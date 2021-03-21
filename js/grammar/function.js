/**
 * FUNCTION Production
 * FUNCTION -> observable FUNCBODY
 */
Eden.AST.prototype.pFUNCTION = function() {
	var func = new Eden.AST.Definition();
	var parent = this.parent;
	this.parent = func;

	let type = this.token;
	this.next();

	if (this.version >= Eden.AST.VERSION_CS3 && this.token === ':') {
		this.next();
		var attribs = this.pATTRIBUTES();
		if (!func.setAttributes(attribs)) {
			func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
			this.parent = parent;
			return func;
		}
	}

	if (this.token == "OBSERVABLE") {
		var lval = new Eden.AST.LValue();
		lval.setObservable(this.data.value);
		this.next();

		if (this.token === ":") {
			// Deprecated CS2 triggered procedure syntax
			if (this.version === Eden.AST.VERSION_CS2 && type === 'proc') {
				this.next();
				const olist = this.pOLIST();
				const attribs = {eager: true};

				for (const o of olist) {
					attribs['depends(' + o + ')'] = true;
				}
				
				if (!func.setAttributes(attribs)) {
					func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
					func.left(lval);
					this.parent = parent;
					return func;
				}

				// TODO: Also set func body to static somehow.
			} else {
				this.next();
				var attribs = this.pATTRIBUTES();
				if (!lval.setAttributes(attribs)) {
					lval.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
					func.left(lval);
					this.parent = parent;
					return func;
				}
			}
		}

		if (this.token === '<~') {
			this.next();
			const olist = this.pOLIST();
			const attribs = {eager: true};

			for (const o of olist) {
				attribs['depends(' + o + ')'] = true;
			}
			
			if (!func.setAttributes(attribs)) {
				func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
				func.left(lval);
				this.parent = parent;
				return func;
			}
		}

		func.left(lval);

		//if (type == "proc") console.warn("Parsed proc", lval.name);
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

	// Wrap in a function call for eager triggered procs.
	if (type === 'proc' && func.eager) {
		const fcall = new Eden.AST.FunctionCall();
		const indexed = new Eden.AST.Indexed();
		indexed.addIndex(fcall);
		indexed.setExpression(expr);
		expr = indexed;
	}

	func.setExpression(expr);

	if (this.token != "}") {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		this.parent = parent;
		return func;
	}
	this.next();

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
		this.next();
	}

	this.parent = parent;
	return codebody;
}

