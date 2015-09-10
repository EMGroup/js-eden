/* Manual EDEN parser */


/**
 * A basic stream wrapper for a javascript string that allows for sequential
 * reading and backtracking of the string.
 */
function EdenStream(code) {
	this.code = code;
	this.position = 0;
	this.position_stack = [];
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




/* Error Handling Class */

function EdenError(ast, stream, msg, parent) {
	this.ast = ast;
	this.stream = stream;
	this.line = stream.line;
	this.msg = msg;
	this.parent = parent;
	this.position = stream.position;

	console.log("Error: " + msg);
};

EdenError.prototype.prettyPrint = function() {
	return "Error on line " + this.line + ": " + this.msg;
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



////////////////////////////////////////////////////////////////////////////////

function EdenAST_Literal(type, literal) {
	this.type = "literal";
	this.datatype = type;
	this.value = literal;
	this.errors = [];
}
EdenAST_Literal.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_UnaryOp(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
EdenAST_UnaryOp.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_BinaryOp(op, right) {
	this.type = "binaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
	this.l = undefined;
}
EdenAST_BinaryOp.prototype.left = fnEdenAST_left;
EdenAST_BinaryOp.prototype.error = fnEdenAST_error;

EdenAST_BinaryOp.prototype.generate = function() {
	var left = (this.l.type == "lvalue") ? this.l.generate() + ".value()" : this.l.generate();
	var right = (this.r.type == "lvalue") ? this.r.generate() + ".value()" : this.r.generate();
	return left + " " + this.op + " " + right;
}



//------------------------------------------------------------------------------

function EdenAST_Length() {
	this.type = "length";
	this.errors = [];
}



//------------------------------------------------------------------------------

function EdenAST_LValue(observable, lvaluep) {
	this.type = "lvalue";
	this.errors = [];
	this.observable = observable;
	this.lvaluep = lvaluep;

	for (var i = 0; i < lvaluep.length; i++) {
		this.errors.push.apply(this.errors, lvaluep[i].errors);
	}
};

EdenAST_LValue.prototype.error = fnEdenAST_error;

EdenAST_LValue.prototype.generate = function() {
	return "context.lookup(\"" + this.observable + "\")";
}

function EdenAST_LValueComponent(kind) {
	this.type = "lvaluecomponent";
	this.errors = [];
	this.kind = kind;
	this.indexexp = undefined;
	this.observable = undefined;
};

EdenAST_LValueComponent.prototype.index = function(pindex) {
	this.indexexp = pindex;
	this.errors.push.apply(this.errors, pindex.errors);
};

EdenAST_LValueComponent.prototype.property = function(pprop) {
	this.observable = pprop;
	this.errors.push.apply(this.errors, pprop.errors);
}

EdenAST_LValueComponent.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Definition(expression) {
	this.type = "definition";
	this.errors = expression.errors;
	this.expression = expression;
	this.lvalue = undefined;
};

EdenAST_Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Definition.prototype.generate = function() {
	var result = this.lvalue.generate() + ".define(function(context) { return ";
	result = result + this.expression.generate();
	result = result + "; }, this, []);"
	return result;
};



//------------------------------------------------------------------------------

function EdenAST_Assignment(expression) {
	this.type = "assignment";
	this.errors = expression.errors;
	this.expression = expression;
	this.lvalue = undefined;
};

EdenAST_Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Assignment.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Action(llist, statement) {
	this.type = "action";
	this.kindofaction = "touch";
	this.errors = llist.errors;
	this.llist = llist;
	this.statement = statement;

	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

EdenAST_Action.prototype.kind = function(k) {
	this.kindofaction = k;
};

EdenAST_Action.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_ConditionalAction(expr, statement) {
	this.type = "conditionalaction";
	this.errors = expr.errors;
	this.expression = expr;
	this.statement = statement;

	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

EdenAST_ConditionalAction.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_LList() {
	this.type = "lvaluelist";
	this.errors = [];
	this.llist = [];
};

EdenAST_LList.prototype.append = function(lvalue) {
	this.llist.push(lvalue);
	this.errors.push.apply(this.errors, lvalue.errors);
};

EdenAST_LList.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

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

EdenAST_Script.prototype.generate = function() {
	var result = "(function (root, eden, includePrefix, done) {(function(context, rt) {";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate();
	}
	result = result + "}).call(this, root, rt);})";
	return result;
}



////////////////////////////////////////////////////////////////////////////////

function EdenAST(code) {
	this.stream = new EdenStream(code);
	this.data = {};
	this.token = "invalid";

	// Get First Token;
	this.next();

	console.time("MakeEdenAST");
	this.script = this.pSCRIPT();
	console.timeEnd("MakeEdenAST");
}

EdenAST.prototype.prettyPrint = function() {
	var result = "";

	if (this.script.errors.length > 0) {
		for (var i = this.script.errors.length - 1; i >= 0; i--) {
			result = result + this.script.errors[i].prettyPrint() + "\n\n";
		}
	} else {
		result = JSON.stringify(this.script, function(key, value) {
			if (key == "errors") return undefined;
			return value;
		}, "    ");
	}

	return result;
};

EdenAST.prototype.next = function() {
	this.token = readToken(this.stream, this.data);

	//Skip normal block comments
	while (this.token == "/*") {
		while (this.token != "*/") {
			this.token = readToken(this.stream, this.data);
		}
		this.token = readToken(this.stream, this.data);
	}
};

EdenAST.prototype.makeBinaryOp = function(op) {
	var term = this.pTERM_P();
	var right = this.pEXPRESSION_PP();
	if (right) {
		right.left(term);
		return new EdenAST_BinaryOp(op, right);
	}
	return new EdenAST_BinaryOp(op, term);
}



////////////////////////////////////////////////////////////////////////////////

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
		return this.makeBinaryOp("&&");
	} else if (this.token == "||") {
		this.next();
		return this.makeBinaryOp("||");
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
		return this.makeBinaryOp("<");
	} else if (this.token == "<=") {
		this.next();
		return this.makeBinaryOp("<=");
	} else if (this.token == ">") {
		this.next();
		return this.makeBinaryOp(">");
	} else if (this.token == ">=") {
		this.next();
		return this.makeBinaryOp(">=");
	} else if (this.token == "==") {
		this.next();
		return this.makeBinaryOp("==");
	} else if (this.token == "!=") {
		this.next();
		return this.makeBinaryOp("!=");
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
	if (this.token == "+") {
		this.next();
		return this.makeBinaryOp("+");
	} else if (this.token == "-") {
		this.next();
		return this.makeBinaryOp("-");
	} else if (this.token == "//") {
		this.next();
		return this.makeBinaryOp("//");
	}
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
	if (this.token == "*") {
		this.next();
		return this.makeBinaryOp("*");
	} else if (this.token == "/") {
		this.next();
		return this.makeBinaryOp("/");
	} else if (this.token == "%") {
		this.next();
		return this.makeBinaryOp("%");
	} else if (this.token == "^") {
		this.next();
		return this.makeBinaryOp("^");
	}
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
	if (this.token == "#") {
		this.next();
		return new EdenAST_Length();
	}
	return undefined;
}



/*
 * F -> ( EXPRESSION ) | - number | number | string | & LVALUE | ! LVALUE | LVALUE
 */
EdenAST.prototype.pFACTOR = function() {
	if (this.token == "(") {
		this.next();
		var expression = this.pEXPRESSION();
		if (this.token != ")") {
			expression.error(new EdenError(expression, this.stream, "Missing a closing ')' bracket"));
		} else {
			this.next();
		}
		return expression;
	} else if (this.token == "NUMBER") {
		this.next();
		return new EdenAST_Literal("NUMBER", this.data.value);
	} else if (this.token == "STRING") {
		this.next();
		return new EdenAST_Literal("STRING", this.data.value);
	} else if (this.token == "!") {
		this.next;
		var lvalue = this.pLVALUE();
		return new EdenAST_UnaryOp("!", lvalue);
	} else {
		var lvalue = this.pLVALUE();
		if (lvalue && lvalue.errors.length == 0) {
			return lvalue;
		}
	}

	var dummy = new EdenAST_Literal("NUMBER", 0);
	dummy.error(new EdenError(dummy, this.stream, "Expected a number, string, observable or ( ... )"));
	return dummy;
}



/*
 * E'''''' -> ? EXPRESSION : EXPRESSION | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPPPP = function() {
	if (this.token == "?") {
		var exp1 = this.pEXPRESSION();
		if (this.token != ":") {

		} else {
			this.next();
		}
		var exp2 = this.pEXPRESSION();

		//return new EdenAST_TernaryOp("?");
	}
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


/**
 * ACTION Production
 * ACTION -> OBSERVABLE { LOCALS SCRIPT }
 */
EdenAST.prototype.pACTION = function() {
	return undefined;
}


/**
 * WHEN Production
 * WHEN -> change WHEN' | touch WHEN' | ( EXPRESSION ) STATEMENT
 */
EdenAST.prototype.pWHEN = function() {
	if (this.token == "touch") {
		this.next();
		var when = this.pWHEN_P();
		when.kind("touch");
		return when;
	}
	if (this.token == "(") {
		this.next();
		var express = this.pEXPRESSION();

		if (this.token != ")") {
			express.error(new EdenError(express, this.stream, "Missing a ')' after a 'when' conditional"));
		} else {
			this.next();
		}

		var statement = this.pSTATEMENT();
		var when = new EdenAST_ConditionalAction(express, statement);

		if (express.errors.length > 0) {
			when.error(new EdenError(when, this.stream, "A 'when' needs to be 'when change', 'when touch' or just 'when' but with a boolean expression"));
		}

		if (statement === undefined) {
			when.error(new EdenError(when, this.stream, "A 'when' needs to be followed by one or more statements"));
		}

		return when;
	}
}


/**
 * WHEN Prime Production
 * WHEN' -> LLIST STATEMENT
 */
EdenAST.prototype.pWHEN_P = function() {
	var llist = this.pLLIST();
	var statement = this.pSTATEMENT();
	var when = new EdenAST_Action(llist, statement);

	if (llist.errors.length > 0) {
		when.error(new EdenError(when, this.stream, "A 'when touch' or 'when change' needs a list of observables to watch"));
	}
	if (statement === undefined) {
		when.error(new EdenError(when, this.stream, "A 'when' needs to be followed by one or more statements"));
	}
	return when;
}


/**
 * LLIST Production
 * LLIST -> LVALUE LLIST'
 */
EdenAST.prototype.pLLIST = function() {
	var lvalue = this.pLVALUE();
	var llist = this.pLLIST_P();
	if (llist === undefined) {
		llist = new EdenAST_LList();
	}

	llist.append(lvalue);
	return llist;
}


/**
 * LLIST Prime Production
 * LLIST' -> , LVALUE LLIST' | epsilon
 */
EdenAST.prototype.pLLIST_P = function() {
	if (this.token == ",") {
		this.next();
		var lvalue = this.pLVALUE();
		var llist = this.pLLIST_P();
		if (llist === undefined) {
			llist = new EdenAST_LList();
		}
		llist.append(lvalue);
		return llist;
	}
	return undefined;
}


EdenAST.prototype.pIF = function() {
	return undefined;
}


EdenAST.prototype.pFOR = function() {
	return undefined;
}


EdenAST.prototype.pWHILE = function() {
	return undefined;
}


EdenAST.prototype.pSWITCH = function() {
	return undefined;
}


EdenAST.prototype.pFUNCTION = function() {
	return undefined;
}


/**
 * LVALUE Prime Production
 * LVALUE' -> [ EXPRESSION ] LVALUE' | . observable LVALUE' | epsilon
 */
EdenAST.prototype.pLVALUE_P = function() {
	var components = [];

	while (true) {
		if (this.token == "[") {
			this.next();

			var comp = new EdenAST_LValueComponent("index");
			var expression = this.pEXPRESSION();
			comp.index(expression);
			components.push(comp);

			if (this.token != "]") {
				comp.error(new EdenError(comp, this.stream, "Missing closing ']' of list index"));
				return components;
			}
			this.next();
		} else {
			break;
		}
	}
	return components;
};



/**
 * LVALUE Production
 * LVALUE -> observable LVALUE'
 */
EdenAST.prototype.pLVALUE = function() {
	if (this.token != "OBSERVABLE") {
		var ast = new EdenAST_LValue("NONAME", []);
		ast.error(new EdenError(ast, this.stream, "Expected an observable name"));
		return ast;
	}

	this.next();
	return new EdenAST_LValue(this.data.value, this.pLVALUE_P());
};



/**
 * STATEMENT PrimePrime Production
 * STATEMENT''	->
 *	is EXPRESSION |
 *	= EXPRESSION |
 *	+= EXPRESSION |
 *	-= EXPRESSION |
 *	/= EXPRESSION |
 *	*= EXPRESSION |
 *	++ |
 *	--
 */
EdenAST.prototype.pSTATEMENT_PP = function() {
	if (this.token == "is") {
		this.next();
		return new EdenAST_Definition(this.pEXPRESSION());
	} else if (this.token == "=") {
		this.next();
		return new EdenAST_Assignment(this.pEXPRESSION());
	} else if (this.token == "+=") {
		this.next();
		return new EdenAST_Modify("+=", this.pEXPRESSION());
	} else if (this.token == "-=") {
		this.next();
		return new EdenAST_Modify("-=", this.pEXPRESSION());
	} else if (this.token == "/=") {
		this.next();
		return new EdenAST_Modify("/=", this.pEXPRESSION());
	} else if (this.token == "*=") {
		this.next();
		return new EdenAST_Modify("*=", this.pEXPRESSION());
	}

	//TODO: Remove known invalid tokens
	var errast = new EdenAST_Assignment(this.pEXPRESSION());
	errast.error(new EdenError(errast, this.stream, "Expecting an 'is' definition or some kind of assignment."));
	return errast;
};



/**
 * STATEMENT Prime Production
 * STATEMENT' -> LVALUE STATEMENT'' | epsilon
 */
EdenAST.prototype.pSTATEMENT_P = function() {
	var lvalue = this.pLVALUE();
	if (lvalue.errors.length == 0) {
		var formula = this.pSTATEMENT_PP();
		formula.left(lvalue);
		return formula;
	}
	return undefined;
};



/**
 * STATEMENT Production
 * STATEMENT	->
 *	{ SCRIPT } |
 *	proc ACTION |
 *	func FUNCTION |
 *	STATEMENT' |
 *	for FOR |
 *	while WHILE |
 *	switch SWITCH |
 *	if IF |
 *	return EOPT |
 *	continue |
 *	break
 */
EdenAST.prototype.pSTATEMENT = function() {
	if (this.token == "proc") {
		this.next();
		return this.pACTION();
	} else if (this.token == "func") {
		this.next();
		return this.pFUNCTION();
	} else if (this.token == "when") {
		this.next();
		return this.pWHEN();
	} else if (this.token == "for") {
		this.next();
		return this.pFOR();
	} else if (this.token == "while") {
		this.next();
		return this.pWHILE();
	} else if (this.token == "switch") {
		this.next();
		return this.pSWITCH();
	} else if (this.token == "if") {
		this.next();
		return this.pIF();
	} else if (this.token == "return") {
		this.next();
		return new EdenAST_Return(this.pEOPT());
	} else if (this.token == "continue") {
		this.next();
		return new EdenAST_Continue();
	} else if (this.token == "break") {
		this.next();
		return new EdenAST_Break();
	} else if (this.token == "{") {
		this.next();
		var script = this.pSCRIPT();
		if (this.token != "}") {
			script.error(new EdenError(script, this.stream, "Missing a closing '}'"));
			return script;
		}
		this.next();
		return script;
	}
	return this.pSTATEMENT_P();
};


/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT ; SCRIPT | epsilon
 */
EdenAST.prototype.pSCRIPT = function() {
	var ast = new EdenAST_Script();

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {
			ast.append(statement);
		} else {
			break;
		} 
		
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


////////////////////////////////////////////////////////////////////////////////
//    TESTS
////////////////////////////////////////////////////////////////////////////////

function eden_parse_tests() {
	var myast;
	myast = new EdenAST("when touch a, b, c { d = a * b * c; };");
	console.log(myast);
	myast = new EdenAST("d is a * b + c / (x * 55);");
	console.log(myast);
	myast = new EdenAST("d is a * b; f = g * h; j is i;");
	console.log(myast);
	myast = new EdenAST("d[1] = 5;");
	console.log(myast);
	myast = new EdenAST("/* some comment */   a = 6;");
	console.log(myast);
}


