import {ERROR_SQL, ERROR_NOTADMIN, ERROR_NO_PROJECTID} from './errors';
import {ensureAuthenticated, getFullVersion, logDBError, logAPI, logAPIError, log} from './common';

const projectRatings = {};
const projectRatingsCount = {};
let db;

function checkOwner(req,res,callback, failedcallback,pid){
	var checkStmt = db.prepare("SELECT owner,writePassword FROM projects WHERE projectID = @projectID");
	var qValues = {};
	if(pid){
		qValues["@projectID"] = pid;
	}else{
		qValues["@projectID"] = req.body.projectID;
	}
	checkStmt.all(qValues,function(err,rows){
		if(rows.length == 0){
			db.run("ROLLBACK");
			res.json({error: ERROR_NO_EXISTING_PROJECT, description: "No existing project"});
		}else{
			if(rows[0].owner == req.user.id || (req.body.writePassword == rows[0].writePassword && rows[0].writePassword != null)){
				req.body.writePassword = rows[0].writePassword;
				callback();
			}else{
				db.run("ROLLBACK");
				if(failedcallback){
					failedcallback("You do not own this project");
				}
				res.json({error: ERROR_USER_NOT_OWNER, description: "User does not own this project"});
			}
		}
	});
}

function updateProject(req,res,callback){
	var updatesNeeded = [];
	var updateValues = {};

	if(req.body.title){
		updatesNeeded.push("title = @title");
		updateValues["@title"] = req.body.title;
	}
	if(req.body.minimisedTitle){
		updatesNeeded.push("minimisedTitle = @minimisedTitle");
		updateValues["@minimisedTitle"] = req.body.minimisedTitle;
	}
	if(req.body.image){
		updatesNeeded.push("image = @image");
		updateValues["@image"] = req.body.image;
	}
	if(req.body.metadata){
		updatesNeeded.push("projectMetadata = @metadata");
		updateValues["@metadata"] = req.body.metadata;
	}
	if(updatesNeeded.length == 0 && !req.body.tags){
		callback();
		return;
	}
	updateValues["@projectID"] = req.body.projectID;
	var updateStr = "UPDATE projects SET " + updatesNeeded.join(", ") + " WHERE projectID = @projectID";
	
	if(req.body.tags){
		var deleteStr = "DELETE FROM tags WHERE projectID = @projectID";
		var tagObject = {};
		tagObject["@projectID"] = req.body.projectID;
		db.run(deleteStr,tagObject,function(err){
			if(err){
				db.run("ROLLBACK");
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}else
				updateTags(req,req.body.projectID,function(err){
					if(err){
						db.run("ROLLBACK");
						logDBError(err);
						res.json({error: ERROR_SQL, description: "SQL Error", err:err})
					}
					db.run(updateStr,updateValues,callback);
				});
		});
	}else{
		db.run(updateStr,updateValues,callback);
		
	}

}

function updateTags(req,projectID,callback){
	var tagList;
	if(Array.isArray(req.body.tags))
		tagList = req.body.tags;
	else
		tagList = [req.body.tags];
	
	var tagObject = {};
	tagObject["@projectID"] = projectID;
	
	var insPairs = [];
	
	for(var i = 0; i < tagList.length; i++){
		insPairs.push("(@projectID, @tag" + i + ")");
		tagObject["@tag" + i] = tagList[i];
	}
	
	var insertStr = "INSERT INTO tags VALUES " + insPairs.join(",");
	
	db.run(insertStr,tagObject,callback);
}

