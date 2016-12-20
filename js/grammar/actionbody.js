/**
 * ACTIONBODY Production
 * ACTIONBODY -> { LOCALS SCRIPT }
 */
Eden.AST.prototype.pACTIONBODY = function() {
	var codebody = new Eden.AST.CodeBlock();
	var parent = this.parent;
	this.parent = codebody;

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	// An action body can have locals but no paras
	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	this.parent = parent;
	return codebody;
}

