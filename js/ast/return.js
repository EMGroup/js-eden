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
	// Can't use a return inside procedures/scripts.
	// TODO Might be desirable, somehow.
	var err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Return not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

Eden.AST.registerStatement(Eden.AST.Return);

