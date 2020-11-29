Eden.AST.Length = function() {
	this.type = "length";
	Eden.AST.BaseExpression.apply(this);
	this.l = undefined;
	this.typevalue = Eden.AST.TYPE_NUMBER;
}

Eden.AST.Length.prototype.left = function(left) {
	this.l = left;
	this.mergeExpr(left);
	this.typevalue = Eden.AST.TYPE_NUMBER;
}

Eden.AST.Length.prototype.toEdenString = function(scope, state) {
	return `${this.l.toEdenString(scope, state)}#`;
}

Eden.AST.Length.prototype.generate = function(ctx, scope, options) {
	var left = this.l.generate(ctx, scope, options);

	if (options.bound) {
		return "new BoundValue(rt.length("+left+"), "+scope+")";
	} else {
		return "rt.length(" + left + ")";
	}
}

Eden.AST.registerExpression(Eden.AST.Length);
