Eden.AST.Switch = function() {
	this.type = "switch";
	Eden.AST.BaseStatement.apply(this);

	this.expression = "";
	this.statement = undefined;
	this.compiled = undefined;
};

Eden.AST.Switch.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Switch.prototype.getSource = Eden.AST.BaseStatement.getSource;

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

	var cond = "(function(context,scope) { return ";
	cond += this.expression.generate(ctx, "scope",{bound: false});
	cond += ";})";
	this.compiled = eval(cond);
	return this.compiled;
}

Eden.AST.Switch.prototype.execute = function(ctx, base, scope, agent) {
	// TODO REWORK FOR NEW EXECUTION PROCESS
	/*var swi = "(function(context,scope) { ";
	swi += this.generate(ctx, "scope");
	swi += " })";
	eval(swi)(eden.root, scope);*/

	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Switch not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
};

Eden.AST.Switch.prototype.error = fnEdenASTerror;

