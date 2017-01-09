var express = require('express')
  , passport = require('passport')
  , util = require('util')
 , cookieParser = require("cookie-parser")
 , bodyParser = require("body-parser")
 , methodOverride = require("method-override")
, session = require("express-session");
var sqlite3 = require("sqlite3").verbose();
var config = require("./config.js");
var db = new sqlite3.Database('csdb.sqlite3');
var passportUsers = require("./passport-users.js");
window = {};
var diffmatchpatch = require("../../js/lib/diff_match_patch.js");
var insertAgentStmt;
// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/

passportUsers.setupPassport(passport,db);

var app = express();

// configure Express
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({limit: '5mb'}));
  app.use(express.static("static"));
  app.use(logErrors);
  
  app.use(function(req, res, next) {
	  var allowedOrigins = ["http://localhost:18882","http://localhost:8000","http://127.0.0.1:8000","http://emgroup.github.io","http://jseden.dcs.warwick.ac.uk"];
	  var corsOrigin = "http://localhost:18882";
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
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));


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
 * 	projectid: [integer],
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
		var tagList = req.body.tags.split(" ");
		var tagObject = {};
		tagObject["@projectID"] = req.body.projectID;
		var deleteStr = "DELETE FROM tags WHERE projectID = @projectID";
		log("About to delete " + deleteStr);
		db.run(deleteStr,tagObject,function(){
			var insPairs = [];
			for(i = 0; i < tagList.length; i++){
				insPairs.push("(@projectID, @tag" + i + ")");
				tagObject["@tag" + i] = tagList[i];
			}
			insertStr = "INSERT INTO tags VALUES " + insPairs.join(",");
			log("inserting tags " + insertStr);
			db.run(insertStr,tagObject,function(){
				log("Updating project " + updateStr);
				db.run(updateStr,updateValues,callback);
			});

		});
	}else{
		log("Updating project " + updateStr);
		db.run(updateStr,updateValues,callback);
		
	}

}

function createProject(req, res, callback){
	var insertProjectStmt = db.prepare("INSERT INTO projects values (NULL,?,?,?,?,?,?,?)");
	
	insertProjectStmt.run(req.body.title,req.body.minimisedTitle,req.body.image,req.user.id,null,
			req.body.parentProject,req.body.metadata,
			function(err){
		if(err){
			db.run("ROLLBACK");
			res.json({error: -1, description: "SQL Error", err:err})
		}

		callback(req, res, this.lastID);
		});
}

function addProjectVersion(req, res, projectID){
	var addVersionStmt = db.prepare("INSERT INTO projectversions values (NULL,?,?,?,?,current_timestamp,?)");
	var pTextForward = null;
	var pTextBackward = null;
	if(req.body.from){
		db.serialize(function(){
		getFullVersion(req.body.from, projectID, function(baseSrc){
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(baseSrc,req.body.source,false);
			var p = dmp.patch_make(baseSrc,req.body.source,d);
			pTextForward = dmp.patch_toText(p);
			var d = dmp.diff_main(req.body.source,baseSrc,false);
			var p = dmp.patch_make(req.body.source,baseSrc,d);
			pTextBackward = dmp.patch_toText(p);
			addVersionStmt.run(projectID, null, pTextForward, pTextBackward, req.body.from,function(){
				db.run("END");
				log("Created version " + this.lastID + " of project " + projectID);
				var jsonres = {"saveID": this.lastID, "projectID": projectID};
				res.json(jsonres);
			});
		});
		});
	}else{
		addVersionStmt.run(projectID, req.body.source, null, null, null,function(){
			db.run("END");
			var jsonres = {"saveID": this.lastID, "projectID": projectID};
			res.json(jsonres);
		});
	}
}

function getFullVersion(version, projectID, callback){
	var versionStmt = db.prepare("SELECT fullsource, forwardPatch,parentDiff FROM projectversions WHERE saveID = ? AND projectID = ?");
	versionStmt.each(version,projectID, function(err,row){
		if(row.fullsource == null){
			//Go and get the source from the parentDiff
//			collateBasesAndPatches(row.parentDiff);
			getFullVersion(row.parentDiff, projectID, function(parentSource){
				var dmp = new window.diff_match_patch();
				var p = dmp.patch_fromText(row.forwardPatch);
				var r = dmp.patch_apply(p,parentSource);
				callback(r[0]);
			});
		}else{
			callback(row.fullsource);
		}
	});
}

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
				getFullVersion(req.query.to,req.query.projectID, function(source){
					var retData = {source: source};
					if(req.query.from){
						sendDiff(req.query.from,source,req.query.projectID,res);
					}else{
						res.json({saveID: req.query.to, projectID: req.query.projectID,source:source});
					}
				});
			});
		}else{
			var getProjectStmt = db.prepare("select saveID,date FROM (SELECT max(saveID) as " +
					"maxsaveID from projectversions group by projectID) as maxv, " +
					"projectversions where maxsaveID = projectversions.saveID and projectID = ?;");
			getProjectStmt.all(req.query.projectID,function(err,rows){
				var row = rows[0];
				db.serialize(function(){
					getFullVersion(row.saveID,req.query.projectID,function(source){
						if(req.query.from){
							sendDiff(req.query.from,source,req.query.projectID,saveID,res);
						}else{
							res.json({saveID: row.saveID, projectID: req.query.projectID,source: source});
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
		getFullVersion(fromID,projectID,function(source){
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
	criteria = [];
	tagCriteria = [];
	criteriaVals = {};
	
	var paramObj = {};
	criteriaVals["@limit"] = 10;
	if(req.query.limit && (req.query.limit < 50))
		criteriaVals["@limit"] = req.query.limit;
	criteriaVals["@offset"] = 0;
	if(req.query.offset)
		criteriaVals["@offset"] = req.query.offset;

	if(req.query.projectID){
		criteria.push("projectID = @projectID");
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
		if(err)
			res.json({error: -1, description: "SQL Error", err: err})
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
	console.log("<Details>");
	console.log(req.user);
	console.log("</Details>");
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
