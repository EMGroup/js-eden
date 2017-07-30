/**
 * PARAMS Production
 * PARAS -> para OLIST ; PARAS | epsilon
 */
Eden.AST.prototype.pPARAMS = function() {
	var params = new Eden.AST.Declarations();
	params.kind = "oracle";

	// Get all parameter aliases.
	while (this.token == "para" || this.token == "oracle") {
		this.next();

		var olist = this.pOLIST();
		params.list.push.apply(params.list,olist);

		if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMNAME));
			return params;
		}

		if (this.token == ";") {
			this.next();
		} else {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMSEMICOLON));
			return params;
		}
	}

	return params;
}



/**
 * LOCALS Production
 * LOCALS -> auto OLIST ; LOCALS | local OLIST ; LOCALS | epsilon
 */
Eden.AST.prototype.pLOCALS = function() {
	var locals = new Eden.AST.Declarations();

	// Get all locals, there may be many lines of such declarations
	while (this.token == "auto" || this.token == "local") {
		this.next();

		if (this.token == "when") {
			this.next();
			this.localStatus = true;
			locals = this.pWHEN();
			this.localStatus = false;
			//locals.local = true;
			return locals;
		} else {
			var olist = this.pOLIST();
			locals.list.push.apply(locals.list,olist);

			if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
				locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALNAME));
				return locals;
			}

			if (this.token == ";") {
				this.next();
			} else {
				locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALSEMICOLON));
				return locals;
			}
		}
	}

	return locals;
}

