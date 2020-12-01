function EdenSyntaxData() {
	this.value = undefined;
	this.error = false;
	this.line = 0;
}

/**
 * A basic stream wrapper for a javascript string that allows for sequential
 * reading and backtracking of the string. It provides a readToken function
 * that extracts one complete Eden token from the string.
 * @param code Eden Script as a string
 */
function EdenStream(code) {
	this.code = code;
	this.position = 0;
	this.position_stack = [0];
	this.prevposition = 0;
	this.line = 1;
	this.prevline = 1;
	this.data = new EdenSyntaxData();
};

/**
 * Save the current stream position.
 */
EdenStream.prototype.pushPosition = function() {
	this.position_stack.push(this.position);
};

/**
 * Restore the last saved stream position.
 */
EdenStream.prototype.popPosition = function() {
	this.position = this.position_stack.pop();
};

/**
 * Forget the last saved stream position.
 */
EdenStream.prototype.discardPosition = function() {
	this.position_stack.pop();
};

/**
 * Get the character (code) as the current position.
 * Moves stream to the next position.
 */
EdenStream.prototype.get = function() {
	return (this.position < this.code.length) ? this.code.charCodeAt(this.position++) : 0;
};

/**
 * Get the next character but don't move the stream on.
 */
EdenStream.prototype.peek = function() {
	return (this.position < this.code.length) ? this.code.charCodeAt(this.position) : 0;
};

/**
 * Get the character after the next and don't move the stream.
 */
EdenStream.prototype.peek2 = function() {
	if (this.position + 1 >= this.code.length) return 0;
	return this.code.charCodeAt(this.position + 1);
};

/**
 * Get the character after the next and don't move the stream.
 */
EdenStream.prototype.peek3 = function() {
	if (this.position + 2 >= this.code.length) return 0;
	return this.code.charCodeAt(this.position + 2);
};

EdenStream.prototype.readLine = function() {
	var eolix = this.code.indexOf("\n",this.position);
	if (eolix == -1) {
		var res = this.code.substring(this.position);
		this.position = this.code.length;
		return res;
	} else {
		var res = this.code.substring(this.position, eolix+1);
		this.position = eolix+1;
		this.line++;
		return res;
	}
};

EdenStream.prototype.peekLine = function() {
	var eolix = this.code.indexOf("\n",this.position);
	if (eolix == -1) {
		var res = this.code.substring(this.position);
		//this.position = this.code.length;
		return res;
	} else {
		var res = this.code.substring(this.position, eolix+1);
		//this.position = eolix+1;
		//this.line++;
		return res;
	}
};

/**
 * Explicitely set the stream position.
 * Used by error handlers to scan around where the error occurred.
 */
EdenStream.prototype.move = function(pos) {
	this.position = pos;
};


EdenStream.prototype.reset = function() {
	this.position = 0;
	this.position_stack = [0];
	this.prevposition = 0;
	this.line = 1;
}

EdenStream.prototype.tokenText = function() {
	return this.code.substr(this.prevposition,this.position - this.prevposition);
}

/**
 * Is the stream at the beginning or end of a line.
 */
EdenStream.prototype.isBEOL = function() {
	if (this.prevposition == 0) return true;
	if (this.peek2() == 10) return true;
	var pastpos = this.prevposition-1;
	var pastchar = this.code.charCodeAt(pastpos);
	while (pastchar == 9 || pastchar == 32) {
		pastpos--;
		pastchar = this.code.charCodeAt(pastpos);
	}
	if (pastchar == 10) return true;
	return false;
};

/**
 * Move forward one character.
 */
EdenStream.prototype.skip = function() {
	this.position++;
};

/**
 * Has the end of input been reached.
 */
EdenStream.prototype.eof = function() {
	return this.position >= this.code.length;
};

/**
 * Is there still valid input to be checked.
 */
EdenStream.prototype.valid = function() {
	return this.position < this.code.length;
};

/**
 * Move back one character.
 */
EdenStream.prototype.unget = function() {
	this.position--;
};



/**
 * Move the stream to the next non-whitespace character.
 * Counts all new lines in the process to record current line number.
 */
EdenStream.prototype.skipWhiteSpace = function() {
	while (this.valid()) {
		var ch= this.peek();
		if (ch == 10) this.line++;
		if (ch == 9 || ch == 10 || ch == 13 || ch == 32 || ch == 160) {
			this.skip();
		} else {
			break;
		}
	}
};



