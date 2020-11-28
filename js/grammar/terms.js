/*
 * T'''' -> TA E''''''
 */
Eden.AST.prototype.pTERM = function() {
	var left = this.pTERM_A();
	var right = this.pEXPRESSION_PPPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}

/**
 * T -> T' { < T' | <= T' | > T' | >= T' | == T' | != T' }
 */
Eden.AST.prototype.pTERM_A = function() {
	var left = this.pTERM_P();

	// For all tokens of this precedence do...
	while (this.token == "<" || this.token == "<=" || this.token == ">"
			|| this.token == ">=" || this.token == "==" || this.token == "!=") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_P());
		binop.typevalue = Eden.AST.TYPE_BOOLEAN;
		left = binop;
	}

	return left;
}



/*
 * T' -> T'' { + T'' | - T'' | // T''}
 */
Eden.AST.prototype.pTERM_P = function() {
	var left = this.pTERM_PP();

	while (this.token == "+" || this.token == "-" || this.token == "//") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PP());

		// Update type
		if (binop.l.typevalue == binop.r.typevalue) binop.typevalue = binop.l.typevalue;
		else if (binop.l.typevalue == Eden.AST.TYPE_UNKNOWN) binop.typevalue = binop.r.typevalue;
		else binop.typevalue = binop.l.typevalue;
		
		left = binop;
	}

	return left;
}



/*
 * T'' -> T''' { * T''' | / T''' | % T''' | ^ T'''}
 */
Eden.AST.prototype.pTERM_PP = function() {
	var left = this.pTERM_PPP();

	while (this.token == "*" || this.token == "/" || this.token == "%"
			|| this.token == "^") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PPP());
		binop.typevalue = Eden.AST.TYPE_NUMBER;  // Probably true!
		left = binop;
	}

	return left;
}



/*
 * T''' -> F E'''''	
 */
Eden.AST.prototype.pTERM_PPP = function() {
	var left = this.pFACTOR(); //this.pTERM_PPPP();
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
/*Eden.AST.prototype.pTERM_PPPP = function() {
	var left = this.pFACTOR();
	var right = this.pEXPRESSION_PPPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}*/

