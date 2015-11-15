Language.addKeywords({
	"fonc": "func",
	"proc": "proc",
	"auto": "auto",
	"para": "para",
	"local": "local",
	"si": "if",
	"est": "is",
	"sinon": "else",
	"\u00e9val": "eval",
	"pour": "for",
	"tantque": "while",
	"faire": "do",
	"choisir": "switch",
	"cas": "case",
	"d\u00e9faut": "default",
	"arr\u00eate": "break",
	"continuer": "continue",
	"retour": "return",
	"quand": "when",
	"include": "include",
	"option": "option",
	"await": "await",
	"insert": "insert",
	"append": "append",
	"delete": "delete",
	"require": "require",
	"after": "after",
	"shift": "shift"
});

Language.addSymbols({
	"ent": "int",
	"str": "str",
	"arrondir": "round",
	"min": "min",
	"max": "max",
	"al\u00e9atoire": "random",
	"plancher": "floor",
	"plafond": "ceil",
	"abs": "abs",
	"acos": "acos",
	"asin": "asin",
	"atan": "atan",
	"cos": "cos",
	"exp": "exp",
	"ln": "ln",
	"log": "log",
	"mod": "mod",
	"al\u00e9atoireEntier": "randomInteger",
	"al\u00e9atoireR\u00e9al": "randomFloat",
	"sin": "sin",
	"racineCarr\u00e9e": "sqrt",
	"somme": "sum",
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
});

