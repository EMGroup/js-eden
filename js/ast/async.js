/**
 * "async" expression node.
 */
Eden.AST.Async = function () {
	this.type = "async";
	Eden.AST.BaseExpression.apply(this);
	
	this.expression = null;
}

Eden.AST.Async.prototype.setExpression = function(express) {
	this.expression = express;
	if (express && express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Async.prototype.generate = function(ctx, scope) {
	return this.expression.generate(ctx,scope,{bound: false});
}

Eden.AST.Async.prototype.execute = function(ctx, base, scope) {
	
}

Eden.AST.registerExpression(Eden.AST.Async);
