/**
 * A basic stream wrapper for a javascript string that allows for sequential
 * reading and backtracking of the string. It provides a readToken function
 * that extracts one complete Eden token from the string.
 * @param code Eden Script as a string
 */
function EdenStream(code) {
	this.code = code;
	this.position = 0;
	this.position_stack = [];
	this.prevposition = 0;
	this.line = 1;
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
	return this.code.charCodeAt(this.position++);
};

/**
 * Get the next character but don't move the stream on.
 */
EdenStream.prototype.peek = function() {
	return this.code.charCodeAt(this.position);
};

/**
 * Get the character after the next and don't move the stream.
 */
EdenStream.prototype.peek2 = function() {
	if (this.position + 1 >= this.code.length) return 0;
	return this.code.charCodeAt(this.position + 1);
};

/**
 * Explicitely set the stream position.
 * Used by error handlers to scan around where the error occurred.
 */
EdenStream.prototype.move = function(pos) {
	this.position = pos;
};

/**
 * Is the stream at the beginning or end of a line.
 */
EdenStream.prototype.isBEOL = function() {
	if (this.peek() == 10) return true;
	var pastpos = this.prevposition;
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
	return this.position == this.code.length;
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
	var ch;
	ch = this.peek();
	while (this.valid() && (ch == 9 || ch == 13 || ch == 10 || ch == 32)) {
		if (ch == 10) this.line++;
		this.skip();
		ch = this.peek();
	}
};



/**
 * Check if a character matches [a-zA-Z0-9_]
 */
EdenStream.prototype.isAlphaNumeric = function(ch) {
	return (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch == 95);
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
	this.skipWhiteSpace();

	if (this.isAlphaNumeric(this.peek()) == false) {
		return false;
	}

	while (this.valid() && this.isAlphaNumeric(this.peek())) {
		result = result + String.fromCharCode(this.get());
	}
	data.value = result;
	return true;
};



EdenStream.prototype.parseString = function(data) {
	var result = "";

	while (this.valid() && this.peek() != 34) {
		result = result + String.fromCharCode(this.get());
	}

	// Remove end quote
	if (this.valid()) {
		this.skip();
	}

	data.value = result;
};



EdenStream.prototype.parseNumber = function(data) {
	var result = "";

	while (this.valid() && this.isNumeric(this.peek())) {
		result = result + String.fromCharCode(this.get());
	}

	if (this.peek() == 46) {
		this.skip();
		result = result + ".";
		while (this.valid() && this.isNumeric(this.peek())) {
			result = result + String.fromCharCode(this.get());
		}
	}

	console.log(result);

	data.value = parseFloat(result);
};


EdenStream.prototype.parseKeyword = function(word) {
	this.skipWhiteSpace();
	this.pushPosition();
	for (var i = 0; i < word.length; i++) {
		if (this.get() != word.charCodeAt(i)) {
			this.popPosition();
			return false;
		}
	}
	if (this.isAlphaNumeric(this.peek())) {
		this.popPosition();
		return false;
	} else {
		this.discardPosition();
		return true;
	}
};


var edenKeywords = [
"func",
"proc",
"auto",
"para",
"local",
"if",
"is",
"else",
"true",
"false",
"eval",
"for",
"while",
"do",
"switch",
"case",
"break",
"continue",
"return",
"when",
"change",
"touch"
];


EdenStream.prototype.readToken = function(data) {
	this.skipWhiteSpace();

	if (this.eof()) return "EOF";

	this.prevposition = this.position;

	var ch = this.get();
	switch (ch) {
	case 33	:	if (this.peek() == 61) { this.skip(); return "!="; }
				if (this.peek() == 126) { this.skip(); return "!~"; }
				return "!";
	case 34	:	this.parseString(data); return "STRING";
	case 35	:	return "#";
	case 36	:	if (this.peek() == 123 && this.peek2() == 123) {
					this.skip(); this.skip();
					//parseJavascript(stream, data);
					return "JAVASCRIPT";
				}
				return "$";
	case 37	:	return "%";
	case 38	:	if (this.peek() == 38) { this.skip(); return "&&"; }
				if (this.peek() == 61) { this.skip(); return "&="; }
				return "&";
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
				return "-";
	case 46	:	if (this.peek() == 46) { this.skip(); return ".."; }
				return ".";
	case 47	:	if (this.peek() == 47) { this.skip(); return "//"; }
				if (this.peek() == 61) { this.skip(); return "/="; }
				if (this.peek() == 42) {
					this.skip();
					if (this.peek() == 42) return "/**";
					return "/*";
				}
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
	case 57 :	this.unget(); this.parseNumber(data); return "NUMBER";
	case 58	:	return ":";
	case 59	:	return ";";
	case 60	:	if (this.peek() == 60) { this.skip(); return "<<"; }
				if (this.peek() == 61) { this.skip(); return "<="; }
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
	case 125:	return "}";
	case 126:	return "~";
	default: break; 
	};

	this.unget();

	// Nothing matched so is alpha numeric...
	// Check for keywords
	for (var i = 0; i < edenKeywords.length; i++) {
		if (this.parseKeyword(edenKeywords[i])) {
			return edenKeywords[i];
		}
	}

	// Must be an identifier?
	if (this.parseAlphaNumeric(data)) return "OBSERVABLE";

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
