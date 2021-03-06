import config from './config.js';

export const Eden = { edenFunctions: {}, Project: {} };
global.Eden = Eden;
global.EdenSymbol = function(){};
EdenSymbol.prototype.value = function(){};
global.edenFunctions = Eden.edenFunctions;

const lang = require(`${config.JSEDENPATH}js/language/lang.js`);
global.Language = lang.Language;

const lex = require(`${config.JSEDENPATH}js/lex.js`);
global.EdenStream = lex.EdenStream;
global.EdenSyntaxData = lex.EdenSyntaxData;
global.rt = require(`${config.JSEDENPATH}js/core/runtime.js`);

require(`${config.JSEDENPATH}js/language/en.js`);
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

require(config.JSEDENPATH + "js/core/errors.js");
require(config.JSEDENPATH + "js/core/warnings.js");

global.edenUI = {};
global.eden = {};

eden.root = {};
eden.root.symbols = {};

global.window = {};
