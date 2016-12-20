/**
 * AFTER Production
 * AFTER -> ( EXPRESSION ) STATEMENT
 */
Eden.AST.prototype.pAFTER = function() {
	var after = new Eden.AST.After();

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
	if (statement === undefined) {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTERNOSTATEMENT));
	}

	after.setStatement(statement);
	return after;
}

