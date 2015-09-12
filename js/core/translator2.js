/* Manual EDEN parser */


////////////////////////////////////////////////////////////////////////////////

function EdenAST(code) {
	this.stream = new EdenStream(code);
	this.data = {};
	this.token = "invalid";
	this.previous = "invalid";
	this.src = "input";

	// Get First Token;
	this.next();

	console.time("MakeEdenAST");
	this.script = this.pSCRIPT();
	console.timeEnd("MakeEdenAST");
}

EdenAST.prototype.prettyPrint = function() {
	var result = "";

	if (this.script.errors.length > 0) {
		//console.log(this.script);
		for (var i = 0; i < this.script.errors.length; i++) {
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
	this.previous = this.token;
	this.token = this.stream.readToken(this.data);

	//Skip normal block comments
	while (this.token == "/*") {
		while (this.token != "*/") {
			this.token = this.stream.readToken(this.data);
		}
		this.token = this.stream.readToken(this.data);
	}
};

EdenAST.prototype.peekNext = function(count) {
	var res;
	var localdata = {value: ""};
	this.stream.pushPosition();
	while (count > 0) {
		res = this.stream.readToken(localdata);
		count--;
	}
	this.stream.popPosition();
	return res;
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
 * F ->
 *	( EXPRESSION ) |
 *	- number |
 *	number |
 *	string |
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
			expression.error(new EdenError(this, EDEN_ERROR_EXPCLOSEBRACKET));
		} else {
			this.next();
		}
		return expression;
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
			literal.errors.push(new EdenError(this, EDEN_ERROR_LISTLITCLOSE));
		} else {
			this.next();
		}
		return literal;
	} else if (this.token == "NUMBER") {
		this.next();
		return new EdenAST_Literal("NUMBER", this.data.value);
	} else if (this.token == "STRING") {
		this.next();
		return new EdenAST_Literal("STRING", this.data.value);
	} else if (this.token == "!") {
		this.next();
		var primary = this.pPRIMARY();
		return new EdenAST_UnaryOp("!", primary);
	} else {
		var primary = this.pPRIMARY();
		return primary;
	}
}



/**
 * PRIMARY Production
 * PRIMARY -> observable PRIMARY'
 */
EdenAST.prototype.pPRIMARY = function() {
	var primary = new EdenAST_Primary();
	if (this.token != "OBSERVABLE") {
		primary.errors.push(new EdenError(this, EDEN_ERROR_BADFACTOR));
		return primary;
	}
	primary.observable = this.data.value;
	this.next();
	primary.setExtras(this.pPRIMARY_P());
	//console.log(primary);
	return primary;
}



/**
 * PRIMARY Prime Production
 * PRIMARY'	->
 *	( ELIST ) PRIMARY'
 *	| . observable PRIMARY'
 *	| [ EXPRESSION ] PRIMARY'
 *	| epsilon
 */
EdenAST.prototype.pPRIMARY_P = function() {
	var result = [];
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
				func.errors.push(new EdenError(this, EDEN_ERROR_FUNCCALLEND));
				return result;
			} else {
				this.next();
			}
		} else if (this.token == "[") {
			this.next();
			var comp = new EdenAST_LValueComponent("index");
			comp.index(this.pEXPRESSION());
			if (comp.errors.length > 0) return comp;

			if (this.token != "]") {
				comp.errors.push(new EdenError(this, EDEN_ERROR_LISTINDEXCLOSE));
			} else {
				this.next();
			}
			return comp;
		} else {
			return result;
		}
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
 * E'''''' -> ? EXPRESSION : EXPRESSION | epsilon
 */
