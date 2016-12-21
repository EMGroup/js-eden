/**
 * "after" statement. This is deprecated/
 */
Eden.AST.After = function () {
	this.type = "after";
	Eden.AST.BaseStatement.apply(this);
	this.expression = undefined;
	this.statement = undefined;

	console.error("DEPRECATED USE OF AFTER");
}

Eden.AST.After.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.After.prototype.setStatement = function(state) {
	this.statement = state;
	if (state.errors.length > 0) {
		this.errors.push.apply(this.errors,state.errors);
	}
}

Eden.AST.After.prototype.generate = function(ctx, scope) {
	if (scope === undefined) scope = "eden.root.scope";
	var statement = "(function() {" + this.statement.generate(ctx, scope, {bound: false})+"})";
	var express = this.expression.generate(ctx,scope,{bound: false});
	return "setTimeout("+statement+", "+express+");\n";
}

Eden.AST.After.prototype.execute = function(ctx, base, scope) {
	var statement = "(function() { var scope = eden.root.scope;\n" + this.statement.generate(ctx, "root.scope")+"})";
	setTimeout(eval(statement),this.expression.execute(ctx,base,scope));
}

Eden.AST.After.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.After.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.After.prototype.error = fnEdenASTerror;

