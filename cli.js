// Eden = {};
global.EdenSymbol = function(){};
EdenSymbol.prototype.value = function(){};
edenFunctions = {};

let config ={};
// Eden = {};
// Eden.Language = {};
config.JSEDENPATH = "./";
require(config.JSEDENPATH + "js/core/eden.js");
require(config.JSEDENPATH + "js/core/scope.js");
require(config.JSEDENPATH + "js/core/symbol.js");
require(config.JSEDENPATH + "js/core/context.js");
// require(config.JSEDENPATH + "js/core/database.js");
// require(config.JSEDENPATH + "js/core/plugins.js");
var lex = require(config.JSEDENPATH + "js/lex.js");
EdenStream = lex.EdenStream;
EdenSyntaxData = lex.EdenSyntaxData;
var lang = require(config.JSEDENPATH + "js/language/lang.js");
// console.log(lang.Language);
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
require(config.JSEDENPATH + "js/ast/async.js");  
require(config.JSEDENPATH + "js/ast/binaryop.js");  
require(config.JSEDENPATH + "js/ast/break.js");  
require(config.JSEDENPATH + "js/ast/case.js");  
require(config.JSEDENPATH + "js/ast/codeblock.js");
require(config.JSEDENPATH + "js/ast/customblock.js");  
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
require(config.JSEDENPATH + "js/ast/querystat.js");
require(config.JSEDENPATH + "js/ast/section.js");
require(config.JSEDENPATH + "js/ast/indexed.js");
require(config.JSEDENPATH + "js/ast/alias.js");
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
require(config.JSEDENPATH + "js/grammar/query.js");
require(config.JSEDENPATH + "js/grammar/section.js");

// global.Eden = Eden;
let eden = new Eden();
let readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  
function getValue(str){
    console.log(eden.root.lookup(str).value());
}
async function exec(str,cb){
    return await eden.exec(str);
}
function printPrompt(){
    process.stdout.write("EDEN > ");
}
printPrompt();

rl.on('line',function(line){
    exec(line);
    if(line.startsWith("?")){
        getValue(line.substring(1));
    }
    printPrompt();
});