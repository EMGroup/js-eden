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
	while (this.token === "<" || this.token === "<=" || this.token === ">"
			|| this.token === ">=" || this.token === "==" || this.token === "!=") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_P());
		left = binop;
		binop.typevalue = Eden.AST.TYPE_BOOLEAN;
	}

	return left;
}



/*
 * T' -> T'' { + T'' | - T'' | // T''}
 */
Eden.AST.prototype.pTERM_P = function() {
	var left = this.pTERM_PP();

	while (this.token === "+" || this.token === "-" || this.token === "//") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PP());
		left = binop;

		if (binop.op === "//") {
			if (binop.l.typevalue !== 0 && binop.r.typevalue !== 0 && binop.l.typevalue !== binop.r.typevalue) {
				this.typeWarning(binop);
			}
			if (binop.l.typevalue === Eden.AST.TYPE_NUMBER || binop.r.typevalue === Eden.AST.TYPE_NUMBER) {
				this.typeWarning(binop, null, Eden.AST.TYPE_NUMBER);
			}
			if (binop.l.typevalue === Eden.AST.TYPE_OBJECT || binop.r.typevalue === Eden.AST.TYPE_OBJECT) {
				this.typeWarning(binop, null, Eden.AST.TYPE_OBJECT);
			}
		} else {
			if (binop.l.typevalue === Eden.AST.TYPE_OBJECT || binop.r.typevalue === Eden.AST.TYPE_OBJECT) {
				this.typeWarning(binop, null, Eden.AST.TYPE_OBJECT);
			}
			if (binop.l.typevalue === Eden.AST.TYPE_LIST || binop.r.typevalue === Eden.AST.TYPE_LIST) {
				this.typeWarning(binop, null, Eden.AST.TYPE_LIST);
			}
		}
	}

	return left;
}



/*
 * T'' -> T''' { * T''' | / T''' | % T''' | ^ T'''}
 */
Eden.AST.prototype.pTERM_PP = function() {
	var left = this.pTERM_PPP();

	while (this.token === "*" || this.token === "/" || this.token === "%"
			|| this.token === "^") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PPP());
		left = binop;

		if ((binop.l.typevalue !== 0 && binop.l.typevalue !== Eden.AST.TYPE_NUMBER) || (binop.r.typevalue !== 0 && binop.r.typevalue !== Eden.AST.TYPE_NUMBER)) {
			this.typeWarning(binop, Eden.AST.TYPE_NUMBER);
		}
	}

	return left;
}



/*
 * T''' -> F E'''''	
 */
Eden.AST.prototype.pTERM_PPP = function() {
	var left = this.pFACTOR(); //this.pTERM_PPPP();
	var right = this.pEXPRESSION_PPPPP();

	// This would be a postfix length operator, just assume that
	if (right) {
		right.left(left);

		if (left.typevalue !== Eden.AST.TYPE_UNKNOWN && left.typevalue !== Eden.AST.TYPE_LIST && left.typevalue !== Eden.AST.TYPE_STRING) {
			right.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
		}

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

