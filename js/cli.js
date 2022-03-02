const { EdenUI } = require("./core/edenui.js");
let CLIEden = {};
CLIEden.EdenSymbol = function(){};
CLIEden.EdenSymbol.prototype.value = function(){};
CLIEden.edenFunctions = {};
localStorage = {};
localStorage.getItem = function(key){
    console.log("Dummy Storage ", key);
}
localStorage.setItem = function(key, value){
    console.log("Setting Dummy Storage ", key, value);
}
global.EdenSymbol = function(){};
global.EdenSymbol.prototype.value = function(){};

CLIEden.config ={};
CLIEden.Eden = require("./core/eden.js").Eden;
// global.Eden = CLIEden.Eden;
// console.log(Eden);
require("./core/scope.js");
require("./core/symbol.js");
require("./core/context.js");
require("./core/database.js");
require("./core/edenui.js");
require("./core/plugins.js");
require("./util/url.js");
require("./core/initialise.js");

CLIEden.lex = require("./lex.js");
CLIEden.EdenStream = CLIEden.lex.EdenStream;
CLIEden.EdenSyntaxData = CLIEden.lex.EdenSyntaxData;
CLIEden.lang = require("./language/lang.js");
CLIEden.Language = CLIEden.lang.Language;
CLIEden.en = require("./language/en.js");
require("./util/misc.js");

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
require("./fragment.js");
require("../plugins/canvas/canvas.js");
// require("node-fetch");

CLIEden.listenTo = function(eventName, target, callback) {
	if (!this.listeners[eventName]) {
		this.listeners[eventName] = [];
	}
	this.listeners[eventName].push({target: target, callback: callback});
};

CLIEden.emit = function(eventName,eventArgs){
    var listenersForEvent = this.listeners[eventName];
    if (!listenersForEvent) {
        return;
    }
    var i;
    for (i = 0; i < listenersForEvent.length; ++i) {
        var target = listenersForEvent[i].target;
        var callback = listenersForEvent[i].callback;
        if (callback.apply(target, eventArgs)) return true;
    }
    return false;
};

CLIEden.initialise = function(){
    let plugins = ["Canvas2D"];

    let eden = CLIEden.eden;
    eden.root.lookup("jseden_parser_cs3").assign(true,eden.root.scope,EdenSymbol.defaultAgent);
    eden.root.lookup("jseden_parser_cs3").addJSObserver("parser",(sym, value) => {
        if (value) {
            Eden.AST.version = Eden.AST.VERSION_CS3;
        } else {
            Eden.AST.version = Eden.AST.VERSION_CS2;
        }
    });
    // Eden.DB.fetch();

    Eden.DB.connect(Eden.DB.repositories[Eden.DB.repoindex], function() {
        console.log("DONE LOADING");
        // doneLoading(true);
        Eden.Project.load(41,undefined,undefined,function(){
            console.log("Loaded");
        });
    });
    EdenUI.prototype.listenTo = CLIEden.listenTo;
    EdenUI.prototype.emit = CLIEden.emit;
    CLIEden.edenUI.plugins = plugins;
    // CLIEden.edenUI.loadPlugin("Canvas2D",function(){console.log("Loaded plugin");});
};


CLIEden.startCommandLine = function(){
    let readline = require('readline');
    if(CLIEden.Eden.projectPath === undefined || CLIEden.Eden.projectPath == ""){
        CLIEden.Eden.projectPath = "./js-eden/";
    }
    CLIEden.eden = new CLIEden.Eden();
    global.eden = CLIEden.eden;
    

    global.root = CLIEden.eden.root;
    var rl = readline.createInterface({
        input: process.stdin,
        terminal: false
    });
    
    function getValue(str){
        console.log(CLIEden.eden.root.lookup(str).value());
    }
    async function exec(str){
        return await CLIEden.eden.exec(str);
    }
    function printPrompt(){
        process.stdout.write("EDEN > ");
    }
    printPrompt();

    CLIEden.edenUI = new EdenUI(CLIEden.eden);
    CLIEden.initialise();

    rl.on('line',function(line){
        exec(line);
        if(line.startsWith("?")){
            getValue(line.substring(1));
        }
        printPrompt();
    });
}
module.exports = {CLIEden};