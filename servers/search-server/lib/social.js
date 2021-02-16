"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _database = _interopRequireDefault(require("./database"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _default(app) {
  app.get('/social/projects', function (req, res) {
    var activityStmt = _database["default"].prepare("select * from view_projectfollows where follower = ? order by date desc limit 20");

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
    var activityStmt = _database["default"].prepare("select * from view_projectfollows where follower = ? order by date desc limit 20");

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
    var followProjectStmt = _database["default"].prepare("INSERT INTO followprojects VALUES (?, ?)");

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
}