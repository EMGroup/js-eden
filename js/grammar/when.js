/**
 * WHEN' ->
 *   with SCOPE |
 *   :: SCOPE |
 *   epsilon
 */

/**
 * WHEN Production
 * WHEN -> ( EXPRESSION ) STATEMENT WHEN'
 */
Eden.AST.prototype.pWHEN = function() {
	var when = new Eden.AST.When();
	var parent = this.parent;
	this.parent = when;

	if (this.token == "role") {
		this.next();
		if (this.token == "OBSERVABLE") {
			when.roles = this.pOLIST();
		} else {
			when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENROLE));
			this.parent = parent;
			return when;
		}
		//this.next();
	}

	if (this.token != "(") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENOPEN));
		this.parent = parent;
		return when;
	} else {
		this.next();
	}

	when.setExpression(this.pEXPRESSION());
	if (when.errors.length > 0) {
		this.parent = parent;
		return when;
	}

	if (this.token != ")") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENCLOSE));
		this.parent = parent;
		return when;
	} else {
		this.next();
	}

	when.setStatement(this.pSTATEMENT());
	if (when.errors.length > 0) {
		this.parent = parent;
		return when;
	}
	if (when.statement === undefined) {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENNOSTATEMENT));
		when.active = true;
		this.parent = parent;
		return when;
	}

	if (this.token == "with" || this.token == "::") {
		this.next();
		var scope = this.pSCOPE();
		when.setScope(scope);
		if (scope.errors.length > 0) return when;

		if (this.token != ";") {
			when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
			return when;
		}
		this.next();
	}

	// Compile the expression and log dependencies
	when.compile(this);
	// Register in index.
	this.whens.push(when);

	this.parent = parent;
	return when;
}

