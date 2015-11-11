/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */


/**
 * Abstract Syntax Tree generator for JS-Eden code.
 * Each production in the grammar has a function in this class. It makes use
 * of the EdenStream class to tokenise the script, and the Eden.SyntaxError class to
 * report the errors found. To use, pass the script to the constructor.
 * @param code String containing the script.
 */
function EdenAST(code) {
	this.stream = new EdenStream(code);
	this.data = new EdenSyntaxData();
	this.token = "INVALID";
	this.previous = "INVALID";
	this.src = "input";
	this.lines = [];
	this.parent = undefined;
	this.scripts = {};			// Actions table
	this.triggers = {};			// Guarded actions
	this.definitions = {};		// Definitions mapping

	this.stream.data = this.data;

	// Get First Token;
	this.next();

	// Start parse with SCRIPT production
	//console.time("MakeEdenAST");
	this.script = this.pSCRIPT();
	//console.timeEnd("MakeEdenAST");
}


EdenAST.prototype.generate = function() {
	return this.script.generate();
}

EdenAST.prototype.execute = function(root) {
	//var gen = this.script.generate();
	//console.log("Execute: " + gen);
	//eval(gen)(root);

	//console.time("EdenASTToJS");
	this.script.execute(root, undefined, this);
	//console.timeEnd("EdenASTToJS");
}


EdenAST.prototype.getSource = function(ast) {
	return this.stream.code.slice(ast.start,ast.end).trim();
}


EdenAST.prototype.getRoot = function() {
	return this.script;
}



EdenAST.prototype.getErrors = function() {
	return this.script.errors;
}



EdenAST.prototype.hasErrors = function() {
	return this.script.errors.length > 0;
}


/**
 * Dump the AST as stringified JSON, or pretty print any error messages.
 * @return String of AST or errors.
 */
EdenAST.prototype.prettyPrint = function() {
	var result = "";

	if (this.script.errors.length > 0) {
		for (var i = 0; i < this.script.errors.length; i++) {
			result = result + this.script.errors[i].prettyPrint() + "\n\n";
		}
	} else {
		result = JSON.stringify(this.script, function(key, value) {
			if (key == "errors") return undefined;
			if (key == "parent") {
				if (value) return true;
				else return undefined;
			} 
			return value;
		}, "    ");
	}

	return result;
};


/**
 * Move to next token.
 */
EdenAST.prototype.next = function() {
	this.previous = this.token;
	this.token = this.stream.readToken();

	//Cache prev line so it isn't affected by comments
	var prevline = this.stream.prevline;

	//Skip comments
	while (true) {
		// Skip block comments
		if (this.token == "/*") {
			var count = 1;
			while (this.stream.valid() && (this.token != "*/" || count > 0)) {
				this.token = this.stream.readToken();
				if (this.token == "/*") {
					count++;
				} else if (this.token == "*/") {
					count--;
				}
			}
			this.token = this.stream.readToken();
		// Skip line comments
		} else if (this.token == "##") {
			this.stream.skipLine();
			this.token = this.stream.readToken();
		} else {
			break;
		}
	}

	this.stream.prevline = prevline;
};



EdenAST.prototype.peekNext = function(count) {
	var res;
	var localdata = {value: ""};
	this.stream.data = localdata;
	this.stream.pushPosition();
	while (count > 0) {
		res = this.stream.readToken();
		count--;
	}
	this.stream.popPosition();
	this.stream.data = this.data;
	return res;
};


////////////////////////////////////////////////////////////////////////////////
//    Grammar Productions                                                     //
////////////////////////////////////////////////////////////////////////////////

/**
 * T -> T' { < T' | <= T' | > T' | >= T' | == T' | != T' }
 */
EdenAST.prototype.pTERM = function() {
	var left = this.pTERM_P();

	while (this.token == "<" || this.token == "<=" || this.token == ">"
			|| this.token == ">=" || this.token == "==" || this.token == "!=") {
		var binop = new EdenAST_BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_P());
		left = binop;
	}

	return left;
}



/*
 * T' -> T'' { + T'' | - T'' | // T''}
 */
EdenAST.prototype.pTERM_P = function() {
	var left = this.pTERM_PP();

	while (this.token == "+" || this.token == "-" || this.token == "//") {
		var binop = new EdenAST_BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PP());
		left = binop;
	}

	return left;
}



/*
 * T'' -> T''' { * T''' | / T''' | % T''' | ^ T'''}
 */
EdenAST.prototype.pTERM_PP = function() {
	var left = this.pTERM_PPP();

	while (this.token == "*" || this.token == "/" || this.token == "%"
			|| this.token == "^") {
		var binop = new EdenAST_BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PPP());
		left = binop;
	}

	return left;
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
 * F ->
 *	( EXPRESSION ) |
 *	- number |
 *	number |
 *	string |
 *  boolean |
 *  character
 *  JAVASCRIPT |
 *	$ NUMBER |
 *	[ ELIST ] |
 *	& LVALUE |
 *	! PRIMARY |
 *	PRIMARY	
 */
