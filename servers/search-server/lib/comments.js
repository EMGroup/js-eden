"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _errors = require("./errors");

var _database = _interopRequireDefault(require("./database"));

var _common = require("./common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _default(app) {
  app.post('/comment/post', _common.ensureAuthenticated, function (req, res) {
    var stmt = _database["default"].prepare("INSERT INTO comments VALUES (NULL, ?, ?, current_timestamp, ?, ?, ?);");

    if (req.body.publiclyVisible != 0 && req.body.publiclyVisible != 1) res.json({
      error: _errors.ERROR_INVALID_FORMAT,
      description: "Invalid range for 'publiclyVisible'"
    });
    stmt.run(req.body.projectID, req.body.versionID, req.user.id, req.body.publiclyVisible, req.body.comment, function (err) {
      if (err) {
        res.json({
          error: _errors.ERROR_SQL,
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
  app.post('/comment/delete', _common.ensureAuthenticated, function (req, res) {
    var stmt = _database["default"].prepare("DELETE FROM comments WHERE commentID = ? AND author = ?");

    stmt.run(req.body.commentID, req.user.id, function (err) {
      if (err) {
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      }

      if (this.changes == 0) res.json({
        error: _errors.ERROR_COMMENT_NOT_MATCHED,
        description: "Matching project not found"
      });
      if (this.changes > 0) res.json({
        status: "deleted",
        changes: this.changes
      });
    });
  });
  app.get('/comment/search', function (req, res) {
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

    var stmt = _database["default"].prepare(stmtstr);

    stmt.all(criteriaObject, function (err, rows) {
      if (err) {
        res.json({
          error: _errors.ERROR_SQL,
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

          var privStmt = _database["default"].prepare(stmtstr);

          privStmt.all(criteriaObject, function (err, privRows) {
            if (err) {
              res.json({
                error: _errors.ERROR_SQL,
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
        error: _errors.ERROR_NOTADMIN,
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

    var stmt = _database["default"].prepare(stmtstr);

    stmt.all(criteriaObject, function (err, rows) {
      if (err) {
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      } else {
        res.json(rows);
      }
    });
  });
}