function createProject(req, res, callback){
	var insertProjectStmt = db.prepare("INSERT INTO projects values (NULL,?,?,?,?,?,?,?,?)");
	var writePassword = parseInt(Math.random() * 100000000000000000).toString(36);
	req.body.writePassword = writePassword;
	insertProjectStmt.run(req.body.title,req.body.minimisedTitle,req.body.image,req.user.id,null,
			req.body.parentProject,req.body.metadata, writePassword,
			function(err){
		if(err){
			db.run("ROLLBACK");
			logAPIError("/project/add", err);
			res.json({error: ERROR_SQL, description: "SQL Error", err:err})
		}else{
			var lastProjectID = this.lastID;
			updateTags(req,lastProjectID,function(err){
				if(err){
					db.run("ROLLBACK");
					logDBError(err);
					res.json({error: ERROR_SQL, description: "SQL Error", err:err})
				}else
					callback(req, res, lastProjectID);
			});
		}
		});
	if(req.body.parentProject){
		var downloadsSQL = "UPDATE projectstats SET forks = forks + 1 WHERE projectID = ?;";
		db.run(downloadsSQL,req.body.parentProject,function(err){
			if(err){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err: err})
				return;
			}
			if(this.changes == 0){
				var insDownloadsSQL = "INSERT INTO projectstats VALUES (?,0,1,0,0)";
				db.run(insDownloadsSQL,req.body.parentProject,function(err){
					if(err){
						logDBError(err);
						res.json({error: ERROR_SQL, description: "SQL Error", err: err})
						return;
					}
				});
			}
		});
	}
}

function addProjectVersion(req, res, projectID){
	var addVersionStmt = db.prepare("INSERT INTO projectversions values (NULL,@projectID,@source,@pForward,@pBackward,current_timestamp,@from,@readPassword,@author)");
	var pTextForward = null;
	var pTextBackward = null;
	var listed = false;
	var readPassword = null;
	if(req.body.listed && req.body.listed == "true"){
		listed = true;
	}else{
		readPassword = parseInt(Math.random() * 100000000000000000).toString(36);
	}
	var params = {};
	params["@author"] = req.user.id;
	params["@projectID"] = projectID;
	params["@readPassword"] = readPassword;

	if(req.body.from){
		db.serialize(function(){
		getFullVersion(db, req.body.from, projectID, [],function(ret){
			var baseSrc = ret.source;
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(baseSrc,req.body.source,false);
			var p = dmp.patch_make(baseSrc,req.body.source,d);
			pTextForward = dmp.patch_toText(p);
			var d = dmp.diff_main(req.body.source,baseSrc,false);
			var p = dmp.patch_make(req.body.source,baseSrc,d);
			pTextBackward = dmp.patch_toText(p);
			params["@source"] = null;
			params["@pForward"] = pTextForward;
			params["@pBackward"] = pTextBackward;
			params["@from"] = req.body.from;
			runAddVersion(addVersionStmt, listed,params,req,res);
		});
		});
	}else{
		params["@source"] = req.body.source;
		params["@pForward"] = null;
		params["@pBackward"] = null;
		params["@from"] = null;
		runAddVersion(addVersionStmt, listed,params,req,res);
	}
}

function runAddVersion(addVersionStmt, listed, params,req,res){
	var projectID = params["@projectID"];
	addVersionStmt.run(params,function(){
		var lastSaveID = this.lastID;
		if(listed){
			var updateListedVersion = "UPDATE projects set publicVersion = @saveID WHERE projectID = @projectID";
			var upParams = {};
			upParams["@saveID"] = lastSaveID;
			upParams["@projectID"] = projectID;
			db.run(updateListedVersion,upParams,function(err){
				if(err){
					logDBError(err);
					db.run("ROLLBACK");
					res.json({error: ERROR_SQL, description: "SQL Error", err:err})
				}else{
					db.run("END");
					log("Created version " + lastSaveID + " of project " + projectID);
					res.json({"saveID": lastSaveID, "projectID": projectID, "writePassword": req.body.writePassword, "readPassword": params["@readPassword"]});
					reindexProject(projectID);
				}
			});
		}else{
			db.run("END");
			log("Created version " + lastSaveID + " of project " + projectID);
			res.json({"saveID": lastSaveID, "projectID": projectID, "writePassword": req.body.writePassword, "readPassword": params["@readPassword"]});
		}
	});
}