EdenStream.prototype.skipLine = function() {
	while (this.valid() && this.peek() != 10) this.skip();
}



/**
 * Check if a character matches [a-zA-Z0-9_] or unicode...
 */
EdenStream.prototype.isAlphaNumeric = function(ch) {
	return (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch == 95) || (ch >= 128 || ch == 36); //(ch >= 0xc0);
};



/**
 * Check if a character matches [0-9]
 */
EdenStream.prototype.isNumeric = function(ch) {
	return (ch >= 48 && ch <= 57);
};



/**
 * Get the generic type of a particular token.
 * Used in error context checking.
 */
EdenStream.prototype.tokenType = function(token) {
	if (token == "OBSERVABLE") {
		return "identifier";
	}
	if (token == "JAVASCRIPT") {
		return "javascript";
	}
	if (token == "NUMBER") {
		return "number";
	}
	if (token == "STRING") {
		return "string";
	}
	if (token == "CHARACTER") {
		return "character";
	}
	if (token == "BOOLEAN") {
		return "boolean";
	}
	if (typeof token != "string") {
		console.error(token);
		return "INVALID";
	}
	if (this.isAlphaNumeric(token.charCodeAt(0))) {
		return "keyword";
	}
	if (token == "(" || token == "[" || token == "{") {
		return "openbracket";
	}
	if (token == ")" || token == "]" || token == "}") {
		return "closebracket";
	}
	if (token == "," || token == "." || token == ";" || token == ":") {
		return "separator";
	}
	return "operator";
};



/**
 * Extract an alphanumeric token from the stream.
 * Fills data.value with the string read.
 */
EdenStream.prototype.parseAlphaNumeric = function(data) {
	var result = "";

	if (this.isAlphaNumeric(this.peek()) == false) {
		return false;
	}

	while (this.valid() && this.isAlphaNumeric(this.peek())) {
		result += String.fromCharCode(this.get());
	}
	data.value = result;
	return true;
};



EdenStream.prototype.parseString = function(data, kind) {
	var result = "";

	while (this.valid() && this.peek() != kind) {
		var chr = String.fromCharCode(this.get());
		if (chr == "\n"){
			this.unget();
			data.error = true;
			data.value = "LINEBREAK";
			return;
		}
		// TODO, the following allows multi-line strings if highlighter can
		//if (chr == "\n") this.line++;
		if (chr == "\\") {
			chr = String.fromCharCode(this.get());
			result += "\\" + chr;
		} else {
			result += chr;
		}
	}

	// Remove end quote
	if (this.valid() && this.peek() == kind) {
		this.skip();
		data.error = false;
	} else {
		data.error = true;
	}

	data.value = result;
};

EdenStream.prototype.parseCharacter = function(data) {
	var result = String.fromCharCode(this.get());

	if (result == "'") {
		data.value = "";
		data.error = true;
		return;
	}

	// Escaped char
	if (result == "\\") {
		result = String.fromCharCode(this.get());
	}

	data.value = result;

	// Remove quote.
	if (this.valid() && this.peek() == 39) {
		this.skip();
	} else {
		data.error = true;
	}
}



EdenStream.prototype.parseNumber = function(data) {
	var result = "";

	while (this.valid() && this.isNumeric(this.peek())) {
		result += String.fromCharCode(this.get());
	}

	if (this.peek() == 46 && this.isNumeric(this.peek2())) {
		this.skip();
		result += ".";
		while (this.valid() && this.isNumeric(this.peek())) {
			result += String.fromCharCode(this.get());
		}
	}

	data.value = parseFloat(result);
};




