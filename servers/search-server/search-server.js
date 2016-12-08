var express = require('express')
  , util = require('util')
 , cookieParser = require("cookie-parser")
 , bodyParser = require("body-parser")
 , methodOverride = require("method-override")
, session = require("express-session");
Eden = {};
var config = require("./config.js");

var lex = require(config.JSEDENPATH + "js/core/lex.js");
EdenStream = lex.EdenStream;
EdenSyntaxData = lex.EdenSyntaxData;
var lang = require(config.JSEDENPATH + "js/language/lang.js");
Language = lang.Language;
var en = require(config.JSEDENPATH + "js/language/en.js");
var query = require(config.JSEDENPATH + "js/query.js");
var translator = require(config.JSEDENPATH + "js/core/translator2.js");
var ast = require(config.JSEDENPATH + "js/core/ast.js");
var sqlite3 = require("sqlite3").verbose();
var errors = require(config.JSEDENPATH + "js/core/errors.js");
var db = new sqlite3.Database(config.DBPATH);
var allKnownAgents = {};

edenUI = {};
eden = {};

eden.root = {};
eden.root.symbols = {};

var doxy = require("../../js/doxycomments.js");

var vstmt = db.prepare("SELECT path, source FROM (SELECT saveID,agentID, source FROM (SELECT * FROM versions where permission = 1 order by agentid,saveID) GROUP BY agentid), agents where agentID = agents.id order by path");

initASTDB();

function initASTDB(){
	vstmt.all(function(err,rows){
		for(var i = 0; i < rows.length; i++){
			var tmpAst = new Eden.AST(rows[i].source,undefined,{});
			console.log("Parsing row " + i);
			allKnownAgents[rows[i].path] = tmpAst;
		}
	});
}

edenUI.regExpFromStr = function (str, flags, exactMatch, searchLang) {
	var regExpStr, regExpObj;
	var valid = true;
	var inputBox;
	var minWordLength = 3;

	if (flags === undefined) {
		flags = "";
	}

	//Determine the syntax that the user used to express their search.
	var simpleWildcards = true;

	//Guess desirability of case sensitivity based on the presence or absence of capital letters.
	if (!/[A-Z]/.test(str)) {
		flags = flags + "i";
	}

	//Handle substitutions to replace simple wildcards with real regexp ones.
	if (simpleWildcards) {
		//Mode where * acts as .* , ? as .? , or as |, no other special characters.
		str = str.replace(/([\\+^$.|(){[])/g, "\\$1").replace(/([*?])/g, ".$1");
		var alternatives = str.split(new RegExp("\\s+(?:" + Language.ui.search.disjunction + "|or)\\s+", "i"));
		for (var i = 0; i < alternatives.length; i++) {
			var alternative = alternatives[i];
			if (exactMatch || /[?*]/.test(alternative)) {
				alternatives[i] = "^(" + alternative + ")$";
			} else if (alternative.length < minWordLength) {
				//Assume very short strings are intended to be prefixes in simple search mode.
				alternatives[i] = "^(" + alternative + ")";
			}
		}
		regExpStr = alternatives.join("|");
		regExpObj = new RegExp(regExpStr, flags);

	}
	return regExpObj;
}

Eden.Query.queryScripts = function(path, ctx) {
	//console.log("PATH",path);
	var scripts = [];

	var paths = path.split(",");

	for (var i=0; i<paths.length; i++) {
		var path = paths[i].trim();
		
		if (path != "/") {
			if (path.includes("*")) {
				var regexp = edenUI.regExpFromStr(path, undefined, true, "simple");
				for (var x in allKnownAgents) {
					if (regexp.test(x)) {
						var ag = allKnownAgents[x];
						if (ag) scripts.push(ag.script);
					}
				}
			} else {
				// Find local action first
				var script;

				// Now attempt to find exact agent...
				if (script === undefined) {
					var ag = allKnownAgents[path];
					if (!ag) return []
					script = ag.script;
				}
				if (!script) return [];
				scripts.push(script);
			}
		}
	}
	//console.log(scripts);
	return scripts;
}



var insertAgentStmt;
// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/

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

  app.get('/', function(req, res){
	  res.json(null);
  });

function logErrors(err,req,res,next){
	console.log(err.stack);
	res.status(500);
	res.json({"error": "Error"});
}

app.get('/code/search', function(req, res){
		var srcList = Eden.Query.querySelector(req.query.selector, req.query.outtype);
		res.json(srcList);
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