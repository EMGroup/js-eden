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
		//this.next();
	}

	this.scripts[name] = script;
	script.base = this;

	return script;
}



/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT SCRIPT | epsilon
 */
Eden.AST.prototype.pSCRIPT = function() {
	var ast = new Eden.AST.Script();
	ast.base = this;
	ast.parent = this.parent;
	var parent = this.parent;
	this.parent = ast;
	//var epos = this.stream.prevposition;

	//ast.setLocals(this.pLOCALS());

	var dummy = new Eden.AST.DummyStatement();
	dummy.setSource(this.prevprevpos, this.stream.prevposition, this.stream.code.substring(this.prevprevpos, this.stream.prevposition));
	ast.append(dummy);

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {
			//console.log("WS: ", this.stream.code.substring(statement.end, this.stream.prevposition));

			ast.append(statement);
			if (statement.errors.length > 0) {
				break;
				// Skip until colon
				/*while (this.token != ";" && this.token != "EOF") {
					this.next();
				}*/
			}

			var ws = this.stream.code.substring(statement.end, this.stream.prevposition);
			if (ws.length > 0) {
				var dummy = new Eden.AST.DummyStatement();
				dummy.setSource(statement.end, this.stream.prevposition, ws);
				ast.append(dummy);
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

