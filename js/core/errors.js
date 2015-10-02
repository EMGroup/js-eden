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
var EDEN_ERROR_TERNIFCOLON = 19;
var EDEN_ERROR_IFCONDOPEN = 20;
var EDEN_ERROR_IFCONDCLOSE = 21;
var EDEN_ERROR_PARAMNAME = 22;
var EDEN_ERROR_PARAMSEMICOLON = 23;
var EDEN_ERROR_FUNCOPEN = 24;
var EDEN_ERROR_FUNCCLOSE = 25;
var EDEN_ERROR_FUNCNAME = 26;
var EDEN_ERROR_FOROPEN = 27;
var EDEN_ERROR_FORCLOSE = 28;
var EDEN_ERROR_FORSTART = 29;
var EDEN_ERROR_FORCOND = 30;
var EDEN_ERROR_SUBSCRIBEOPEN = 31;
var EDEN_ERROR_SUBSCRIBECLOSE = 32;
var EDEN_ERROR_SWITCHOPEN = 33;
var EDEN_ERROR_SWITCHCLOSE = 34;
var EDEN_ERROR_DEFAULTCOLON = 35;
var EDEN_ERROR_CASELITERAL = 36;
var EDEN_ERROR_CASECOLON = 37;
var EDEN_ERROR_INSERTCOMMA = 38;
var EDEN_ERROR_DELETECOMMA = 39;
var EDEN_ERROR_APPENDCOMMA = 40;
var EDEN_ERROR_SCOPENAME = 41;
var EDEN_ERROR_SCOPEEQUALS = 42;
var EDEN_ERROR_SCOPECLOSE = 43;
var EDEN_ERROR_BACKTICK = 44;
var EDEN_ERROR_WHILEOPEN = 45;
var EDEN_ERROR_WHILECLOSE = 46;
var EDEN_ERROR_WHILENOSTATEMENT = 47;
var EDEN_ERROR_NEGNUMBER = 48;
var EDEN_ERROR_DEFINELISTIX = 49;
var EDEN_ERROR_OUTOFBOUNDS = 50;
var EDEN_ERROR_PROPERTYNAME = 51;

var eden_error_db = [
/* EDEN_ERROR_PROCNAME */
	{	message: function() {
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 0;
			if (type == "boolean" || type == "character" || type == "string" || type == "number") return 1;
			if (this.token == ":") return 4;
			if (this.token == "{") return 5;
			if (this.token == "closebracket") return 3;
			return 2; 
		},
		suggestion: {expected: ["OBSERVABLE"], next: [":"]}
	},
/* EDEN_ERROR_EXPCLOSEBRACKET */
	{	message: function() {
			if (this.token == "}" || this.token == "]") return 0;
			if (this.token == ";") return 1;
			return 2;
		},
		suggestion: {expected: [")"], next: [";","+","-","==","<=",">=","!=","/","*","%","^"]}
	},
/* EDEN_ERROR_BADFACTOR */
	{	message: function() {
			if (this.token == "{") return 0;
			if (this.token == ")") {
				var prevtype = this.context.stream.tokenType(this.prevtoken);
				if (prevtype == "operator") {
					return 3;
				}
				return 1;
			}
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 4;
			if (type == "operator") return 3;
			return 2;
		},
		suggestion: {expected: ["NUMBER","STRING","OBSERVABLE","&","!","("], next: ["NUMBER","STRING","OBSERVABLE","&","!","(",";","+","-","==","<=",">=","!=","/","*","%","^"]}
	},
/* EDEN_ERROR_ACTIONCOLON */
	{	message: function() {
			if (this.token == "{") return 1;
			if (this.token == "OBSERVABLE") return 0;
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 3;
			return 2;
		},
		suggestion: {expected: [":"], next: ["OBSERVABLE"]}
	},
/* EDEN_ERROR_ACTIONNOWATCH */
	{	message: function() {
			if (this.token == "{") return 2;
			if (this.token == "(") return 3;
			if (this.token == "[" && (this.prevtoken == ":" || this.prevtoken == ",")) return 6;
			if (this.token == "NUMBER" || this.token == "STRING") return 4;
			if (this.token == ",") return 5;
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 0;
			if (type == "operator") return 1;
			return 1;
		},
		suggestion: {expected: ["OBSERVABLE"], next: [",","{"]}
	},
/* EDEN_ERROR_ACTIONCOMMAS */
	{	message: function() {
			if (this.token == "{") return 0;
			if (this.token == "(" && !this.context.stream.isBEOL()) return 1;
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 2;
			return 3;
		},
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
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword" || type == "identifier") return 3;
			if (type == "separator") return 4;
			return 5;
		},
		suggestion: {
			expected: ["{"],
			next: ["local","OBSERVABLE","if","for","switch","while","return"]
		}
	},
