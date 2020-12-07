/*
 * F ->
 *	( EXPRESSION ) |
 *	- FACTOR |
 *	number |
 *	string |
 *  << observable string observable |
 *  boolean |
 *  character
 *  JAVASCRIPT |
 *  $ # |
 *	$ NUMBER |
 *	[ ELIST ] |
 *	& LVALUE |
 *  @ |
 *  * FACTOR |
 *	! FACTOR |
 *	PRIMARY	
 */
Eden.AST.prototype.pFACTOR = function() {
	// Sub-expression
	if (this.token == "(") {
		this.next();

		// Parse the sub-expression
		var expression = this.pEXPRESSION();
		if (expression.errors.length > 0) return expression;

		// Remove closing bracket (or error).
		if (this.token != ")") {
			expression.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
		} else {
			this.next();
		}

		if (this.token == "[" || this.token == "." || this.token == "(") {
			var indexed = this.pINDEXED();
			indexed.setExpression(expression);
			return indexed;
		}
		return expression;
	// Action parameters (DEPRECATED!)
	/*} else if (this.token == "$") {
		this.next();
		var index = 0;

		// Allow for # to get lengths
		if (this.token == "#") {
			index = -1;
		// Otherwise if not a valid number > 0 then error
		} else if (this.token != "NUMBER" || this.data.value < 1) {
			var p = new Eden.AST.Parameter(-1);
			p.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMNUMBER));
			return p;
		}

		index = this.data.value
		this.next();
		return new Eden.AST.Parameter(index);*/
	// Make a list literal
	} else if (this.token == "[") {
		this.next();

		var elist = [];
		var labels = false;
		// Check for basic empty case, if not then parse elements
		if (this.token != "]") {
			if (this.token == "OBSERVABLE" && this.stream.peek() == 58) {
				elist = this.pLLIST();
				labels = true;
			} else {
				elist = this.pELIST();
			}
		}

		var literal;
		if (!labels) {
			literal = new Eden.AST.Literal("LIST", elist);
			literal.typevalue = Eden.AST.TYPE_LIST;
		} else {
			literal = new Eden.AST.Literal("OBJECT", elist);
			literal.typevalue = Eden.AST.TYPE_OBJECT;
		}

		// Merge any errors found in the expressions
		if (!labels) {
			for (var i = 0; i < elist.length; i++) {
				if (elist[i].errors.length > 0) {
					literal.errors.push.apply(literal.errors, elist[i].errors);
				}
			}
		} else {
			for (var ename in elist) {
				var expr = elist[ename];
				if (expr.errors.length > 0) {
					literal.errors.push.apply(literal.errors, expr.errors);
				}
			}
		}
		if (literal.errors.length > 0) return literal;

		// Must have a closing bracket...
		if (this.token != "]") {
			literal.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTLITCLOSE));
		} else {
			this.next();
		}
		return literal;
	// Literal undefined
	} else if (this.token == "@") {
		this.next();
		return new Eden.AST.Literal("UNDEFINED", "@");
	// Should NOT be encountered here anymore!!!?
	} else if (this.token == "JAVASCRIPT") {
		var lit = new Eden.AST.Literal("JAVASCRIPT", this.data.value);
		this.next();
		return lit;
	// Numeric literal
	} else if (this.token == "NUMBER") {
		var lit = new Eden.AST.Literal("NUMBER", this.data.value);
		this.next();
		lit.typevalue = Eden.AST.TYPE_NUMBER;
		return lit
	// Query
	} else if (this.token == "?") {
		// TODO: Disable following
		//if (!this.strict) {
			this.next();
			var q = this.pQUERY();
			if (this.token == "[") {
				var indexed = this.pINDEXED();
				indexed.setExpression(q);
				return indexed;
			}
			return q;
		//}

		/*this.next();

		var lit = new Eden.AST.Literal("UNDEFINED", "@");
		lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYNOTALLOWED));
		return lit;*/
	// Unary negation operator
	} else if (this.token == "-") {
		this.next();
		var negop = new Eden.AST.UnaryOp("-", this.pFACTOR());
		negop.typevalue = Eden.AST.TYPE_NUMBER;
		return negop;
	} else if (this.token == "<" && eden.root.lookup("jseden_parser_cs3").value()) {
		return this.pHTML();
	// Heredoc for multiline strings
	} else if (this.token == "<<") {
		this.next();
		if (this.token != "OBSERVABLE") {
			var lit = new Eden.AST.Literal("STRING", this.data.value);
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
			return lit;
		}

		var endtoken = this.data.value;

		// Must be at end of a line
		if (this.stream.get() != 10) {
			var lit = new Eden.AST.Literal("STRING", this.data.value);
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
			return lit;
		}
		//this.stream.line++;

		// Scan looking for endtoken
		var res = "";
		while (this.stream.valid()) {
			var cachepos = this.stream.position;
			var line = this.stream.readLine();
			if (line.startsWith(endtoken)) {
				this.stream.position = cachepos + endtoken.length;
				break;
			}
			res += line;
		}

		if (!this.stream.valid()) {
			this.errors.push(new Eden.SyntaxError(this,Eden.SyntaxError.NEWLINE));
		}

		this.next();

		var lit = new Eden.AST.Literal("STRING", res.slice(0,-1).replace(/\\/g,"\\\\").replace(/"/g, "\\\""));
		lit.typevalue = Eden.AST.TYPE_STRING;
		return lit;
		
	// String literal
	} else if (this.token == "STRING") {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		if (!this.data.error) this.next();
		// Allow multiple strings to be combined as lines
		while (this.data.error == false && this.token == "STRING") {
			lit.value += "\n"+this.data.value;
			this.next();
		}

		if (this.data.error) {
			if (this.data.value == "LINEBREAK") {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRLINE));
			} else {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRCLOSE));
			}
		}

		lit.typevalue = Eden.AST.TYPE_STRING;
		return lit;
	// Boolean literal
	} else if (this.token == "BOOLEAN") {
		var lit = new Eden.AST.Literal("BOOLEAN", this.data.value);
		this.next();
		lit.typevalue = Eden.AST.TYPE_BOOLEAN;
		return lit;
	// Character literal
	} else if (this.token == "CHARACTER") {
		var lit = new Eden.AST.Literal("CHARACTER", this.data.value);
		if (this.data.error) {
			if (this.data.value == "") {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITCHAREMPTY));
			} else {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITCHARCLOSE));
			}
			return lit;
		}
		this.next();
		lit.typevalue = Eden.AST.TYPE_STRING;
		return lit;
	// Unary boolean not
	} else if (this.token == "!" || this.token == "not") {
		this.next();
		var f = this.pFACTOR();
		var op = new Eden.AST.UnaryOp("!", f);
		op.typevalue = Eden.AST.TYPE_BOOLEAN;
		return op;
	// Unary address of operator
	} else if (this.token == "&") {
		this.next();
		var lvalue = this.pLVALUE();
		return new Eden.AST.UnaryOp("&", lvalue);
	// Unary dereference operator
	} else if (this.token == "*") {
		this.next();
		var lvalue = this.pFACTOR();
		return new Eden.AST.UnaryOp("*", lvalue);
	} else if (this.token == "eval") {
		this.next();
		this.isdynamic = true;
		var una = new Eden.AST.UnaryOp("eval", {errors: []});

		if (this.token != "(") {
			una.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALOPEN));
			return una;
		}
		this.next();

		var exp = this.pEXPRESSION();

		if (this.token != ")") {
			una.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
			return una;
		}
		this.next();

		una.r = exp;
		una.errors = exp.errors;
		return una;
	// Otherwise it must be some primary (observable or backticks)
	} else {
		var primary = this.pPRIMARY();
		return primary;
	}
}

