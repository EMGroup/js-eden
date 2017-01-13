var express = require('express')
  , passport = require('passport')
  , util = require('util')
 , cookieParser = require("cookie-parser")
 , bodyParser = require("body-parser")
 , methodOverride = require("method-override")
, session = require("express-session");
Eden = {};
var config = require("./config.js");

var lex = require(config.JSEDENPATH + "js/lex.js");
EdenStream = lex.EdenStream;
EdenSyntaxData = lex.EdenSyntaxData;
var lang = require(config.JSEDENPATH + "js/language/lang.js");
Language = lang.Language;
var en = require(config.JSEDENPATH + "js/language/en.js");
//require(config.JSEDENPATH + "js/util/misc.js");
require(config.JSEDENPATH + "js/index.js");  
require(config.JSEDENPATH + "js/selectors/selector.js");  
require(config.JSEDENPATH + "js/selectors/property.js");  
require(config.JSEDENPATH + "js/selectors/name.js");  
require(config.JSEDENPATH + "js/selectors/tag.js");  
require(config.JSEDENPATH + "js/selectors/intersection.js");  
require(config.JSEDENPATH + "js/selectors/union.js");  
require(config.JSEDENPATH + "js/selectors/navigate.js");  
require(config.JSEDENPATH + "js/ast/ast.js");  
require(config.JSEDENPATH + "js/ast/basestatement.js");  
require(config.JSEDENPATH + "js/ast/basescript.js");  
require(config.JSEDENPATH + "js/ast/basecontext.js");  
require(config.JSEDENPATH + "js/ast/append.js");  
require(config.JSEDENPATH + "js/ast/assignment.js");  
require(config.JSEDENPATH + "js/ast/after.js");  
require(config.JSEDENPATH + "js/ast/binaryop.js");  
require(config.JSEDENPATH + "js/ast/break.js");  
require(config.JSEDENPATH + "js/ast/case.js");  
require(config.JSEDENPATH + "js/ast/codeblock.js");  
require(config.JSEDENPATH + "js/ast/context.js");  
require(config.JSEDENPATH + "js/ast/continue.js");  
require(config.JSEDENPATH + "js/ast/declarations.js");  
require(config.JSEDENPATH + "js/ast/default.js");  
require(config.JSEDENPATH + "js/ast/definition.js");  
require(config.JSEDENPATH + "js/ast/delete.js");  
require(config.JSEDENPATH + "js/ast/do.js");  
require(config.JSEDENPATH + "js/ast/doxycomments.js");  
require(config.JSEDENPATH + "js/ast/dummy.js");  
require(config.JSEDENPATH + "js/ast/for.js");  
require(config.JSEDENPATH + "js/ast/function.js");  
require(config.JSEDENPATH + "js/ast/functioncall.js");  
require(config.JSEDENPATH + "js/ast/handle.js");  
require(config.JSEDENPATH + "js/ast/if.js");  
require(config.JSEDENPATH + "js/ast/import.js");  
require(config.JSEDENPATH + "js/ast/index.js");  
require(config.JSEDENPATH + "js/ast/insert.js");  
require(config.JSEDENPATH + "js/ast/length.js");  
require(config.JSEDENPATH + "js/ast/literal.js");  
require(config.JSEDENPATH + "js/ast/llist.js");  
require(config.JSEDENPATH + "js/ast/local.js");  
require(config.JSEDENPATH + "js/ast/lvalue.js");  
require(config.JSEDENPATH + "js/ast/modify.js");  
require(config.JSEDENPATH + "js/ast/parameter.js");  
require(config.JSEDENPATH + "js/ast/primary.js");  
require(config.JSEDENPATH + "js/ast/proc.js");  
require(config.JSEDENPATH + "js/ast/range.js");  
require(config.JSEDENPATH + "js/ast/require.js");  
require(config.JSEDENPATH + "js/ast/return.js");  
require(config.JSEDENPATH + "js/ast/scope.js");  
require(config.JSEDENPATH + "js/ast/scopedscript.js");  
require(config.JSEDENPATH + "js/ast/scopepath.js");  
require(config.JSEDENPATH + "js/ast/scopepattern.js");  
require(config.JSEDENPATH + "js/ast/script.js");  
require(config.JSEDENPATH + "js/ast/virtual.js");  
require(config.JSEDENPATH + "js/ast/scriptexpr.js");  
require(config.JSEDENPATH + "js/ast/subscribers.js");  
require(config.JSEDENPATH + "js/ast/switch.js");  
require(config.JSEDENPATH + "js/ast/ternaryop.js");  
require(config.JSEDENPATH + "js/ast/unaryop.js");  
require(config.JSEDENPATH + "js/ast/wait.js");  
require(config.JSEDENPATH + "js/ast/when.js");  
require(config.JSEDENPATH + "js/ast/while.js");  
require(config.JSEDENPATH + "js/grammar/actionbody.js");  
require(config.JSEDENPATH + "js/grammar/after.js");  
require(config.JSEDENPATH + "js/grammar/declarations.js");  
require(config.JSEDENPATH + "js/grammar/do.js");  
require(config.JSEDENPATH + "js/grammar/expression.js");  
require(config.JSEDENPATH + "js/grammar/factor.js");  
require(config.JSEDENPATH + "js/grammar/for.js");  
require(config.JSEDENPATH + "js/grammar/function.js");  
require(config.JSEDENPATH + "js/grammar/if.js");  
require(config.JSEDENPATH + "js/grammar/import.js");  
require(config.JSEDENPATH + "js/grammar/listops.js");  
require(config.JSEDENPATH + "js/grammar/lists.js");  
require(config.JSEDENPATH + "js/grammar/lvalue.js");  
require(config.JSEDENPATH + "js/grammar/primary.js");  
require(config.JSEDENPATH + "js/grammar/proc.js");  
require(config.JSEDENPATH + "js/grammar/scope.js");  
require(config.JSEDENPATH + "js/grammar/script.js");  
require(config.JSEDENPATH + "js/grammar/selector.js");  
require(config.JSEDENPATH + "js/grammar/statement.js");  
require(config.JSEDENPATH + "js/grammar/switch.js");  
require(config.JSEDENPATH + "js/grammar/terms.js");  
require(config.JSEDENPATH + "js/grammar/wait.js");  
require(config.JSEDENPATH + "js/grammar/when.js");  
require(config.JSEDENPATH + "js/grammar/while.js"); 
var passportUsers = require("./passport-users.js");
window = {};
var diffmatchpatch = require(config.JSEDENPATH + "js/lib/diff_match_patch.js"); 
var sqlite3 = require("sqlite3").verbose();
var errors = require(config.JSEDENPATH + "js/core/errors.js");
var warnings = require(config.JSEDENPATH + "js/core/warnings.js");
var db = new sqlite3.Database(config.DBPATH);
var allKnownProjects = {};

