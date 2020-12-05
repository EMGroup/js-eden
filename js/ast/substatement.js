Eden.AST.SubStatement = function() {
	this.type = "substat";
	Eden.AST.BaseStatement.apply(this);
	this.kind = "parse";
	this.expression = undefined;
};

Eden.AST.SubStatement.prototype.setOperation = function(kind, expr) {
	this.expression = expr;
	if (expr && expr.errors.length > 0) this.errors.push.apply(this.errors, expr.errors);
}

Eden.AST.SubStatement.prototype.toEdenString = function(scope, state) {
	var val = Eden.AST.executeExpressionNode(this.expression, scope, state);
	return val;
}

Eden.AST.SubStatement.prototype.generate = function(ctx,scope,options) {
	var state = {
		isconstant: true,
		locals: ctx.locals,
		scope: options.scope,
		symbol: options.symbol
	};
	var val = Eden.AST.executeExpressionNode(this.expression, options.scope, state);

	var stat = Eden.AST.parseStatement(val);
	console.log("PARSE STRING = " + val, stat);
	return stat.generate(ctx, scope, options);
}

Eden.AST.SubStatement.prototype.execute = function(ctx,base,scope,agent) {
	// Can't use a return inside procedures/scripts.
	// TODO Might be desirable, somehow.
	var err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Sub-statements not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

Eden.AST.registerStatement(Eden.AST.SubStatement);

