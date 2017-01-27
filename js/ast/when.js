Eden.AST.When = function() {
	this.type = "when";
	Eden.AST.BaseContext.apply(this);

	this.name = "*When";
	this.id = 0;
	this.expression = undefined;
	this.active = false;
	this.compiled = undefined;
	this.scope = undefined;
	this.compScope = undefined;
	this.local = false;
	this.dirty = false;
	this.statement = undefined;
	this.enabled = false;
	this.statements = [];
};

Eden.AST.registerContext(Eden.AST.When);

Eden.AST.When.prototype.addTrigger = function(base, d, scope) {
	var trigs = base.triggers[d];
	if (trigs) {
		for (var i=0; i<trigs.length; i++) if (trigs[i].statement === this) return;
		base.triggers[d].push({base: base, statement: this, scope: scope});
	} else {
		trigs = [{base: base, statement: this, scope: scope}];
		base.triggers[d] = trigs;
	}
}

Eden.AST.When.prototype.getSource = function() {
	if (!this.statement) {
		return this.prefix + this.postfix;
	} else {
		return this.prefix + this.statement.getSource() + this.postfix;
	}
}

Eden.AST.When.prototype.setSource = function(start, end, src) {
	this.start = start;
	this.end = end;

	if (!src) return;

	if (this.statement) {
		this.prefix = src.substring(0, this.statement.start-start);
		this.postfix = src.substring(this.statement.end-start);
	} else {
		this.prefix = src.substring(0,end);
		this.postfix = "";
	}
}

Eden.AST.When.prototype.getLine = function() { return this.line; }

Eden.AST.When.prototype.doDebug = function() {
	return this.doxyComment && this.doxyComment.getControls()["@debug"];
}

Eden.AST.When.prototype.setScope = function (scope) {
	this.scope = scope;
}

Eden.AST.When.prototype.subscribeDynamic = function(position, dependency, scope) {
	//console.log("Subscribe Dyn: ", dependency, scope);
	/*if (this.base.triggers[dependency]) {
		if (this.base.triggers[dependency].indexOf(this) == -1) {
			this.base.triggers[dependency].push(this);
		}
	} else {
		var trigs = [this];
		this.base.triggers[dependency] = trigs;
	}*/
	var p = this;
	while (p.parent) p = p.parent;
	this.addTrigger(p.base, dependency, scope);
	return eden.root.lookup(dependency);
}

Eden.AST.When.prototype.setExpression = function (express) {
	this.expression = express;
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.When.prototype.setStatement = function (statement) {
	this.statement = statement;
	if (statement) {
		this.statements.push(statement);
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.When.prototype.generate = function() {
	return "";
}

Eden.AST.When.prototype.compile = function(base) {
	var cond = "(function(context,scope) { try { return ";
	cond += this.expression.generate(this, "scope",{bound: false});
	cond += "; } catch(e) {} })";
	this.compiled = eval(cond);

	if (this.scope && this.compScope === undefined) {
		try {
			this.compScope = eval("(function (context, scope) { var s = " + this.scope.generateConstructor(this, "scope") + "; s.rebuild(); return s; })");
		} catch (e) {
			//var err;

			//if (/[0-9][0-9]*/.test(e.message)) {
			//	err = new Eden.RuntimeError(base, parseInt(e.message), this, e.message);
			//} else {
			//	err = new Eden.RuntimeError(base, 0, this, e);
			//}

			//err.line = this.line;

			//this.errors.push(err);
			//if (base.origin) Eden.Agent.emit("error", [base.origin,err]);
			//console.error(e);
		}
	}

	// Register with base to be triggered
	//for (var d in this.dependencies) {
	//	this.addTrigger(base, d);
	//}

	return "";
}

Eden.AST.When.prototype.trigger = function(base, scope) {
	//console.trace("TRIGGER", this.name, scope);
	if (base === undefined) console.error("No trigger base for when",this);
	if (this.active == false) {
		this.active = true;
		var res = this.executeReal(this, base, (scope) ? scope : eden.root.scope);
		//console.log(res);
		if (res && (eden.peer === undefined || eden.peer.authoriseWhen(this))) {
			base.executeStatements(res, -1, this, undefined, this);
		} else {
			this.active = false;
		}
	} else {
		//this.retrigger = true;
	}
}

Eden.AST.When.prototype.executeReal = function(ctx, base, scope) {
	//if (this.active) return;
	//this.active = true;
	this.executed = 1;
	//this.compile(base);

	//console.log("Exec When: " + base.getSource(this));

	if (this.doxyComment && this.doxyComment.getControls()["@local"]) this.local = true;

	// Reset local variables
	this.locals = {};
	var me = this;

	if (scope === undefined || scope === eden.root.scope) {
		if (this.compScope) scope = this.compScope.call(this, eden.root, eden.root.scope);
		else scope = eden.root.scope;
	}

	if (scope.range) {
		scope.range = false;
		var sscripts = [];

		//if (scope.first()) {
			while (true) {
				var cscope = scope.clone();
				if (this.compiled.call(this, eden.root,cscope)) {
					//sscripts.push(new Eden.AST.ScopedScript(this.statement.statements, cscope));
					console.log("RANGE WHEN:", cscope);
				} else {
					this.executed = 2;
				}
				if (scope.next() == false) break;
			}
		//}

		scope.range = true;
		return sscripts;
	} else {
		if (this.compiled.call(this,eden.root,scope)) {
			//console.log(this.name, scope);
			if (scope !== eden.root.scope && this.statement.type == "script") {
				return [new Eden.AST.ScopedScript(this.statement.statements, scope)];
			} else {
				return [this.statement];
			}
		} else {
			this.executed = 2;
		}
	}

	//this.active = false;
}

Eden.AST.When.prototype.execute = function(ctx,base,scope,agent) {
	if (!this.enabled) {
		// Register agent with project.
		eden.project.registerAgent(this);
	}
	this.enabled = true;
	//if (this.scope && this.compScope === undefined) {
	//	try {
	//		this.compScope = eval("(function (context, scope) { return " + this.scope.generateConstructor(this, "scope") + "; })").call(this, eden.root, eden.root.scope);
	//	} catch (e) {
			//var err;

			//if (/[0-9][0-9]*/.test(e.message)) {
			//	err = new Eden.RuntimeError(base, parseInt(e.message), this, e.message);
			//} else {
			//	err = new Eden.RuntimeError(base, 0, this, e);
			//}

			//err.line = this.line;

			//this.errors.push(err);
			//if (base.origin) Eden.Agent.emit("error", [base.origin,err]);
			//else console.log(err.prettyPrint());
	//	}
	//}
	if (agent && !agent.loading) base.executeStatements(this.executeReal(ctx,base,scope,agent), -1, this, undefined, this);
}

Eden.AST.When.prototype.error = Eden.AST.fnEdenASTerror;

