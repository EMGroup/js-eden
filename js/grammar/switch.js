/**
 * SWITCH Production
 * SWITCH -> ( EXPRESSION ) SCRIPT
 */
Eden.AST.prototype.pSWITCH = function() {
	var swi = new Eden.AST.Switch();
	var parent = this.parent;
	this.parent = swi;

	if (this.token != "(") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHOPEN));
		this.parent = parent;
		return swi;
	} else {
		this.next();
	}

	swi.setExpression(this.pEXPRESSION());
	if (swi.errors.length > 0) {
		this.parent = parent;
		return swi;
	}

	if (this.token != ")") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHCLOSE));
		this.parent = parent;
		return swi;
	} else {
		this.next();
	}

	// Force a switch to be followed by a script
	if (this.token != "{") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHSCRIPT));
		this.parent = parent;
		return swi;
	}

	swi.setStatement(this.pSTATEMENT());
	this.parent = parent;
	return swi;
}

/**
 * CASE Production
 * CASE -> STRING : | NUMBER : | CHARACTER :
 */
Eden.AST.prototype.pCASE = function() {
	var cas = new Eden.AST.Case();

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

