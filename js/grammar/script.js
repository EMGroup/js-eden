/**
 * Named Script Production
 * NAMEDSCRIPT -> observable \{ SCRIPT \}
 */
Eden.AST.prototype.pNAMEDSCRIPT = function() {
	var name;
	var attribs = null;

	// Allow for execution attributes
	if (this.token == "[") {
		attribs = this.pATTRIBUTES();
		/*if (!stat.setAttributes(attribs)) {
			w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
			this.parent = parent;
			return;
		}*/
	}

	// Expect an action name with same syntax as an observable name
	if (this.token != "OBSERVABLE") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNAME));
		return script;
	} else {
		name = this.data.value;
		this.next();
	}

	// TODO: Do we need this? Can it be removed??
	let readables,writables;
	if (this.token == "(") {
		this.next();
		if (this.token == "oracle") {
			this.next();
			readables = this.pCODESELECTOR();
		}
		if (this.token == ";") this.next();
		if (this.token == "handle") {
			this.next();
			writables = this.pCODESELECTOR();
		}
		if (this.token != ")") {
			var script = new Eden.AST.Script();
			script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
			return script;
		}
		this.next();
	}

	if (this.token == "is") {
		this.next();
		var alias = new Eden.AST.Alias();

		if (!alias.setAttributes(attribs)) {
			alias.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
			return alias;
		}

		// For now it must be a query
		if (this.token != "?") {
			alias.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ALIASQUERY));
			return alias;
		}
		this.next();

		if (this.token != "(") {
			alias.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYOPEN));
			return alias;
		}
		this.next();
	
		alias.setSelector(this.pCODESELECTOR());
	
		if (this.token != ")") {
			alias.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYCLOSE));
			return alias;
		}
		this.next();

		//alias.setSelector(this.pCODESELECTOR());
		alias.setName(name);

		if (this.token != ";") {
			alias.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
			return alias;
		}
		this.next();

		return alias;
	} else if (this.token != "{") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		return script;
	} else {
		this.next();
	}

	var script = this.pSCRIPT();
	if (script.errors.length > 0) return script;

	if (!script.setAttributes(attribs)) {
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		return script;
	}

	script.setName(this,name);
	if (readables) script.setReadables(readables);
	if (writables) script.setWritables(writables);

	if (this.token != "}") {
		script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		return script;
	} else {
		this.next();
	}

	this.scripts[name] = script;
	//script.base = this;

	return script;
}



/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT SCRIPT | epsilon
 */
Eden.AST.prototype.pSCRIPT = function() {
	var ast = new Eden.AST.Script();
	//ast.base = this;
	ast.parent = this.parent;
	var parent = this.parent;
	this.parent = ast;
	//ast.indexed = this.options === undefined || !this.options.noindex;
	//var epos = this.stream.prevposition;

	//ast.setLocals(this.pLOCALS());

	var dummy = new Eden.AST.DummyStatement();
	dummy.setSource(this.lastposition, this.stream.prevposition, this.stream.code.substring(this.lastposition, this.stream.prevposition));
	dummy.numlines = dummy.source.match(/\n/g);
	if (dummy.numlines === null) dummy.numlines = 0;
	else dummy.numlines = dummy.numlines.length;
	ast.append(dummy);
	var lastStat = dummy;	

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {

			if (statement.errors.length > 0) {
				ast.appendChild(statement);
				break;
			}

			var end = statement.end;

			if (statement.type == "dummy" && lastStat && lastStat.type == "dummy") {
				lastStat.setSource(statement.start, statement.end, statement.source);
				lastStat.numlines += statement.numlines;
			} else {
				ast.appendChild(statement);
				lastStat = statement;
			}

			var ws = this.stream.code.substring(end, this.stream.prevposition);
			if (ws.length > 0) {
				var dummy = new Eden.AST.DummyStatement();
				dummy.setSource(end, this.stream.prevposition, ws);
				dummy.numlines = dummy.source.match(/\n/g);
				if (dummy.numlines === null) dummy.numlines = 0;
				else dummy.numlines = dummy.numlines.length;
				//ast.appendChild(dummy);

				if (lastStat && lastStat.type == "dummy") {
					lastStat.setSource(dummy.start, dummy.end, dummy.source);
					lastStat.numlines += dummy.numlines;
				} else {
					ast.appendChild(dummy);
					lastStat = dummy;
				}
			}
		} else {
			/*if (this.depth > 0) {
				this.depth--;
				break;
			}*/
			if (this.token != "}" && this.token != ";") {
				ast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.STATEMENT));
			}
			if (this.token == ";") {
				this.next();
			} else {
				//this.next();
				break;
			}
		}
	}

	// To make sure it gets indexed later...
	//if (ast.parent) ast.indexed = false;
	this.parent = parent;
	return ast;
};

/**
 * SCRIPTEXPR Production
 * SCRIPTEXPR -> STATEXPR SCRIPTEXPR | epsilon
 */
Eden.AST.prototype.pSCRIPTEXPR = function() {
	var ast = new Eden.AST.ScriptExpr();
	ast.parent = this.parent;
	var parent = this.parent;
	//this.parent = ast;

	//ast.setLocals(this.pLOCALS());

	while (this.token != "EOF") {
		var statement = this.pSTATEXPR();

		if (statement !== undefined) {
			ast.append(statement);
			if (statement.errors.length > 0) {
				break;
				// Skip until colon
				/*while (this.token != ";" && this.token != "EOF") {
					this.next();
				}*/
			}
		} else {
			if (this.token != "}" && this.token != ";") {
				ast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.STATEMENT));
			}
			if (this.token == ";") {
				this.next();
			} else {
				break;
			}
		}
	}

	//this.parent = parent;
	return ast;
};

