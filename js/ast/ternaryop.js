Eden.AST.TernaryOp = function(op) {
	this.type = "ternaryop";
	Eden.AST.BaseExpression.apply(this);

	this.op = op;
	this.first = undefined;
	this.second = undefined;
	this.condition = undefined;
}

Eden.AST.TernaryOp.prototype.setFirst = function(first) {
	this.first = first;
	this.mergeExpr(first);
};

Eden.AST.TernaryOp.prototype.setSecond = function(second) {
	this.second = second;
	this.mergeExpr(second);
};

Eden.AST.TernaryOp.prototype.setCondition = function(cond) {
	this.condition = cond;
	// Needs a manual merge
	if (!cond) return;
	this.isconstant = this.isconstant && cond.isconstant;
	this.isdependant = this.isdependant || cond.isdependant;
	this.isdynamic = this.isdynamic || cond.isdynamic;
	if (cond.errors.length > 0) this.errors.push.apply(this.errors, cond.errors);
	if (cond.warning && !this.warning) this.warning = cond.warning;
};

Eden.AST.TernaryOp.prototype.left = function(pleft) {
	if (this.condition === undefined) {
		this.setCondition(pleft);
	} else {
		this.setFirst(pleft);
	}
};

Eden.AST.TernaryOp.prototype.toEdenString = function(scope, state) {
	return `(${this.first.toEdenString(scope,state)} if ${this.condition.toEdenString(scope,state)} else ${this.second.toEdenString(scope,state)})`;
}

Eden.AST.TernaryOp.prototype.generate = function(ctx, scope, options) {
	var first = this.first.generate(ctx, scope, options);
	var cond = this.condition.generate(ctx, scope, options);
	var second = this.second.generate(ctx, scope, options);

	return "(("+cond+")?("+first+"):("+second+"))";
}

Eden.AST.registerExpression(Eden.AST.TernaryOp);
