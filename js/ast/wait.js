Eden.AST.Wait = function() {
	this.type = "wait";
	Eden.AST.BaseStatement.apply(this);

	this.delay = undefined;
	this.compiled_delay = undefined;
};

Eden.AST.Wait.prototype.setDelay = function(delay) {
	this.delay = delay;
	if (delay && delay.errors.length > 0) {
		this.errors.push.apply(this.errors, delay.errors);
	}
}

Eden.AST.Wait.prototype.compile = function(ctx) {
	if (this.delay === undefined) return;
	if (this.compiled_delay) return;
	var source = "return ";
	source += this.delay.generate(ctx, "scope",{bound: false});
	source += ";";
	this.compiled_delay = new Function(["context","scope"],source);
}

Eden.AST.Wait.prototype.generate = function(ctx, scope, options) {
	var err = new Eden.RuntimeError(options.scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot use 'wait' here");
	this.errors.push(err);
	options.scope.context.instance.emit("error", [EdenSymbol.defaultAgent,err]);
	return "";
	//return "yield "+this.delay+";";
}

Eden.AST.registerStatement(Eden.AST.Wait);

