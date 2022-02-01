// Eden = {};
let CLIEden = {};
CLIEden.EdenSymbol = function(){};
CLIEden.EdenSymbol.prototype.value = function(){};
CLIEden.edenFunctions = {};

CLIEden.config ={};
// Eden = {};
// Eden.Language = {};
CLIEden.config.JSEDENPATH = "./";
CLIEden.Eden = require(CLIEden.config.JSEDENPATH + "js/core/eden.js").Eden;
require(CLIEden.config.JSEDENPATH + "js/core/scope.js");
require(CLIEden.config.JSEDENPATH + "js/core/symbol.js");
require(CLIEden.config.JSEDENPATH + "js/core/context.js");
// require(CLIEden.config.JSEDENPATH + "js/core/database.js");
// require(CLIEden.config.JSEDENPATH + "js/core/plugins.js");
CLIEden.lex = require(CLIEden.config.JSEDENPATH + "js/lex.js");
CLIEden.EdenStream = CLIEden.lex.EdenStream;
CLIEden.EdenSyntaxData = CLIEden.lex.EdenSyntaxData;
CLIEden.lang = require(CLIEden.config.JSEDENPATH + "js/language/lang.js");
// console.log(lang.Language);
CLIEden.Language = CLIEden.lang.Language;
CLIEden.en = require(CLIEden.config.JSEDENPATH + "js/language/en.js");
require(CLIEden.config.JSEDENPATH + "js/index.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/selector.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/property.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/name.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/tag.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/intersection.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/union.js");  
require(CLIEden.config.JSEDENPATH + "js/selectors/navigate.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/ast.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/basestatement.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/basescript.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/basecontext.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/append.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/assignment.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/after.js");
require(CLIEden.config.JSEDENPATH + "js/ast/async.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/binaryop.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/break.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/case.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/codeblock.js");
require(CLIEden.config.JSEDENPATH + "js/ast/customblock.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/context.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/continue.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/declarations.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/default.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/definition.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/delete.js");
require(CLIEden.config.JSEDENPATH + "js/ast/do.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/doxycomments.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/dummy.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/for.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/function.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/functioncall.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/handle.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/if.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/import.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/index.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/insert.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/length.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/literal.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/llist.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/local.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/lvalue.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/modify.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/parameter.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/primary.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/proc.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/range.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/require.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/return.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/scope.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/scopedscript.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/scopepath.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/scopepattern.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/script.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/virtual.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/scriptexpr.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/subscribers.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/switch.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/ternaryop.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/unaryop.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/wait.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/when.js");  
require(CLIEden.config.JSEDENPATH + "js/ast/while.js"); 
require(CLIEden.config.JSEDENPATH + "js/ast/querystat.js");
require(CLIEden.config.JSEDENPATH + "js/ast/section.js");
require(CLIEden.config.JSEDENPATH + "js/ast/indexed.js");
require(CLIEden.config.JSEDENPATH + "js/ast/alias.js");
require(CLIEden.config.JSEDENPATH + "js/grammar/actionbody.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/after.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/declarations.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/do.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/expression.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/factor.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/for.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/function.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/if.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/import.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/listops.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/lists.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/lvalue.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/primary.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/proc.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/scope.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/script.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/selector.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/statement.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/switch.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/terms.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/wait.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/when.js");  
require(CLIEden.config.JSEDENPATH + "js/grammar/while.js"); 
require(CLIEden.config.JSEDENPATH + "js/grammar/query.js");
require(CLIEden.config.JSEDENPATH + "js/grammar/section.js");
CLIEden.Eden.projectPath = "./js-eden/";
(function(global){
    let eden = new CLIEden.Eden();
    let readline = require('readline');

    var rl = readline.createInterface({
        input: process.stdin,
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

}(typeof window !== 'undefined' ? window : global));