EdenAST.prototype.pEXPRESSION_PPPPPP = function() {
	if (this.token == "?") {
		console.log(this);
		this.next();
		var tern = new EdenAST_TernaryOp("?");
		tern.setFirst(this.pEXPRESSION());

		if (tern.errors.length > 0) return tern;

		if (this.token != ":") {
			tern.errors.push(new EdenError(this, EDEN_ERROR_TERNIFCOLON));
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
 * ACTION -> observable : OLIST ACTIONBODY
 */
EdenAST.prototype.pACTION = function() {
	var action = new EdenAST_Action();

	if (this.token == "OBSERVABLE") {
		action.name = this.data.value;
		this.next();
	} else {
		action.errors.push(new EdenError(this, EDEN_ERROR_PROCNAME));
		return action;
	}

	if (this.token == ":") {
		this.next();
	} else {
		action.errors.push(new EdenError(this, EDEN_ERROR_ACTIONCOLON));
		return action;
	}

	var olist = this.pOLIST();
	if (olist.length == 0) {
		action.errors.push(new EdenError(this, EDEN_ERROR_ACTIONNOWATCH));
		return action;
	} else if (olist[olist.length-1] == "NONAME") {
		action.errors.push(new EdenError(this, EDEN_ERROR_ACTIONCOMMAS));
		return action;
	}
	action.triggers = olist;

	action.setBody(this.pACTIONBODY());
	return action;
}


/**
 * WHEN Production
 * WHEN -> change : WHEN' | touch : WHEN' | ( EXPRESSION ) ACTIONBODY
 */
EdenAST.prototype.pWHEN = function() {
	if (this.token == "touch" || this.token == "change") {
		var kind = this.token;
		this.next();

		var hascolon = false;

		if (this.token == ":") {
			hascolon = true;
			this.next();
		}

		var when = this.pWHEN_P();
		when.kind(kind);

		if (hascolon == false) {
			when.errors.unshift(new EdenError(this, EDEN_ERROR_ACTIONCOLON));
		}

		return when;
	}

	var errors = [];

	if (this.token != "(") {
		errors.push(new EdenError(this, EDEN_ERROR_WHENTYPE));
	} else {
		this.next();
	}

	var express = this.pEXPRESSION();

	if (this.token != ")") {
		express.error(new EdenError(this, 0, "Missing a ')' after a 'when' conditional", undefined, ")"));
	} else {
		this.next();
	}

	var statement = this.pSTATEMENT();
	var when = new EdenAST_ConditionalAction(express, statement);

	if (statement === undefined) {
		when.error(new EdenError(this, 0, "A 'when' needs to be followed by one or more statements", undefined, undefined));
	}

	if (errors.length > 0) {
		for (var i = 0; i < errors.length; i++) {
			when.error(errors[i]);
		}
	}
	return when;
}


/**
 * WHEN Prime Production
 * WHEN' -> OLIST ACTIONBODY
 */
EdenAST.prototype.pWHEN_P = function() {
	var when = new EdenAST_Action();

	var olist = this.pOLIST();
	if (olist.length == 0) {
		when.error(new EdenError(this, 0, "'when touch' or 'when change' needs a list of observables to watch", undefined, undefined));
	} else if (olist[olist.length-1] == "NONAME") {
		when.error(new EdenError(this, 0, "Too many ',' or a missing observable", undefined, undefined));
	}
	when.triggers = olist;

	var body = this.pACTIONBODY();
	
	if (body === undefined) {
		when.error(new EdenError(this, 0, "A 'when' needs to be followed by a body of code", undefined, undefined));
	} else {
		when.setBody(body);
	}
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
		codebody.errors.push(new EdenError(this, EDEN_ERROR_ACTIONOPEN));
		return codebody;
	} else {
		this.next();
	}

	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) return codebody;
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new EdenError(this, EDEN_ERROR_ACTIONCLOSE));
		return codebody;
	} else {
		this.next();
	}

	return codebody;
}



EdenAST.prototype.pPARAMS = function() {

}



/**
 * LOCALS Production
 * LOCALS ->
 *		auto observable ; LOCALS |
 *		local observable ; LOCALS |
 *		epsilon
 */
EdenAST.prototype.pLOCALS = function() {
	var locals = new EdenAST_Declarations();

	while (this.token == "auto" || this.token == "local") {
		this.next();

		if (this.token == "OBSERVABLE") {
			locals.list.push(this.data.value);
			this.next();
		} else {
			locals.errors.push(new EdenError(this, EDEN_ERROR_LOCALNAME));
			return locals;
		}

		if (this.token == ";") {
			this.next();
		} else {
			locals.errors.push(new EdenError(this, EDEN_ERROR_LOCALSEMICOLON));
			return locals;
		}
	}

	return locals;
}



EdenAST.prototype.pFUNCBODY = function() {

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
				comp.errors.unshift(new EdenError(this, EDEN_ERROR_LISTINDEXEXP));
			}

			if (this.token != "]") {
				comp.error(new EdenError(this, EDEN_ERROR_LISTINDEXCLOSE));
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
		ast.error(new EdenError(this, EDEN_ERROR_LVALUE));
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

	var errors = [];
	errors.push(new EdenError(this, EDEN_ERROR_DEFINITION));

	var errast = new EdenAST_Assignment(undefined);
	errast.errors.unshift(errors[0]);
	return errast;
};



/**
 * STATEMENT Prime Production
 * STATEMENT' -> LVALUE STATEMENT''
 */
EdenAST.prototype.pSTATEMENT_P = function() {
	
};



/**
 * STATEMENT Production
 * STATEMENT	->
 *	{ SCRIPT } |
 *	proc ACTION |
 *	func FUNCTION |
 *	LVALUE STATEMENT'' |
 *	for FOR |
 *	while WHILE |
 *	switch SWITCH |
 *	if IF |
 *	return EOPT |
 *	continue |
 *	break |
 *  epsilon
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
			script.error(new EdenError(this, 0, "Missing a closing '}'", undefined, undefined));
			return script;
		}
		this.next();
		return script;
	} else if (this.token == "OBSERVABLE") {
		var lvalue = this.pLVALUE();
		var formula = this.pSTATEMENT_PP();
		formula.left(lvalue);
		return formula;
	}
	return undefined;
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
			if (statement.errors.length > 0) {
				// Skip until colon
				while (this.token != ";" && this.token != "EOF") {
					this.next();
				}
			}
		} else {
			break;
		} 

		if (this.token != ";") {
			ast.errors.push(new EdenError(this, EDEN_ERROR_SEMICOLON));
			return ast;
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


