/**
 * DO' ->
 *   with SCOPE
 *   | :: SCOPE
 *   | epsilon
 */


/**
 * Do Production
 * DO ->
 *   CODESELECTOR ELIST DO';
 *   \{ SCRIPT \} DO';
 */
Eden.AST.prototype.pDO = function() {
	var w = new Eden.AST.Do();
	var parent = this.parent;
	this.parent = w;

	// Direct script block
	if (this.token == "{") {
		this.next();
		var script = this.pSCRIPT();
		script.parent = w;
		if (this.token != "}") {
			w.setScript(script);
			w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
			this.parent = parent;
			return w;
		}
		this.next();
		w.setScript(script);
		this.parent = parent;

		// Allow a scope here
		if (this.token == "with" || this.token == "::") {
			this.next();
			w.setScope(this.pSCOPE());
		}

		return w;
	// Must have a name otherwise, or error
	} else if (this.token != "OBSERVABLE" && this.token != "." && this.token != ">>" && this.token != ":") {
		w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DONAME));
		this.parent = parent;
		return w;
	} else {
		var path = this.pCODESELECTOR();
		if (path == "_ERROR_") {
			w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DONAME));
			return w;
		}
		w.setName(path);
		//this.next();
	}

	if (this.token == "with" || this.token == "::") {
		this.next();
		w.setScope(this.pSCOPE());
	} else if (this.token != ";") {
		// DEPRECATED
		var elist = this.pELIST();

		for (var i=0; i<elist.length; i++) {
			w.addParameter(elist[i]);
			if (w.errors.length > 0) {
				this.parent = parent;
				return w;
			}
		}
	}

	if (this.token != ";") {
		w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	this.parent = parent;
	return w;
}

