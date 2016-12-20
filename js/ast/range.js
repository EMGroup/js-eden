Eden.AST.Range = function(expression) {
	this.type = "range";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	//this.scopes = [];
	//this.backtickCount = 0;
	//this.executed = 0;
	//this.compiled = undefined;
	//this.dirty = false;
	//this.value = undefined;
	//this.dependencies = {};
	//this.bound = false;
};

Eden.AST.Range.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Range.prototype.setSecond = function(expr) {
	this.second = expr;
	if (expr && expr.errors) this.errors.push.apply(this.errors, expr.errors);
}

Eden.AST.Range.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Range.prototype.error = fnEdenASTerror;

