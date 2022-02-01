let CLIEden = {};
CLIEden.EdenSymbol = function(){};
CLIEden.EdenSymbol.prototype.value = function(){};
CLIEden.edenFunctions = {};

CLIEden.config ={};
CLIEden.Eden = require("./core/eden.js").Eden;
require("./core/scope.js");
require("./core/symbol.js");
require("./core/context.js");
// require("./core/database.js");
// require("./core/plugins.js");
CLIEden.lex = require("./lex.js");
// CLIEden.EdenStream = CLIEden.lex.EdenStream;
// CLIEden.EdenSyntaxData = CLIEden.lex.EdenSyntaxData;
CLIEden.lang = require("./language/lang.js");
// CLIEden.Language = CLIEden.lang.Language;
CLIEden.en = require("./language/en.js");
require("./index.js");  
require("./selectors/selector.js");  
require("./selectors/property.js");  
require("./selectors/name.js");  
require("./selectors/tag.js");  
require("./selectors/intersection.js");  
require("./selectors/union.js");  
require("./selectors/navigate.js");  
require("./ast/ast.js");  
require("./ast/basestatement.js");  
require("./ast/basescript.js");  
require("./ast/basecontext.js");  
require("./ast/append.js");  
require("./ast/assignment.js");  
require("./ast/after.js");
require("./ast/async.js");  
require("./ast/binaryop.js");  
require("./ast/break.js");  
require("./ast/case.js");  
require("./ast/codeblock.js");
require("./ast/customblock.js");  
require("./ast/context.js");  
require("./ast/continue.js");  
require("./ast/declarations.js");  
require("./ast/default.js");  
require("./ast/definition.js");  
require("./ast/delete.js");
require("./ast/do.js");  
require("./ast/doxycomments.js");  
require("./ast/dummy.js");  
require("./ast/for.js");  
require("./ast/function.js");  
require("./ast/functioncall.js");  
require("./ast/handle.js");  
require("./ast/if.js");  
require("./ast/import.js");  
require("./ast/index.js");  
require("./ast/insert.js");  
require("./ast/length.js");  
require("./ast/literal.js");  
require("./ast/llist.js");  
require("./ast/local.js");  
require("./ast/lvalue.js");  
require("./ast/modify.js");  
require("./ast/parameter.js");  
require("./ast/primary.js");  
require("./ast/proc.js");  
require("./ast/range.js");  
require("./ast/require.js");  
require("./ast/return.js");  
require("./ast/scope.js");  
require("./ast/scopedscript.js");  
require("./ast/scopepath.js");  
require("./ast/scopepattern.js");  
require("./ast/script.js");  
require("./ast/virtual.js");  
require("./ast/scriptexpr.js");  
require("./ast/subscribers.js");  
require("./ast/switch.js");  
require("./ast/ternaryop.js");  
require("./ast/unaryop.js");  
require("./ast/wait.js");  
require("./ast/when.js");  
require("./ast/while.js"); 
require("./ast/querystat.js");
require("./ast/section.js");
require("./ast/indexed.js");
require("./ast/alias.js");
require("./grammar/actionbody.js");  
require("./grammar/after.js");  
require("./grammar/declarations.js");  
require("./grammar/do.js");  
require("./grammar/expression.js");  
require("./grammar/factor.js");  
require("./grammar/for.js");  
require("./grammar/function.js");  
require("./grammar/if.js");  
require("./grammar/import.js");  
require("./grammar/listops.js");  
require("./grammar/lists.js");  
require("./grammar/lvalue.js");  
require("./grammar/primary.js");  
require("./grammar/proc.js");  
require("./grammar/scope.js");  
require("./grammar/script.js");  
require("./grammar/selector.js");  
require("./grammar/statement.js");  
require("./grammar/switch.js");  
require("./grammar/terms.js");  
require("./grammar/wait.js");  
require("./grammar/when.js");  
require("./grammar/while.js"); 
require("./grammar/query.js");
require("./grammar/section.js");
CLIEden.Eden.projectPath = "./js-eden/";

(function(){
    let eden = new CLIEden.Eden();
    function startCommandLine(){
        let readline = require('readline');
    
        var rl = readline.createInterface({
            input: process.stdin,
            terminal: false
        });
        
        function getValue(str){
            console.log(eden.root.lookup(str).value());
        }
        async function exec(str){
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
    }
    exports.CLIEden = {eden,startCommandLine};
}(typeof window !== 'undefined' ? window : global));
