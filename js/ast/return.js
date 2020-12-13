Eden.AST.Return = function() {
	this.type = "return";
	Eden.AST.BaseStatement.apply(this);

	this.result = undefined;
};

Eden.AST.Return.prototype.setResult = function(result) {
	this.result = result;
	this.errors.push.apply(this.errors, result.errors);
}

Eden.AST.Return.prototype.toEdenString = function(scope, state) {
	return `return ${this.result.toEdenString(scope,state)};`;
}

Eden.AST.Return.prototype.generate = function(ctx,scope,options) {
	if (this.result) {
		var res = this.result.generate(ctx, scope, options);
		return "return " + res + ";\n";
	} else {
		return "return;\n";
	}
}

Eden.AST.Return.prototype.execute = function(ctx,base,scope,agent) {
	ctx.result = this.result.execute(ctx, base, scope, agent);
	return -1;
}

Eden.AST.registerStatement(Eden.AST.Return);

