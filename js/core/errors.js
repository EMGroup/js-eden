/* Error Handling Class */

var EDEN_ERROR_PROCNAME = 0;
var EDEN_ERROR_EXPCLOSEBRACKET = 1
var EDEN_ERROR_BADFACTOR = 2;
var EDEN_ERROR_ACTIONCOLON = 3;
var EDEN_ERROR_ACTIONNOWATCH = 4;
var EDEN_ERROR_ACTIONCOMMAS = 5;
var EDEN_ERROR_ACTIONOPEN = 6;
var EDEN_ERROR_ACTIONCLOSE = 7;
var EDEN_ERROR_LOCALNAME = 8;
var EDEN_ERROR_LOCALSEMICOLON = 9;
var EDEN_ERROR_WHENTYPE = 10;
var EDEN_ERROR_LISTINDEXEXP = 11;
var EDEN_ERROR_LISTINDEXCLOSE = 12;
var EDEN_ERROR_LVALUE = 13;
var EDEN_ERROR_SEMICOLON = 14;
var EDEN_ERROR_STATEMENT = 15;
var EDEN_ERROR_DEFINITION = 16;
var EDEN_ERROR_FUNCCALLEND = 17;
var EDEN_ERROR_LISTLITCLOSE = 18;

var eden_error_db = [
/* EDEN_ERROR_PROCNAME */
	{	messages: {
			keyword: "'proc' names can't be keywords",
			operator: "'proc' actions need a name",
			bracket: "'proc' actions need a name"},
		suggestion: {expected: ["OBSERVABLE"], next: [":"]}
	},
/* EDEN_ERROR_EXPCLOSEBRACKET */
	{	messages: {
			bracket: "Wrong kind of bracket, expected a ')'.",
			keyword: "Need a closing bracket before ending the expression.",
			identifier: "Missing a closing bracket around an expression."},
		suggestion: {expected: [")"], next: [";","+","-","==","<=",">=","!=","/","*","%","^"]}
	},
/* EDEN_ERROR_BADFACTOR */
	{	messages: {
			openbracket: "Wrong kind of bracket, use '(' or '[' in expressions.",
			closebracket: "Missing expression? Unexpected closing bracket",
			separator: "Missing a closing bracket?",
			operator: "Missing an operand.",
			keyword: "Keywords are not allowed in expressions"},
		suggestion: {expected: ["NUMBER","STRING","OBSERVABLE","&","!","("], next: ["NUMBER","STRING","OBSERVABLE","&","!","(",";","+","-","==","<=",">=","!=","/","*","%","^"]}
	},
/* EDEN_ERROR_ACTIONCOLON */
	{	messages: {
			identifier: "Need a ':' before listing trigger observables",
			bracket: "Actions require a list of observables to trigger on",
			operator: "Expecting a ':' here",
			keyword: "Need a ':' after an action name, not a reserved word"},
		suggestion: {expected: [":"], next: ["OBSERVABLE"]}
	},
/* EDEN_ERROR_ACTIONNOWATCH */
	{	messages: {
			keyword: "A reserved word can't be used as an observable name",
			operator: "Umm, ask for some help",
			openbracket: "There needs to be at least one watch observable"},
		suggestion: {expected: ["OBSERVABLE"], next: [",","{"]}
	},
/* EDEN_ERROR_ACTIONCOMMAS */
	{	messages: {
			keyword: "A reserved word can't be used as an observable name",
			operator: "Umm, ask for some help",
			separator: "Too many commas or missing a watch observable",
			openbracket: "Too many commas, or missing a watch observable"},
		suggestion: {expected: ["OBSERVABLE"], next: [",","{"]}
	},
/* EDEN_ERROR_ACTIONOPEN */
	{	message: function() {
			if ((this.token == "(" || this.token == "[")
					&& this.context.stream.isBEOL()) {
				return 6;
			}
			if (this.token == "(") return 0;
			if (this.token == "[") return 1;
			if (this.token == ";") return 2;
			var type = tokenType(this.token);
			if (type == "keyword" || type == "identifier") return 3;
			if (type == "separator") return 4;
			return 5;
		},
		messages: [
			"Cannot do a function call here",
			"Can only watch observables, not a specific list index",
			"An action must have a body of code",
			"Missing an open '{' to start the action code",
			"Use ',' to separate watch observables",
			"Expected an open '{' to start action",
			"Action code must start with a curly '{' bracket"
		],
		suggestion: {
			expected: ["{"],
			next: ["local","OBSERVABLE","if","for","switch","while","return"]
		}
	},
/* EDEN_ERROR_ACTIONCLOSE */
	{	messages: {
			bracket: "Wrong kind of bracket, use '}' to end action code",
			operator: "Missing a closing '}'"},
		suggestion: {expected: ["}"], next: [";"]}
	},
/* EDEN_ERROR_LOCALNAME */
	{	messages: {
			keyword: "Reserved words can't be used as local variable names",
			operator: "'local' can't be used as an observable name",
			bracket: "Unexpected bracket, expected a local variable name"},
		suggestion: {expected: ["OBSERVABLE"], next: [";"]}
	},
/* EDEN_ERROR_LOCALSEMICOLON */
	{	messages: {
			keyword: "Need a ';' after a local declaration",
			operator: "It's not possible to initialise a local",
			identifier: "Need a ';' after a local declaration",
			bracket: "Unexpected bracket, need a ';'"},
		suggestion: {expected: [";"], next: ["local","OBSERVABLE","if","for","switch","while","return"]}
	},
/* EDEN_ERROR_WHENTYPE */
	{	messages: {
			keyword: "Did you mean 'when change' or 'when touch'?",
			identifier: "Need to know type of 'when' first (change, touch or condition)",
			bracket: "Wrong kind of bracket, use '(' for a 'when' condition",
			operator: "A 'when' must have some condition or trigger observables"},
		suggestion: {expected: ["touch","change","("], next: ["OBSERVABLE",":","NUMBER","STRING","!","&"]}
	},
/* EDEN_ERROR_LISTINDEXEXP */
	{	messages: {
			keyword: "A list index must be a valid expression",
			bracket: "A list index must be a valid expression",
			operator: "A list index must be a valid expression"},
		suggestion: {expected: ["(","OBSERVABLE","NUMBER"], next: ["]","OBSERVABLE","NUMBER","+","-","/","*","%","^"]}
	},
/* EDEN_ERROR_LISTINDEXCLOSE */
	{	messages: {
			bracket: "Wrong kind of bracket, need a ']' to end the list index",
			keyword: "Missing a ']' to end the list index",
			operator: "Missing a ']' to end the list index",
			identifier: "Unexpected observable name, did you forget ']'?"},
		suggestion: {expected: ["]"], next: ["[",".","=","+=","-=","==","+","-","/","*",";","/=","*=","%","^","is"]}
	},
/* EDEN_ERROR_LVALUE */
	{	messages: {
			bracket: "Must be an observable name",
			keyword: "Expected an observable name, cannot use reserved words as observables",
			operator: "Missing an observable"},
		suggestion: {expected: ["OBSERVABLE"], next: [".","[","is","=","+=","-=","++","--","*=","/="]}
	},
/* EDEN_ERROR_SEMICOLON */
	{	messages: {
			keyword: "Missing a ';'",
			identifier: "Missing a ';'",
			operator: "Missing a ';'",
			closebracket: "Missing an open bracket, or too many close brackets",
			openbracket: "Expected a ';' not a bracket"},
		suggestion: {expected: [";"], next: ["proc","when","OBSERVABLE","if","for","while","EOF","switch","func"]}
	},
/* EDEN_ERROR_STATEMENT */
	{	messages: {
			keyword: "A keyword can't be used as an observable name",
			operator: "Missing an observable name",
			bracket: "Wrong kind of bracket, only '{' is allowed here"},
		suggestion: {expected: ["proc","func","when","if","for","while","switch","OBSERVABLE","{"], next: ["OBSERVABLE","(","change","touch","is","=","+=","-=","*=","proc","func","when","if","for","while","switch"]}
	},
/* EDEN_ERROR_DEFINITION */
	{	messages: {
			keyword: "Must be an 'is' or some kind of assignment",
			operator: "Must be an 'is' or some kind of assignment",
			identifier: "Must be an 'is' or some kind of assignment",
			bracket: "Wrong kind of bracket, can only be '['"},
		suggestion: {expected: ["=","is","+=","-=","/=","*="], next: ["(","OBSERVABLE","NUMBER","STRING","!"]}
	},
/* EDEN_ERROR_FUNCCALLEND */
	{	messages: {
			keyword: "Missing a ')' after function call",
			operator: "Missing a ')' after function call",
			identifier: "Missing a ')' after function call",
			separator: "Missing a ')' after function call",
			bracket: "Wrong kind of bracket, need a ')'"},
		suggestion: {expected: [")"], next: [";","(","[","+","-","/","*","%","^"]}
	},
/* EDEN_ERROR_LISTLITCLOSE */
	{	message: function() { return 0; },	
		messages: [
			"Missing a ']' after a list literal"
		],
		suggestion: {expected: ["]"], next: []}
	}
]

