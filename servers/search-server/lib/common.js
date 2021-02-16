"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureAuthenticated = ensureAuthenticated;
exports.getFullVersion = getFullVersion;
exports.logDBError = logDBError;
exports.logAPI = logAPI;
exports.logAPIError = logAPIError;

var _database = _interopRequireDefault(require("./database"));

require("colors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Simple route middleware to ensure user is authenticated.
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

function getFullVersion(version, projectID, meta, callback) {
  var versionStmt = _database["default"].prepare("SELECT fullsource, forwardPatch,parentDiff,date FROM projectversions WHERE saveID = ? AND projectID = ?");

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

function logDBError(str) {
  console.error("".concat(new Date().toISOString().cyan, ": ").concat(str.red));
}

function logAPI(api, str) {
  console.log("".concat(new Date().toISOString().cyan, ": ").concat(api.bold, " : ").concat(str));
}

function logAPIError(api, str) {
  console.error("".concat(new Date().toISOString().cyan, ": ").concat(api.bold, " : ").concat(str.red));
}