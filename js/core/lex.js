/**
 * A basic stream wrapper for a javascript string that allows for sequential
 * reading and backtracking of the string.
 */
function EdenStream(code) {
	this.code = code;
	this.position = 0;
	this.position_stack = [];
	this.prevposition = 0;
	this.line = 1;
};

EdenStream.prototype.pushPosition = function() {
	this.position_stack.push(this.position);
};

EdenStream.prototype.popPosition = function() {
	this.position = this.position_stack.pop();
};

EdenStream.prototype.discardPosition = function() {
	this.position_stack.pop();
};

EdenStream.prototype.get = function() {
	return this.code.charCodeAt(this.position++);
};

EdenStream.prototype.peek = function() {
	return this.code.charCodeAt(this.position);
};

EdenStream.prototype.peek2 = function() {
	if (this.position + 1 >= this.code.length) return 0;
	return this.code.charCodeAt(this.position + 1);
};

EdenStream.prototype.skip = function() {
	this.position++;
};

EdenStream.prototype.eof = function() {
	return this.position == this.code.length;
};

EdenStream.prototype.valid = function() {
	return this.position < this.code.length;
};

EdenStream.prototype.unget = function() {
	this.position--;
};



/* Lexer Primatives */

function skipWhiteSpace(stream) {
	var ch;
	ch = stream.peek();
	while (stream.valid() && (ch == 9 || ch == 13 || ch == 10 || ch == 32)) {
		if (ch == 10) stream.line++;
		stream.skip();
		ch = stream.peek();
	}
};


function isAlphaNumeric(ch) {
	return (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch == 95);
};


function isNumeric(ch) {
	return (ch >= 48 && ch <= 57);
};


function tokenType(token) {
	if (token == "OBSERVABLE") {
		return "identifier";
	}
	if (isAlphaNumeric(token.charCodeAt(0))) {
		return "keyword";
	}
	if (token == "(" || token == ")" || token == "[" || token == "]" || token == "{" || token == "}") {
		return "bracket";
	}
	return "operator";
};


function parseAlphaNumeric(stream, data) {
	var result = "";
	skipWhiteSpace(stream);

	if (isAlphaNumeric(stream.peek()) == false) {
		return false;
	}

	while (stream.valid() && isAlphaNumeric(stream.peek())) {
		result = result + String.fromCharCode(stream.get());
	}
	data.value = result;
	return true;
};



function parseString(stream, data) {
	var result = "";

	while (stream.valid() && stream.peek() != 34) {
		result = result + String.fromCharCode(stream.get());
	}

	data = result;
};



function parseNumber(stream, data) {
	var result = "";

	while (stream.valid() && isNumeric(stream.peek())) {
		result = result + String.fromCharCode(stream.get());
	}

	data.value = parseFloat(result);
};


function parseKeyword(stream, word) {
	skipWhiteSpace(stream);
	stream.pushPosition();
	for (var i = 0; i < word.length; i++) {
		if (stream.get() != word.charCodeAt(i)) {
			stream.popPosition();
			return false;
		}
	}
	if (isAlphaNumeric(stream.peek())) {
		stream.popPosition();
		return false;
	} else {
		stream.discardPosition();
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


function readToken(stream, data) {
	skipWhiteSpace(stream);

	if (stream.eof()) return "EOF";

	stream.prevposition = stream.position;

	var ch = stream.get();
	switch (ch) {
	case 33	:	if (stream.peek() == 61) { stream.skip(); return "!="; }
				if (stream.peek() == 126) { stream.skip(); return "!~"; }
				return "!";
	case 34	:	parseString(stream, data); return "STRING";
	case 35	:	return "#";
	case 36	:	if (stream.peek() == 123 && stream.peek2() == 123) {
					stream.skip(); stream.skip();
					//parseJavascript(stream, data);
					return "JAVASCRIPT";
				}
				return "$";
	case 37	:	return "%";
	case 38	:	if (stream.peek() == 38) { stream.skip(); return "&&"; }
				if (stream.peek() == 61) { stream.skip(); return "&="; }
				return "&";
	case 40	:	return "(";
	case 41	:	return ")";
	case 42	:	if (stream.peek() == 61) { stream.skip(); return "*="; }
				if (stream.peek() == 47) { stream.skip(); return "*/"; }
				return "*";
	case 43	:	if (stream.peek() == 43) { stream.skip(); return "++"; }
				if (stream.peek() == 61) { stream.skip(); return "+="; }
				return "+";
	case 44 :	return ",";
	case 45	:	if (stream.peek() == 45) { stream.skip(); return "--"; }
				if (stream.peek() == 61) { stream.skip(); return "-="; }
				return "-";
	case 46	:	if (stream.peek() == 46) { stream.skip(); return ".."; }
				return ".";
	case 47	:	if (stream.peek() == 47) { stream.skip(); return "//"; }
				if (stream.peek() == 61) { stream.skip(); return "/="; }
				if (stream.peek() == 42) {
					stream.skip();
					if (stream.peek() == 42) return "/**";
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
	case 57 :	stream.unget(); parseNumber(stream, data); return "NUMBER";
	case 58	:	return ":";
	case 59	:	return ";";
	case 60	:	if (stream.peek() == 60) { stream.skip(); return "<<"; }
				if (stream.peek() == 61) { stream.skip(); return "<="; }
				return "<";
	case 61 :	if (stream.peek() == 61) { stream.skip(); return "=="; }
				if (stream.peek() == 126) { stream.skip(); return "=~"; }
				return "=";
	case 62	:	if (stream.peek() == 62) { stream.skip(); return ">>"; }
				if (stream.peek() == 61) { stream.skip(); return ">="; }
				return ">";
	case 63	:	return "?";
	case 64	:	return "@";
	case 91	:	return "[";
	case 92	:	return "\"";	//TODO: Escape chars
	case 93	:	return "]";
	case 94	:	return "^";
	case 96	:	return "`";
	case 123:	return "{";
	case 124:	if (stream.peek() == 124) { stream.skip(); return "||"; }
				if (stream.peek() == 61) { stream.skip(); return "|="; }
				return "|";
	case 125:	return "}";
	case 126:	return "~";
	default: break; 
	};

	stream.unget();

	// Nothing matched so is alpha numeric...
	// Check for keywords
	for (var i = 0; i < edenKeywords.length; i++) {
		if (parseKeyword(stream, edenKeywords[i])) {
			return edenKeywords[i];
		}
	}

	// Must be an identifier
	if (parseAlphaNumeric(stream, data)) return "OBSERVABLE";

	return "INVALID";
};


function edenTokenTest(code) {
	var stream = new EdenStream(code);
	var result = [];
	var data = {};

	while (stream.valid()) {
		result.push(readToken(stream, data));
	}

	return result;
};
