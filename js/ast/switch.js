Eden.AST.Switch = function() {
	this.type = "switch";
	Eden.AST.BaseStatement.apply(this);

	this.expression = "";
	this.statement = undefined;
	this.compiled = undefined;
};

Eden.AST.Switch.prototype.setExpression = function(expression) {
	this.expression = expression;
	if (expression) this.errors.push.apply(this.errors, expression.errors);
};

Eden.AST.Switch.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
};

Eden.AST.Switch.prototype.generate = function(ctx, scope) {
	if (scope === undefined) scope = "eden.root.scope";
	var res = "switch(";
	res += this.expression.generate(ctx,scope,{bound: false});
	res += ") " + this.statement.generate(ctx,scope);
	return res;
};

Eden.AST.Switch.prototype.getSelector = function(ctx) {
	if (this.compiled) return this.compiled;

	var cond = "return ";
	cond += this.expression.generate(ctx, "scope",{bound: false});
	cond += ";";
	this.compiled = new Function(["context","scope"], cond);
	return this.compiled;
}

Eden.AST.Switch.prototype.execute = function(ctx, base, scope, agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Switch not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
};

Eden.AST.registerStatement(Eden.AST.Switch);