EdenAST.prototype.pFACTOR = function() {
	if (this.token == "(") {
		this.next();
		var expression = this.pEXPRESSION();
		if (this.token != ")") {
			expression.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
		} else {
			this.next();
		}
		return expression;
	} else if (this.token == "$") {
		this.next();
		// TODO $ parameters
		console.error("$ parameters deprecated");
		return new EdenAST_Literal("ERROR", undefined);
	} else if (this.token == "[") {
		this.next();

		var elist = [];
		if (this.token != "]") {
			elist = this.pELIST();
		}

		var literal = new EdenAST_Literal("LIST", elist);
		for (var i = 0; i < elist.length; i++) {
			if (elist[i].errors.length > 0) {
				literal.errors.push.apply(literal.errors, elist[i].errors);
			}
		}

		if (literal.errors.length > 0) return literal;

		if (this.token != "]") {
			literal.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTLITCLOSE));
		} else {
			this.next();
		}
		return literal;
	} else if (this.token == "@") {
		this.next();
		return new EdenAST_Literal("UNDEFINED", "@");
	} else if (this.token == "JAVASCRIPT") {
		var lit = new EdenAST_Literal("JAVASCRIPT", this.data.value);
		this.next();
		return lit;
	} else if (this.token == "NUMBER") {
		var lit = new EdenAST_Literal("NUMBER", this.data.value);
		this.next();
		return lit
	} else if (this.token == "-") {
		this.next();
		var negop = new EdenAST_UnaryOp("-", this.pFACTOR());
		return negop;
		/*if (this.token == "NUMBER") {
			var lit = new EdenAST_Literal("NUMBER", 0.0 - this.data.value);
			this.next();
			return lit;
		} else {
			var res = new EdenAST_Literal("UNDEFINED","@");
			res.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.NEGNUMBER));
			return res;
		}*/
	} else if (this.token == "STRING") {
		var lit = new EdenAST_Literal("STRING", this.data.value);
		this.next();
		return lit
	} else if (this.token == "BOOLEAN") {
		var lit = new EdenAST_Literal("BOOLEAN", this.data.value);
		this.next();
		return lit;
	} else if (this.token == "CHARACTER") {
		var lit = new EdenAST_Literal("CHARACTER", this.data.value);
		this.next();
		return lit;
	} else if (this.token == "!") {
		this.next();
		var primary = this.pFACTOR();
		return new EdenAST_UnaryOp("!", primary);
	} else if (this.token == "&") {
		this.next();
		var lvalue = this.pLVALUE();
		return new EdenAST_UnaryOp("&", lvalue);
	} else if (this.token == "*") {
		this.next();
		var lvalue = this.pPRIMARY();
		return new EdenAST_UnaryOp("*", lvalue);
	} else {
		var primary = this.pPRIMARY();
		return primary;
	}
}



/**
 * PRIMARY Production
 * PRIMARY -> observable PRIMARY' | ` EXPRESSION ` PRIMARY'
 */
EdenAST.prototype.pPRIMARY = function() {
	if (this.token == "`") {
		this.next();
		var btick = this.pEXPRESSION();
		
		if (this.token != "`") {
			var primary = new EdenAST_Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return primary;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_P();
		primary.setBackticks(btick);
		primary.setObservable("__BACKTICKS__");
		return primary;
	} else if (this.token == "OBSERVABLE") {
		var observable = this.data.value;
		this.next();
		var primary = this.pPRIMARY_P();
		if (primary.errors.length > 0) return primary;
		primary.setObservable(observable);
		return primary;
	} else {
		var primary = new EdenAST_Primary();
		primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADFACTOR));
		return primary;
	}
}



/**
 * PRIMARY Prime Production
 * PRIMARY' ->
 *	( ELIST ) PRIMARY''
 *	| . PRIMARY
 *	| [ EXPRESSION ] PRIMARY'''
 *	| PRIMARY''''
 */
