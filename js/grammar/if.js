/**
 * IF Production
 * IF -> ( EXPRESSION ) STATEMENT IF'
 */
Eden.AST.prototype.pIF = function() {
	var ifast = new Eden.AST.If();
	ifast.parent = this.parent;
	var parent = this.parent;
	this.parent = ifast;

	ifast.setCondition(this.pEXPRESSION());
	if (ifast.errors.length > 0) {
		this.parent = parent;
		return ifast;
	}

	ifast.setStatement(this.pSTATEMENT());
	if (ifast.errors.length > 0) {
		this.parent = parent;
		return ifast;
	}

	// Can't have an if without a statement
	if (ifast.statement === undefined) {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFNOSTATEMENT));
		this.parent = parent;
		return ifast;
	}

	// Get the optional else part.
	ifast.setElse(this.pIF_P());
	this.parent = parent;
	return ifast;
}



/**
 * IF Prime Production
 * IF' -> else STATEMENT | epsilon
 */
Eden.AST.prototype.pIF_P = function() {
	if (this.token == "else") {
		this.next();
		return this.pSTATEMENT();
	}
	// Doesn't have to exist...
	return undefined;
}