function EdenError(context, errno) {
	this.context = context;
	this.errno = errno;
	this.token = context.token;
	this.line = context.stream.line;
	this.position = context.stream.position;
	this.prevposition = context.stream.prevposition;
};

EdenError.prototype.extractBefore = function(maxchar) {
	var pos = this.prevposition;
	while (pos > 0 && maxchar > 0) {
		if (this.context.stream.code.charCodeAt(pos) == 10) {
			break;
		}
		pos--;
		maxchar--;
	}
	if (this.context.stream.code.charCodeAt(pos) == 10) {
		pos++;
	}
	return this.context.stream.code.substr(pos, this.prevposition - pos);
};

EdenError.prototype.extractToken = function() {
	return this.context.stream.code.substr(this.prevposition, this.position - this.prevposition);
};

EdenError.prototype.extractAfter = function(maxchar) {
	var pos = this.position;
	while (pos < this.context.stream.code.length && maxchar > 0) {
		if (this.context.stream.code.charCodeAt(pos) == 10) {
			//pos--;
			break;
		}
		pos++;
		maxchar--;
	}
	return this.context.stream.code.substr(this.position, pos - this.position);
};

EdenError.prototype.buildSuggestion = function() {
	var autofix = eden_error_db[this.errno].suggestion;
	// Did we get a token that we expect to get next?
	if (autofix.next.indexOf(this.token) != -1) {
		// So insert an expected token because its missing
		return this.extractBefore(10)
				+ autofix.expected[0]
				+ " " + this.extractToken()
				+ this.extractAfter(10);
	} else {
		// Replace token with an expected one.
		// This might just be a spelling mistake.
		// Maybe also check that the next token is in expected.
		// It may also be a keyword used as an observable.
		return this.extractBefore(10)
				+ autofix.expected[0]
				+ " "
				+ this.extractAfter(10);
	}
};

EdenError.prototype.prettyPrint = function() {
	// Move stream to correct location
	this.context.stream.pushPosition();
	this.context.stream.move(this.position);

	var err = eden_error_db[this.errno];

	var msg = (err.message) ? err.messages[err.message.call(this)] : err.messages[tokenType(this.token)];
	var errmsg =
			"Error:\n    " + msg +
			"\n    Source : " + this.context.src + ", line " + this.line +
			"\n    Code   : " + this.errno;

	errmsg += "\n    Here   : " + this.extractBefore(10) + ">>> " + this.extractToken() + " <<<" + this.extractAfter(10);

	if (err.suggestion) {
		errmsg += "\n    Suggestion : " + this.buildSuggestion();
	}

	// Reset stream position
	this.context.stream.popPosition();

	return errmsg;
};