EdenAST.prototype.pPRIMARY_P = function() {
	if (this.token == "[") {
		this.next();
		var index = new EdenAST_Index();
		var express = this.pEXPRESSION();

		if (this.token != "]") {

		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PPP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new EdenAST_FunctionCall();	

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				if (func.errors.length > 0) return func;
				func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return func;
			} else {
				this.next();
			}

			var primary = this.pPRIMARY_PP();
			if (primary.errors.length > 0) return primary;
			primary.prepend(func);
			return primary;
		}
	} else if (this.token == ".") {
		this.next();
		var rhs = this.pPRIMARY();
		var scopepath = new EdenAST_ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;
	} else {
		return this.pPRIMARY_PPPP();
	}

	/*var result = [];
	while (true) {
		if (this.token == "(") {
			var func = new EdenAST_FunctionCall();
			this.next();

			result.push(func);

			if (this.token == ")") {
				this.next();
				continue;
			}

			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				if (func.errors.length > 0) return result;
				func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return result;
			} else {
				this.next();
			}
		} else if (this.token == "[") {
			this.next();
			var comp = new EdenAST_LValueComponent("index");
			comp.index(this.pEXPRESSION());

			if (comp.indexexp.type == "literal" &&
					comp.indexexp.datatype == "NUMBER" &&
					comp.indexexp.value < 1) {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
			}

			result.push(comp);

			if (comp.errors.length > 0) return result;

			if (this.token != "]") {
				comp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return result;
			} else {
				this.next();
			}
		} else if (this.token == ".") {
			this.next();
			var comp = new EdenAST_LValueComponent("property");

			if (this.token != "OBSERVABLE") {
				comp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PROPERTYNAME));
			} else {
				comp.property(this.data.value);
				this.next();
			}

			result.push(comp);

			if (comp.errors.length > 0) return result;
		} else if (this.token == "with") {
			this.next();
			var scope = this.pSCOPE();
			result.push(scope);
			if (scope.errors.length > 0) return result;
		} else {
			return result;
		}
	}*/
}


/**
 * Primary Prime Prime Production.
 * PRIMARY'' ->
 *	( ELIST ) PRIMARY''
 *	| [ EXPRESSION ] PRIMARY''
 *	| PRIMARY''''
 */
EdenAST.prototype.pPRIMARY_PP = function() {
	if (this.token == "[") {
		this.next();
		var index = new EdenAST_Index();
		var express = this.pEXPRESSION();

		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			return index;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new EdenAST_FunctionCall();

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				if (func.errors.length > 0) return func;
				func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return func;
			} else {
				this.next();
			}

			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		}
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Triple Prime.
 * PRIMARY''' ->
 *	. PRIMARY
 *	| ( ELIST ) PRIMARY''
 *	| [ EXPRESSION ] PRIMARY''
 *	| PRIMARY''''
 */
