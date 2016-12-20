/**
 * FUNCTION Production
 * FUNCTION -> observable FUNCBODY
 */
Eden.AST.prototype.pFUNCTION = function() {
	var func = new Eden.AST.Function();
	var parent = this.parent;
	this.parent = func;

	if (this.token == "OBSERVABLE") {
		func.name = this.data.value;
		this.next();
	} else {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
		this.parent = parent;
		return func;
	}

	func.setBody(this.pFUNCBODY());
	this.parent = parent;
	return func;
}



/**
 * FUNCBODY Production
 * FUNCBODY -> \{ PARAS LOCALS SCRIPT \}
 */
Eden.AST.prototype.pFUNCBODY = function() {
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
		//this.next();
	}

	this.parent = parent;
	return codebody;
}