function getListQueryStr(targetTable){
	return 'SELECT saveID, projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags, date, downloads,forks, myrating, avgStars FROM (SELECT saveID, projects.projectID, title, minimisedTitle, image, owner, name as ownername, date,' 
		+ ' publicVersion, parentProject, projectMetaData,	projectratings.stars as myrating, projectStats.avgStars, downloads,forks, (" " || group_concat(tag, " ") || " " ) as tags FROM projects,oauthusers,' + targetTable + ' left outer join tags'
		+ ' on projects.projectID = tags.projectID LEFT OUTER JOIN projectstats ON projectstats.projectID = projects.projectID LEFT OUTER JOIN projectratings ON projectratings.projectID = projects.projectID AND projectratings.userID = @ratingsUser WHERE owner = oauthusers.userid AND '+targetTable+'.projectID = projects.projectID ';	
}

function getMaxReadableSaveID(projectID, user, res, callback){
	var getMaxSaveIDStmt = db.prepare("SELECT max(saveID) as maxSaveID FROM projectversions, projects WHERE projects.projectID = projectversions.projectID " +
			"AND projectversions.projectID = ? AND (readPassword is NULL OR projects.owner = ?)");
	getMaxSaveIDStmt.get(projectID, user,function(err,row){
		if(err){
			logDBError(err);
			res.json({error: ERROR_SQL, description: "SQL Error", err: err});
			return;
		}
		if(row == undefined) {
			res.json({error: ERROR_SQL, description: ""})
		}
		callback(row.maxSaveID);
	});
}

function getVersionInfo(saveID,projectID,userID, readPassword, res, callback){
	var getVersionInfoStmt = db.prepare("SELECT date, readPassword, owner FROM projectversions, projects WHERE projectversions.projectid = projects.projectid and saveID = ?");
	getVersionInfoStmt.get(saveID,function(err,row){
		if(err){
			logDBError(err);
			res.json({error: ERROR_SQL, description: "SQL Error", err: err});
			return;
		}
		if(row && (row.owner == userID || row.readPassword == null || row.readPassword == readPassword)){
			callback(saveID, projectID, row.date);
		}else{
			if(row)
				res.json({error: ERROR_USER_NOT_OWNER, description: "No permissions"});
			else
				res.json({error: ERROR_PROJECT_NOT_MATCHED, description: "No matching saveID"});
		}
	});
}

function getProjectMetaDataFromSaveID(saveID, res, callback){
	getProjectIDFromSaveID(saveID,res,function(projectID){
		getProjectMetaData(projectID,null,callback);
	});
}

function getProjectIDFromSaveID(saveID,res,callback){
	var query = db.prepare('SELECT projectID FROM projectversions WHERE saveID = ?');
	query.get(saveID,function(err,row){
		if(err){
			logDBError(err);
			res.json({error: ERROR_SQL, description: "SQL Error", err: err});
			return;
		}else{
			callback((row) ? row.projectID : undefined);
		}
	});
}
function getProjectMetaData(projectID, userID, res,callback){
	var metadataQuery = db.prepare('SELECT projects.projectID, title, minimisedTitle, image, owner, oauthusers.name as ownername, publicVersion, parentProject, projectMetaData, '
		+ '(" " || group_concat(tag, " ") || " " ) as tags, stars as myrating '
		+ 'FROM projects, oauthusers left outer join tags on projects.projectID = tags.projectID left outer join projectratings on '
		+ 'projectratings.projectID = projects.projectID AND projectratings.userID = ? WHERE owner = oauthusers.userid AND projects.projectID = ?');
	metadataQuery.get(userID,projectID,function(err,row){
		if(err){
			logDBError(err);
			res.json({error: ERROR_SQL, description: "SQL Error", err: err});
			return;
		}else{
			callback(row);
		}
	});
}

function increaseProjectDownloadStat(req,res){
	var downloadsSQL = "UPDATE projectstats SET downloads = downloads + 1 WHERE projectID = ?;";
	db.run(downloadsSQL,req.query.projectID,function(err){
		if(err){
			logDBError(err);
			res.json({error: ERROR_SQL, description: "SQL Error", err: err})
			return;
		}
		if(this.changes == 0){
			var insDownloadsSQL = "INSERT INTO projectstats VALUES (?,1,0,0,0)";
			db.run(insDownloadsSQL,req.query.projectID,function(err){
				if(err){
					logDBError(err);
					res.json({error: ERROR_SQL, description: "SQL Error", err: err})
					return;
				}
			});
		}else{

		}
	});
}

