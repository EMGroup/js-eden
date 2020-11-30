Eden.AST.While = function() {
	this.type = "while";
	Eden.AST.BaseStatement.apply(this);

	this.condition = undefined;
	this.statement = undefined;
	this.compiled = undefined;
};

Eden.AST.While.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

Eden.AST.While.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.While.prototype.generate = function(ctx, scope, options) {
	var res = "while (" + this.condition.generate(ctx,scope, options);
	res += ") ";
	res += this.statement.generate(ctx, scope, options) + "\n";
	return res;
}

Eden.AST.While.prototype.getCondition = function(ctx, scope) {
	if (this.compiled) {
		return this.compiled;
	} else {
		var express = this.condition.generate(ctx, "scope", {bound: false, scope: scope});
		var expfunc = eval("(function(context,scope){ return " + express + "; })");
		this.compiled = expfunc;
		return expfunc;
	}
}

Eden.AST.While.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	// A tail recursive while loop...
	if (this.getCondition(ctx)(eden.root,scope)) {
		return [this.statement, this];
	}
}

Eden.AST.registerStatement(Eden.AST.While);

