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
	this.line = context.stream.prevline;
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
Eden.SyntaxError.PARAMNUMBER = 53;
//Eden.SyntaxError.FUNCCALL = 54;		// RUNTIME
Eden.SyntaxError.AFTEROPEN = 55;
Eden.SyntaxError.AFTERCLOSE = 56;
Eden.SyntaxError.ACTIONNAME = 57;
Eden.SyntaxError.WHENOPEN = 58;
Eden.SyntaxError.WHENCLOSE = 59;
Eden.SyntaxError.DONAME = 60;
Eden.SyntaxError.PROCNAME = 61;
Eden.SyntaxError.IMPORTPATH = 62;
Eden.SyntaxError.IMPORTOPTION = 63;
Eden.SyntaxError.IMPORTCOMB = 64;
Eden.SyntaxError.IFNOSTATEMENT = 65;
Eden.SyntaxError.AFTERNOSTATEMENT = 66;
Eden.SyntaxError.WHENNOSTATEMENT = 67;
Eden.SyntaxError.LITCHAREMPTY = 68;
Eden.SyntaxError.LITCHARCLOSE = 69;
Eden.SyntaxError.LITSTRLINE = 70;
Eden.SyntaxError.LITSTRCLOSE = 71;
Eden.SyntaxError.IMPORTTAG = 72;
Eden.SyntaxError.SWITCHSCRIPT = 73;
Eden.SyntaxError.RANGEBANNED = 74;
Eden.SyntaxError.HEREDOCTOKEN = 75;
Eden.SyntaxError.SELECTORACTION = 76;
Eden.SyntaxError.SELECTORATTRIB = 77;
Eden.SyntaxError.SELECTORTAG = 78;
Eden.SyntaxError.SELECTORBTICK = 79;
Eden.SyntaxError.SELECTOROPTION = 80;
Eden.SyntaxError.QUERYOPEN = 81;
Eden.SyntaxError.QUERYCLOSE = 82;
Eden.SyntaxError.QUERYSELECTOPEN = 83;
Eden.SyntaxError.QUERYSELECTCLOSE = 84;
Eden.SyntaxError.QUERYSELECTCOMMA = 85;
Eden.SyntaxError.BLOCKCOMMENT = 86;
Eden.SyntaxError.NEWLINE = 87;
Eden.SyntaxError.WHENROLE = 88;
Eden.SyntaxError.ALIASQUERY = 89;
Eden.SyntaxError.EVALOPEN = 90;
Eden.SyntaxError.EVALCLOSE = 91;
Eden.SyntaxError.DOATTRIBCLOSE = 92;
Eden.SyntaxError.DOBADATTRIB = 93;
Eden.SyntaxError.QUERYNOTALLOWED = 94;
Eden.SyntaxError.SYNCNOTALLOWED = 95;
Eden.SyntaxError.BADEXPRTYPE = 96;

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
	{	message: function() { return 1; },
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
/* EDEN_ERROR_PARAMNUMBER */
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
	},
/* EDEN_ERROR_IMPORTPATH */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_IMPORTOPTION */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_IMPORTCOMB */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_IFNOSTATEMENT */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_AFTERNOSTATEMENT */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_WHENNOSTATEMENT */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_LITCHAREMPTY */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_LITCHARCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_LITSTRLINE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_LITSTRCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_IMPORTTAG */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SWITCHSCRIPT */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_RANGEBANNED */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_HEREDOCTOKEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SELECTORACTION */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SELECTORATTRIB */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SELECTORTAG */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SELECTORBTICK */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SELECTOROPTION */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYSELECTOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYSELECTCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYSELECTCOMMA */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_BLOCKCOMMENT */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_NEWLINE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_WHENROLE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_ALIASQUERY */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_EVALOPEN */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_EVALCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_DOATTRIBCLOSE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_DOBADATTRIB */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_QUERYNOTALLOWED */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_SYNCNOTALLOWED */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
	},
