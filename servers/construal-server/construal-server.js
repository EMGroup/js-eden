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

app.post('/project/add', ensureAuthenticated, function(req, res){
	
	if(typeof req.user == "undefined")
		return res.json({error: "1", description: "Unauthenticated"});
	if(req.body.source == undefined){
		return res.json({error: "4", description: "No source provided"});
	}
	projectID = req.body.projectID;
	db.run("BEGIN TRANSACTION");
	if(projectID === undefined || projectID == null){
		createProject(req, res, function(req, res, lastID){
			addProjectVersion(req, res, lastID);
		});
	}else{
		addProjectVersion(req, res, projectID);
	}
	
});

function createProject(req, res, callback){
	var insertProjectStmt = db.prepare("INSERT INTO projects values (NULL,?,?,?,?,?,?,?)");
	
	insertProjectStmt.run(req.body.title,req.body.minimisedTitle,req.body.image,req.user.id,null,
			req.body.parentProject,req.body.metadata,
			function(){callback(req, res, this.lastID);});
}

function addProjectVersion(req, res, projectID){
	var addVersionStmt = db.prepare("INSERT INTO projectversions values (NULL,?,?,?,?,current_timestamp,?)");
	var pTextForward = null;
	var pTextBackward = null;
	if(req.body.from){
		db.serialize(function(){
		getFullVersion(req.body.from,function(baseSrc){
			var dmp = new window.diff_match_patch();
			var d = dmp.diff_main(baseSrc,req.body.source,false);
			var p = dmp.patch_make(baseSrc,req.body.source,d);
			pTextForward = dmp.patch_toText(p);
			var d = dmp.diff_main(req.body.source,baseSrc,false);
			var p = dmp.patch_make(req.body.source,baseSrc,d);
			pTextBackward = dmp.patch_toText(p);
			addVersionStmt.run(projectID, null, pTextForward, pTextBackward, req.body.from,function(){
				db.run("END");
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

function getFullVersion(version, callback){
	var versionStmt = db.prepare("SELECT fullsource, forwardPatch,parentDiff FROM projectversions WHERE saveID = ?");
	versionStmt.each(version,function(err,row){
		if(row.fullsource == null){
			//Go and get the source from the parentDiff
//			collateBasesAndPatches(row.parentDiff);
			getFullVersion(row.parentDiff, function(parentSource){
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

function collateBasesAndPatches(){
	
}

function applyPatch(base,patch,callback){

}

function updateProjectMetadata(req){
	
}

app.get('/project/get',ensureAuthenticated, function(req,res){
	//ProjectID must be defined
	//Request should have 'from' and 'to', which gives the diff between the two versions
	//If both undefined, get full snapshot of latest version (with no diffs)
	//If 'from' undefined, get full snapshot of 'to' version (no diffs).
	//If 'to' undefined but from is defined, get diff from 'from' to latest version.
	
	if(req.query.projectID){
		var getProjectStmt = db.prepare("SELECT projectid,saveID,date,source FROM projectversions where ");
	}
	if(req.query.to){
		console.log("Get results for to=" + req.query.to);
		db.serialize(function(){
			getFullVersion(req.query.to,function(source){
				res.json(source);
			});
		});
	}
});

/*app.post('/project/search',ensureAuthenticated,);*/

app.post('/project/versions',ensureAuthenticated, function(req, res){
	if(req.body.projectID !== undefined){
		var listProjectIDStmt = db.prepare("select projectid, saveID, date, parentDiff from projectversions where projectid = ?;");
		listProjectIDStmt.all(req.body.projectID,function(err,rows){
			res.json(rows);
		});
	}
	if(req.body.userID !== undefined){
		var listProjectStmt = db.prepare("select projects.projectid, saveID, date, parentDiff from projectversions,projects where projects.projectid = projectversions.projectid AND owner = ?;");
		listProjectStmt.all(req.body.userID,function(err,rows){
			res.json(rows);
		});
	}
	

});

function doInsert(vstmt, agentID, source, tag, parent, id, permission, title, group, res){
	vstmt.run(agentID, source, tag, parent, id, permission, title, group,function(a){
		var saveID = this.lastID;
		res.json({agent: agentID, saveID: saveID});
	});
}

app.get('/agent/get', function(req, res){
	var argArray = [];
	
	var version = null;
	var tag = null;
	if(typeof(req.query.tag) != "undefined"){
		tag = req.query.tag;
	}
	if(typeof(req.query.version != "undefined")){
		tag = null;
	}	
	

	var query = "SELECT path, saveID, source, tag, parentSaveID, date, name, versions.title FROM versions, agents, oauthusers WHERE ";
	var validQuery = false;


	
	if(typeof(req.query.path) != "undefined"){
		query = query + "path = ?";
		argArray.push(req.query.path)	;
		validQuery = true;
	}
	if(typeof(req.query.version) != "undefined"){
		if(validQuery)
			query = query + " AND";
		query = query + " saveID = ?";
		argArray.push(req.query.version);
		validQuery = true;
	}
	if(tag){
		query = query + " AND tag = ?";
		argArray.push(req.query.tag);
	}
	if(!validQuery)
		return res.json({error: "3", description: "Request requires either a path or a version" });
	
	query = query + " AND owner = oauthusers.id AND agents.id = agentID AND (owner = ? OR permission = 1) ORDER BY date desc LIMIT 1";
	var stmt = db.prepare(query);

	var tmpUser = -1;
	if(typeof req.user != "undefined")
		tmpUser = req.user.id;

	argArray.push(tmpUser);
	
	stmt.get(argArray, function(err,row){
		res.json(row);
	});
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
