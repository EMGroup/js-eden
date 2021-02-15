"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _express = _interopRequireDefault(require("express"));

var _passport = _interopRequireDefault(require("passport"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _config = _interopRequireDefault(require("./config.js"));

var passportUsers = _interopRequireWildcard(require("./passport-users.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

global.Eden = {
  edenFunctions: {}
};

global.EdenSymbol = function () {};

EdenSymbol.prototype.value = function () {};

global.edenFunctions = Eden.edenFunctions;

var lang = require("".concat(_config["default"].JSEDENPATH, "js/language/lang.js"));

global.Language = lang.Language;

var lex = require("".concat(_config["default"].JSEDENPATH, "js/lex.js"));

global.EdenStream = lex.EdenStream;
global.EdenSyntaxData = lex.EdenSyntaxData;
global.rt = require("".concat(_config["default"].JSEDENPATH, "js/core/runtime.js"));

require("".concat(_config["default"].JSEDENPATH, "js/language/en.js")); //require(config.JSEDENPATH + "js/util/misc.js");


require(_config["default"].JSEDENPATH + "js/index.js");

require(_config["default"].JSEDENPATH + "js/selectors/selector.js");

require(_config["default"].JSEDENPATH + "js/selectors/property.js");

require(_config["default"].JSEDENPATH + "js/selectors/name.js");

require(_config["default"].JSEDENPATH + "js/selectors/tag.js");

require(_config["default"].JSEDENPATH + "js/selectors/intersection.js");

require(_config["default"].JSEDENPATH + "js/selectors/union.js");

require(_config["default"].JSEDENPATH + "js/selectors/navigate.js");

require(_config["default"].JSEDENPATH + "js/ast/ast.js");

global.window = {};

var sqlite3 = require("sqlite3").verbose();

require(_config["default"].JSEDENPATH + "js/lib/diff_match_patch.js");

var randomstring = require('randomstring');

var errors = require(_config["default"].JSEDENPATH + "js/core/errors.js");

var warnings = require(_config["default"].JSEDENPATH + "js/core/warnings.js");

var db = new sqlite3.Database(_config["default"].DBPATH);
var allKnownProjects = {};
var projectRatings = {};
var projectRatingsCount = {};
var ERROR_SQL = -1;
var ERROR_UNAUTHENTICATED = 1;
var ERROR_INVALID_PROJECTID_FORMAT = 9;
var ERROR_NO_EXISTING_PROJECT = 5;
var ERROR_USER_NOT_OWNER = 6;
var ERROR_NO_PROJECTID = 7;
var ERROR_PROJECT_NOT_MATCHED = 10;
var ERROR_COMMENT_NOT_MATCHED = 11;
var ERROR_INVALID_FORMAT = 12;
var ERROR_NOTADMIN = 13;
passportUsers.setupPassport(_passport["default"], db);
global.edenUI = {};
global.eden = {};
eden.root = {};
eden.root.symbols = {}; //var doxy = require(config.JSEDENPATH + "js/doxycomments.js");

var vstmtStr = "select projects.projectID as projectID,view_listedVersion.saveID as saveID,title,minimisedTitle,projectMetaData,ifnull(group_concat(tag, \" \"),\"\") as tags, view_listedVersion.date as date," + " name as authorname from view_listedVersion, projects, oauthusers left join tags on projects.projectID = tags.projectID where " + "projects.projectID = view_listedVersion.projectID and owner = oauthusers.userid";
var vstmt = db.prepare(vstmtStr + " group by projects.projectid");
initASTDB();

var generateTimeStamp = function generateTimeStamp(str) {
  var relativeTimeRe = /(\d*)(minutes|minute|min|hours|hour|days|day|weeks|week|months|month|mon|years|year|Quarters|Quarter|seconds|second|sec|s|m|h|d|M|y|Y|Q|ms|w)/g;
  var comp;
  var stamp = 0;

  while ((comp = relativeTimeRe.exec(str)) !== null) {
    console.log("Reltime:", comp);

    switch (comp[2]) {
      case "second":
      case "seconds":
      case "s":
        stamp += parseInt(comp[1]) * 1000;
        break;

      case "minute":
      case "minutes":
      case "m":
        stamp += parseInt(comp[1]) * 60000;
        break;

      case "hour":
      case "hours":
      case "h":
        stamp += parseInt(comp[1]) * 3600000;
        break;
    }
  }

  return stamp;
};

function getFullVersion(version, projectID, meta, callback) {
  var versionStmt = db.prepare("SELECT fullsource, forwardPatch,parentDiff,date FROM projectversions WHERE saveID = ? AND projectID = ?");
  versionStmt.each(version, projectID, function (err, row) {
    if (row.fullsource == null) {
      //Go and get the source from the parentDiff
      //			collateBasesAndPatches(row.parentDiff);
      getFullVersion(row.parentDiff, projectID, meta, function (ret) {
        var parentSource = ret.source;
        var dmp = new window.diff_match_patch();
        var p = dmp.patch_fromText(row.forwardPatch);
        var r = dmp.patch_apply(p, parentSource);
        callback({
          source: r[0],
          date: row.date,
          meta: meta
        });
      });
    } else {
      callback({
        source: row.fullsource,
        date: row.date,
        meta: meta
      });
    }
  });
}

function initASTDB() {
  logErrorTime("InitASTDB");
  vstmt.all(function (err, rows) {
    var status = {
      count: 0,
      errors: 0,
      version2: 0,
      version3: 0
    };
    console.log("Parser Default: ", Eden.AST.version);

    if (err) {
      console.log("Error: " + err);
    }

    for (var i = 0; i < rows.length; i++) {
      rows[i].stamp = new Date(rows[i].date).getTime(); // console.log("Parsing row " + i, rows[i]);

      getFullVersion(rows[i].saveID, rows[i].projectID, rows[i], function (data) {
        var origin = {
          id: data.meta.projectID,
          saveID: data.meta.saveID,
          name: data.meta.minimisedTitle,
          title: data.meta.title,
          tags: data.meta.tags.split(" "),
          author: data.meta.authorname,
          stamp: data.meta.stamp
        };
        var tmpAst = new Eden.AST(data.source, undefined, origin, {
          version: 1
        }); // Try with older parser

        if (tmpAst.hasErrors()) {
          tmpAst = new Eden.AST(data.source, undefined, origin, {
            version: 0
          });
        }

        if (tmpAst.hasErrors()) {
          console.error("\"".concat(data.meta.title, " (").concat(data.meta.projectID, ")\" has errors: ").concat(tmpAst.script.errors[0].messageText()));
          status.errors++;
        }

        if (tmpAst.version === 0) {
          status.version2++;
        } else {
          status.version3++;
        }

        allKnownProjects[data.meta.projectID] = tmpAst.script;
        status.count++;

        if (status.count === rows.length) {
          console.log("Indexed ".concat(status.count, " construals, but ").concat(status.errors, " errored"));
          console.log("Old construals = ".concat(status.version2, ", new = ").concat(status.version3));
        }
      });
    }
  });
}

function reindexProject(projectID) {
  log("Reindexing projectID: " + projectID);
  var myVStmt = db.prepare(vstmtStr + " and projects.projectID = @projectID");
  var params = {};
  params["@projectID"] = projectID;
  myVStmt.all(params, function (err, rows) {
    if (err) {
      log("Error: " + err);
      return;
    } else {
      var row = rows[0];
      getFullVersion(row.saveID, row.projectID, row, function (data) {
        if (allKnownProjects[row.projectID]) allKnownProjects[row.projectID].destroy();
        var tmpAst = new Eden.AST(data.source, undefined, {
          id: row.projectID,
          saveID: row.saveID,
          name: data.meta.minimisedTitle,
          title: data.meta.title,
          tags: data.meta.tags.split(" "),
          author: data.meta.authorname,
          stamp: data.meta.stamp
        });
        allKnownProjects[row.projectID] = tmpAst.script;
      });
    }
  });
} // pid, source, location within AST. Reindex then patch


function loadVersion(saveID, cb) {
  getProjectIDFromSaveID(saveID, undefined, function (pid) {
    if (!pid) {
      cb();
      return;
    }

    getProjectMetaData(pid, undefined, undefined, function (meta) {
      getFullVersion(saveID, pid, meta, function (data) {
        var tmpAst = new Eden.AST(data.source, undefined, {
          id: pid,
          saveID: saveID,
          name: data.meta.minimisedTitle,
          title: data.meta.title,
          tags: data.meta.tags ? data.meta.tags.split(" ") : [],
          author: data.meta.authorname,
          stamp: data.meta.stamp
        });
        cb(tmpAst.script);
      });
    });
  });
}

Eden.Selectors.query = function (s, o, options, cb) {
  cb([]);
};

Eden.Selectors.PropertyNode.prototype.construct = function () {
  var _this = this;

  var result;

  switch (this.name) {
    case ".type":
      result = Eden.Index.getByType(this.value);
      break;

    case ".id":
      result = Eden.Index.getByID(this.value);
      break;

    case ".name":
      if (this.param === undefined) {
        result = Eden.Index.getAllWithName();
      } else if (this.isreg) {
        result = Eden.Index.getByNameRegex(this.value);
      } else {
        result = Eden.Index.getByName(this.value);
      }

      break;

    case ".v":
    case ".vid":
    case ".version":
      return new Promise(function (resolve, reject) {
        loadVersion(_this.value, function (ast) {
          resolve(ast ? [ast] : []);
        });
      });
    // TODO this doesn't capture executes.

    case ":remote":
    case ":root":
      result = Object.keys(allKnownProjects).map(function (e) {
        return allKnownProjects[e];
      });
      break;

    case ":active":
    case ":depends":
    case ":determines":
    case ".depends":
    case ".determines":
    case ":project":
      result = [];
      break;

    default:
      result = Eden.Index.getAll();
  }

  return Promise.resolve(result);
};

var flash = require('connect-flash');

var app = (0, _express["default"])(); // configure Express

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use((0, _cookieParser["default"])());
app.use(_bodyParser["default"].urlencoded({
  limit: '5mb'
}));
app.use(_express["default"]["static"]("static"));
app.use(logErrors);
app.use(flash());
app.use(function (req, res, next) {
  var allowedOrigins = ["http://localhost:8000", "http://127.0.0.1:8000", "http://emgroup.github.io", "http://jseden.dcs.warwick.ac.uk", "http://construit.co.uk"];
  var corsOrigin = "http://localhost:8000";

  if (typeof req.headers.origin != 'undefined' && allowedOrigins.indexOf(req.headers.origin) > -1) {
    corsOrigin = req.headers.origin;
  } else if (typeof req.headers["jseden-origin"] != 'undefined') {
    corsOrigin = req.headers["jseden-origin"];
  }

  res.header("Access-Control-Allow-Origin", corsOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, JSEDEN-ORIGIN");
  next();
});
app.use((0, _expressSession["default"])({
  secret: _config["default"].SESSION_SECRET
}));
app.use(_passport["default"].initialize());
app.use(_passport["default"].session());
app.get('/', function (req, res) {
  logErrorTime("Getting root");

  if (req.user !== undefined && req.user.id == null) {
    res.render('registration', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else if (req.user !== undefined && req.user.status == "localunregistered") {
    res.render('editprofile', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else {
    res.render('index', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  }
});
app.get('/index', function (req, res) {
  logErrorTime("Getting root");

  if (req.user !== undefined && req.user.id == null) {
    res.render('registration', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else if (req.user !== undefined && req.user.status == "localunregistered") {
    res.render('editprofile', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else {
    res.render('index', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  }
});
app.post("/updateprofile", ensureAuthenticated, function (req, res) {
  logErrorTime("update Profile");
  var displayName = req.body.displayName;
  var stmt = db.prepare("UPDATE oauthusers SET name = ?, status = \"registered\" WHERE oauthstring = ?");
  stmt.run(req.body.displayName, req.user.oauthstring, function (err) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.redirect(_config["default"].BASEURL);
    }
  });
});
app.get('/join', function (req, res) {
  logErrorTime("Join");
  res.render('joincommunity', {
    user: req.user,
    baseurl: _config["default"].BASEURL
  });
});
app.post('/comment/post', ensureAuthenticated, function (req, res) {
  logErrorTime("Comment post");
  var stmt = db.prepare("INSERT INTO comments VALUES (NULL, ?, ?, current_timestamp, ?, ?, ?);");
  if (req.body.publiclyVisible != 0 && req.body.publiclyVisible != 1) res.json({
    error: ERROR_INVALID_FORMAT,
    description: "Invalid range for 'publiclyVisible'"
  });
  stmt.run(req.body.projectID, req.body.versionID, req.user.id, req.body.publiclyVisible, req.body.comment, function (err) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.json({
        commentID: this.lastID
      });
    }
  });
});
app.post('/comment/delete', ensureAuthenticated, function (req, res) {
  logErrorTime("comment delete");
  var stmt = db.prepare("DELETE FROM comments WHERE commentID = ? AND author = ?");
  stmt.run(req.body.commentID, req.user.id, function (err) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    }

    if (this.changes == 0) res.json({
      error: ERROR_COMMENT_NOT_MATCHED,
      description: "Matching project not found"
    });
    if (this.changes > 0) res.json({
      status: "deleted",
      changes: this.changes
    });
  });
});
app.get('/comment/search', function (req, res) {
  //logErrorTime("Comment search");
  var stmtstr = "SELECT name,commentID,projectID,versionID,date,author,public,comment FROM comments,oauthusers WHERE projectID = @projectID AND public = 1";
  var criteriaObject = {};
  criteriaObject["@projectID"] = req.query.projectID;
  criteriaObject["@offset"] = 0;
  criteriaObject["@limit"] = 100;

  if (req.query.newerThan) {
    stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
    criteriaObject["@newerThanComment"] = req.query.newerThan;
  }

  if (req.query.offset) criteriaObject["@offset"] = req.query.offset;
  if (req.query.limit) criteriaObject["@limit"] = req.query.limit;
  stmtstr += " AND author = userid ORDER BY date DESC LIMIT @limit OFFSET @offset";
  var stmt = db.prepare(stmtstr);
  stmt.all(criteriaObject, function (err, rows) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      if (req.user) {
        stmtstr = "SELECT name,commentID,projectID,versionID,date,author,public,comment FROM comments,oauthusers WHERE projectID = @projectID AND public = 0 AND author = @author";
        criteriaObject = {};
        criteriaObject["@projectID"] = req.query.projectID;
        criteriaObject["@offset"] = 0;
        criteriaObject["@limit"] = 100;
        criteriaObject["@author"] = req.user.id;

        if (req.query.newerThan) {
          stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
          criteriaObject["@newerThanComment"] = req.query.newerThan;
        }

        if (req.query.offset) criteriaObject["@offset"] = req.query.offset;
        if (req.query.limit) criteriaObject["@limit"] = req.query.limit;
        stmtstr += " AND author = userid LIMIT @limit OFFSET @offset";
        var privStmt = db.prepare(stmtstr);
        privStmt.all(criteriaObject, function (err, privRows) {
          if (err) {
            res.json({
              error: ERROR_SQL,
              description: "SQL Error",
              err: err
            });
          } else {
            var mergedRows = rows.concat(privRows);
            res.json(mergedRows);
          }
        });
      } else {
        res.json(rows);
      }
    }
  });
});
app.get('/comment/activity', function (req, res) {
  if (req.user.admin != 1) {
    res.json({
      error: ERROR_NOTADMIN,
      description: "Must be admin to see comment activity"
    });
    return;
  }

  var stmtstr = "SELECT name,commentID,comments.projectID,title,versionID,date,author,public,comment FROM comments,oauthusers,projects WHERE public = 1 AND comments.projectID = projects.projectID";
  var criteriaObject = {};
  criteriaObject["@offset"] = 0;
  criteriaObject["@limit"] = 100;

  if (req.query.newerThan) {
    stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
    criteriaObject["@newerThanComment"] = req.query.newerThan;
  }

  if (req.query.offset) criteriaObject["@offset"] = req.query.offset;
  if (req.query.limit) criteriaObject["@limit"] = req.query.limit;
  stmtstr += " AND author = userid ORDER BY date DESC LIMIT @limit OFFSET @offset";
  var stmt = db.prepare(stmtstr);
  stmt.all(criteriaObject, function (err, rows) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.json(rows);
    }
  });
});

function registerUser(req, oauthcode, displayName, status, callback) {
  var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?, ?,0)");
  stmt.run(oauthcode, displayName, status, function (err) {
    req.user.id = this.lastID;

    if (callback) {
      callback();
    }
  });
}

app.post('/registration', function (req, res) {
  registerUser(req, req.user.oauthcode, req.body.displayName, "registered", function () {
    res.redirect(_config["default"].BASEURL);
  });
});
app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', {
    user: req.user,
    baseurl: _config["default"].BASEURL
  });
});
app.get('/login', function (req, res) {
  res.render('login', {
    user: req.user,
    baseurl: _config["default"].BASEURL,
    message: req.flash('loginMessage')
  });
});