passportUsers.setupPassport(passport,db);
edenUI = {};
eden = {};

eden.root = {};
eden.root.symbols = {};

//var doxy = require(config.JSEDENPATH + "js/doxycomments.js");

var vstmt = db.prepare("select projects.projectID,projectversions.saveID,title,minimisedTitle,ifnull(group_concat(tag, \" \"),\"\") as tags"+
		", projectversions.date, name as authorname FROM (SELECT max(saveID) as maxsaveID from projectversions group by projectID) as maxv, projectversions,projects,oauthusers" +
		" left join tags on projects.projectID = tags.projectID where maxsaveID = projectversions.saveID and projects.projectID = projectversions.projectID" +
		" and owner = oauthusers.userid group by projects.projectID;");

initASTDB();

generateTimeStamp = function(str) {
	var relativeTimeRe = /(\d*)(minutes|minute|min|hours|hour|days|day|weeks|week|months|month|mon|years|year|Quarters|Quarter|seconds|second|sec|s|m|h|d|M|y|Y|Q|ms|w)/g;

	var comp;
	var stamp = 0;
	while ((comp = relativeTimeRe.exec(str)) !== null) {
		console.log("Reltime:",comp);
		switch(comp[2]) {
		case "second":
		case "seconds":
		case "s"	:	stamp += parseInt(comp[1]) * 1000; break;
		case "minute":
		case "minutes":
		case "m"	:	stamp += parseInt(comp[1]) * 60000; break;
		case "hour":
		case "hours":
		case "h"	:	stamp += parseInt(comp[1]) * 3600000; break;
		}
	}

	return stamp;
}