/* EDEN_ERROR_ACTIONCLOSE */
	{	message: function() {
			if (this.token == ")" || this.token == "]") {
				if (this.context.stream.isBEOL()) {
					return 0;
				} else {
					return 1;
				}
			}
			return 1;
		},
		suggestion: {expected: ["}"], next: ["proc","func","if","for","OBSERVABLE","switch","while","return","continue","break"]}
	},
/* EDEN_ERROR_LOCALNAME */
	{	message: function() {
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword") return 0;
			if (this.token == ";") return 1;
			return 2;
		},
		suggestion: {expected: ["OBSERVABLE"], next: [";"]}
	},
/* EDEN_ERROR_LOCALSEMICOLON */
	{	message: function() {
			if (this.token == "is" || this.token == "=") return 1;
			return 0;
		},
		suggestion: {expected: [";"], next: ["local","OBSERVABLE","if","for","switch","while","return"]}
	},
/* EDEN_ERROR_WHENTYPE */
	{	message: function() { return 0; },
		suggestion: {expected: ["touch","change","("], next: ["OBSERVABLE",":","NUMBER","STRING","!","&"]}
	},
/* EDEN_ERROR_LISTINDEXEXP */
	{	message: function() { return 0; },
		suggestion: {expected: ["(","OBSERVABLE","NUMBER"], next: ["]","OBSERVABLE","NUMBER","+","-","/","*","%","^"]}
	},
/* EDEN_ERROR_LISTINDEXCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: ["]"], next: ["[",".","=","+=","-=","==","+","-","/","*",";","/=","*=","%","^","is"]}
	},
/* EDEN_ERROR_LVALUE */
	{	message: function() { return 0; },
		suggestion: {expected: ["OBSERVABLE"], next: [".","[","is","=","+=","-=","++","--","*=","/="]}
	},
/* EDEN_ERROR_SEMICOLON */
	{	message: function() {
			if (this.token == ".") {
				var prevchar = (this.position >= 2) ? this.context.stream.code.charCodeAt(this.position-2) : 0;
				if (this.prevtoken == "NUMBER" && (prevchar != 32 && prevchar != 160)) {
					return 1;
				} else {
					return 2;
				}
			} else if (this.token == "OBSERVABLE") {
				if (this.context.stream.isBEOL()) {
					return 3;
				}
				return 4;
			}
			return 0;
		},
		suggestion: {expected: [";"], next: ["proc","when","OBSERVABLE","if","for","while","EOF","switch","func"]}
	},
/* EDEN_ERROR_STATEMENT */
	{	message: function() { return 0; },
		suggestion: {expected: ["proc","func","when","if","for","while","switch","OBSERVABLE","{"], next: ["OBSERVABLE","(","change","touch","is","=","+=","-=","*=","proc","func","when","if","for","while","switch"]}
	},
/* EDEN_ERROR_DEFINITION */
	{	message: function() { return 0; },
		suggestion: {expected: ["=","is","+=","-=","/=","*="], next: ["(","OBSERVABLE","NUMBER","STRING","!"]}
	},
/* EDEN_ERROR_FUNCCALLEND */
	{	message: function() { return 0; },
		suggestion: {expected: [")"], next: [";","(","[","+","-","/","*","%","^"]}
	},
/* EDEN_ERROR_LISTLITCLOSE */
	{	message: function() { return 0; },	
		suggestion: {expected: ["]"], next: []}
	},
/* EDEN_ERROR_TERNIFCOLON */
	{	message: function() { return 0; },
		suggestion: {expected: [":"], next: []}
	},
/* EDEN_ERROR_IFCONDOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: ["("], next: []}
	},
/* EDEN_ERROR_IFCONDCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [")"], next: []}
	},
/* EDEN_ERROR_PARAMNAME */
	{	message: function() { return 0; },
		suggestion: {expected: ["OBSERVABLE"], next: [";"]}
	},
/* EDEN_ERROR_PARAMSEMICOLON */
	{	message: function() { return 0; },
		suggestion: {expected: [";"], next: ["para","local","OBSERVABLE","if","for","switch","while","return"]}
	},