function sendDiff(fromID,toSource,projectID,toID,res,metaRow){
	db.serialize(function(){
		getFullVersion(db, fromID,projectID,[],function(ret){
			var source = ret.source;
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(source,toSource,false);
			var p = dmp.patch_make(source,toSource,d);
			var patchText = dmp.patch_toText(p);
			var srcRow = {from: fromID, projectID: projectID, to: toID, patch: patchText};
			res.json(Object.assign(srcRow,metaRow));
		});
	});
}

function processSelectorNode(t, criteria, criteriaVals, i){
	if(t.type == "property"){
		switch(t.name){
		case ".id":
			criteria.push("projectID = @projectID" + i);
			criteriaVals["@projectID" + i] = t.value;
			break;
		case ".title":
			criteria.push("title LIKE @title" + i);
			criteriaVals["@title" + i] = t.param.replace(/\*/g,"%");
			break;
		case ":me":
			criteriaVals["@mineOnly"] = true;
			break;
		case ".author":
//			criteria.push("owner = @otherAuthor");
//			criteriaVals["@otherAuthor"] = 
			break;
		case ".name":
			if(t.param === undefined)
				return;
			criteria.push("minimisedTitle LIKE @minimisedTitle" + i);
			criteriaVals["@minimisedTitle" + i] = t.param.replace(/\*/g,"%");
			break;
		case ".parent":
		case ":parent":
			criteria.push("parentProject = @parentProject" +i);
			criteriaVals["@parentProject" + i] = t.value;
			break;
		case ".listed":
			criteriaVals["listedOnly"] = true;
			break;
		}
	}
	if(t.type == "tag"){
		if(t.tag === undefined)
			return;
		criteria.push("tags like @tag" + i);
		criteriaVals["@tag" + i] = "% " + t.tag.replace(/\*/g,"%").substring(1) + " %";				
	}
	if(t.type == "name"){
		if(t.name === undefined)
			return;
		var tmpCriteria = ["OR"];
		tmpCriteria.push("minimisedTitle LIKE @minimisedTitle" + i);
		tmpCriteria.push("tags like @minimisedTitleTag" + i);
		criteria.push(tmpCriteria);
		criteriaVals["@minimisedTitle" + i] = t.name.replace(/\*/g,"%");
		criteriaVals["@minimisedTitleTag" + i] = "% " + t.name.replace(/\*/g,"%") + " %";
	}
}

function parseCriteria(arr){
	if(!Array.isArray(arr) || arr.length == 1){
		if(arr == "AND" || arr == "OR")
			return "";
		return arr;
	}
	if(arr.length == 2)
		return parseCriteria(arr[1]);
	var connectionType = arr[0];

	arr.shift();
	var tmpArr = [];
	for(j = 0; j < arr.length; j++){
		tmpArr.push(parseCriteria(arr[j]));
	}
	return "(" + tmpArr.join(" " + connectionType + " ") + ")";
}

function processNextRating(projectRows, unknownRatings,i,res){
	if(i == unknownRatings.length){
		for(let j = 0; j < projectRows.length; j++){
			if(projectRows[j].overallRating == undefined){
				projectRows[j].overallRating = projectRatings[projectRows[j].projectID];
				projectRows[j].numRatings = projectRatingsCount[projectRows[j].projectID];
			}
		}
		res.json(projectRows);
	}else{
		var getRatingsStmt = "SELECT count(1) as c,sum(stars) as s FROM projectratings WHERE projectID = ?";
		var projectID = unknownRatings[i];
		db.get(getRatingsStmt,projectID,function(err,row){
			if(err || row === undefined){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}
			projectRatings[projectID] = row.s;
			projectRatingsCount[projectID] = row.c;
			var overallRating = Number(row.s / row.c).toFixed(1);
			
			if(isNaN(overallRating))
				overallRating = null;
			
			var updateStarsStmt = "UPDATE projectstats SET avgStars = ? WHERE projectID = ?";
			db.run(updateStarsStmt, overallRating, projectID, function(err){
				if(err){
					logDBError(err);
					res.json({error: ERROR_SQL, description: "SQL Error", err:err});
				}
				processNextRating(projectRows,unknownRatings,i+1,res);
			});
		});
	}
}

