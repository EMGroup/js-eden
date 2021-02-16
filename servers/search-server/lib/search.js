"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reindexProject = reindexProject;
exports["default"] = _default;

var _database = _interopRequireDefault(require("./database"));

var _common = require("./common");

require("colors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var allKnownProjects = {};
var vstmtStr = "select projects.projectID as projectID,view_listedVersion.saveID as saveID,title,minimisedTitle,projectMetaData,ifnull(group_concat(tag, \" \"),\"\") as tags, view_listedVersion.date as date," + " name as authorname from view_listedVersion, projects, oauthusers left join tags on projects.projectID = tags.projectID where " + "projects.projectID = view_listedVersion.projectID and owner = oauthusers.userid";

var vstmt = _database["default"].prepare(vstmtStr + " group by projects.projectid");

function initASTDB(cb) {
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

      (0, _common.getFullVersion)(rows[i].saveID, rows[i].projectID, rows[i], function (data) {
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
          console.log("".concat("Error".red.bold, " : \"").concat(data.meta.title.bold, " (").concat(('' + data.meta.projectID).blue, ")\" : ").concat(tmpAst.script.errors[0].messageText()));
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
          cb();
        }
      });
    }
  });
}

function reindexProject(projectID) {
  var myVStmt = _database["default"].prepare(vstmtStr + " and projects.projectID = @projectID");

  var params = {};
  params["@projectID"] = projectID;
  myVStmt.all(params, function (err, rows) {
    if (err) {
      log("Error: " + err);
      return;
    } else {
      var row = rows[0];
      (0, _common.getFullVersion)(row.saveID, row.projectID, row, function (data) {
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
}

function _default(app) {
  app.get('/code/search', function (req, res) {
    var sast = Eden.Selectors.parse(req.query.selector);

    if (sast.local) {
      res.json([]);
    } else {
      sast.filter().then(function (p) {
        var nodelist = Eden.Selectors.unique(p);
        var outtype = "standalone_outersource";

        if (req.query.outtype !== undefined) {
          outtype = req.query.outtype;
        }

        var srcList = Eden.Selectors.processResults(nodelist, outtype);

        if (outtype.includes('standalone_outersource')) {
          (0, _common.logAPI)("/code/search", "'".concat(req.query.selector, "'"));
        }

        res.json(srcList);
      })["catch"](function (error) {
        console.error("Query error for: " + req.body.selector + " - " + error);
      });
    }
  });
  app.get('/code/get', function (req, res) {
    var sast = Eden.Selectors.parse(req.query.selector);

    if (sast.local) {
      res.json([]);
    } else {
      sast.filter().then(function (p) {
        var nodelist = Eden.Selectors.unique(p);
        var srcList = Eden.Selectors.processResults(nodelist, "standalone_outersource");

        if (outtype === 'standalone_outersource') {
          (0, _common.logAPI)("/code/get", "'".concat(req.query.selector, "'"));
        }

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
        console.error("Query error for: " + req.body.selector + " - " + error);
      });
    }
  });
  return new Promise(function (resolve, reject) {
    initASTDB(function () {
      return resolve();
    });
  });
}