/* EDEN_ERROR_FUNCOPEN */
	{	message: function() {
			if ((this.token == "(" || this.token == "[")
					&& this.context.stream.isBEOL()) {
				return 6;
			}
			if (this.token == "(") return 0;
			if (this.token == "[") return 1;
			if (this.token == ";") return 2;
			var type = this.context.stream.tokenType(this.token);
			if (type == "keyword" || type == "identifier") return 3;
			if (type == "separator") return 4;
			return 5;
		},
		suggestion: {
			expected: ["{"],
			next: ["local","OBSERVABLE","if","for","switch","while","return"]
		}
	},
/* EDEN_ERROR_FUNCCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: ["}"], next: [";"]}
	},
/* EDEN_ERROR_FUNCNAME */
	{	message: function() { return 0; },	
		suggestion: {expected: ["OBSERVABLE"], next: ["{"]}
	},
/* EDEN_ERROR_FOROPEN */
	{	message: function() { return 0; },
		suggestion: {expected: ["("], next: []}
	},
/* EDEN_ERROR_FORCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [")"], next: []}
	},
/* EDEN_ERROR_FORSTART */
	{	message: function() { return 0; },
		suggestion: {expected: [";"], next: []}
	},
/* EDEN_ERROR_FORCOND */
	{	message: function() { return 0; },
		suggestion: {expected: [";"], next: []}
	},
/* EDEN_ERROR_SUBSCRIBEOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: ["["], next: []}
	},
/* EDEN_ERROR_SUBSCRIBECLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: ["]"], next: []}
	},
/* EDEN_ERROR_SWITCHOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: ["("], next: []}
	},
/* EDEN_ERROR_SWITCHCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: ["]"], next: []}
	},
/* EDEN_ERROR_DEFAULTCOLON */
	{	message: function() { return 0; },
		suggestion: {expected: [":"], next: []}
	},
/* EDEN_ERROR_CASELITERAL */
	{	message: function() { return 0; },
		suggestion: {expected: ["NUMBER","STRING"], next: []}
	},
/* EDEN_ERROR_CASECOLON */
	{	message: function() { return 0; },
		suggestion: {expected: [":"], next: []}
	},
/* EDEN_ERROR_INSERTCOMMA */
	{	message: function() { return 0; },
		suggestion: {expected: [","], next: []}
	},
/* EDEN_ERROR_DELETECOMMA */
	{	message: function() { return 0; },
		suggestion: {expected: [","], next: []}
	},
/* EDEN_ERROR_APPENDCOMMA */
	{	message: function() { return 0; },
		suggestion: {expected: [","], next: []}
	},
/* EDEN_ERROR_SCOPENAME */
	{	message: function() { return 0; },
		suggestion: {expected: ["OBSERVABLE"], next: []}
	},
/* EDEN_ERROR_SCOPEEQUALS */
	{	message: function() { return 0; },
		suggestion: {expected: ["="], next: []}
	},
/* EDEN_ERROR_SCOPECLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: ["}"], next: []}
	},
/* EDEN_ERROR_BACKTICK */
	{	message: function() { return 0; },
		suggestion: {expected: ["`"], next: []}
	},
/* EDEN_ERROR_WHILEOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: ["("], next: []}
	},
/* EDEN_ERROR_WHILECLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [")"], next: []}
	},
/* EDEN_ERROR_WHILENOSTATEMENT */
	{	message: function() { return 0; },
		suggestion: {expected: [")"], next: []}
	},
/* EDEN_ERROR_NEGNUMBER */
	{	message: function() { return 0; },
		suggestion: {expected: ["NUMBER"], next: []}
	},
/* EDEN_ERROR_DEFINELISTIX */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_OUTOFBOUNDS */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_PROPERTYNAME */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	}
]

function EdenError(context, errno) {
	this.context = context;
	this.errno = errno;
	this.token = context.token;
	this.prevtoken = context.previous;
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

EdenError.prototype.messageText = function() {
	var err = eden_error_db[this.errno];
	return Language.errors[this.errno][err.message.call(this)];
}

EdenError.prototype.prettyPrint = function() {
	// Move stream to correct location
	this.context.stream.pushPosition();
	this.context.stream.move(this.position);

	var err = eden_error_db[this.errno];

	var msg = Language.errors[this.errno][err.message.call(this)];
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


