/**
 * Named Script Production
 * NAMEDSCRIPT -> observable \{ SCRIPT \}
 */
Eden.AST.prototype.pNAMEDSCRIPT = function() {
	var name;

	// Expect an action name with same syntax as an observable name
	if (this.token != "OBSERVABLE") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNAME));
		return script;
	} else {
		name = this.data.value;
		this.next();
	}

	if (this.token != "{") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		return script;
	} else {
		this.next();
	}

	var script = this.pSCRIPT();
	if (script.errors.length > 0) return script;

	script.setName(this,name);

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

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {
			//console.log("WS: ", this.stream.code.substring(statement.end, this.stream.prevposition));

			if (statement.errors.length > 0) {
				ast.appendChild(statement);
				break;
			}

			var end = statement.end;
			ast.appendChild(statement);

			var ws = this.stream.code.substring(end, this.stream.prevposition);
			if (ws.length > 0) {
				var dummy = new Eden.AST.DummyStatement();
				dummy.setSource(end, this.stream.prevposition, ws);
				dummy.numlines = dummy.source.match(/\n/g);
				if (dummy.numlines === null) dummy.numlines = 0;
				else dummy.numlines = dummy.numlines.length;
				ast.appendChild(dummy);
			}
		} else {
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