function getFullVersion(version, projectID, meta, callback){
	var versionStmt = db.prepare("SELECT fullsource, forwardPatch,parentDiff,date FROM projectversions WHERE saveID = ? AND projectID = ?");
	versionStmt.each(version,projectID, function(err,row){
		if(row.fullsource == null){
			//Go and get the source from the parentDiff
//			collateBasesAndPatches(row.parentDiff);
			getFullVersion(row.parentDiff, projectID, meta, function(ret){
				var parentSource = ret.source;
				var dmp = new window.diff_match_patch();
				var p = dmp.patch_fromText(row.forwardPatch);
				var r = dmp.patch_apply(p,parentSource);
				callback({source: r[0], date: row.date, meta: meta});
			});
		}else{
			callback({source: row.fullsource, date: row.date, meta: meta});
		}
	});
}

function initASTDB(){
	vstmt.all(function(err,rows){
		for(var i = 0; i < rows.length; i++){
			rows[i].stamp = new Date(rows[i].date).getTime();
			console.log("Parsing row " + i, rows[i]);
			getFullVersion(rows[i].saveID, rows[i].projectID, rows[i], function(data) {
				var tmpAst = new Eden.AST(data.source,undefined,{name: data.meta.minimisedTitle, title: data.meta.title, tags: data.meta.tags.split(" "), author: data.meta.authorname, stamp: data.meta.stamp});
				Eden.Index.update(tmpAst.script);
				allKnownProjects[tmpAst.script.id] = tmpAst.script;
			});
		}

		console.log(JSON.stringify(Eden.Index.name_index));
	});
}

Eden.Selectors.PropertyNode.prototype.construct = function() {
	switch (this.name) {
	case ".type"		:	return Eden.Index.getByType(this.value);
	case ".id"			:	return Eden.Index.getByID(this.value);
	case ".name"		:	if (this.param === undefined) {
								return Eden.Index.getAllWithName();
							} else if (this.isreg) {
								return Eden.Index.getByNameRegex(this.value);
							} else {
								return Eden.Index.getByName(this.value);
							}
	// TODO this doesn't capture executes.
	case ":remote"		:
	case ":root"		:	return Object.keys(allKnownProjects).map(function(e) { return allKnownProjects[e]; });
	case ":project"		:	return [];
	}

	return Eden.Index.getAll();
}


var app = express();

// configure Express
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({limit: '5mb'}));
  app.use(express.static("static"));
  app.use(logErrors);
  
  app.use(function(req, res, next) {
	  var allowedOrigins = ["http://localhost:8000","http://127.0.0.1:8000","http://emgroup.github.io","http://jseden.dcs.warwick.ac.uk"];
	  var corsOrigin = "http://localhost:8000";
	  if(typeof(req.headers.origin) != 'undefined' && allowedOrigins.indexOf(req.headers.origin) > -1){
		corsOrigin = req.headers.origin;
	  }else if(typeof(req.headers["jseden-origin"]) != 'undefined'){
	 	corsOrigin = req.headers["jseden-origin"];
	  }
	  res.header("Access-Control-Allow-Origin", corsOrigin);
	  res.header("Access-Control-Allow-Credentials","true");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, JSEDEN-ORIGIN");
	next();
	});
  
  app.use(session({ secret: config.SESSION_SECRET }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/', function(req, res){
	  if(req.user !== undefined && req.user.id == null){
		  res.render('registration', { user: req.user });
//		  res.render('regclosed');
	  }else{
		  res.render('index', { user: req.user });
	  }
  });

