var express = require('express')
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
var sqlite3 = require("sqlite3").verbose();
var errors = require(config.JSEDENPATH + "js/core/errors.js");
var db = new sqlite3.Database(config.DBPATH);
var allKnownAgents = {};

edenUI = {};
eden = {};

eden.root = {};
eden.root.symbols = {};

//var doxy = require(config.JSEDENPATH + "js/doxycomments.js");

var vstmt = db.prepare("select minimisedTitle,title,fullsource FROM (SELECT max(saveID) as maxsaveID from projectversions group by projectID) as maxv, projectversions,projects where maxsaveID = projectversions.saveID and projects.projectID = projectversions.projectID;");

initASTDB();

function initASTDB(){
	vstmt.all(function(err,rows){
		for(var i = 0; i < rows.length; i++){
			if (rows[i].fullsource === null) continue;
			console.log("Parsing row " + i, rows[i]);
			var tmpAst = new Eden.AST(rows[i].fullsource,undefined,{});
			allKnownAgents[rows[i].minimisedTitle] = tmpAst;
		}

		console.log(JSON.stringify(Eden.Index.name_index));
	});
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
		var sast = Eden.Selectors.parse(req.query.selector);
		if (sast.local) {
			res.json([]);
		} else {
			var nodelist = sast.filter();
			var srcList = Eden.Selectors.processResults(nodelist, req.query.outtype);
			res.json(srcList);
		}
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