function rectifySource(source) {
	let ast = new Eden.AST(source, undefined, {}, {noparse: true, noindex: true, version: 1});
	ast.next();

	let hasVersionName = false;
	while (ast.token === "STRING") {
		switch (ast.data.value) {
		case "use cs2;":
		case "use cs3;":
			hasVersionName = true;
			break;
		default:
			break;	
		}
		ast.next();
	}

	if (hasVersionName) {
		return source;
	}

	// Otherwise, needs fixing
	const script = ast.pSCRIPT();
	if (script.errors.length === 0) {
		return `"use cs3;\n${source}`;
	} else {
		return `"use cs2;\n${source}`;
	}
}

export default function(app) {
	db = app.rawdb;

	app.get('/project/tags', function(req,res){
		  var stmtstr = "SELECT projectID,tag FROM tags WHERE tag LIKE @tagname";
		  var criteriaObject = {};
		  criteriaObject["@offset"] = 0;
		  criteriaObject["@limit"] = 100;
		  criteriaObject["@tagname"] = "%"+req.query.tag+"%";
	
	
		  /*if(req.query.offset)
			  criteriaObject["@offset"] = req.query.offset;
		  if(req.query.limit)
			  criteriaObject["@limit"] = req.query.limit;*/
		  
		  stmtstr += " LIMIT @limit OFFSET @offset";
		  var stmt = db.prepare(stmtstr);
	
		  var tags = {};
		  
		  stmt.all(criteriaObject,function(err,rows){
			  if(err){
				logDBError(err);
				  res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			  }else{
				//res.json(rows);
				for (let i=0; i<rows.length; i++) {
					var tmp = rows[i].tag.split(" ");
					for (let j=0; j<tmp.length; j++) {
						if (tmp[j] == req.query.tag) continue;
						if (tags[tmp[j]] === undefined) tags[tmp[j]] = 1;
						else tags[tmp[j]]++;
					}
				}
	
				var sorted = [];
				for (let x in tags) sorted.push(x);
				sorted.sort(function(a,b) {
					return tags[b] - tags[a];
				});
	
				res.json(sorted);
			  }		  
		  });
	  });
	
	app.get('/project/activity', function(req,res){
		  if (req.user.admin != 1) {
			 res.json({error: ERROR_NOTADMIN, description: "Must be admin to see project activity"});
			 return;
		  }
		  var stmtstr = "SELECT name,saveID,projectversions.projectID,date,title,readPassword FROM projectversions,oauthusers,projects WHERE oauthusers.userid = projects.owner AND projectversions.projectID = projects.projectID";
		  var criteriaObject = {};
		  criteriaObject["@offset"] = 0;
		  criteriaObject["@limit"] = 100;
	
		  if(req.query.newerThan){
			  stmtstr += " AND date > (SELECT date from projectversions WHERE saveID = @newerThanVersion)";
			  criteriaObject["@newerThanVersion"] = req.query.newerThan;
		  }
		  if(req.query.offset)
			  criteriaObject["@offset"] = req.query.offset;
		  if(req.query.limit)
			  criteriaObject["@limit"] = req.query.limit;
		  
		  stmtstr += " ORDER BY date DESC LIMIT @limit OFFSET @offset";
		  var stmt = db.prepare(stmtstr);
		  
		  stmt.all(criteriaObject,function(err,rows){
			  if(err){
				logDBError(err);
				  res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			  }else{
				res.json(rows);
			  }		  
		  });
	  });
	
	/**
	* Title: Project Get
	* URL: /project/get
	* Method: GET
	* Data Params:
	* {
	*  projectID: integer,
	*  to: [integer],
	*  from: [integer],
	* }
	* 
	* Request should have 'from' and 'to', which gives the diff between the two versions
	* If both undefined, get full snapshot of latest version (with no diffs)
	* If from undefined, get full snapshot of 'to' version (no diffs)
	* If to undefined but from is defined, get diff from 'from' to latest version.
	* Returns JSON object with saveID, projectID and source properties.
	* If a 'from' is defined, the object won't contain a source property, but will contain a patch property
	**/
	
	app.get('/project/get', function(req,res){
		//ProjectID must be defined
		//Request should have 'from' and 'to', which gives the diff between the two versions
		//If both undefined, get full snapshot of latest version (with no diffs)
		//If 'from' undefined, get full snapshot of 'to' version (no diffs).
		//If 'to' undefined but from is defined, get diff from 'from' to latest version.
	
		if(!req.query.projectID) {
			logAPIError("/project/get", "projectID must be defined");
			return res.json({error: ERROR_NO_PROJECTID, description: "projectID must be defined" });
		}

		logAPI("/project/get", `id = ${req.query.projectID}`);
		
		var userID = -1;
		if(req.user != undefined){
			userID = req.user.id;
		}

		const api = req.query.api;
		// Do a source rectification for new version
		const rectify = api >= 3;
		
		var targetSaveID = null; 
		if(req.query.to){
			targetSaveID = req.query.to;
			getVersionInfo(targetSaveID,req.query.projectID,userID,req.query.readPassword,res,function(saveID,projectID,date){
				
				getProjectMetaData(req.query.projectID, userID, res, function(metaRow){
					db.serialize(function(){
						
						getFullVersion(db, saveID,req.query.projectID, metaRow, function(ret){
							const source = rectify ? rectifySource(ret.source) : ret.source;
							const date = ret.date;
							if(req.query.from){
								sendDiff(req.query.from,source,req.query.projectID,targetSaveID,res,metaRow);
							}else{
								var srcRow = {saveID: saveID, projectID: projectID,source:source, date:date, meta: metaRow};
								res.json(Object.assign(srcRow,metaRow));
							}
						});
						
					});
	
				});
				
			});
	
		}else{
			getMaxReadableSaveID(req.query.projectID, userID, res, function(saveID){
				getVersionInfo(saveID,req.query.projectID,userID, req.query.readPassword, res, function(){
					
					getProjectMetaData(req.query.projectID, userID, res, function(metaRow){
						
						db.serialize(function(){
							getFullVersion(db, saveID,req.query.projectID, metaRow, function(ret){
								const source = rectify ? rectifySource(ret.source) : ret.source;
								const date = ret.date;
								if(req.query.from){
									sendDiff(req.query.from,source,req.query.projectID,saveID,res,metaRow);
								}else{
									var srcRow = {saveID: saveID, projectID: req.query.projectID,source:source, date:date, meta: metaRow};
									res.json(Object.assign(srcRow,metaRow));
								}
							});
						});
						
					});
					
				});
			});		
		}
		increaseProjectDownloadStat(req,res);
		
	});
	
	app.post('/project/rate', function(req,res){
		var userID = req.user.id;
		var starRating = req.body.stars;
		var projectID = req.body.projectID;
		var rateSQL = "UPDATE projectratings SET stars = ? WHERE projectID = ? AND userID = ?;";
		delete projectRatings[req.body.projectID];
		db.run(rateSQL,starRating,projectID,userID,function(err){
			if(err){
				res.json({error: ERROR_SQL, description: "SQL Error", err: err})
				return;
			}
			if(this.changes == 0){
				var insRateSQL = "INSERT INTO projectratings VALUES (?,?,?,NULL);";
				db.run(insRateSQL,projectID,userID,starRating,function(err){
					if(err){
						logDBError(err);
						res.json({error: ERROR_SQL, description: "SQL Error", err: err})
						return;
					}
					res.json({status: "INSERTED"});
				});
			}else{
				res.json({status: "UPDATED"});
			}
		});
	});
	
	/**
	* Title: Project Search
	* URL: /project/search
	* Method: GET
	* * Data Params:
	* {
	*  projectid: [integer],
	*  dateBefore: [date],
	*  dateAfter: [date],
	*  minimisedTitle: [string like pattern],
	*  title: [string like pattern],
	*  query: [string],
	*  limit: [integer],
	*  offset: [offset],
	*  }
	*  
	*  Returns JSON
	**/
	
	app.get('/project/search', function(req, res){
		logAPI("/project/search", `query = ${req.query.query}`);

		const criteriaVals = {};
		
		criteriaVals["@limit"] = 50;
		if(req.query.limit && (req.query.limit <= 50))
			criteriaVals["@limit"] = req.query.limit;
		criteriaVals["@offset"] = 0;
		if(req.query.offset)
			criteriaVals["@offset"] = req.query.offset;
	
		var tmpCriteria = ["AND"];
		if(req.query.query && req.query.query != " "){
			var selectorAST = Eden.Selectors.parse(req.query.query.trim());
			if(selectorAST !== undefined){
				if(selectorAST.type == "intersection"){
					for(var i = 0; i < selectorAST.children.length; i++){
						processSelectorNode(selectorAST.children[i],tmpCriteria,criteriaVals, i);
					}
				}else{
					processSelectorNode(selectorAST,tmpCriteria,criteriaVals, 0);
				}
			}else{
				res.json([]);
				return;
			}
		}
		
		var mineOnly = (criteriaVals["@mineOnly"] !== undefined) ? criteriaVals["@mineOnly"] : false;
		var listedOnly = (criteriaVals["@listedOnly"] !== undefined) ? criteriaVals["@listedOnly"] : false;
		
		if(criteriaVals["@mineOnly"] !== undefined)
			delete criteriaVals["@mineOnly"];
		if(criteriaVals["@listedOnly"] !== undefined)
			delete criteriaVals["@listedOnly"];
		
		var conditionStr = "";
		
		var tagConditionStr = "";
		if(tmpCriteria.length > 0){
			var tmpCStr = parseCriteria(tmpCriteria);
			if(tmpCStr.length > 0)
				tagConditionStr = "\n WHERE " + tmpCStr;
		}

		var listQueryStr;
		
		if(!mineOnly && !listedOnly){
			if(req.user == null)
				listedOnly = true;
		}
		
		var orderString = " order by date desc ";
		if(req.query.by){
			if(req.query.by == "downloads")
				orderString = " order by downloads desc ";
			if(req.query.by == "rating")
				orderString = " order by avgStars desc "
		}
		
		if(req.user == null)
			criteriaVals["@ratingsUser"] = -1;
		else
			criteriaVals["@ratingsUser"] = req.user.id;
			
		if(mineOnly){
			if(req.user == null) return res.json([]);
			listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner' + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
			criteriaVals["@owner"] = req.user.id;
		}else if(listedOnly){
			listQueryStr = getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
		}else{
			listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner';
			criteriaVals["@owner"] = req.user.id;
			listQueryStr += conditionStr + ' group by projects.projectID)' + tagConditionStr;
			listQueryStr += " UNION " + getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID) ' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
		}
	
		var listProjectStmt = db.prepare(listQueryStr);
		var unknownRatings = [];
	
		listProjectStmt.all(criteriaVals,function(err,rows){
			if(err){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err: err})
				return;
			}
			for(var i = 0; i < rows.length; i++){
				if(rows[i].tags){
					var tmpTags = rows[i].tags.split(" ");
					for(var j = tmpTags.length - 1; j >= 0; j--){
						if(tmpTags[j] == "")
							tmpTags.splice(j,1);
					}
					
					rows[i].tags = tmpTags;
				}
				var projectID = rows[i].projectID;
				if(projectRatings[projectID] !== undefined){
					rows[i].overallRating = projectRatings[projectID];
					rows[i].numRatings = projectRatingsCount[projectID];
				}else{
					unknownRatings.push(projectID);
				}
			}
			processNextRating(rows,unknownRatings,0,res);
		});
	});
	
	app.post('/project/remove',ensureAuthenticated, function(req,res){
		var projectID = req.body.projectID;
		var userID = req.user.id;
		var delStatement = "DELETE FROM projects WHERE projectID = ? AND owner = ?";
		db.run(delStatement,projectID, userID,function(err){
			if(err){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}
			if(this.changes == 0)
				res.json({error: ERROR_PROJECT_NOT_MATCHED, description: "Matching project not found"});
			if(this.changes > 0)
				res.json({status: "deleted", changes: this.changes});
		});
	});
	
	
	/**
	 * 
	 * GET version info for either projectID or userID
	 * 
	 * URL: /project/versions
	 * 
	 * Data param{
	 * 	projectID: [integer],
	 *  userID: [integer]
	 * }
	 * 
	 * Note - the user ID does not have to be the logged in user!
	 * 
	 */
	
	app.get('/project/versions', function(req, res){
		if(req.query.projectID !== undefined){
			var listProjectIDStmt = db.prepare("select projectid, saveID, date, parentDiff,author,name, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions left join oauthusers ON author = userid where projectid = ?;");
			listProjectIDStmt.all(req.query.projectID,function(err,rows){
				for(var i = 0; i < rows.length; i++){
					if(rows[i].author === undefined || rows[i].author == null)
						rows[i].name = "[Me]";
				}
				res.json(rows);
			});
		}else if(req.query.userID !== undefined){
			var listProjectStmt = db.prepare("select projects.projectid, saveID, date, parentDiff, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions,projects where projects.projectid = projectversions.projectid AND owner = ? ORDER BY date;");
			listProjectStmt.all(req.user.id,function(err,rows){
				res.json(rows);
			});
		}
	});

	/*
	* Title: Project Add
	* URL: /project/add
	* Method: POST
	* Data Params:
	* {
	* 	projectID: [integer],
	*  title: [string],
	*  minimisedTitle: [string],
	*  image: [base64 string],
	*  metadata: [json string],
	*  source: [string] source to be saved,
	*  tags: [string] separated by space
	* }
	* 
	* Success response: JSON object containing saveID and projectID
	* If no source provided, the title, minimisedTitle,image,metadata will 
	* be updated and will result in a JSON object with status "updated" and the projectID
	* 
	*/
	app.post('/project/add', ensureAuthenticated, function(req, res){
		if(typeof req.user == "undefined")
			return res.json({error: ERROR_UNAUTHENTICATED, description: "Unauthenticated"});
		var projectID = req.body.projectID;

		logAPI("/project/add", `project = ${projectID}`);
		
		if(projectID == undefined || projectID == null || projectID == ""){
			db.run("BEGIN TRANSACTION");
			log("Creating new project");
			createProject(req, res, function(req, res, lastID){
				logAPI("/project/add", "New project id is " + lastID);
				addProjectVersion(req, res, lastID);
			});
		}else if(isNaN(projectID)){
			res.json({error: ERROR_INVALID_PROJECTID_FORMAT, description: "Invalid projectID format"});
		}else{
			db.run("BEGIN TRANSACTION");
			checkOwner(req,res,function(){
				updateProject(req, res, function(err){
					if(req.body.source == undefined){
						db.run("END");
						res.json({status:"updated", projectID: projectID});
					}else{
						addProjectVersion(req, res, projectID);	
					}
				});
			});
		}
		
	});

	/*
	* Title: Project Add
	* URL: /project/add
	* Method: POST
	* Data Params:
	* {
	*  source: [string],
	*  selector: [string]
	* }
	* 
	* Success response: 
	* Reindex then patch AST
	* 
	*/
	app.post('/project/patch', ensureAuthenticated, function(req, res){
		if(typeof req.user == "undefined")
			return res.json({error: ERROR_UNAUTHENTICATED, description: "Unauthenticated"});

			logAPI("/project/patch", `selector = ${req.body.selector}`);

			var sast = Eden.Selectors.parse(req.body.selector);
			if (sast.local) {
				res.json([]);
			} else {
				sast.filter().then((p) => {
					var astres = Eden.Selectors.unique(p);

					if(astres.length != 1 || astres[0].type != "script"){
						return false;
					}
					var parent = astres[0];
					while(parent.parent){
						parent = parent.parent;
					}
					checkOwner(req,res,function(){
						var newnode = Eden.AST.parseScript(req.body.source);
						astres[0].patchInner(newnode);
						res.json({status:"updated", projectID: parent.id});
					},function(errstr){
						res.json({error:"error", description: "Error patching project" + errstr,projectID: parent.id});
					},parent.id);
			
				}).catch(error => {
					logAPIError("/project/patch", "Query error for: "+req.body.selector+" - "+error);
				});
			}
	});

}