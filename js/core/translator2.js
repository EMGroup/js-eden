/* Manual EDEN parser */


/**
 * A basic stream wrapper for a javascript string that allows for sequential
 * reading and backtracking of the string.
 */
function EdenStream(code) {
	this.code = code;
	this.position = 0;
	this.position_stack = [];
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
	while (stream.valid() && (ch == 9 || ch == 13 || ch == 32)) {
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
"return"
];


function readToken(stream, data) {
	skipWhiteSpace(stream);

	// Remove line and block comments and whitespace.

	if (stream.eof()) return "EOF";

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




/* Error Handling Class */

function EdenError(ast, stream, msg, parent) {
	this.ast = ast;
	this.stream = stream;
	this.msg = msg;
	this.parent = parent;
	this.position = stream.position;

	console.log("Error: " + msg);
};






/* AST Structures */


function fnEdenAST_error(err) {
	this.errors.push(err);
};

function fnEdenAST_left(left) {
	this.l = left;
	if (left.errors.length > 0) {
		this.errors.push.apply(this.errors, left.errors);
	}
};

function EdenAST_Number(number) {
	this.type = "number";
	this.number = number;
	this.errors = [];
}

function EdenAST_BinaryOp(op, right) {
	this.type = "binaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
	this.l = undefined;
}
EdenAST_BinaryOp.prototype.left = fnEdenAST_left;


function EdenAST_LValue(observable, lvaluep) {
	this.type = "lvalue";
	this.errors = [];
	this.observable = observable;
	this.lvaluep = lvaluep;

	if (lvaluep) {
		this.errors = lvaluep.errors;
	}
};

EdenAST_LValue.prototype.error = fnEdenAST_error;


function EdenAST_Definition(expression) {
	this.type = "definition";
	this.errors = expression.errors;
	this.expression = expression;
};

function EdenAST_Assignment(expression) {
	this.type = "assignment";
	this.errors = expression.errors;
	this.expression = expression;
};


function EdenAST_Formula(lvalue, formula) {
	this.type = "formula";
	this.errors = lvalue.errors;
	this.lvalue = lvalue;
	this.formula = formula;

	if (formula && formula.errors.length > 0) {
		this.errors.push.apply(this.errors, formula.errors);
	}
};

//EdenAST_Formula.prototype.error = fnEdenAST_error;

function EdenAST_Script() {
	this.type = "script";
	this.errors = [];
	this.statements = [];
};

EdenAST_Script.prototype.error = fnEdenAST_error;

EdenAST_Script.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}





function EdenAST(code) {
	this.stream = new EdenStream(code);
	this.data = {};
	this.token = "invalid";
	this.script = this.pSCRIPT();
}

EdenAST.prototype.next = function() {
	this.token = readToken(this.stream, this.data);
};


/**
 * T -> T' E''
 */
EdenAST.prototype.pTERM = function() {
	var left = this.pTERM_P();
	var right = this.pEXPRESSION_PP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


/*
 * E'-> && T E' | || T E' | epsilon
 */
EdenAST.prototype.pEXPRESSION_P = function() {
	if (this.token == "&&") {
		this.next();
		var term = this.pTERM();
		var right = this.pEXPRESSION_P();
		if (right) {
			right.left(term);
			return new EdenAST_BinaryOp("&&", right);
		}
		return new EdenAST_BinaryOp("&&", term);
	} else if (this.token == "||") {
		this.next();
		var term = this.pTERM();
		var right = this.pEXPRESSION_P();
		if (right) {
			right.left(term);
			return new EdenAST_BinaryOp("||", right);
		}
		return new EdenAST_BinaryOp("||", term);
	}
	return undefined;
}


/*
 * T' -> T'' E'''
 */
EdenAST.prototype.pTERM_P = function() {
	var left = this.pTERM_PP();
	var right = this.pEXPRESSION_PPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


/*
 * E'' -> < T' E'' | <= T' E'' | > T' E'' | >= T' E'' | == T' E'' | != T' E'' | epsilon
 */
EdenAST.prototype.pEXPRESSION_PP = function() {
	if (this.token == "<") {
		this.next();
		var term = this.pTERM_P();
		var right = this.pEXPRESSION_PP();
		if (right) {
			right.left(term);
			return new EdenAST_BinaryOp("<", right);
		}
		return new EdenAST_BinaryOp("<", term);
	}
	return undefined;
}


/*
 * T'' -> T''' E''''
 */
EdenAST.prototype.pTERM_PP = function() {
	var left = this.pTERM_PPP();
	var right = this.pEXPRESSION_PPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


/*
 * E''' -> + T'' E''' | - T'' E''' | // T'' E''' | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPP = function() {
	return undefined;
}


/*
 * T''' -> T'''' E'''''	
 */
EdenAST.prototype.pTERM_PPP = function() {
	var left = this.pTERM_PPPP();
	var right = this.pEXPRESSION_PPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


/*
 * E'''' -> * T''' E'''' | / T''' E'''' | % T''' E'''' | ^ T''' E'''' | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPP = function() {
	return undefined;
}


/*
 * T'''' -> F E''''''
 */
EdenAST.prototype.pTERM_PPPP = function() {
	var left = this.pFACTOR();
	var right = this.pEXPRESSION_PPPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


/*
 * E''''' -> # | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPPP = function() {
	return undefined;
}


/*
 * F -> ( EXPRESSION ) | - number | number | string | & LVALUE | ! LVALUE | LVALUE
 */
EdenAST.prototype.pFACTOR = function() {
	if (this.token == "NUMBER") {
		this.next();
		return new EdenAST_Number(this.data.value);
	}
}


/*
 * E'''''' -> ? EXPRESSION : EXPRESSION | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPPPP = function() {
	return undefined;
}



/**
 * EXPRESSION Production
 * EXPRESSION -> T E'
 */
EdenAST.prototype.pEXPRESSION = function() {
	var left = this.pTERM();
	var right = this.pEXPRESSION_P();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}


EdenAST.prototype.pPROCEDURE = function() {
	return undefined;
}


EdenAST.prototype.pFUNCTION = function() {
	return undefined;
}


EdenAST.prototype.pLVALUE_P = function() {
	return undefined;
};



/**
 * LVALUE Production
 * LVALUE -> observable LVALUE'
 */
EdenAST.prototype.pLVALUE = function() {
	if (this.token != "OBSERVABLE") {
		var ast = new EdenAST_LValue("NONAME", undefined);
		ast.error(new EdenError(ast, this.stream, "Expected an observable name"));
		return ast;
	}

	this.next();
	return new EdenAST_LValue(this.data.value, this.pLVALUE_P());
};



/**
 * FORMULA Prime Production
 * FORMULA' -> is EXPRESSION | = EXPRESSION | epsilon
 */
EdenAST.prototype.pFORMULA_P = function() {
	if (this.token == "is") {
		this.next();
		return new EdenAST_Definition(this.pEXPRESSION());
	} else if (this.token == "=") {
		this.next();
		return new EdenAST_Assignment(this.pEXPRESSION());
	}
	return undefined;
};



/**
 * FORMULA Production
 * FORMULA -> LVALUE FORMULA'	
 */
EdenAST.prototype.pFORMULA = function() {
	return new EdenAST_Formula(this.pLVALUE(), this.pFORMULA_P());
};



/**
 * STATEMENT Production
 * STATEMENT -> proc PROCEDURE | func FUNCTION | FORMULA
 */
EdenAST.prototype.pSTATEMENT = function() {
	if (this.token == "proc") {
		this.next();
		return this.pPROCEDURE();
	} else if (this.token == "func") {
		this.next();
		return this.pFUNCTION();
	}
	return this.pFORMULA();
};


/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT ; SCRIPT | epsilon
 */
EdenAST.prototype.pSCRIPT = function() {
	var ast = new EdenAST_Script();

	// Get First Token;
	this.next();

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();
		ast.append(statement);
		
		//this.next();

		if (this.token != ";") {
			ast.error(new EdenError(ast, this.stream, "Missing ';'"));
			
			// Attempt to carry on with next statement
			while (this.token != "EOF" && this.token != ";") {
				this.next();
			}
		}

		this.next();
	}

	return ast;
};


