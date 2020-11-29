var Language = {
	language: "en",

	loadSymbols: function(root) {
		for (var s in this.symbols) {
			if (s != this.symbols[s] && root.symbols[this.symbols[s]] === undefined) {
				root.symbols[this.symbols[s]] = root.lookup(s);
			}
		}
	},

	addKeywords: function(keywords) {
		for (var k in keywords) {
			this.keywords[k] = keywords[k];
		}
	},
	addSymbols: function(symbols) {
		for (var s in symbols) {
			this.symbols[s] = symbols[s];
		}
	},

	importoptions: {
		"readonly": "readonly",
		"remote": "remote",
		"local": "local",
		"rebase": "rebase",
		"noexec": "noexec",
		"reload": "reload",
		"force": "force",
		"async": "async",
		"create": "create",
		"remove": "remove"
	},

	selectors: {
		"has-name": true,
		"name": true,
		"type": true,
		"definition": true,
		"assignment": true,
		"script": true,
		"when": true,
		"for": true,
		"if": true,
		"last": true,
		"nth": true,
		"executed": true,
		"not": true,
		"unexecuted": true,
		"remote": true,
		"value": true,
		"active": true,
		"depends": true
	},

	doxytags: {
		"title": "title",
		"author": "author",
		"version": "version",
		"param": "param",
		"return": "return",
		"debug": "debug",
		"local": "local",
		"role": "role",
		"shared": "shared",
		"oracle": "oracle",
		"handle": "handle",
		"deprecated": "deprecated",
		"see": "see",
		"{": "{",
		"}": "}",
		"hidden": "hidden",
		"script": "script"
	},

	keywords: {
		"func": "func",			/* To be deprecated */
		"function": "function",
		"oracle": "oracle",
		"handle": "handle",
		"proc": "proc",			/* Deprecated */
		"auto": "auto",
		"para": "para",
		"action": "action",
		"procedure": "procedure",
		"local": "local",
		"role": "role",
		"if": "if",
		"is": "is",
		"in": "in",
		"else": "else",
		"for": "for",
		"while": "while",
		"do": "do",
		"switch": "switch",
		"case": "case",
		"default": "default",
		"break": "break",
		"continue": "continue",
		"return": "return",
		"when": "when",
		"wait": "wait",
		"import": "import",
		"insert": "insert",		/* Deprecated, use a function */
		"append": "append",		/* Deprecated, use += */
		"delete": "delete",		/* Should be repurposed to remove observables */
		"require": "require",
		"after": "after",		/* Deprecatedm use wait */
		"shift": "shift",		/* Deprecated, use a function */
		"with": "with",
		"and": "and",
		"or": "or",
		"not": "not",
		"eval": "eval",
		"sync": "sync",
		"parse": "parse",
		"compile": "compile",
		"exec": "exec"
	},
	symbols: {
		"int": "int",
		"str": "str",
		"round": "round",
		"min": "min",
		"max": "max",
		"random": "random",
		"floor": "floor",
		"ceil": "ceil",
		"abs": "abs",
		"acos": "acos",
		"asin": "asin",
		"atan": "atan",
		"cos": "cos",
		"exp": "exp",
		"ln": "ln",
		"log": "log",
		"mod": "mod",
		"randomInteger": "randomInteger",
		"randomFloat": "randomFloat",
		"sin": "sin",
		"sqrt": "sqrt",
		"sum": "sum",
		"tan": "tan",
		"length": "length",
		"error": "error",
		"substr": "substr",
		"type": "type",
		"createView": "createView",
		"createCanvas": "createCanvas",
		"zonesAt": "zonesAt",
		"execute": "execute",
		"indexOf": "indexOf",
		"forget": "forget",
		"eager": "eager",
		"time": "time",
		"writeln": "writeln",
		"apply": "apply",
		"todo": "todo",
		"char": "char",
		"isBoolean": "isBoolean",
		"isCallable": "isCallable",
		"isChar": "isChar",
		"isDefined": "isDefined",
		"isValue": "isValue",
		"isFunc": "isFunc",
		"isInt": "isInt",
		"isNaN": "isNaN",
		"isNumber": "isNumber",
		"isObject": "isObject",
		"isPoint": "isPoint",
		"isProc": "isProc",
		"showView": "showView",
		"array": "array",
		"sublist": "sublist",
		"reverse": "reverse",
		"search": "search",
		"sort": "sort",
		"tail": "tail",
		"concat": "concat",
		"decodeHTML": "decodeHTML"
	},
	values: { "true":"true", "false":"false" },
	errors: {}
};

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.Language = Language;
}
