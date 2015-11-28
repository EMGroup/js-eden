var Language = {
	language: "en",

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
		"create": "create"
	},

	doxytags: {
		"title": "title",
		"author": "author",
		"version": "version",
		"param": "param",
		"return": "return"
	},

	keywords: {
		"func": "func",
		"proc": "proc",
		"auto": "auto",
		"para": "para",
		"action": "action",
		"local": "local",
		"if": "if",
		"is": "is",
		"else": "else",
		"eval": "eval",
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
		"include": "include",
		"import": "import",
		"insert": "insert",
		"append": "append",
		"delete": "delete",
		"require": "require",
		"after": "after",
		"shift": "shift",
		"with": "with"
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
