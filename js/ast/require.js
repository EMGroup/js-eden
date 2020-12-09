Eden.AST.Require = function() {
	this.type = "require";
	Eden.AST.BaseStatement.apply(this);

	this.expression = undefined;
}

Eden.AST.Require.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Require.prototype.generate = function(ctx,scope,options) {
	return "edenUI.loadPlugin("+this.expression.generate(ctx, scope,options)+");";
}

Eden.AST.Require.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	edenUI.loadPlugin(this.expression.execute(ctx, base, scope));
}

Eden.AST.registerStatement(Eden.AST.Require);