function logErrorTime(str) {
  console.error(new Date().toISOString() + ": " + str);
}

function logErrors(err, req, res, next) {
  console.error(new Date().toISOString() + ": " + str);
  console.error(err.stack);
  res.status(500);
  res.json({
    "error": "Error"
  });
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


app.post('/project/add', ensureAuthenticated, function (req, res) {
  logErrorTime("Adding project");
  if (typeof req.user == "undefined") return res.json({
    error: ERROR_UNAUTHENTICATED,
    description: "Unauthenticated"
  });
  var projectID = req.body.projectID;

  if (projectID == undefined || projectID == null || projectID == "") {
    db.run("BEGIN TRANSACTION");
    log("Creating new project");
    createProject(req, res, function (req, res, lastID) {
      log("New project id is " + lastID);
      addProjectVersion(req, res, lastID);
    });
  } else if (isNaN(projectID)) {
    res.json({
      error: ERROR_INVALID_PROJECTID_FORMAT,
      description: "Invalid projectID format"
    });
  } else {
    db.run("BEGIN TRANSACTION");
    checkOwner(req, res, function () {
      updateProject(req, res, function (err) {
        if (req.body.source == undefined) {
          db.run("END");
          res.json({
            status: "updated",
            projectID: projectID
          });
        } else {
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

app.post('/project/patch', ensureAuthenticated, function (req, res) {
  logErrorTime("Adding project");
  if (typeof req.user == "undefined") return res.json({
    error: ERROR_UNAUTHENTICATED,
    description: "Unauthenticated"
  });
  var sast = Eden.Selectors.parse(req.body.selector);

  if (sast.local) {
    res.json([]);
  } else {
    sast.filter().then(function (p) {
      var astres = Eden.Selectors.unique(p);

      if (astres.length != 1 || astres[0].type != "script") {
        return false;
      }

      var parent = astres[0];

      while (parent.parent) {
        parent = parent.parent;
      }

      checkOwner(req, res, function () {
        var newnode = Eden.AST.parseScript(req.body.source);
        astres[0].patchInner(newnode);
        res.json({
          status: "updated",
          projectID: parent.id
        });
      }, function (errstr) {
        res.json({
          error: "error",
          description: "Error patching project" + errstr,
          projectID: parent.id
        });
      }, parent.id);
    })["catch"](function (error) {
      logErrorTime("Query error for: " + req.body.selector + " - " + error);
    });
  }
});

function log(str) {
  console.log(new Date().toISOString() + ": " + str);
}

function checkOwner(req, res, callback, failedcallback, pid) {
  logErrorTime("checking Owner");
  logErrorTime("pid" + pid);
  var checkStmt = db.prepare("SELECT owner,writePassword FROM projects WHERE projectID = @projectID");
  var qValues = {};

  if (pid) {
    qValues["@projectID"] = pid;
  } else {
    qValues["@projectID"] = req.body.projectID;
  }

  checkStmt.all(qValues, function (err, rows) {
    if (rows.length == 0) {
      db.run("ROLLBACK");
      res.json({
        error: ERROR_NO_EXISTING_PROJECT,
        description: "No existing project"
      });
    } else {
      if (rows[0].owner == req.user.id || req.body.writePassword == rows[0].writePassword && rows[0].writePassword != null) {
        req.body.writePassword = rows[0].writePassword;
        callback();
      } else {
        db.run("ROLLBACK");

        if (failedcallback) {
          failedcallback("You do not own this project");
        }

        res.json({
          error: ERROR_USER_NOT_OWNER,
          description: "User does not own this project"
        });
      }
    }
  });
}

function updateProject(req, res, callback) {
  var updatesNeeded = [];
  var updateValues = {};
  var updateArr = [];
  var updateStrs = [];

  if (req.body.title) {
    updatesNeeded.push("title = @title");
    updateValues["@title"] = req.body.title;
  }

  if (req.body.minimisedTitle) {
    updatesNeeded.push("minimisedTitle = @minimisedTitle");
    updateValues["@minimisedTitle"] = req.body.minimisedTitle;
  }

  if (req.body.image) {
    updatesNeeded.push("image = @image");
    updateValues["@image"] = req.body.image;
  }

  if (req.body.metadata) {
    updatesNeeded.push("projectMetadata = @metadata");
    updateValues["@metadata"] = req.body.metadata;
  }

  if (updatesNeeded.length == 0 && !req.body.tags) {
    callback();
    return;
  }

  updateValues["@projectID"] = req.body.projectID;
  var updateStr = "UPDATE projects SET " + updatesNeeded.join(", ") + " WHERE projectID = @projectID";

  if (req.body.tags) {
    var deleteStr = "DELETE FROM tags WHERE projectID = @projectID";
    log("About to delete " + deleteStr);
    var tagObject = {};
    tagObject["@projectID"] = req.body.projectID;
    db.run(deleteStr, tagObject, function (err) {
      if (err) {
        db.run("ROLLBACK");
        res.json({
          error: ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      } else updateTags(req, req.body.projectID, function (err) {
        if (err) {
          db.run("ROLLBACK");
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
        }

        log("Updating project " + updateStr);
        db.run(updateStr, updateValues, callback);
      });
    });
  } else {
    log("Updating project " + updateStr);
    db.run(updateStr, updateValues, callback);
  }
}

function updateTags(req, projectID, callback) {
  var tagList;
  if (Array.isArray(req.body.tags)) tagList = req.body.tags;else tagList = [req.body.tags];
  console.log(tagList);
  var tagObject = {};
  tagObject["@projectID"] = projectID;
  var insPairs = [];

  for (var i = 0; i < tagList.length; i++) {
    insPairs.push("(@projectID, @tag" + i + ")");
    tagObject["@tag" + i] = tagList[i];
  }

  var insertStr = "INSERT INTO tags VALUES " + insPairs.join(",");
  log("inserting tags " + insertStr);
  db.run(insertStr, tagObject, callback);
}

function createProject(req, res, callback) {
  var insertProjectStmt = db.prepare("INSERT INTO projects values (NULL,?,?,?,?,?,?,?,?)");
  var writePassword = parseInt(Math.random() * 100000000000000000).toString(36);
  req.body.writePassword = writePassword;
  insertProjectStmt.run(req.body.title, req.body.minimisedTitle, req.body.image, req.user.id, null, req.body.parentProject, req.body.metadata, writePassword, function (err) {
    if (err) {
      db.run("ROLLBACK");
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      var lastProjectID = this.lastID;
      updateTags(req, lastProjectID, function (err) {
        if (err) {
          db.run("ROLLBACK");
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
        } else callback(req, res, lastProjectID);
      });
    }
  });

  if (req.body.parentProject) {
    var downloadsSQL = "UPDATE projectstats SET forks = forks + 1 WHERE projectID = ?;";
    db.run(downloadsSQL, req.body.parentProject, function (err) {
      if (err) {
        logErrorTime(err);
        res.json({
          error: ERROR_SQL,
          description: "SQL Error",
          err: err
        });
        return;
      }

      if (this.changes == 0) {
        var insDownloadsSQL = "INSERT INTO projectstats VALUES (?,0,1,0,0)";
        db.run(insDownloadsSQL, req.body.parentProject, function (err) {
          if (err) {
            logErrorTime(err);
            res.json({
              error: ERROR_SQL,
              description: "SQL Error",
              err: err
            });
            return;
          }

          console.log("INSERTED projectstats");
        });
      } else {
        console.log("UPDATED projectstats");
      }
    });
  }
}

function addProjectVersion(req, res, projectID) {
  var addVersionStmt = db.prepare("INSERT INTO projectversions values (NULL,@projectID,@source,@pForward,@pBackward,current_timestamp,@from,@readPassword,@author)");
  var pTextForward = null;
  var pTextBackward = null;
  var listed = false;
  var readPassword = null;

  if (req.body.listed && req.body.listed == "true") {
    listed = true;
  } else {
    readPassword = parseInt(Math.random() * 100000000000000000).toString(36);
  }

  var params = {};
  params["@author"] = req.user.id;
  params["@projectID"] = projectID;
  params["@readPassword"] = readPassword;

  if (req.body.from) {
    db.serialize(function () {
      getFullVersion(req.body.from, projectID, [], function (ret) {
        var baseSrc = ret.source;
        var dmp = new window.diff_match_patch();
        var d = dmp.diff_main(baseSrc, req.body.source, false);
        var p = dmp.patch_make(baseSrc, req.body.source, d);
        pTextForward = dmp.patch_toText(p);
        var d = dmp.diff_main(req.body.source, baseSrc, false);
        var p = dmp.patch_make(req.body.source, baseSrc, d);
        pTextBackward = dmp.patch_toText(p);
        params["@source"] = null;
        params["@pForward"] = pTextForward;
        params["@pBackward"] = pTextBackward;
        params["@from"] = req.body.from;
        runAddVersion(addVersionStmt, listed, params, req, res);
      });
    });
  } else {
    params["@source"] = req.body.source;
    params["@pForward"] = null;
    params["@pBackward"] = null;
    params["@from"] = null;
    runAddVersion(addVersionStmt, listed, params, req, res);
  }
}

function runAddVersion(addVersionStmt, listed, params, req, res) {
  var projectID = params["@projectID"];
  addVersionStmt.run(params, function () {
    var lastSaveID = this.lastID;

    if (listed) {
      var updateListedVersion = "UPDATE projects set publicVersion = @saveID WHERE projectID = @projectID";
      var upParams = {};
      upParams["@saveID"] = lastSaveID;
      upParams["@projectID"] = projectID;
      log(updateListedVersion);
      db.run(updateListedVersion, upParams, function (err) {
        if (err) {
          db.run("ROLLBACK");
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
        } else {
          db.run("END");
          log("Created version " + lastSaveID + " of project " + projectID);
          res.json({
            "saveID": lastSaveID,
            "projectID": projectID,
            "writePassword": req.body.writePassword,
            "readPassword": params["@readPassword"]
          });
          reindexProject(projectID);
        }
      });
    } else {
      db.run("END");
      log("Created version " + lastSaveID + " of project " + projectID);
      res.json({
        "saveID": lastSaveID,
        "projectID": projectID,
        "writePassword": req.body.writePassword,
        "readPassword": params["@readPassword"]
      });
    }
  });
}

app.get('/code/search', function (req, res) {
  logErrorTime("Code search");
  var sast = Eden.Selectors.parse(req.query.selector);

  if (sast.local) {
    res.json([]);
  } else {
    sast.filter().then(function (p) {
      var nodelist = Eden.Selectors.unique(p);
      var outtype = "standalone_outersource";
      if (req.query.outtype !== undefined) outtype = req.query.outtype;
      var srcList = Eden.Selectors.processResults(nodelist, outtype);
      res.json(srcList);
    })["catch"](function (error) {
      logErrorTime("Query error for: " + req.body.selector + " - " + error);
    });
  }
});
app.get('/code/get', function (req, res) {
  logErrorTime("Code get");
  var sast = Eden.Selectors.parse(req.query.selector);

  if (sast.local) {
    res.json([]);
  } else {
    sast.filter().then(function (p) {
      var nodelist = Eden.Selectors.unique(p);
      var srcList = Eden.Selectors.processResults(nodelist, "standalone_outersource");

      if (srcList.length == 0) {
        res.json({
          "error": "Not found"
        });
        return;
      }

      if (parseInt(req.query.timestamp) < nodelist[0].stamp) {
        res.json({
          timestamp: nodelist[0].stamp,
          src: srcList[0]
        });
        return;
      }

      res.json({});
    })["catch"](function (error) {
      logErrorTime("Query error for: " + req.body.selector + " - " + error);
    });
  }
});

function getMaxReadableSaveID(projectID, user, res, callback) {
  var getMaxSaveIDStmt = db.prepare("SELECT max(saveID) as maxSaveID FROM projectversions, projects WHERE projects.projectID = projectversions.projectID " + "AND projectversions.projectID = ? AND (readPassword is NULL OR projects.owner = ?)");
  getMaxSaveIDStmt.get(projectID, user, function (err, row) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (row == undefined) res.json({
      error: ERROR_SQL,
      description: ""
    });
    callback(row.maxSaveID);
  });
}

function getVersionInfo(saveID, projectID, userID, readPassword, res, callback) {
  var getVersionInfoStmt = db.prepare("SELECT date, readPassword, owner FROM projectversions, projects WHERE projectversions.projectid = projects.projectid and saveID = ?");
  getVersionInfoStmt.get(saveID, function (err, row) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (row && (row.owner == userID || row.readPassword == null || row.readPassword == readPassword)) {
      console.log("Allowing because row.owner = ", row.owner, " and userID = ", userID, " and row.readPassword = ", row.readPassword, " and readPassword = ", readPassword);
      callback(saveID, projectID, row.date);
    } else {
      if (row) res.json({
        error: ERROR_USER_NOT_OWNER,
        description: "No permissions"
      });else res.json({
        error: ERROR_PROJECT_NOT_MATCHED,
        description: "No matching saveID"
      });
    }
  });
}

function getProjectMetaDataFromSaveID(saveID, res, callback) {
  getProjectIDFromSaveID(saveID, res, function (projectID) {
    getProjectMetaData(projectID, null, callback);
  });
}

function getProjectIDFromSaveID(saveID, res, callback) {
  var query = db.prepare('SELECT projectID FROM projectversions WHERE saveID = ?');
  query.get(saveID, function (err, row) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    } else {
      callback(row ? row.projectID : undefined);
    }
  });
}

function getProjectMetaData(projectID, userID, res, callback) {
  var metadataQuery = db.prepare('SELECT projects.projectID, title, minimisedTitle, image, owner, oauthusers.name as ownername, publicVersion, parentProject, projectMetaData, ' + '(" " || group_concat(tag, " ") || " " ) as tags, stars as myrating ' + 'FROM projects, oauthusers left outer join tags on projects.projectID = tags.projectID left outer join projectratings on ' + 'projectratings.projectID = projects.projectID AND projectratings.userID = ? WHERE owner = oauthusers.userid AND projects.projectID = ?');
  metadataQuery.get(userID, projectID, function (err, row) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    } else {
      callback(row);
    }
  });
}

function increaseProjectDownloadStat(req, res) {
  var downloadsSQL = "UPDATE projectstats SET downloads = downloads + 1 WHERE projectID = ?;";
  db.run(downloadsSQL, req.query.projectID, function (err) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (this.changes == 0) {
      var insDownloadsSQL = "INSERT INTO projectstats VALUES (?,1,0,0,0)";
      db.run(insDownloadsSQL, req.query.projectID, function (err) {
        if (err) {
          logErrorTime(err);
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
          return;
        }

        console.log("INSERTED projectstats");
      });
    } else {
      console.log("UPDATED projectstats");
    }
  });
}

app.get('/project/tags', function (req, res) {
  var stmtstr = "SELECT projectID,tag FROM tags WHERE tag LIKE @tagname";
  var criteriaObject = {};
  criteriaObject["@offset"] = 0;
  criteriaObject["@limit"] = 100;
  criteriaObject["@tagname"] = "%" + req.query.tag + "%";
  /*if(req.query.offset)
   criteriaObject["@offset"] = req.query.offset;
  if(req.query.limit)
   criteriaObject["@limit"] = req.query.limit;*/

  stmtstr += " LIMIT @limit OFFSET @offset";
  var stmt = db.prepare(stmtstr);
  var tags = {};
  stmt.all(criteriaObject, function (err, rows) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      //res.json(rows);
      for (var i = 0; i < rows.length; i++) {
        var tmp = rows[i].tag.split(" ");

        for (var j = 0; j < tmp.length; j++) {
          if (tmp[j] == req.query.tag) continue;
          if (tags[tmp[j]] === undefined) tags[tmp[j]] = 1;else tags[tmp[j]]++;
        }
      }

      var sorted = [];

      for (var x in tags) {
        sorted.push(x);
      }

      sorted.sort(function (a, b) {
        return tags[b] - tags[a];
      });
      res.json(sorted);
    }
  });
});
app.get('/project/activity', function (req, res) {
  if (req.user.admin != 1) {
    res.json({
      error: ERROR_NOTADMIN,
      description: "Must be admin to see project activity"
    });
    return;
  }

  var stmtstr = "SELECT name,saveID,projectversions.projectID,date,title,readPassword FROM projectversions,oauthusers,projects WHERE oauthusers.userid = projects.owner AND projectversions.projectID = projects.projectID";
  var criteriaObject = {};
  criteriaObject["@offset"] = 0;
  criteriaObject["@limit"] = 100;

  if (req.query.newerThan) {
    stmtstr += " AND date > (SELECT date from projectversions WHERE saveID = @newerThanVersion)";
    criteriaObject["@newerThanVersion"] = req.query.newerThan;
  }

  if (req.query.offset) criteriaObject["@offset"] = req.query.offset;
  if (req.query.limit) criteriaObject["@limit"] = req.query.limit;
  stmtstr += " ORDER BY date DESC LIMIT @limit OFFSET @offset";
  var stmt = db.prepare(stmtstr);
  stmt.all(criteriaObject, function (err, rows) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
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

app.get('/project/get', function (req, res) {
  logErrorTime("Project get"); //ProjectID must be defined
  //Request should have 'from' and 'to', which gives the diff between the two versions
  //If both undefined, get full snapshot of latest version (with no diffs)
  //If 'from' undefined, get full snapshot of 'to' version (no diffs).
  //If 'to' undefined but from is defined, get diff from 'from' to latest version.

  if (!req.query.projectID) return res.json({
    error: ERROR_NO_PROJECTID,
    description: "projectID must be defined"
  });
  var userID = -1;

  if (req.user != undefined) {
    userID = req.user.id;
  }

  var targetSaveID = null;

  if (req.query.to) {
    console.log("To ID specified");
    targetSaveID = req.query.to;
    getVersionInfo(targetSaveID, req.query.projectID, userID, req.query.readPassword, res, function (saveID, projectID, date) {
      getProjectMetaData(req.query.projectID, userID, res, function (metaRow) {
        db.serialize(function () {
          getFullVersion(saveID, req.query.projectID, metaRow, function (ret) {
            var source = ret.source;
            var date = ret.date;

            if (req.query.from) {
              sendDiff(req.query.from, source, req.query.projectID, targetSaveID, res, metaRow);
            } else {
              var srcRow = {
                saveID: saveID,
                projectID: projectID,
                source: source,
                date: date,
                meta: metaRow
              };
              res.json(Object.assign(srcRow, metaRow));
            }
          });
        });
      });
    });
  } else {
    getMaxReadableSaveID(req.query.projectID, userID, res, function (saveID) {
      getVersionInfo(saveID, req.query.projectID, userID, req.query.readPassword, res, function () {
        getProjectMetaData(req.query.projectID, userID, res, function (metaRow) {
          db.serialize(function () {
            getFullVersion(saveID, req.query.projectID, metaRow, function (ret) {
              var source = ret.source;
              var date = ret.date;

              if (req.query.from) {
                sendDiff(req.query.from, source, req.query.projectID, saveID, res, metaRow);
              } else {
                var srcRow = {
                  saveID: saveID,
                  projectID: req.query.projectID,
                  source: source,
                  date: date,
                  meta: metaRow
                };
                res.json(Object.assign(srcRow, metaRow));
              }
            });
          });
        });
      });
    });
  }

  increaseProjectDownloadStat(req, res);
});

function sendDiff(fromID, toSource, projectID, toID, res, metaRow) {
  db.serialize(function () {
    getFullVersion(fromID, projectID, [], function (ret) {
      var source = ret.source;
      var dmp = new window.diff_match_patch();
      var d = dmp.diff_main(source, toSource, false);
      var p = dmp.patch_make(source, toSource, d);
      var patchText = dmp.patch_toText(p);
      var srcRow = {
        from: fromID,
        projectID: projectID,
        to: toID,
        patch: patchText
      };
      res.json(Object.assign(srcRow, metaRow));
    });
  });
}

function processSelectorNode(t, criteria, criteriaVals, i) {
  if (t.type == "property") {
    switch (t.name) {
      case ".id":
        criteria.push("projectID = @projectID" + i);
        criteriaVals["@projectID" + i] = t.value;
        break;

      case ".title":
        criteria.push("title LIKE @title" + i);
        criteriaVals["@title" + i] = t.param.replace(/\*/g, "%");
        break;

      case ":me":
        criteriaVals["@mineOnly"] = true;
        break;

      case ".author":
        //			criteria.push("owner = @otherAuthor");
        //			criteriaVals["@otherAuthor"] = 
        break;

      case ".name":
        if (t.param === undefined) return;
        criteria.push("minimisedTitle LIKE @minimisedTitle" + i);
        criteriaVals["@minimisedTitle" + i] = t.param.replace(/\*/g, "%");
        break;

      case ".parent":
      case ":parent":
        criteria.push("parentProject = @parentProject" + i);
        criteriaVals["@parentProject" + i] = t.value;
        break;

      case ".listed":
        criteriaVals["listedOnly"] = true;
        break;
    }
  }

  if (t.type == "tag") {
    if (t.tag === undefined) return;
    criteria.push("tags like @tag" + i);
    criteriaVals["@tag" + i] = "% " + t.tag.replace(/\*/g, "%").substring(1) + " %";
  }

  if (t.type == "name") {
    if (t.name === undefined) return;
    var tmpCriteria = ["OR"];
    tmpCriteria.push("minimisedTitle LIKE @minimisedTitle" + i);
    tmpCriteria.push("tags like @minimisedTitleTag" + i);
    criteria.push(tmpCriteria);
    criteriaVals["@minimisedTitle" + i] = t.name.replace(/\*/g, "%");
    criteriaVals["@minimisedTitleTag" + i] = "% " + t.name.replace(/\*/g, "%") + " %";
  }
}

function parseCriteria(arr) {
  if (!Array.isArray(arr) || arr.length == 1) {
    if (arr == "AND" || arr == "OR") return "";
    return arr;
  }

  if (arr.length == 2) return parseCriteria(arr[1]);
  var connectionType = arr[0];
  arr.shift();
  var tmpArr = [];

  for (j = 0; j < arr.length; j++) {
    tmpArr.push(parseCriteria(arr[j]));
  }

  return "(" + tmpArr.join(" " + connectionType + " ") + ")";
}

app.post('/project/rate', function (req, res) {
  var userID = req.user.id;
  var starRating = req.body.stars;
  var projectID = req.body.projectID;
  var rateSQL = "UPDATE projectratings SET stars = ? WHERE projectID = ? AND userID = ?;";
  delete projectRatings[req.body.projectID];
  db.run(rateSQL, starRating, projectID, userID, function (err) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (this.changes == 0) {
      var insRateSQL = "INSERT INTO projectratings VALUES (?,?,?,NULL);";
      db.run(insRateSQL, projectID, userID, starRating, function (err) {
        if (err) {
          logErrorTime(err);
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
          return;
        }

        res.json({
          status: "INSERTED"
        });
      });
    } else {
      res.json({
        status: "UPDATED"
      });
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

app.get('/project/search', function (req, res) {
  logErrorTime("Project search");
  var criteria = [];
  var tagCriteria = [];
  var criteriaVals = {};
  var paramObj = {};
  criteriaVals["@limit"] = 50;
  if (req.query.limit && req.query.limit <= 50) criteriaVals["@limit"] = req.query.limit;
  criteriaVals["@offset"] = 0;
  if (req.query.offset) criteriaVals["@offset"] = req.query.offset;
  var tmpCriteria = ["AND"];

  if (req.query.query && req.query.query != " ") {
    var selectorAST = Eden.Selectors.parse(req.query.query.trim());

    if (selectorAST !== undefined) {
      if (selectorAST.type == "intersection") {
        for (var i = 0; i < selectorAST.children.length; i++) {
          processSelectorNode(selectorAST.children[i], tmpCriteria, criteriaVals, i);
        }
      } else {
        processSelectorNode(selectorAST, tmpCriteria, criteriaVals, 0);
      }
    } else {
      res.json([]);
      return;
    }
  }

  var mineOnly = criteriaVals["@mineOnly"] !== undefined ? criteriaVals["@mineOnly"] : false;
  var listedOnly = criteriaVals["@listedOnly"] !== undefined ? criteriaVals["@listedOnly"] : false;
  if (criteriaVals["@mineOnly"] !== undefined) delete criteriaVals["@mineOnly"];
  if (criteriaVals["@listedOnly"] !== undefined) delete criteriaVals["@listedOnly"];
  var conditionStr = "";
  var tagConditionStr = "";

  if (tmpCriteria.length > 0) {
    var tmpCStr = parseCriteria(tmpCriteria);
    if (tmpCStr.length > 0) tagConditionStr = "\n WHERE " + tmpCStr;
  }

  var targetTable;
  var listQueryStr;

  if (!mineOnly && !listedOnly) {
    if (req.user == null) listedOnly = true;
  }

  var orderString = " order by date desc ";

  if (req.query.by) {
    if (req.query.by == "downloads") orderString = " order by downloads desc ";
    if (req.query.by == "rating") orderString = " order by avgStars desc ";
  }

  if (req.user == null) criteriaVals["@ratingsUser"] = -1;else criteriaVals["@ratingsUser"] = req.user.id;

  if (mineOnly) {
    if (req.user == null) return res.json([]);
    listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner' + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
    criteriaVals["@owner"] = req.user.id;
  } else if (listedOnly) {
    listQueryStr = getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
  } else {
    listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner';
    criteriaVals["@owner"] = req.user.id;
    listQueryStr += conditionStr + ' group by projects.projectID)' + tagConditionStr;
    listQueryStr += " UNION " + getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID) ' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
  } //console.log(listQueryStr);


  var listProjectStmt = db.prepare(listQueryStr);
  var unknownRatings = [];
  listProjectStmt.all(criteriaVals, function (err, rows) {
    if (err) {
      logErrorTime(err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    for (var i = 0; i < rows.length; i++) {
      if (rows[i].tags) {
        var tmpTags = rows[i].tags.split(" ");

        for (var j = tmpTags.length - 1; j >= 0; j--) {
          if (tmpTags[j] == "") tmpTags.splice(j, 1);
        }

        rows[i].tags = tmpTags;
      }

      var projectID = rows[i].projectID;

      if (projectRatings[projectID] !== undefined) {
        rows[i].overallRating = projectRatings[projectID];
        rows[i].numRatings = projectRatingsCount[projectID];
      } else {
        unknownRatings.push(projectID);
      }
    }

    processNextRating(rows, unknownRatings, 0, res);
  });
});

function processNextRating(projectRows, unknownRatings, i, res) {
  if (i == unknownRatings.length) {
    for (j = 0; j < projectRows.length; j++) {
      if (projectRows[j].overallRating == undefined) {
        projectRows[j].overallRating = projectRatings[projectRows[j].projectID];
        projectRows[j].numRatings = projectRatingsCount[projectRows[j].projectID];
      }
    }

    res.json(projectRows);
  } else {
    var getRatingsStmt = "SELECT count(1) as c,sum(stars) as s FROM projectratings WHERE projectID = ?";
    var projectID = unknownRatings[i];
    db.get(getRatingsStmt, projectID, function (err, row) {
      if (err || row === undefined) {
        res.json({
          error: ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      }

      projectRatings[projectID] = row.s;
      projectRatingsCount[projectID] = row.c;
      var overallRating = Number(row.s / row.c).toFixed(1);
      if (isNaN(overallRating)) overallRating = null;
      var updateStarsStmt = "UPDATE projectstats SET avgStars = ? WHERE projectID = ?";
      db.run(updateStarsStmt, overallRating, projectID, function (err) {
        if (err) {
          res.json({
            error: ERROR_SQL,
            description: "SQL Error",
            err: err
          });
        }

        processNextRating(projectRows, unknownRatings, i + 1, res);
      });
    });
  }
}

app.post('/project/remove', ensureAuthenticated, function (req, res) {
  logErrorTime("Removing project");
  var projectID = req.body.projectID;
  var userID = req.user.id;
  var delStatement = "DELETE FROM projects WHERE projectID = ? AND owner = ?";
  db.run(delStatement, projectID, userID, function (err) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    }

    if (this.changes == 0) res.json({
      error: ERROR_PROJECT_NOT_MATCHED,
      description: "Matching project not found"
    });
    if (this.changes > 0) res.json({
      status: "deleted",
      changes: this.changes
    });
  });
});

function getListQueryStr(targetTable) {
  return 'SELECT saveID, projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags, date, downloads,forks, myrating, avgStars FROM (SELECT saveID, projects.projectID, title, minimisedTitle, image, owner, name as ownername, date,' + ' publicVersion, parentProject, projectMetaData,	projectratings.stars as myrating, projectStats.avgStars, downloads,forks, (" " || group_concat(tag, " ") || " " ) as tags FROM projects,oauthusers,' + targetTable + ' left outer join tags' + ' on projects.projectID = tags.projectID LEFT OUTER JOIN projectstats ON projectstats.projectID = projects.projectID LEFT OUTER JOIN projectratings ON projectratings.projectID = projects.projectID AND projectratings.userID = @ratingsUser WHERE owner = oauthusers.userid AND ' + targetTable + '.projectID = projects.projectID ';
}
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


app.get('/project/versions', function (req, res) {
  logErrorTime("Project versions");

  if (req.query.projectID !== undefined) {
    var listProjectIDStmt = db.prepare("select projectid, saveID, date, parentDiff,author,name, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions left join oauthusers ON author = userid where projectid = ?;");
    listProjectIDStmt.all(req.query.projectID, function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].author === undefined || rows[i].author == null) rows[i].name = "[Me]";
      }

      res.json(rows);
    });
  } else if (req.query.userID !== undefined) {
    var listProjectStmt = db.prepare("select projects.projectid, saveID, date, parentDiff, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions,projects where projects.projectid = projectversions.projectid AND owner = ? ORDER BY date;");
    listProjectStmt.all(req.user.id, function (err, rows) {
      res.json(rows);
    });
  }
});
app.get('/user/details', function (req, res) {
  var u = null;

  if (typeof req.user != "undefined") {
    u = {
      id: req.user.id,
      name: req.user.displayName
    };
  }

  res.json(u);
}); // GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback

app.get('/auth/google', _passport["default"].authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.email']
}));
app.get('/auth/twitter', _passport["default"].authenticate('twitter'));
app.get('/auth/facebook', _passport["default"].authenticate('facebook'));
app.post('/auth/locallogin', _passport["default"].authenticate('local-login', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  res.redirect(_config["default"].BASEURL + '/');
});
app.post('/auth/localsignup', _passport["default"].authenticate('local-signup', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  if (req.flash('signUpMessage') == "form") {
    res.render('joined');
    req.logout();
  } else {
    res.redirect(_config["default"].BASEURL + '/');
  }
}); // GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

app.get('/auth/google/callback', _passport["default"].authenticate('google', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  res.redirect(_config["default"].BASEURL);
});
app.get('/auth/twitter/callback', _passport["default"].authenticate('twitter', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  // Successful authentication, redirect home.
  res.redirect(_config["default"].BASEURL);
});
app.get('/auth/facebook/callback', _passport["default"].authenticate('facebook', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  // Successful authentication, redirect home.
  res.redirect(_config["default"].BASEURL);
});
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect(_config["default"].BASEURL);
});
/*
app.get('/social/activity', function(req, res){
	/*	var activityStmt = db.prepare("select ;");
		listProjectStmt.all(criteriaVals,function(err,rows){
			
		});
	});*/

app.get('/social/projects', function (req, res) {
  logErrorTime("Social projects");
  var activityStmt = db.prepare("select * from view_projectfollows where follower = ? order by date desc limit 20");
  activityStmt.all(req.user.id, function (err, rows) {
    if (err) {
      console.log("Error: " + err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.json(rows);
    }
  });
});
app.get('/social/comments', function (req, res) {
  logErrorTime("Social comments");
  var activityStmt = db.prepare("select * from view_projectfollows where follower = ? order by date desc limit 20");
  activityStmt.all(req.user.id, function (err, rows) {
    if (err) {
      console.log("Error: " + err);
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.json(rows);
    }
  });
});
app.get('/social/followproject', function (req, res) {
  logErrorTime("Social followproject");
  var followProjectStmt = db.prepare("INSERT INTO followprojects VALUES (?, ?)");
  followProjectStmt.run(req.query.projectID, req.user.id, function (err) {
    if (err) {
      if (err.errno != 19) {
        console.log("Error: " + err);
        res.json({
          error: ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      } else {
        res.json({
          status: "ALREADY FOLLOWED"
        });
      }
    } else {
      res.json({
        status: "OK"
      });
    }
  });
});
app.listen(_config["default"].PORT); // Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.

function ensureAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  }

  res.status(403).send('logout');
}