app.post('/registration', function(req,res){
	var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?)");
	stmt.run(req.user.oauthcode, req.body.displayName, function(err){
		req.user.id = this.lastID;
		res.redirect(config.BASEURL);
	});
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

function logErrors(err,req,res,next){
	console.error(err.stack);
	res.status(500);
	res.json({"error": "Error"});
}

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
		return res.json({error: 1, description: "Unauthenticated"});
	var projectID = req.body.projectID;
	
	if(projectID == undefined || projectID == null || projectID == ""){
		db.run("BEGIN TRANSACTION");
		log("Creating new project");
		createProject(req, res, function(req, res, lastID){
			log("New project id is " + lastID);
			addProjectVersion(req, res, lastID);
		});
	}else if(isNaN(projectID)){
		res.json({error: 9, description: "Invalid projectID format"});
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

function log(str){
	console.log(new Date().toISOString() + ": " + str);
}

function checkOwner(req,res,callback){
	var checkStmt = db.prepare("SELECT owner FROM projects WHERE projectID = @projectID");
	var qValues = {};
	qValues["@projectID"] = req.body.projectID;
	checkStmt.all(qValues,function(err,rows){
		if(rows.length == 0){
			db.run("ROLLBACK");
			res.json({error:5, description: "No existing project"});
		}else{
			if(rows[0].owner == req.user.id){
				callback();
			}else{
				db.run("ROLLBACK");
				res.json({error:6, description: "User does not own this project"});
			}
		}
	});
}

function updateProject(req,res,callback){
	var updatesNeeded = [];
	var updateValues = {};
	var updateArr = [];
	var updateStrs = [];
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
		log("About to delete " + deleteStr);
		var tagObject = {};
		tagObject["@projectID"] = req.body.projectID;
		db.run(deleteStr,tagObject,function(err){
			if(err){
				db.run("ROLLBACK");
				res.json({error: -1, description: "SQL Error", err:err})
			}else
				updateTags(req,req.body.projectID,function(err){
					if(err){
						db.run("ROLLBACK");
						res.json({error: -1, description: "SQL Error", err:err})
					}
					log("Updating project " + updateStr);
					db.run(updateStr,updateValues,callback);
				});
		});
	}else{
		log("Updating project " + updateStr);
		db.run(updateStr,updateValues,callback);
		
	}

}

function updateTags(req,projectID,callback){
	var tagList;
	if(Array.isArray(req.body.tags))
		tagList = req.body.tags;
	else
		tagList = [req.body.tags];
	
	console.log(tagList);
	
	var tagObject = {};
	tagObject["@projectID"] = projectID;
	
	var insPairs = [];
	
	for(var i = 0; i < tagList.length; i++){
		insPairs.push("(@projectID, @tag" + i + ")");
		tagObject["@tag" + i] = tagList[i];
	}
	
	var insertStr = "INSERT INTO tags VALUES " + insPairs.join(",");
	
	log("inserting tags " + insertStr);
	db.run(insertStr,tagObject,callback);
}

function createProject(req, res, callback){
	var insertProjectStmt = db.prepare("INSERT INTO projects values (NULL,?,?,?,?,?,?,?)");
	
	insertProjectStmt.run(req.body.title,req.body.minimisedTitle,req.body.image,req.user.id,null,
			req.body.parentProject,req.body.metadata,
			function(err){
		if(err){
			db.run("ROLLBACK");
			res.json({error: -1, description: "SQL Error", err:err})
		}else{
			var lastProjectID = this.lastID;
			updateTags(req,lastProjectID,function(err){
				if(err){
					db.run("ROLLBACK");
					res.json({error: -1, description: "SQL Error", err:err})
				}else
					callback(req, res, lastProjectID);
			});
		}
		});
}

function addProjectVersion(req, res, projectID){
	var addVersionStmt = db.prepare("INSERT INTO projectversions values (NULL,@projectID,@source,@pForward,@pBackward,current_timestamp,@from)");
	var pTextForward = null;
	var pTextBackward = null;
	var listed = false;
	if(req.body.listed && req.body.listed == "true"){
		listed = true;
	}
	var params = {};
	if(req.body.from){
		db.serialize(function(){
		getFullVersion(req.body.from, projectID, [],function(ret){
			var baseSrc = ret.source;
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(baseSrc,req.body.source,false);
			var p = dmp.patch_make(baseSrc,req.body.source,d);
			pTextForward = dmp.patch_toText(p);
			var d = dmp.diff_main(req.body.source,baseSrc,false);
			var p = dmp.patch_make(req.body.source,baseSrc,d);
			pTextBackward = dmp.patch_toText(p);
			params["@projectID"] = projectID;
			params["@source"] = null;
			params["@pForward"] = pTextForward;
			params["@pBackward"] = pTextBackward;
			params["@from"] = req.body.from;
			runAddVersion(addVersionStmt, listed,params,res);
		});
		});
	}else{
		params["@projectID"] = projectID;
		params["@source"] = req.body.source;
		params["@pForward"] = null;
		params["@pBackward"] = null;
		params["@from"] = null;
		runAddVersion(addVersionStmt, listed,params,res);
	}
}

function runAddVersion(addVersionStmt, listed, params,res){
	var projectID = params["@projectID"];
	addVersionStmt.run(params,function(){
		var lastSaveID = this.lastID;
		if(listed){
			var updateListedVersion = "UPDATE projects set publicVersion = @saveID WHERE projectID = @projectID";
			var upParams = {};
			upParams["@saveID"] = lastSaveID;
			upParams["@projectID"] = projectID;
			log(updateListedVersion);
			db.run(updateListedVersion,upParams,function(err){
				if(err){
					db.run("ROLLBACK");
					res.json({error: -1, description: "SQL Error", err:err})
				}else{
					db.run("END");
					log("Created version " + lastSaveID + " of project " + projectID);
					res.json({"saveID": this.lastSaveID, "projectID": projectID});
				}
			});
		}else{
			db.run("END");
			log("Created version " + lastSaveID + " of project " + projectID);
			res.json({"saveID": this.lastSaveID, "projectID": projectID});
		}
	});
}

app.get('/code/search', function(req, res){
		var sast = Eden.Selectors.parse(req.query.selector);
		if (sast.local) {
			res.json([]);
		} else {
			var nodelist = Eden.Selectors.unique(sast.filter());
			var srcList = Eden.Selectors.processResults(nodelist, req.query.outtype);
			res.json(srcList);
		}
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
	
	if(req.query.projectID){
		if(req.query.to){
			db.serialize(function(){
				getFullVersion(req.query.to,req.query.projectID, [], function(ret){
					var source = ret.source;
					var date = ret.date;
					if(req.query.from){
						sendDiff(req.query.from,source,req.query.projectID,res);
					}else{
						res.json({saveID: req.query.to, projectID: req.query.projectID,source:source, date:date});
					}
				});
			});
		}else{
			var getProjectStmt = db.prepare("select saveID,date FROM view_latestVersion WHERE projectID = ?;");
			getProjectStmt.all(req.query.projectID,function(err,rows){
				var row = rows[0];
				db.serialize(function(){
					getFullVersion(row.saveID,req.query.projectID, [], function(ret){
						var source = ret.source;
						if(req.query.from){
							sendDiff(req.query.from,source,req.query.projectID,saveID,res);
						}else{
							res.json({saveID: row.saveID, date: row.date, projectID: req.query.projectID,source: source});
						}
					});
				});
			});
		}
	}else{
		res.json({error: 7, description: "projectID must be defined" });
	}
});

function sendDiff(fromID,toSource,projectID,toID,res){
	db.serialize(function(){
		getFullVersion(fromID,projectID,[],function(ret){
			var source = ret.source;
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(source,toSource,false);
			var p = dmp.patch_make(source,toSource,d);
			var patchText = dmp.patch_toText(p);
			res.json({from: fromID, projectID: projectID, to: toID, patch: patchText});
		});
	});
}

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
	var criteria = [];
	var tagCriteria = [];
	var criteriaVals = {};
	
	var paramObj = {};
	criteriaVals["@limit"] = 10;
	if(req.query.limit && (req.query.limit < 50))
		criteriaVals["@limit"] = req.query.limit;
	criteriaVals["@offset"] = 0;
	if(req.query.offset)
		criteriaVals["@offset"] = req.query.offset;

	if(req.query.projectID){
		criteria.push("projects.projectID = @projectID");
		criteriaVals["@projectID"] = req.query.projectID;
	}
	if(req.query.dateBefore){
		criteria.push("date < @dateBefore");
		criteriaVals["@dateBefore"] = req.query.dateBefore;
	}
	if(req.query.dateAfter){
		criteria.push("date < @dateAfter");
		criteriaVals["@dateAfter"] = req.query.dateAfter;
	}
	if(req.query.minimisedTitle){
		criteria.push("minimisedTitle LIKE @minimisedTitle");
		criteriaVals["@minimisedTitle"] = req.query.minimisedTitle;
	}
	if(req.query.title){
		criteria.push("title LIKE @title");
		criteriaVals["@title"] = req.query.title;
	}
	if(req.query.query){
		if(req.query.query.startsWith(":title(")){
			var endOfB = req.query.query.indexOf(")");
			criteria.push("title LIKE @title");
			criteriaVals["@title"] = "%" + req.query.query.substring(7,endOfB) + "%";
		}
	}

	if(req.query.tag){
		if(Array.isArray(req.query.tag)){
			for(var i = 0; i < req.query.tag.length; i++){
				tagCriteria.push("tags LIKE @tag" + i);
				criteriaVals["@tag" + i] = "% " + req.query.tag[i] + " %";
			}
		}else{
			tagCriteria.push("tags LIKE @tag");
			criteriaVals["@tag"] = "% " + req.query.tag + " %";
		}
	}
	
	var conditionStr = "";
	if(criteria.length > 0){
		conditionStr = " AND " + criteria.join(" AND ");
	}
	
	var tagConditionStr = "";
	if(tagCriteria.length > 0){
		tagConditionStr = " WHERE " + tagCriteria.join(" AND ");
	}
	
	var listQueryStr = 'SELECT projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags ' 
		+ 'FROM (SELECT projects.projectID, title, minimisedTitle, image, owner, name as ownername, publicVersion, parentProject, projectMetaData, '
		+ '(" " || group_concat(tag, " ") || " " ) as tags FROM projects,oauthusers left outer join tags on projects.projectID = tags.projectID WHERE owner = userid ' 
		+ conditionStr + ' group by projects.projectID)' + tagConditionStr + ' LIMIT @limit OFFSET @offset';
	
	var listProjectStmt = db.prepare(listQueryStr);

	listProjectStmt.all(criteriaVals,function(err,rows){
		if(err){
			res.json({error: -1, description: "SQL Error", err: err})
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
		}
		res.json(rows);
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
		var listProjectIDStmt = db.prepare("select projectid, saveID, date, parentDiff from projectversions where projectid = ?;");
		listProjectIDStmt.all(req.query.projectID,function(err,rows){
			res.json(rows);
		});
	}else if(req.query.userID !== undefined){
		var listProjectStmt = db.prepare("select projects.projectid, saveID, date, parentDiff from projectversions,projects where projects.projectid = projectversions.projectid AND owner = ?;");
		listProjectStmt.all(req.user.id,function(err,rows){
			res.json(rows);
		});
	}
});

app.get('/user/details', function(req, res){
	var u = null;

	if(typeof req.user != "undefined"){
		u = {id: req.user.id, name : req.user.displayName};
	}
	res.json(u);
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/facebook', passport.authenticate('facebook'));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect(config.BASEURL);
  });

app.get('/auth/twitter/callback', 
		  passport.authenticate('twitter', { failureRedirect: '/login' }),
		  function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect(config.BASEURL);
		  });

app.get('/auth/facebook/callback', 
		  passport.authenticate('facebook', { failureRedirect: '/login' }),
		  function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect(config.BASEURL);
		  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect(config.BASEURL);
});

app.listen(config.PORT);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if(req.user) {return next();}
  res.status(403).send('logout');
}
