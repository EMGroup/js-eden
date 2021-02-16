"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Eden = void 0;

var _config = _interopRequireDefault(require("./config.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Eden = {
  edenFunctions: {},
  Project: {}
};
exports.Eden = Eden;
global.Eden = Eden;

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

require(_config["default"].JSEDENPATH + "js/core/errors.js");

require(_config["default"].JSEDENPATH + "js/core/warnings.js");

global.edenUI = {};
global.eden = {};
eden.root = {};
eden.root.symbols = {};
global.window = {};