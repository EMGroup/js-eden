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

Eden.AST.TernaryOp.prototype.generate = function(ctx, scope, options) {
	var cond = this.condition.generate(ctx, scope, {bound: false, usevar: options.usevar, fulllocal: options.fulllocal});
	var first = this.first.generate(ctx, scope, options);
	var second = this.second.generate(ctx, scope, options);

	return "(("+cond+")?("+first+"):("+second+"))";
}

Eden.AST.TernaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope",{bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

