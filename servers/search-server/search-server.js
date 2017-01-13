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
window = {};
var diffmatchpatch = require("../../js/lib/diff_match_patch.js"); 
var sqlite3 = require("sqlite3").verbose();
var errors = require(config.JSEDENPATH + "js/core/errors.js");
var db = new sqlite3.Database(config.DBPATH);
var allKnownProjects = {};

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
			var nodelist = Eden.Selectors.unique(sast.filter());
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