/* EDEN_ERROR_BADEXPRTYPE */
	{	message: function() { return 0; },
		suggestion: {expected: [], next: []}
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
	var autofix = Eden.SyntaxError.db[this.errno].suggestion;
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
 * 
 * @param {object} context Eden.Folder symbol table
 */
Eden.RuntimeError = function(context, errno, statement, extra) {
	this.type = "runtime";
	this.line = -1;
	this.statement = statement;
	this.extra = extra;
	this.errno = errno;
	this.context = context;
	this.lastsymbol = context.lastlookup;

	console.error(extra);
}

Eden.RuntimeError.UNKNOWN = 0;
Eden.RuntimeError.ASSIGNEXEC = 1;
Eden.RuntimeError.FUNCCALL = 2;
Eden.RuntimeError.ACTIONNAME = 3;
Eden.RuntimeError.NOAGENT = 4;
Eden.RuntimeError.NOTSUPPORTED = 5;
Eden.RuntimeError.ASSIGNTODEFINED = 6;
Eden.RuntimeError.ASSIGNDIMENSION = 7;
Eden.RuntimeError.EXTENDSTATIC = 8;
Eden.RuntimeError.INFINITERANGE = 9;
Eden.RuntimeError.NOLISTRANGE = 10;
Eden.RuntimeError.LEFTCONCAT = 11;
Eden.RuntimeError.RIGHTCONCAT = 12;
Eden.RuntimeError.AGENTSOURCE = 13;
Eden.RuntimeError.JSOBSERVER = 14;
Eden.RuntimeError.PROCAGENT = 15;
Eden.RuntimeError.ARGUMENTS = 16;
Eden.RuntimeError.NOTCHILD = 17;
Eden.RuntimeError.INFINITEWHEN = 18;

Eden.RuntimeError.prototype.messageText = function() {
	var msg = (this.statement && (this.statement.type == "functioncall" || this.statement.type == "definition" || this.statement.type == "assignment")) ? "'" + this.statement.lvalue.name + "': " : "";

	switch (this.errno) {
	case Eden.RuntimeError.ACTIONNAME		:
	case Eden.RuntimeError.NOAGENT			: 
	case Eden.RuntimeError.NOTSUPPORTED		:
	case Eden.RuntimeError.AGENTSOURCE		:
	case Eden.RuntimeError.JSOBSERVER		:
	case Eden.RuntimeError.PROCAGENT		:
	case Eden.RuntimeError.ARGUMENTS		:
	case Eden.RuntimeError.EXTENDSTATIC		: return msg + this.extra;
	case Eden.RuntimeError.ASSIGNTODEFINED	: return msg + "cannot assign to a defined list, use 'is'";
	case Eden.RuntimeError.ASSIGNDIMENSION	: return msg + "list does not have this many dimensions";
	case Eden.RuntimeError.RIGHTCONCAT		: return msg + "Concatenation: When the right hand side is a list then the left hand side must also be a list";
	case Eden.RuntimeError.LEFTCONCAT		: return msg + "Concatenation: When the left hand side is a list then the right hand side must also be a list";
	case Eden.RuntimeError.INFINITERANGE	: return msg + "range scope is infinite";
	case Eden.RuntimeError.NOLISTRANGE		: return msg + "range 'in' is not a list";
	case Eden.RuntimeError.INFINITEWHEN		: return msg + "infinite when loop detected";
	default: break;
	}

	if (String(this.extra).search("is not a function") >= 0) {
		return msg + "function used does not exist";
	} else if (this.errno == Eden.RuntimeError.FUNCCALL && (String(this.extra).search("Cannot read property 'call'") >= 0 || String(this.extra).search("Cannot read property 'apply'") >= 0)) {
		return msg + "procedure does not exist";
	} else if (String(this.extra).match(/Cannot read property .* of undefined/)) {
		return msg + "uses an undefined list";
	}
	return this.extra;
}

Eden.RuntimeError.prototype.edenSource = function() {
	if (this.statement) {
		if (this.statement.type == "definition") {
			var sym = this.context.symbols[this.statement.lvalue.name];
			if (sym && sym.definition) {
				return sym.getSource();
			}
		} else if (this.statement.getSource) {
			return this.statement.getSource();
		}
	}
}

Eden.RuntimeError.prototype.javascriptSource = function() {
	return this.statement.generate({scopes: [], dependencies: {}},"scope");
}

Eden.RuntimeError.prototype.details = function() {
	var res = "";
	if (this.statement.type == "definition" || this.statement.type == "assignment") {
		res += "Symbol: " + this.statement.lvalue.name + "\n";
	}
	if (String(this.extra).search("SyntaxError") >= 0) {
		res += "JavaScript: " + this.javascriptSource() + "\n";
	} else {
		res += "Source: " + this.edenSource() + "\n";
	}
	if (this.extra.message) res += "Original: " + this.extra.message + "\n";
	
	return res;
}

Eden.RuntimeError.prototype.prettyPrint = function() {
	if (this.extra && this.extra.stack) {
		return "Run-time Error:\n"+this.extra.stack;
	} else {
		return "Run-time Error:\n";
	}
}


