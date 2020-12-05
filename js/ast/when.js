Eden.AST.When = function() {
	this.type = "when";
	Eden.AST.BaseContext.apply(this);

	this.name = "*When";
	this.id = 0;
	this.expression = undefined;
	this.active = false;
	this.compiled = undefined;
	this.scope = undefined;
	this.nscope = undefined;
	this.compScope = undefined;
	this.local = false;
	this.dirty = false;
	this.statement = undefined;
	this.enabled = false;
	this.statements = [];
	this.retrigger = false;
	this.roles = null;
	this.triggercount = 0;
	this.refreshtimeout = null;
};

Eden.AST.registerContext(Eden.AST.When);

/*Eden.AST.When.prototype.addTrigger = function(base, d, scope) {
	var trigs = base.triggers[d];
	if (trigs) {
		for (var i=0; i<trigs.length; i++) if (trigs[i].statement === this) return;
		base.triggers[d].push({base: base, statement: this, scope: scope});
	} else {
		trigs = [{base: base, statement: this, scope: scope}];
		base.triggers[d] = trigs;
	}
}*/

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

	this.numlines = 0;
	for (var i=0; i<this.prefix.length; i++) if (this.prefix.charAt(i) == "\n") this.numlines++;
	for (var i=0; i<this.postfix.length; i++) if (this.postfix.charAt(i) == "\n") this.numlines++;
}

Eden.AST.When.prototype.getLine = function() { return this.line; }

Eden.AST.When.prototype.doDebug = function() {
	return this.doxyComment && this.doxyComment.getControls()["@debug"];
}

Eden.AST.When.prototype.setScope = function (scope) {
	this.scope = scope;
}

Eden.AST.When.prototype.subscribeDynamic = function(position, dependency, scope) {
	console.log("Subscribe Dyn: ", dependency, scope);
	/*if (this.base.triggers[dependency]) {
		if (this.base.triggers[dependency].indexOf(this) == -1) {
			this.base.triggers[dependency].push(this);
		}
	} else {
		var trigs = [this];
		this.base.triggers[dependency] = trigs;
	}*/
	//var p = this;
	//while (p.parent) p = p.parent;
	scope.context.instance.project.addTrigger(this, dependency, scope);
	return scope.context.lookup(dependency);
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
		if (statement.warning && !this.warning) this.warning = statement.warning;
	}
}

Eden.AST.When.prototype.generate = function(ctx, scope, options) {
	var err = new Eden.RuntimeError(options.scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot use 'when' here");
	this.errors.push(err);
	options.scope.context.instance.emit("error", [EdenSymbol.defaultAgent,err]);
	return "";
}

Eden.AST.When.prototype.getScope = function(ctx) {
	// FIXME: Can't pre-compile because context changes. (fixed?)
	if (this.compScope === undefined) {
		if (this.scope) {
			try {
				this.compScope = new Function(["context","scope"], "var s = " + this.scope.generateConstructor(ctx, "scope", {bound: false}) + "; s.rebuild(); return s;");
			} catch (e) {

			}
		} else {
			// Just create an empty scope
			this.compScope = function(context, scope) {
				return new Eden.Scope(context, scope, [], false, null, false);
			};
		}
	}
	return this.compScope;
}

Eden.AST.When.prototype.compile = function(base, scope) {
	var cond = "try { return ";
	cond += this.expression.generate(this, "scope",{bound: false, scope: scope});
	cond += "; } catch(e) {}";

	try {
		this.compiled = new Function(["context","scope"], cond);
	} catch(e) {
		console.error("Error compiling when condition");
	}

	return "";
}

Eden.AST.When.prototype.trigger = function(scope) {
	if (!this.enabled) return;

	//var scope = eden.root.scope;  // FIXME:
	var base = eden.project.ast;
	if (this.active == false) {
		this.triggercount++;

		if (this.triggercount > 1000) {
			if (this.name == "*When" && this.parent && this.parent.name) this.name = this.parent.name + ">when";
			this.enabled = false;
			var err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.INFINITEWHEN, this);
			this.errors.push(err);
			err.line = this.line;
			scope.context.instance.emit("error", [this,err]);
			return;
		}

		// Used to detect infinite when loops. Max 1000 calls every 5s.
		if (!this.refreshtimeout) {
			this.refreshtimeout = setTimeout(()=>{
				this.refreshtimeout=null;
				this.triggercount=0;
			}, 5000);
		}

		this.active = true;
		scope = this.getScope(this)(scope.context,scope);
		//this.nscope = scope;  // Use previous scope?

		var res = this.executeReal(this, base, scope);

		if (res && (eden.peer === undefined || eden.peer.authoriseWhen(this))) {
			var me = this;
			base.executeStatements(res, -1, this, function() {
				me.active = false;
				if (me.retrigger) {
					me.retrigger = false;
					setTimeout(function(){me.trigger(scope);},0);
				}
			}, this, scope);
		} else {
			this.active = false;
		}
	} else {
		this.retrigger = true;
	}
}

Eden.AST.When.prototype.executeReal = function(ctx, base, scope) {
	//if (this.active) return;
	//this.active = true;
	this.executed = 1;
	if (!this.compiled) this.compile(base, scope);

	//console.log("Exec When: " + base.getSource(this));

	if (this.doxyComment && this.doxyComment.getControls()["@local"]) this.local = true;

	// Reset local variables
	this.locals = {};
	var me = this;

	if (scope.range) {
		scope.range = false;
		var sscripts = [];

		//if (scope.first()) {
			while (true) {
				var cscope = scope.clone();
				if (this.compiled.call(this, scope.context,scope)) {
					sscripts.push(new Eden.AST.ScopedScript(this.statement.statements, cscope));
					//console.log("RANGE WHEN:", scope);
				} else {
					this.executed = 2;
				}
				if (scope.next() == false) break;
			}
		//}

		scope.range = true;
		return sscripts;
	} else {
		if (this.compiled.call(this,scope.context,scope)) {
			//console.log(this.name, scope);
			if (scope !== scope.context.scope && this.statement.type == "script") {
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
		if (this.doxyComment && this.doxyComment.getControls()["@local"]) {
			this.local = true;
		}
		// Register agent with project.
		let project = scope.project();
		if (project) project.registerAgent(this);
	}
	this.enabled = true;
	scope = (this.nscope) ? this.nscope : this.getScope(this)(scope.context, scope);
	this.nscope = scope;
	if (agent && !agent.loading) base.executeStatements(this.executeReal(ctx,base,scope,agent), -1, this, undefined, this, scope);
}

Eden.AST.When.prototype.error = Eden.AST.fnEdenASTerror;

