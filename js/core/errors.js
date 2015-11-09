/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */



/**
 * Constructor for syntax errors detected in the new parser. It captures the
 * type of error, the context and location.
 */
Eden.SyntaxError = function(context, errno, extra) {
	this.type = "syntax";
	this.context = context;
	this.errno = errno;
	this.extra = extra;
	this.token = context.token;
	this.prevtoken = context.previous;
	this.line = context.stream.line;
	this.position = context.stream.position;
	this.prevposition = context.stream.prevposition;
};

Eden.SyntaxError.UNKNOWN = 0;
Eden.SyntaxError.EXPCLOSEBRACKET = 1
Eden.SyntaxError.BADFACTOR = 2;
Eden.SyntaxError.ACTIONCOLON = 3;
Eden.SyntaxError.ACTIONNOWATCH = 4;
Eden.SyntaxError.ACTIONCOMMAS = 5;
Eden.SyntaxError.ACTIONOPEN = 6;
Eden.SyntaxError.ACTIONCLOSE = 7;
Eden.SyntaxError.LOCALNAME = 8;
Eden.SyntaxError.LOCALSEMICOLON = 9;
Eden.SyntaxError.WHENTYPE = 10;
Eden.SyntaxError.LISTINDEXEXP = 11;
Eden.SyntaxError.LISTINDEXCLOSE = 12;
Eden.SyntaxError.LVALUE = 13;
Eden.SyntaxError.SEMICOLON = 14;
Eden.SyntaxError.STATEMENT = 15;
Eden.SyntaxError.DEFINITION = 16;
Eden.SyntaxError.FUNCCALLEND = 17;
Eden.SyntaxError.LISTLITCLOSE = 18;
Eden.SyntaxError.TERNIFCOLON = 19;
Eden.SyntaxError.IFCONDOPEN = 20;
Eden.SyntaxError.IFCONDCLOSE = 21;
Eden.SyntaxError.PARAMNAME = 22;
Eden.SyntaxError.PARAMSEMICOLON = 23;
Eden.SyntaxError.FUNCOPEN = 24;
Eden.SyntaxError.FUNCCLOSE = 25;
Eden.SyntaxError.FUNCNAME = 26;
Eden.SyntaxError.FOROPEN = 27;
Eden.SyntaxError.FORCLOSE = 28;
Eden.SyntaxError.FORSTART = 29;
Eden.SyntaxError.FORCOND = 30;
Eden.SyntaxError.SUBSCRIBEOPEN = 31;
Eden.SyntaxError.SUBSCRIBECLOSE = 32;
Eden.SyntaxError.SWITCHOPEN = 33;
Eden.SyntaxError.SWITCHCLOSE = 34;
Eden.SyntaxError.DEFAULTCOLON = 35;
Eden.SyntaxError.CASELITERAL = 36;
Eden.SyntaxError.CASECOLON = 37;
Eden.SyntaxError.INSERTCOMMA = 38;
Eden.SyntaxError.DELETECOMMA = 39;
Eden.SyntaxError.APPENDCOMMA = 40;
Eden.SyntaxError.SCOPENAME = 41;
Eden.SyntaxError.SCOPEEQUALS = 42;
Eden.SyntaxError.SCOPECLOSE = 43;
Eden.SyntaxError.BACKTICK = 44;
Eden.SyntaxError.WHILEOPEN = 45;
Eden.SyntaxError.WHILECLOSE = 46;
Eden.SyntaxError.WHILENOSTATEMENT = 47;
Eden.SyntaxError.NEGNUMBER = 48;
Eden.SyntaxError.DEFINELISTIX = 49;
Eden.SyntaxError.OUTOFBOUNDS = 50;
Eden.SyntaxError.PROPERTYNAME = 51;
Eden.SyntaxError.WHILEOFDO = 52;
//Eden.SyntaxError.ASSIGNEXEC = 53;		// RUNTIME
//Eden.SyntaxError.FUNCCALL = 54;		// RUNTIME
Eden.SyntaxError.AFTEROPEN = 55;
Eden.SyntaxError.AFTERCLOSE = 56;
Eden.SyntaxError.ACTIONNAME = 57;
Eden.SyntaxError.WHENOPEN = 58;
Eden.SyntaxError.WHENCLOSE = 59;
Eden.SyntaxError.DONAME = 60;
Eden.SyntaxError.PROCNAME = 61;

Eden.SyntaxError.db = [
/* EDEN_ERROR_UNKNOWN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
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
	},
/* EDEN_ERROR_WHILEOFDO */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_ASSIGNEXEC */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_FUNCCALL */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_AFTEROPEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_AFTERCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_ACTIONNAME */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_WHENOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_WHENCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_DONAME */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
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
	}
];



Eden.SyntaxError.prototype.extractBefore = function(maxchar) {
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

Eden.SyntaxError.prototype.extractToken = function() {
	return this.context.stream.code.substr(this.prevposition, this.position - this.prevposition);
};

Eden.SyntaxError.prototype.extractAfter = function(maxchar) {
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

Eden.SyntaxError.prototype.buildSuggestion = function() {
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

Eden.SyntaxError.prototype.messageText = function() {
	var err = Eden.SyntaxError.db[this.errno];
	var txt = Language.errors[this.errno][err.message.call(this)]
	if (this.extra === undefined) {
		return txt;
	} else {
		return txt + ": " + this.extra;
	}
}

Eden.SyntaxError.prototype.prettyPrint = function() {
	// Move stream to correct location
	this.context.stream.pushPosition();
	this.context.stream.move(this.position);

	var err = Eden.SyntaxError.db[this.errno];

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

Eden.SyntaxError.prototype.toString = function() {
	return this.prettyPrint();
}




/**
 * Constructor for AST runtime errors. This must be given positional info
 * because it can't be extracted from context.
 */
Eden.RuntimeError = function(context, errno, statement, extra) {
	this.type = "runtime";
	this.line = -1;
	this.statement = statement;
	this.extra = extra;
	this.errno = errno;
}

Eden.RuntimeError.UNKNOWN = 0;
Eden.RuntimeError.ASSIGNEXEC = 1;
Eden.RuntimeError.FUNCCALL = 2;
Eden.RuntimeError.ACTIONNAME = 3;

Eden.RuntimeError.prototype.messageText = function() {
	return this.extra;
}