EdenAST.prototype.pPRIMARY_PPP = function() {
	if (this.token == "[") {
		this.next();
		var index = new EdenAST_Index();
		var express = this.pEXPRESSION();

		if (this.token != "]") {

		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new EdenAST_FunctionCall();		

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				if (func.errors.length > 0) return func;
				func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return func;
			} else {
				this.next();
			}

			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		}
	} else if (this.token == ".") {
		this.next();
		var rhs = this.pPRIMARY();
		var scopepath = new EdenAST_ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Quad Prime Production.
 * PRIMARY'''' -> with SCOPE | epsilon
 */
EdenAST.prototype.pPRIMARY_PPPP = function() {
	if (this.token == "with") {
		this.next();
		return this.pSCOPE();
	} else {
		return new EdenAST_Primary();
	}
}



/**
 * SCOPE Production
 * SCOPE -> ( SCOPE' ) | SCOPE'
 */
EdenAST.prototype.pSCOPE = function() {
	if (this.token == "(") {
		this.next();
		var scope = this.pSCOPE_P();
		if (this.token != ")") {
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPECLOSE));
			return scope;
		} else {
			this.next();
		}
		return scope;
	}
	return this.pSCOPE_P();
}



/**
 * SCOPE Prime Production
 * SCOPE' -> observable SCOPE''
 */
EdenAST.prototype.pSCOPE_P = function() {
	if (this.token != "OBSERVABLE") {
		var scope = new EdenAST_Scope();
		scope.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPENAME));
		return scope;
	}
	var obs = this.data.value;
	this.next();

	if (this.token != "is") {
		var scope = new EdenAST_Scope();
		scope.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPEEQUALS));
		return scope;
	}
	this.next();
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		var scope = new EdenAST_Scope();
		scope.addOverride(obs, expression, undefined);
		return scope;
	}

	var exp2 = undefined;
	if (this.token == "..") {
		this.next();
		exp2 = this.pEXPRESSION();
		if (exp2.errors.length > 0) {
			var scope = new EdenAST_Scope();
			scope.addOverride(obs, expression, exp2);
			return scope;
		}
	}

	var scope = this.pSCOPE_PP();
	scope.addOverride(obs, expression, exp2);
	return scope;
}



/**
 * Scope Prime Prime Production
 * SCOPE'' -> , SCOPE | epsilon
 */
EdenAST.prototype.pSCOPE_PP = function() {
	if (this.token == ",") {
		this.next();
		return this.pSCOPE_P();
	} else {
		return new EdenAST_Scope();
	}
}



/**
 * ELIST Production
 * ELIST -> EXPRESSION ELIST' | epsilon
 */
EdenAST.prototype.pELIST = function() {
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		return [expression];
	}
	var list = this.pELIST_P();
	list.unshift(expression);
	return list;
}



/**
 * ELIST Prime Production
 * ELIST' -> , EXPRESSION ELIST' | epsilon
 */
EdenAST.prototype.pELIST_P = function() {
	var result = [];
	while (this.token == ",") {
		this.next();
		var expression = this.pEXPRESSION();
		result.push(expression);
		if (expression.errors.length > 0) {
			return result;
		}
	}
	return result;
}



/*
 * E'''''' ->
 *  ? EXPRESSION : EXPRESSION |
 *  if EXPRESSION else EXPRESSION |
 *  epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPPPP = function() {
	if (this.token == "?") {
		this.next();
		var tern = new EdenAST_TernaryOp("?");
		tern.setFirst(this.pEXPRESSION());

		if (tern.errors.length > 0) return tern;

		if (this.token != ":") {
			tern.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.TERNIFCOLON));
			return tern;
		} else {
			this.next();
		}
		
		tern.setSecond(this.pEXPRESSION());
		return tern;
	} else if (this.token == "if") {
		this.next();
		var tern = new EdenAST_TernaryOp("?");
		tern.setCondition(this.pEXPRESSION());

		if (tern.errors.length > 0) return tern;

		if (this.token != "else") {
			tern.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.TERNIFCOLON));
			return tern;
		} else {
			this.next();
		}
		
		tern.setSecond(this.pEXPRESSION());
		return tern;
	}
	return undefined;
}



/**
 * EXPRESSION Production
 * EXPRESSION -> T { && T | || T }
 */
EdenAST.prototype.pEXPRESSION = function() {
	var left = this.pTERM();

	while (this.token == "&&" || this.token == "||") {
		var binop = new EdenAST_BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM());
		left = binop;
	}

	return left;
}


/**
 * ACTION Production
 * ACTION -> observable : OLIST ACTIONBODY
 */
EdenAST.prototype.pACTION = function() {
	var action = new EdenAST_Action();
	var parent = this.parent;
	this.parent = action;

	if (this.token == "OBSERVABLE") {
		action.name = this.data.value;
		this.next();
	} else {
		action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PROCNAME));
		return action;
	}

	if (this.token == ":") {
		this.next();

		var olist = this.pOLIST();
		if (olist.length == 0) {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNOWATCH));
			return action;
		} else if (olist[olist.length-1] == "NONAME") {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCOMMAS));
			return action;
		}
		action.triggers = olist;
	}

	action.setBody(this.pFUNCBODY());
	this.parent = parent;
	return action;
}


/**
 * WHEN Production
 * WHEN -> ( EXPRESSION ) STATEMENT
 */
EdenAST.prototype.pWHEN = function() {
	var when = new EdenAST_When();
	var parent = this.parent;
	this.parent = when;

	if (this.token != "(") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENOPEN));
		return when;
	} else {
		this.next();
	}

	when.setExpression(this.pEXPRESSION());
	if (when.errors.length > 0) return when;

	if (this.token != ")") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENCLOSE));
		return when;
	} else {
		this.next();
	}

	when.setStatement(this.pSTATEMENT());
	if (when.errors.length > 0) return when;

	// Compile the expression and log dependencies
	when.compile(this);

	this.parent = parent;
	return when;
}



/**
 * OLIST Production.
 * OLIST -> observable OLIST'
 */
EdenAST.prototype.pOLIST = function() {
	if (this.token != "OBSERVABLE") {
		return [];
	}

	var observable = this.data.value;
	this.next();

	var prime = this.pOLIST_P();
	prime.unshift(observable);
	return prime;
}


/**
 * OLIST Prime Production
 * OLIST' -> , observable OLIST' | epsilon
 */
EdenAST.prototype.pOLIST_P = function() {
	var olist = [];
	while (this.token == ",") {
		this.next();
		if (this.token == "OBSERVABLE") {
			olist.push(this.data.value);
			this.next();
		} else {
			olist.push("NONAME");
			return olist;
		}
	}

	return olist;
}



/**
 * ACTIONBODY Production
 * ACTIONBODY -> { LOCALS SCRIPT }
 */
EdenAST.prototype.pACTIONBODY = function() {
	var codebody = new EdenAST_CodeBlock();

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		return codebody;
	} else {
		this.next();
	}

	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) return codebody;
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		return codebody;
	} else {
		this.next();
	}

	return codebody;
}



/**
 * PARAMS Production
 * PARAS -> para OLIST ; PARAS | epsilon
 */
EdenAST.prototype.pPARAMS = function() {
	var params = new EdenAST_Declarations();

	while (this.token == "para") {
		this.next();

		var olist = this.pOLIST();
		params.list = olist;

		if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMNAME));
			return params;
		}

		if (this.token == ";") {
			this.next();
		} else {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMSEMICOLON));
			return params;
		}
	}

	return params;
}



/**
 * LOCALS Production
 * LOCALS -> auto OLIST ; LOCALS | local OLIST ; LOCALS | epsilon
 */
EdenAST.prototype.pLOCALS = function() {
	var locals = new EdenAST_Declarations();

	while (this.token == "auto" || this.token == "local") {
		this.next();

		var olist = this.pOLIST();
		locals.list = olist;

		if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
			locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALNAME));
			return locals;
		}

		if (this.token == ";") {
			this.next();
		} else {
			locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALSEMICOLON));
			return locals;
		}
	}

	return locals;
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



/**
 * IF Production
 * IF -> ( EXPRESSION ) STATEMENT IF'
 */
EdenAST.prototype.pIF = function() {
	var ifast = new EdenAST_If();
	var parent = this.parent;
	this.parent = ifast;

	if (this.token != "(") {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDOPEN));
		return ifast;
	} else {
		this.next();
	}

	ifast.setCondition(this.pEXPRESSION());
	if (ifast.errors.length > 0) return ifast;

	if (this.token != ")") {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDCLOSE));
		return ifast;
	} else {
		this.next();
	}

	ifast.setStatement(this.pSTATEMENT());
	if (ifast.errors.length > 0) return ifast;

	ifast.setElse(this.pIF_P());
	this.parent = parent;
	return ifast;
}



/**
 * IF Prime Production
 * IF' -> else STATEMENT | epsilon
 */
EdenAST.prototype.pIF_P = function() {
	if (this.token == "else") {
		this.next();
		return this.pSTATEMENT();
	}
	return undefined;
}



/**
 * FOR Production
 * FOR -> ( STATEMENT'_OPT ; EXPRESSION_OPT ; STATEMENT'_OPT ) STATEMENT
 */
EdenAST.prototype.pFOR = function() {
	var forast = new EdenAST_For();

	if (this.token != "(") {
		forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FOROPEN));
		return forast;
	} else {
		this.next();
	}

	if (this.token == ";") {
		this.next();
	} else {
		forast.setStart(this.pSTATEMENT_P());
		if (forast.errors.length > 0) return forast;

		if (this.token != ";") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORSTART));
			return forast;
		} else {
			this.next();
		}
	}

	if (this.token == ";") {
		this.next();
	} else {
		forast.setCondition(this.pEXPRESSION());
		if (forast.errors.length > 0) return forast;

		if (this.token != ";") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCOND));
			return forast;
		} else {
			this.next();
		}
	}

	if (this.token == ")") {
		this.next();
	} else {
		forast.setIncrement(this.pSTATEMENT_P());
		if (forast.errors.length > 0) return forast;

		if (this.token != ")") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCLOSE));
			return forast;
		} else {
			this.next();
		}
	}

	forast.setStatement(this.pSTATEMENT());
	return forast;
}


/**
 * WHILE Production
 * WHILE -> ( EOPT ) STATEMENT
 */
EdenAST.prototype.pWHILE = function() {
	var w = new EdenAST_While();
	var parent = this.parent;
	this.parent = w;

	if (this.token != "(") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILEOPEN));
		return w;
	} else {
		this.next();
	}

	w.setCondition(this.pEXPRESSION());
	if (w.errors.length > 0) return w;

	if (this.token != ")") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILECLOSE));
		return w;
	} else {
		this.next();
	}

	w.setStatement(this.pSTATEMENT());

	if (w.statement === undefined) {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILENOSTATEMENT));
		return w;
	}

	this.parent = parent;
	return w;
}



/**
 * Do Production
 * DO -> observable;
 */
EdenAST.prototype.pDO = function() {
	var w = new EdenAST_Do();

	if (this.token != "OBSERVABLE") {
		w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DONAME));
		return w;
	} else {
		w.setName(this.data.value);
		this.next();
	}
	return w;

	/*var parent = this.parent;
	this.parent = w;

	w.setStatement(this.pSTATEMENT());

	if (w.statement === undefined) {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILENOSTATEMENT));
		return w;
	}

	if (this.token != "while") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILEOFDO));
		return w;
	} else {
		this.next();
	}

	if (this.token != "(") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILEOPEN));
		return w;
	} else {
		this.next();
	}

	w.setCondition(this.pEXPRESSION());
	if (w.errors.length > 0) return w;

	if (this.token != ")") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILECLOSE));
		return w;
	} else {
		this.next();
	}

	this.parent = parent;
	return w;*/
}



/**
 * SWITCH Production
 * SWITCH -> ( EXPRESSION ) STATEMENT
 */
EdenAST.prototype.pSWITCH = function() {
	var swi = new EdenAST_Switch();

	if (this.token != "(") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHOPEN));
		return swi;
	} else {
		this.next();
	}

	swi.setExpression(this.pEXPRESSION());
	if (swi.errors.length > 0) return swi;

	if (this.token != ")") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHCLOSE));
		return swi;
	} else {
		this.next();
	}

	swi.setStatement(this.pSTATEMENT());
	return swi;
}



/**
 * FUNCTION Production
 * FUNCTION -> observable FUNCBODY
 */
EdenAST.prototype.pFUNCTION = function() {
	var func = new EdenAST_Function();
	var parent = this.parent;
	this.parent = func;

	if (this.token == "OBSERVABLE") {
		func.name = this.data.value;
		this.next();
	} else {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
		return func;
	}

	func.setBody(this.pFUNCBODY());
	this.parent = parent;
	return func;
}



/**
 * FUNCBODY Production
 * FUNCBODY -> { PARAS LOCALS SCRIPT }
 */
EdenAST.prototype.pFUNCBODY = function() {
	var codebody = new EdenAST_CodeBlock();

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCOPEN));
		return codebody;
	} else {
		this.next();
	}

	codebody.setParams(this.pPARAMS());
	if (codebody.params.errors.length > 0) return codebody;
	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) return codebody;
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCLOSE));
		return codebody;
	} else {
		//this.next();
	}

	return codebody;
}


/**
 * LVALUE Prime Production
 * LVALUE' -> [ EXPRESSION ] LVALUE' | . observable LVALUE' | epsilon
 * Returns an array of lvalue extra details, possibly empty.
 */
EdenAST.prototype.pLVALUE_P = function() {
	var components = [];

	// Get all lvalue extras such as list indices and object properties.
	// This production is tail recursive so loop it.
	while (true) {
		// So we are using a list element as an lvalue?
		if (this.token == "[") {
			this.next();

			// Make an index tree element.
			var comp = new EdenAST_LValueComponent("index");
			var expression = this.pEXPRESSION();
			comp.index(expression);
			components.push(comp);

			if (expression.errors.length > 0) {
				comp.errors.unshift(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			}

			if (comp.indexexp.type == "literal" &&
				comp.indexexp.datatype == "NUMBER" &&
				comp.indexexp.value < 1) {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
			}

			if (this.token != "]") {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
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
		ast.error(new Eden.SyntaxError(this, Eden.SyntaxError.LVALUE));
		return ast;
	}
	var obs = this.data.value;
	this.next();
	return new EdenAST_LValue(obs, this.pLVALUE_P());
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
 *	-- |
 *  ( ELIST )
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
	} else if (this.token == "~>") {
		this.next();
		var subscribers = new EdenAST_Subscribers();

		if (this.token != "[") {
			subscribers.error(new Eden.SyntaxError(this, Eden.SyntaxError.SUBSCRIBEOPEN));
			return subscribers;
		} else {
			this.next();
		}

		subscribers.setList(this.pOLIST());
		if (subscribers.errors.length > 0) return subscribers;

		if (this.token != "]") {
			subscribers.error(new Eden.SyntaxError(this, Eden.SyntaxError.SUBSCRIBECLOSE));
			return subscribers;
		} else {
			this.next();
		}

		return subscribers;
	} else if (this.token == "++") {
		this.next();
		return new EdenAST_Modify("++", undefined);
	} else if (this.token == "--") {
		this.next();
		return new EdenAST_Modify("--", undefined);
	} else if (this.token == "(") {
		var fcall = new EdenAST_FunctionCall();
		this.next();

		if (this.token != ")") {
			fcall.setParams(this.pELIST());
			if (fcall.errors.length > 0) return fcall;

			if (this.token != ")") {
				fcall.error(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCLOSE));
				return fcall;
			}
		}

		this.next();
		return fcall;
	}

	var errors = [];
	errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DEFINITION));

	var errast = new EdenAST_Assignment(undefined);
	errast.errors.unshift(errors[0]);
	return errast;
};



/**
 * STATEMENT Prime Production
 * STATEMENT' -> LVALUE STATEMENT''
 */
EdenAST.prototype.pSTATEMENT_P = function() {
	var lvalue = this.pLVALUE();
	if (lvalue.errors.length > 0) return lvalue;
	var formula = this.pSTATEMENT_PP();
	formula.left(lvalue);
	if (formula.errors.length > 0) return formula;
	return formula;
};



/**
 * CASE Production
 * CASE -> STRING : | NUMBER : | CHARACTER :
 */
EdenAST.prototype.pCASE = function() {
	var cas = new EdenAST_Case();

	if (this.token == "STRING" || this.token == "NUMBER") {
		cas.setLiteral(this.token, this.data.value);
		this.next();
	} else {
		cas.error(new Eden.SyntaxError(this, Eden.SyntaxError.CASELITERAL));
		return cas;
	}

	if (this.token != ":") {
		cas.error(new Eden.SyntaxError(this, Eden.SyntaxError.CASECOLON));
		return cas;
	} else {
		this.next();
	}

	return cas;
}



/**
 * INSERT Production
 * INSERT -> LVALUE , EXPRESSION , EXPRESSION ;
 */
EdenAST.prototype.pINSERT = function() {
	var insert = new EdenAST_Insert();
	
	insert.setDest(this.pLVALUE());
	if (insert.errors.length > 0) return insert;

	if (this.token != ",") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.INSERTCOMMA));
		return insert;
	} else {
		this.next();
	}

	insert.setIndex(this.pEXPRESSION());
	if (insert.errors.length > 0) return insert;

	if (this.token != ",") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.INSERTCOMMA));
		return insert;
	} else {
		this.next();
	}

	insert.setValue(this.pEXPRESSION());
	if (insert.errors.length > 0) return insert;

	if (this.token != ";") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return insert;
	} else {
		this.next();
	}

	return insert;
}



/**
 * DELETE Production
 * DELETE -> LVALUE , EXPRESSION ;
 */
EdenAST.prototype.pDELETE = function() {
	var del = new EdenAST_Delete();
	
	del.setDest(this.pLVALUE());
	if (del.errors.length > 0) return del;

	if (this.token != ",") {
		del.error(new Eden.SyntaxError(this, Eden.SyntaxError.DELETECOMMA));
		return del;
	} else {
		this.next();
	}

	del.setIndex(this.pEXPRESSION());
	if (del.errors.length > 0) return del;

	if (this.token != ";") {
		del.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return del;
	} else {
		this.next();
	}

	return del;
}



/**
 * APPEND Production
 * APPEND -> LVALUE , EXPRESSION ;
 */
EdenAST.prototype.pAPPEND = function() {
	var append = new EdenAST_Append();
	
	append.setDest(this.pLVALUE());
	if (append.errors.length > 0) return append;

	if (this.token != ",") {
		append.error(new Eden.SyntaxError(this, Eden.SyntaxError.APPENDCOMMA));
		return append;
	} else {
		this.next();
	}

	append.setIndex(this.pEXPRESSION());
	if (append.errors.length > 0) return append;

	if (this.token != ";") {
		append.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return append;
	} else {
		this.next();
	}

	return append;
}



/**
 * SHIFT Production
 * SHIFT -> LVALUE ;
 */
EdenAST.prototype.pSHIFT = function() {
	var shif = new EdenAST_Shift();

	shif.setDest(this.pLVALUE());
	if (shif.errors.length > 0) return shif;

	if (this.token != ";") {
		shif.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return shif;
	} else {
		this.next();
	}

	return shif;
}



/**
 * REQUIRE Production
 * REQUIRE -> EXPRESSION ;
 */
EdenAST.prototype.pREQUIRE = function() {
	var req = new EdenAST_Require();
	var express = this.pEXPRESSION();
	req.setExpression(express);
	return req;
}



/**
 * AFTER Production
 * AFTER -> ( EXPRESSION ) STATEMENT
 */
EdenAST.prototype.pAFTER = function() {
	var after = new EdenAST_After();

	if (this.token != "(") {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTEROPEN));
		return after;
	} else {
		this.next();
	}

	var express = this.pEXPRESSION();
	after.setExpression(express);
	if (after.errors.length > 0) return after;

	if (this.token != ")") {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTEROPEN));
		return after;
	} else {
		this.next();
	}

	var statement = this.pSTATEMENT();

	after.setStatement(statement);
	return after;
}



/**
 * AWAIT Production
 * AWAIT -> EXPRESSION ;
 */
EdenAST.prototype.pAWAIT = function() {
	var shif = new EdenAST_Shift();
	
}



/**
 * OPTION Production
 * OPTION -> OBSERVABLE = OPTION'
 */
EdenAST.prototype.pOPTION = function() {
	var shif = new EdenAST_Shift();
	
}



/**
 * INCLUDE Production
 * INCLUDE -> ( EXPRESSION ) ; INCLUDE'
 */
EdenAST.prototype.pINCLUDE = function() {
	var express = this.pEXPRESSION();
	var inc = new EdenAST_Include();//this.pINCLUDE_P();
	inc.prepend(express);
	return inc;
}



EdenAST.prototype.pWAIT = function() {
	var wait = new EdenAST_Wait();

	if (this.token == ";") {
		this.next();
		return wait;
	} else {
		var express = this.pEXPRESSION();
		wait.setDelay(express);

		if (this.token != ";") {
			wait.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
			return wait;
		}
		this.next();
	}
	return wait;
}



/**
 * STATEMENT Production
 * STATEMENT ->
	{ SCRIPT } |
	when WHEN |
	proc ACTION |
	func FUNCTION |
	for FOR |
	while WHILE |
	switch SWITCH |
	case CASE |
	default : |
	if IF |
	return EOPT ; |
	continue ; |
	break ; |
	? LVALUE ; |
	insert INSERT |
	delete DELETE |
	append APPEND |
	shift SHIFT |
	require REQUIRE |
	await AWAIT |
	after AFTER |
	option OPTION |
	include INCLUDE |
	LVALUE STATEMENT'' ; |
	epsilon
 */
EdenAST.prototype.pSTATEMENT = function() {
	var start = this.stream.prevposition;
	var curline = this.stream.line - 1;
	var endline = -1;
	var stat = undefined;
	var end = -1;

	switch (this.token) {
	case "proc"		:	this.next(); stat = this.pACTION(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "func"		:	this.next(); stat = this.pFUNCTION(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "when"		:	this.next(); stat = this.pWHEN(); end = this.stream.prevposition; endline = this.stream.prevline; break;
	case "action"	:	this.next(); stat = this.pNAMEDSCRIPT(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "for"		:	this.next(); stat = this.pFOR(); break;
	case "while"	:	this.next(); stat = this.pWHILE(); break;
	case "do"		:	this.next(); stat = this.pDO(); break;
	case "wait"		:	this.next(); stat = this.pWAIT(); break;
	case "switch"	:	this.next(); stat = this.pSWITCH(); break;
	case "case"		:	this.next(); stat = this.pCASE(); break;
	case "insert"	:	this.next(); stat = this.pINSERT(); break;
	case "delete"	:	this.next(); stat = this.pDELETE(); break;
	case "append"	:	this.next(); stat = this.pAPPEND(); break;
	case "shift"	:	this.next(); stat = this.pSHIFT(); break;
	case "require"	:	this.next(); stat = this.pREQUIRE(); break;
	case "await"	:	this.next(); stat = this.pAWAIT(); break;
	case "after"	:	this.next(); stat = this.pAFTER(); break;
	case "option"	:	this.next(); stat = this.pOPTION(); break;
	case "include"	:	this.next(); stat = this.pINCLUDE(); break;
	case "default"	:	this.next();
						var def = new EdenAST_Default();
						if (this.token != ":") {
							def.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.DEFAULTCOLON));
						} else {
							this.next();
						}
						stat = def; break;
	case "if"		:	this.next(); stat = this.pIF(); break;
	case "return"	:	this.next();
						var ret = new EdenAST_Return();

						if (this.token != ";") {
							ret.setResult(this.pEXPRESSION());
							if (ret.errors.length > 0) return ret;
						} else {
							this.next();
							return ret;
						}

						if (this.token != ";") {
							ret.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = ret; break;
	case "continue"	:	this.next();
						var cont = new EdenAST_Continue();
						if (cont.errors.length > 0) return cont;

						if (this.token != ";") {
							cont.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = cont; break;
	case "break"	:	this.next();
						var breakk = new EdenAST_Break();
						if (breakk.errors.length > 0) return breakk;

						if (this.token != ";") {
							breakk.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = breakk; break;
	case "{"		:	this.next();
						var script = this.pSCRIPT();
						if (this.token != "}") {
							script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
							return script;
						}
						endline = this.stream.line;
						this.next();
						stat = script; break;
	case "OBSERVABLE" :	var lvalue = this.pLVALUE();
						if (lvalue.errors.length > 0) return lvalue;
						var formula = this.pSTATEMENT_PP();
						formula.left(lvalue);

						if (formula.errors.length > 0) {
							stat = formula;
							// To correctly report multi-line def errors.
							endline = this.stream.line;
							break;
						}
		
						if (this.token != ";") {
							formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
						} else {
							// End source here to avoid bringing comments in
							end = this.stream.position;
							endline = this.stream.line;
							this.next();
						}
						stat = formula; break;
	case "JAVASCRIPT" : var js = this.data.value;
						this.next();
						stat = new EdenAST_Literal("JAVASCRIPT", js);
						break;
	default : return undefined;
	}
	
	stat.parent = this.parent;
	if (end == -1) {
		stat.setSource(start, this.stream.prevposition);
	} else {
		stat.setSource(start, end);
	}
	this.lines[curline] = stat;
	//var endline = this.stream.line;
	for (var i=curline+1; i<endline; i++) {
		if (this.lines[i] === undefined) this.lines[i] = stat;
	}
	return stat;
};



EdenAST.prototype.pNAMEDSCRIPT = function() {
	var name;

	if (this.token != "OBSERVABLE") {
		var script = new EdenAST_Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNAME));
		return script;
	} else {
		name = this.data.value;
		this.next();
	}

	if (this.token != "{") {
		var script = new EdenAST_Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		return script;
	} else {
		this.next();
	}

	var script = this.pSCRIPT();
	if (script.errors.length > 0) return script;

	script.setName(name);

	if (this.token != "}") {
		script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		return script;
	} else {
		//this.next();
	}

	this.scripts[script.name] = script;

	return script;
}



/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT SCRIPT | epsilon
 */
EdenAST.prototype.pSCRIPT = function() {
	var ast = new EdenAST_Script();
	var parent = this.parent;
	this.parent = ast;

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {
			ast.append(statement);
			if (statement.errors.length > 0) {
				break;
				// Skip until colon
				/*while (this.token != ";" && this.token != "EOF") {
					this.next();
				}*/
			}
		} else {
			if (this.token != "}" && this.token != ";") {
				ast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.STATEMENT));
			}
			if (this.token == ";") {
				this.next();
			} else {
				break;
			}
		}
	}

	this.parent = parent;
	return ast;
};

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.EdenAST = EdenAST;
}

