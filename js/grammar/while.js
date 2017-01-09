/**
 * WHILE Production
 * WHILE -> ( EXPRESSION ) STATEMENT
 */
Eden.AST.prototype.pWHILE = function() {
	var w = new Eden.AST.While();
	var parent = this.parent;
	this.parent = w;

	if (this.token != "(") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILEOPEN));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	w.setCondition(this.pEXPRESSION());
	if (w.errors.length > 0) {
		this.parent = parent;
		return w;
	}

	if (this.token != ")") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILECLOSE));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	w.setStatement(this.pSTATEMENT());

	if (w.statement === undefined) {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILENOSTATEMENT));
		this.parent = parent;
		return w;
	}

	this.parent = parent;
	return w;
}
