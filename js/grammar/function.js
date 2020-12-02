/**
 * FUNCTION Production
 * FUNCTION -> observable FUNCBODY
 */
Eden.AST.prototype.pFUNCTION = function() {
	var func = new Eden.AST.Definition();
	var parent = this.parent;
	this.parent = func;

	func.eager = true;

	var type = this.token;
	this.next();

	if (this.token == ":") {
		this.next();
		var attribs = this.pATTRIBUTES();
		if (!func.setAttributes(attribs)) {
			// TODO: Error
		}
	}

	if (this.token == "OBSERVABLE") {
		var lval = new Eden.AST.LValue();
		lval.setObservable(this.data.value);
		func.left(lval);
		this.next();

		if (type == "proc") console.warn("Parsed proc", lval.name);
	} else {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
		this.parent = parent;
		return func;
	}

	if (this.token != "{") {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCOPEN));
		this.parent = parent;
		return func;
	} else {
		this.next();
	}

	var expr = this.pSCRIPTEXPR();
	func.setExpression(expr);

	if (this.token != "}") {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		this.parent = parent;
		return expr;
	}
	this.next();

	this.parent = parent;
	return func;
}



/**
 * FUNCBODY Production
 * FUNCBODY -> \{ PARAS LOCALS SCRIPT \}
 */
/*Eden.AST.prototype.pFUNCBODY = function() {
	var codebody = new Eden.AST.CodeBlock();
	var parent = this.parent;
	this.parent = codebody;

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCOPEN));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	codebody.setParams(this.pPARAMS());
	if (codebody.params.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCLOSE));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	this.parent = parent;
	return codebody;
}*/

