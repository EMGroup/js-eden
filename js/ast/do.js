Eden.AST.Do = function() {
	this.type = "do";
	Eden.AST.BaseStatement.apply(this);

	this.name = undefined;
	this.script = undefined;
	this.parameters = [];
	this.params = []; // The evaluated params
	this.scope = undefined;
	this.compScope = undefined;
	this.nscope = undefined;
	this.selector = undefined;
	this.attribs = {atomic: true};
};

Eden.AST.Do.attributes = {
	"atomic": true,
	"nonatomic": true
};

Eden.AST.Do.prototype.addParameter = function(express) {
	this.parameters.push(express);
	if (express && express.errors.length > 0) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.Do.prototype.setScript = function(script) {
	this.script = script;
	if (this.script && this.script.errors.length > 0) {
		this.errors.push.apply(this.errors, script.errors);
	}
}

Eden.AST.Do.prototype.setAttribute = function(name, value) {
	if (!this.attribs) this.attribs = {};
	this.attribs[name] = value;
}

Eden.AST.Do.prototype.setName = function(name) {
	if (name && name.errors) {
		this.errors.push.apply(this.errors, name.errors);
	}
	this.name = name;
}

Eden.AST.Do.prototype.setScope = function(scope) {
	this.scope = scope;
	if (scope && scope.errors.length > 0) {
		this.errors.push.apply(this.errors, scope.errors);
	}
}

Eden.AST.Do.prototype.getScope = function(ctx) {
	if (this.scope && this.compScope === undefined) {
		try {
			this.compScope = eval("(function (context, scope) { var s = " + this.scope.generateConstructor(ctx, "scope") + "; s.rebuild(); return s; })");
		} catch (e) {

		}
	}
	return this.compScope;
}

/*Eden.AST.Do.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

Eden.AST.Do.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}*/



Eden.AST.Do.prototype.generate = function(ctx) {
	/*var res = "do\n";
	res += this.statement.generate(ctx) + "\n";
	res += "while (" + this.condition.generate(ctx,"scope");
	if (this.condition.doesReturnBound && this.doesReturnBound()) {
		res += ".value";
	}
	res += ");";
	return res;*/
	return "";
}

Eden.AST.Do.prototype.getParameters = function(ctx,base,scope) {
	var params = [];
	for (var i=0; i<this.parameters.length; i++) {
		params.push(this.parameters[i].execute(ctx,base,scope));
	}
	return params;
}


Eden.AST.Do.prototype.execute = function(ctx,base,scope, agent) {
	this.executed = 1;

	var script;
	if (this.script) {
		script = this.script;
	} else {
		script = base.getActionByName(this.name);
	}

	if (script) {
		return script.execute(ctx,base, scope, agent);
	} else {
		this.executed = 3;
		var err = new Eden.RuntimeError(base, Eden.RuntimeError.ACTIONNAME, this, "Action '"+this.name+"' does not exist");
		if (this.parent) this.parent.executed = 3;
		err.line = this.line;
		this.errors.push(err);
		Eden.Agent.emit("error", [agent,err]);
	}
}

Eden.AST.registerStatement(Eden.AST.Do);

