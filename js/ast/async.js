/**
 * "async" expression node.
 */
Eden.AST.Async = function () {
	this.type = "async";
	this.errors = [];
	this.expression = null;
	this.warning = undefined;
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

Eden.AST.Async.prototype.error = Eden.AST.fnEdenASTerror;
