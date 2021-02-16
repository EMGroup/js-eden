"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(_config["default"].DBPATH);
var _default = db;
exports["default"] = _default;