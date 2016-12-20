/**
 * RANGE ->
 *   EXPRESSION .. EXPRESSION |
 *   EXPRESSION
 */


/**
 * FOR Production
 * FOR ->
 *	( STATEMENT'_OPT ; EXPRESSION_OPT ; STATEMENT'_OPT ) STATEMENT
 *  | ( observable in RANGE ) STATEMENT
 */
Eden.AST.prototype.pFOR = function() {
	var forast = new Eden.AST.For();
	var parent = this.parent;
	this.parent = forast;

	if (this.token != "(") {
		forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FOROPEN));
		this.parent = parent;
		return forast;
	} else {
		this.next();
	}

	if (this.token == ";") {
		this.next();
	} else {
		forast.setStart(this.pSTATEMENT_P(true));
		if (forast.errors.length > 0) {
			this.parent = parent;
			return forast;
		}

		if (forast.sstart.type != "range" && this.token != ";") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORSTART));
			this.parent = parent;
			return forast;
		} else if (this.token == ";") {
			this.next();
		}
	}

	
	if (forast.sstart.type != "range") {
		if (this.token == ";") {
			this.next();
		} else {
			forast.setCondition(this.pEXPRESSION());
			if (forast.errors.length > 0) {
				this.parent = parent;
				return forast;
			}

			if (this.token != ";") {
				forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCOND));
				this.parent = parent;
				return forast;
			} else {
				this.next();
			}
		}

		if (this.token == ")") {
			this.next();
		} else {
			forast.setIncrement(this.pSTATEMENT_P());
			if (forast.errors.length > 0) {
				this.parent = parent;
				return forast;
			}

			if (this.token != ")") {
				forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCLOSE));
				this.parent = parent;
				return forast;
			} else {
				this.next();
			}
		}
	} else {
		if (this.token != ")") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCLOSE));
			this.parent = parent;
			return forast;
		} else {
			this.next();
		}
	}

	forast.setStatement(this.pSTATEMENT());
	forast.statement.parent = forast;
	forast.parent = parent;
	this.parent = parent;
	return forast;
}