EdenStream.prototype.readToken = function(ignorestrings) {
	this.prevline = this.line;
	this.skipWhiteSpace();
	this.prevposition = this.position;

	if (this.eof()) return "EOF";

	//var ch = this.get();

	var ch = this.code.charCodeAt(this.position);
	this.position++;

	switch (ch) {
	case 33	:	if (this.peek() == 61) { this.skip(); return "!="; }
				if (this.peek() == 126) { this.skip(); return "!~"; }
				return "!";
	case 34	:	if (!ignorestrings) { this.parseString(this.data, 34); return "STRING"; }
				else return "\"";
	case 35	:	if (this.peek() == 35) { this.skip(); return "##"; }
				return "#";
	case 36	:	if (this.peek() == 123 && this.peek2() == 123) {
					this.skip(); this.skip();
					return "${{";
				} else if (this.peek() == 123) {
					this.skip();
					return "${";
				}
				break;
	case 37	:	return "%";
	case 38	:	if (this.peek() == 38) { this.skip(); return "&&"; }
				if (this.peek() == 61) { this.skip(); return "&="; }
				return "&";
	case 39 :	if (!ignorestrings) { this.parseString(this.data, 39); return "STRING"; }
				else return "'";
	case 40	:	return "(";
	case 41	:	return ")";
	case 42	:	if (this.peek() == 61) { this.skip(); return "*="; }
				if (this.peek() == 47) { this.skip(); return "*/"; }
				return "*";
	case 43	:	if (this.peek() == 43) { this.skip(); return "++"; }
				if (this.peek() == 61) { this.skip(); return "+="; }
				return "+";
	case 44 :	return ",";
	case 45	:	if (this.peek() == 45) { this.skip(); return "--"; }
				if (this.peek() == 61) { this.skip(); return "-="; }
				//if (this.isNumeric(this.peek())) { this.parseNumber(this.data); this.data.value = -this.data.value; return "NUMBER"; }
				return "-";
	case 46	:	if (this.peek() == 46) { this.skip(); return ".."; }
				return ".";
	case 47	:	if (this.peek() == 47 && this.peek2() == 61) { this.skip(); return "//="; }
				if (this.peek() == 47) { this.skip(); return "//"; }
				if (this.peek() == 61) { this.skip(); return "/="; }
				if (this.peek() == 42) { this.skip(); return "/*"; }
				return "/";
	case 48 :
	case 49 :
	case 50 :
	case 51 :
	case 52 :
	case 53 :
	case 54 :
	case 55 :
	case 56 :
	case 57 :	this.unget(); this.parseNumber(this.data); return "NUMBER";
	case 58	:	if (this.peek() == 58) { this.skip(); return "::"; }
				return ":";
	case 59	:	return ";";
	case 60	:	if (this.peek() == 60) { this.skip(); return "<<"; }
				if (this.peek() == 61) { this.skip(); return "<="; }
				if (this.peek() == 47) { this.skip(); return "</"; }
				return "<";
	case 61 :	if (this.peek() == 61) { this.skip(); return "=="; }
				if (this.peek() == 126) { this.skip(); return "=~"; }
				return "=";
	case 62	:	if (this.peek() == 62) { this.skip(); return ">>"; }
				if (this.peek() == 61) { this.skip(); return ">="; }
				return ">";
	case 63	:	return "?";
	case 64	:	return "@";
	case 91	:	return "[";
	case 92	:	return "\"";	//TODO: Escape chars
	case 93	:	return "]";
	case 94	:	return "^";
	case 96	:	return "`";
	case 123:	return "{";
	case 124:	if (this.peek() == 124) { this.skip(); return "||"; }
				if (this.peek() == 61) { this.skip(); return "|="; }
				return "|";
	case 125:	if (this.peek() == 125 && this.peek2() == 36) {
					this.skip(); this.skip();
					return "}}$";
				}/* else if (this.peek() == 36) {
					this.skip();
					return "}$";
				}*/
				return "}";
	case 126:	if (this.peek() == 62) { this.skip(); return "~>"; }
				return "~";
	default: break; 
	};

	this.unget();

	if (this.parseAlphaNumeric(this.data)) {
		if (Language.keywords.hasOwnProperty(this.data.value)) return Language.keywords[this.data.value];
		if (Language.values.hasOwnProperty(this.data.value)) {
			this.data.value = Language.values[this.data.value];
			return "BOOLEAN";
		}
		return "OBSERVABLE";
	}

	// Ignore invalid tokens
	this.skip();
	//return this.readToken();
	//console.error("Invalid Token: " + ch);
	throw new Error("Invalid Token: " + ch);
	return "INVALID";
};



function edenTokenTest(code) {
	var stream = new EdenStream(code);
	var result = [];
	var data = {};

	while (stream.valid()) {
		result.push(stream.readToken(data));
	}

	return result;
};

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.EdenStream = EdenStream;
	exports.EdenSyntaxData = EdenSyntaxData;
}
