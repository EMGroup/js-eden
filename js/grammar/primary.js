Eden.AST.prototype.pDEPRECATED_BTICK = function(observable) {
	// Allow backtick without operator
		
	var expr = new Eden.AST.Literal("STRING", (observable) ? observable : "");
	expr.typevalue = Eden.AST.TYPE_STRING;

	while (this.token == "{") {
		this.next();
		// Parse the backticks expression
		var btick = this.pEXPRESSION();
		if (btick.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			primary.setBackticks(btick);
			return primary;
		}	

		// Closing backtick missing?
		if (this.token != "}") {
			var primary = new Eden.AST.Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return primary;
		} else {
			this.next();
		}

		var nexpr = new Eden.AST.BinaryOp('//');
		nexpr.left(expr);
		nexpr.setRight(btick);
		nexpr.typevalue = Eden.AST.TYPE_STRING;
		expr = nexpr;

		if (this.token == "OBSERVABLE") {
			var nexpr = new Eden.AST.BinaryOp('//');
			nexpr.left(expr);
			var lit = new Eden.AST.Literal("STRING", this.data.value);
			lit.typevalue = Eden.AST.TYPE_STRING;
			nexpr.setRight(lit);
			nexpr.typevalue = Eden.AST.TYPE_STRING;
			expr = nexpr;
			this.next();
		}
	}
	return expr;
}

Eden.AST.prototype.pPRIMARY_DEPRECATED_BTICK = function(observable) {
	var expr = this.pDEPRECATED_BTICK(observable);

	// Check for '.', '[' and '('... plus 'with'
	primary = this.pPRIMARY_P();
	primary.setBackticks(expr);
	primary.setObservable("__BACKTICKS__");
	this.isdynamic = true;
	return primary;
}

/**
 * PRIMARY Production
 * PRIMARY -> observable {\{ EXPRESSION \}} PRIMARY' | ` EXPRESSION ` PRIMARY'
 */
