Eden.AST.After = function () {
	this.type = "after";
	this.errors = [];
	this.expression = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;

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

Eden.AST.After.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.After.prototype.error = fnEdenASTerror;

