Eden.AST.Require = function() {
	this.type = "require";
	this.errors = [];
	this.expression = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.Require.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Require.prototype.generate = function(ctx) {
	return "edenUI.loadPlugin("+this.expression.generate(ctx, "scope",{bound: false})+");";
}

Eden.AST.Require.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	edenUI.loadPlugin(this.expression.execute(ctx, base, scope));
}

Eden.AST.Require.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Require.prototype.error = fnEdenASTerror;