Eden.AST.prototype.pPRIMARY = function() {

	if (this.token == "`") {
		var btick;

		if (Eden.AST.version === Eden.AST.VERSION_CS2) {
			console.warn("Old syntax for backticks");
			this.next();
			btick = this.pEXPRESSION();
			this.deprecated(btick, "Backticks are now identifier templates");

			// Closing backtick missing?
			if (this.token != "`") {
				var primary = new Eden.AST.Primary();
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
				return primary;
			} else {
				this.next();
			}
		} else {
			btick = this.pTEMPLATE_STRING(false);
		}

		var primary = this.pPRIMARY_P();

		if (btick.typevalue != 0 && btick.typevalue != Eden.AST.TYPE_STRING) {
			this.typeWarning(primary, Eden.AST.TYPE_STRING, btick.typevalue);
		}

		if (primary.errors.length > 0) return primary;

		primary.setBackticks(btick);
		primary.setObservable("__BACKTICKS__");
		return primary;
	} else if (this.token == "OBSERVABLE") {
		var obs = this.data.value;
		this.next();

		if (this.token == "{" && Eden.AST.version === Eden.AST.VERSION_CS2) {
			console.warn("Old syntax for backticks");
			var p = this.pPRIMARY_DEPRECATED_BTICK(obs);
			this.deprecated(p, "Backticks are now identifier templates");
			return p;
		}

		var primary = this.pPRIMARY_P();
		if (primary.errors.length > 0) return primary;
		primary.setObservable(obs);
		return primary;
	} else {
		var primary = new Eden.AST.Primary();
		primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADFACTOR));
		return primary;
	}


	// Backticks on RHS
	if (this.token == "`") {
		this.next();
		// Parse the backticks expression
		var btick = this.pEXPRESSION();
		if (btick.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			primary.setBackticks(btick);
			return primary;
		}

		if (btick.typevalue != 0 && btick.typevalue != Eden.AST.TYPE_STRING) {
			var primary = new Eden.AST.Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
			return primary;
		}

		// Closing backtick missing?
		if (this.token != "`") {
			var primary = new Eden.AST.Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return primary;
		} else {
			this.next();
		}

		// Check for other components like '.' and '['.
		var primary = this.pPRIMARY_P();
		if (primary.errors.length > 0) return primary;

		primary.setBackticks(btick);
		primary.setObservable("__BACKTICKS__");
		return primary;	
	// Plain observable
	} else if (this.token == "OBSERVABLE") {
		var primary;
		var observable = this.data.value;
		this.next();

		// Allow backtick without operator
		if (this.token == "{") {
			var expr = new Eden.AST.Literal("STRING", observable);
			expr.typevalue = Eden.AST.TYPE_STRING;

			while (this.token == "{") {
				this.next();
				// Parse the backticks expression
				var btick = this.pEXPRESSION();
				if (btick.errors.length > 0) {
					var primary = new Eden.AST.Primary();
					primary.setBackticks(btick);
					return primary;
				}	

				// Closing backtick missing?
				if (this.token != "}") {
					var primary = new Eden.AST.Primary();
					primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
					return primary;
				} else {
					this.next();
				}

				var nexpr = new Eden.AST.BinaryOp('//');
				nexpr.left(expr);
				nexpr.setRight(btick);
				nexpr.typevalue = Eden.AST.TYPE_STRING;
				expr = nexpr;

				if (this.token == "OBSERVABLE") {
					var nexpr = new Eden.AST.BinaryOp('//');
					nexpr.left(expr);
					var lit = new Eden.AST.Literal("STRING", this.data.value);
					lit.typevalue = Eden.AST.TYPE_STRING;
					nexpr.setRight(lit);
					nexpr.typevalue = Eden.AST.TYPE_STRING;
					expr = nexpr;
					this.next();
				}
			}

			// Check for '.', '[' and '('... plus 'with'
			primary = this.pPRIMARY_P();
			primary.setBackticks(expr);
			primary.setObservable("__BACKTICKS__");
			this.isdynamic = true;
		} else {
			// Check for '.', '[' and '('... plus 'with'
			primary = this.pPRIMARY_P();
			primary.setObservable(observable);
		}
		return primary;
	// Missing primary so give an error
	} else {
		var primary = new Eden.AST.Primary();
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
Eden.AST.prototype.pPRIMARY_P = function() {

	var attribs;

	// Allow primary attributes
	if (this.token == ":") {
		this.next();
		attribs = this.pATTRIBUTES();
	}

	// Do we have a list index to add
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();

		// Can't be empty, needs an index
		if (this.token == "]") {
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			index.setExpression(express);
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		// And try to find more components...
		var primary = this.pPRIMARY_PPP();
		//if (primary.errors.length > 0) return primary;
		index.setExpression(express);
		primary.prepend(index);

		if (attribs && !primary.setAttributes(attribs)) {
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		}

		return primary;
	// Do we have a function call?
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();	

		// Check for base case of no parameters
		if (this.token == ")") {
			this.next();
			// Check for other components...
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);

			if (attribs && !primary.setAttributes(attribs)) {
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
			}

			return primary;
		// Otherwise we have parameters so parse them
		} else {
			// Expression list.
			var elist = this.pELIST();
			func.setParams(elist);
			if (func.errors.length > 0) {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				return primary;
			}

			// Check for closing bracket
			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0) return primary;
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
			} else {
				this.next();
			}

			// Get more components...
			var primary = this.pPRIMARY_PP();
			if (primary.errors.length > 0) return primary;
			primary.prepend(func);

			if (attribs && !primary.setAttributes(attribs)) {
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
			}

			return primary;
		}
	// Scope path
	/*} else if (this.token == ":") {
		this.next();
		var rhs = this.pPRIMARY();
		var scopepath = new Eden.AST.ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;*/
	} else if (this.token == ".") {
		this.next();
		var index = new Eden.AST.Index();

		// Can't be empty, needs an index
		if (this.token != "OBSERVABLE") {
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			return primary;
		}

		var express = new Eden.AST.Literal("STRING", this.data.value);
		this.next();

		// And try to find more components...
		var primary = this.pPRIMARY_PPP();
		//if (primary.errors.length > 0) return primary;
		index.setExpression(express);
		primary.prepend(index);

		if (attribs && !primary.setAttributes(attribs)) {
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		}
		return primary;
	// Go to end, check for "with"
	} else {
		var primary = this.pPRIMARY_PPPP();

		if (attribs && !primary.setAttributes(attribs)) {
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		}
		return primary;
	}
}


/**
 * Primary Prime Prime Production.
 * PRIMARY'' ->
 *	( ELIST ) PRIMARY''
 *	| [ EXPRESSION ] PRIMARY''
 *	| PRIMARY''''
 */
Eden.AST.prototype.pPRIMARY_PP = function() {
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();

		// Can't be empty, needs an index
		if (this.token == "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			index.setExpression(express);
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0)	{
					return primary;
				}
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
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
Eden.AST.prototype.pPRIMARY_PPP = function() {
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();
		// Can't be empty, needs an index
		if (this.token == "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			index.setExpression(express);
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();		

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			//if (primary.errors.length > 0) return primary;
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0)	{
					return primary;
				}
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
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
		if (rhs.errors.length > 0) return rhs;
		var scopepath = new Eden.AST.ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Quad Prime Production. DEFUNCT
 * PRIMARY'''' -> epsilon
 */
Eden.AST.prototype.pPRIMARY_PPPP = function() {
	/*if (this.token == "with") {
		this.next();
		return this.pSCOPE();
	} else {*/
		return new Eden.AST.Primary();
	//}
}

