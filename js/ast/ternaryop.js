Eden.AST.TernaryOp = function(op) {
	this.type = "ternaryop";
	this.op = op;
	this.errors = [];
	this.first = undefined;
	this.second = undefined;
	this.condition = undefined;
	this.warning = undefined;
}
Eden.AST.TernaryOp.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.TernaryOp.prototype.getDependencies = function(out) {
	this.condition.getDependencies(out);
	this.first.getDependencies(out);
	this.second.getDependencies(out);
}

Eden.AST.TernaryOp.prototype.setFirst = function(first) {
	this.first = first;
	if (first.errors.length > 0) {
		this.errors.push.apply(this.errors, first.errors);
	}
	if (first && first.warning) this.warning = first.warning;
};

Eden.AST.TernaryOp.prototype.setSecond = function(second) {
	this.second = second;
	if (second.errors.length > 0) {
		this.errors.push.apply(this.errors, second.errors);
	}
	if (second && second.warning) this.warning = second.warning;
};

Eden.AST.TernaryOp.prototype.setCondition = function(cond) {
	this.condition = cond;
	if (cond.errors.length > 0) {
		this.errors.push.apply(this.errors, cond.errors);
	}
	if (cond && cond.warning) this.warning = cond.warning;
};

Eden.AST.TernaryOp.prototype.left = function(pleft) {
	if (this.condition === undefined) {
		this.condition = pleft;
	} else {
		this.first = pleft;
	}
	if (pleft && pleft.warning) this.warning = pleft.warning;
};

Eden.AST.TernaryOp.prototype.generate = function(ctx, scope, mode) {
	var cond = this.condition.generate(ctx, scope, mode);
	var first = this.first.generate(ctx, scope, mode);
	var second = this.second.generate(ctx, scope, mode);

	return "(("+cond+")?("+first+"):("+second+"))";
}

Eden.AST.TernaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope",Eden.AST.MODE_DYNAMIC);
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