Language.errors = [
/* EDEN_ERROR_PROCNAME */ [
	"'proc' names cannot be keywords",
	"'proc' action names cannot be a literal value",
	"'proc' actions need a name",
	"Unexpected closing bracket",
	"A 'proc' needs a name before it's watch list",
	"A 'proc' needs a name and a watch list"
],
/* EDEN_ERROR_EXPCLOSEBRACKET */ [
	"Wrong kind of bracket, expected a ')'",
	"Missing a closing ')' bracket before end of statement",
	"Missing a closing bracket ')' or operator"
],
/* EDEN_ERROR_BADFACTOR */ [
	"Wrong kind of bracket, use '(' or '[' in expressions.",
	"Missing expression? Unexpected closing bracket",
	"Expected a value or observable",
	"Missing an operand.",
	"Keywords are not allowed in expressions"
],
/* EDEN_ERROR_ACTIONCOLON */ [
	"Need a ':' before listing trigger observables",
	"Actions require a list of observables to trigger on, expected a ':'",
	"Expecting a ':' here",
	"Need a ':' after an action name, not a reserved word"
],
/* EDEN_ERROR_ACTIONNOWATCH */ [
	"A reserved word cannot be used as an observable name",
	"Umm, ask for some help. Need a list of observables",
	"There needs to be at least one watch observable",
	"Expressions cannot be used as watches",
	"Literals cannot be watched by actions",
	"Missing first observable before comma",
	"Cannot watch list literals"
],
/* EDEN_ERROR_ACTIONCOMMAS */ [
	"Either too many ','s or a missing watch observable",
	"Must give an observable name, not an expression",
	"The reserved word '%R' cannot be used as an observable name",
	"Expecting an observable name but got %T"
],
/* EDEN_ERROR_ACTIONOPEN */ [
	"Cannot do a function call here",
	"Can only watch observables, not a specific list index",
	"An action must have a body of code",
	"Missing an open '{' to start the action code",
	"Use ',' to separate watch observables",
	"Expected an open '{' to start action",
	"Action code must start with a curly '{' bracket"
],
/* EDEN_ERROR_ACTIONCLOSE */ [
	"Wrong kind of bracket to close an action, use '}' instead",
	"Missing a closing '}' bracket at end of action code"
],
/* EDEN_ERROR_LOCALNAME */ [
	"Reserved words cannot be used as local variable names",
	"Missing a name after a 'local' declaration",
	"'local' must be followed by a valid name"
],
/* EDEN_ERROR_LOCALSEMICOLON */ [
	"Need a ';' after a local declaration",
	"It's not possible to initialise a local here"
],
/* EDEN_ERROR_WHENTYPE */ [
	"Did you mean 'when change' or 'when touch'?",
	"Need to know type of 'when' first (change, touch or condition)",
	"Wrong kind of bracket, use '(' for a 'when' condition",
	"A 'when' must have some condition or trigger observables"
],
/* EDEN_ERROR_LISTINDEXEXP */ [
	"A list index must be a valid expression",
	"A list index must be a valid expression",
	"A list index must be a valid expression"
],
/* EDEN_ERROR_LISTINDEXCLOSE */ [
	"Wrong kind of bracket, need a ']' to end the list index",
	"Missing a ']' to end the list index",
	"Missing a ']' to end the list index",
	"Unexpected observable name, did you forget ']'?"
],
/* EDEN_ERROR_LVALUE */ [
	"Must be an observable name",
	"Expected an observable name, cannot use reserved words as observables",
	"Missing an observable"
],
/* EDEN_ERROR_SEMICOLON */ [
	"Missing a ';'",
	"Incomplete floating point number",
	"Need another dot for a range, or a property name",
	"Missing a ';' on previous line?",
	"Missing either an operator or a ';'",
	"Missing an open bracket, or too many close brackets",
	"Expected a ';' not a bracket"
],
/* EDEN_ERROR_STATEMENT */ [
	"A keyword can't be used as an observable name",
	"Missing an observable name",
	"Wrong kind of bracket, only '{' is allowed here"
],
/* EDEN_ERROR_DEFINITION */ [
	"Must be an 'is' or some kind of assignment",
	"Must be an 'is' or some kind of assignment",
	"Must be an 'is' or some kind of assignment",
	"Wrong kind of bracket, can only be '['"
],
/* EDEN_ERROR_FUNCCALLEND */ [
	"Missing a ')' after function call",
	"Missing a ')' after function call",
	"Missing a ')' after function call",
	"Missing a ')' after function call",
	"Wrong kind of bracket, need a ')'"
],
/* EDEN_ERROR_LISTLITCLOSE */ [
	"Missing a ']' after a list literal"
],
/* EDEN_ERROR_TERNIFCOLON */ [
	"An 'if' in an expression must have a ':' else part"
],
/* EDEN_ERROR_IFCONDOPEN */ [
	"An 'if' condition must be surrounded by '(' and ')'"
],
/* EDEN_ERROR_IFCONDCLOSE */ [
	"Missing a closing ')' after if condition"
],
/* EDEN_ERROR_PARAMNAME */ [
	"Reserved words can't be used as para names",
	"'para' can't be used as an observable name",
	"Unexpected bracket, expected a para name"
],
/* EDEN_ERROR_PARAMSEMICOLON */ [
	"Need a ';' after a para declaration",
	"It's not possible to initialise a para",
	"Need a ';' after a para declaration",
	"Unexpected bracket, need a ';'"
],
/* EDEN_ERROR_FUNCOPEN */ [
	"Cannot do a function call here",
	"Can only watch observables, not a specific list index",
	"An action must have a body of code",
	"Missing an open '{' to start the action code",
	"Use ',' to separate watch observables",
	"Expected an open '{' to start action",
	"Action code must start with a curly '{' bracket"
],
/* EDEN_ERROR_FUNCCLOSE */ [
	"Wrong kind of bracket, use '}' to end action code",
	"Missing a closing '}'"
],
/* EDEN_ERROR_FUNCNAME */ [
	"'func' names can't be keywords",
	"'func' needs a name",
	"'func' needs a name"
],
/* EDEN_ERROR_FOROPEN */ [
	"Missing an open '(' in 'for'"
],
/* EDEN_ERROR_FORCLOSE */ [
	"Missing a closing ')' after 'for'"
],
/* EDEN_ERROR_FORSTART */ [
	"Missing a ';' after initialising statement in 'for'"
],
/* EDEN_ERROR_FORCOND */ [
	"Missing a ';' after 'for' condition"
],
/* EDEN_ERROR_SUBSCRIBEOPEN */ [
	"Expected a '[' to list subscribers"
],
/* EDEN_ERROR_SUBSCRIBECLOSE */ [
	"Expected a ']' to end subscribers list"
],
/* EDEN_ERROR_SWITCHOPEN */ [
	"Expected a '(' to start 'switch' expression"
],
/* EDEN_ERROR_SWITCHCLOSE */ [
	"Expected a ')' to end 'switch' expression"
],
/* EDEN_ERROR_DEFAULTCOLON */ [
	"A 'default' statement must be followed by a ':'"
],
/* EDEN_ERROR_CASELITERAL */ [
	"A 'case' needs a number or string after it"
],
/* EDEN_ERROR_CASECOLON */ [
	"A 'case' must end in a ':'"
],
/* EDEN_ERROR_INSERTCOMMA */ [
	"An 'insert' operation takes 3 parts"
],
/* EDEN_ERROR_DELETECOMMA */ [
	"A 'delete' operation takes 2 parts"
],
/* EDEN_ERROR_APPENDCOMMA */ [
	"An 'append' operation takes 2 parts"
],
/* EDEN_ERROR_SCOPENAME */ [
	"Expected an observable name for a scope override"
],
/* EDEN_ERROR_SCOPEEQUALS */ [
	"Missing an '=' in giving a scope override"
],
/* EDEN_ERROR_SCOPECLOSE */ [
	"Missing a closing '}' after scope"
],
/* EDEN_ERROR_BACKTICK */ [
	"Missing a closing backtick"
],
/* EDEN_ERROR_WHILEOPEN */ [
	"While loop conditions start with an open '('"
],
/* EDEN_ERROR_WHILECLOSE */ [
	"Missing a closing ')' after while condition"
],
/* EDEN_ERROR_WHILENOSTATEMENT */ [
	"While loops must have a statement"
],
/* EDEN_ERROR_NEGNUMBER */ [
	"Expected a number after a negative sign"
],
];

Language.ui = {
	"input_window": {
		title: "Script Fen\u00eatre Entr\u00e9e",
		description: "Provides the ability to type in definitional scripts using the keyboard, submit them for interpretation and recall the input history.",
		success: "Super!"
	},
	"canvas": {
		title: "Image"
	},
	"menu_bar": {
		title: "Barre de Menu",
		description: "Cr\u00e9e la barre de menu.",
		opt_confirm: "Confirmez environnement fermeture",
		opt_simple_search: "Recherches simplifiées",
		opt_hide: "Cacher des fen\u00eatre sur de minimiser",
		opt_collapse: "R\u00e9duire \u00e0 la barre de titre sur la double clic",
		opt_debug: "D\u00e9boguer JS-EDEN",
		main_views: "Nouvelle Fen\u00eatre",
		main_existing: "Fen\u00eatres Existantes",
		main_options: "Les Options"
	},
	"general": {
		finished_loading: "JS-EDEN a termin\u00e9 le chargement.",
		leaving: "Laissant cette page sera jeter le script courant. Votre travail ne sera pas sauvegard\u00e9."
	}
}

