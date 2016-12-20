/*
 * E''''' -> # | epsilon
 */
Eden.AST.prototype.pEXPRESSION_PPPPP = function() {
	if (this.token == "#") {
		this.next();
		return new Eden.AST.Length();
	}
	return undefined;
}

/*
 * E'''''' ->
 *  ? EXPRESSION : EXPRESSION |
 *  if EXPRESSION else EXPRESSION |
 *  epsilon
 */
Eden.AST.prototype.pEXPRESSION_PPPPPP = function() {
	if (this.token == "?") {
		this.next();
		var tern = new Eden.AST.TernaryOp("?");
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
		var tern = new Eden.AST.TernaryOp("?");
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
Eden.AST.prototype.pEXPRESSION_PLAIN = function() {
	var left = this.pTERM();

	while (this.token == "&&" || this.token == "||") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM());
		left = binop;
	}

	return left;
}



/**
 * Scoped Expression Production
 * SCOPEDEXP ->
 *   EXPRESSION with SCOPE |
 *   EXPRESSION :: SCOPE |
 *   EXPRESSION
 */
Eden.AST.prototype.pEXPRESSION = function() {
	var expr;

	if (this.token == "{") {
		this.next();
		//var expr = new Eden.AST.World(this.pSCRIPT());
		expr = this.pSCRIPTEXPR();
		if (this.token != "}") {
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
			return expr;
		}
		this.next();
	} else {
		expr = this.pEXPRESSION_PLAIN();
	}

	if (this.token == "with" || this.token == "::") {
		this.next();
		var scope = this.pSCOPE();
		scope.setExpression(expr);
		return scope;
	} else {
		return expr;
	}
}

