/**
 * Unary Operators.
 */
Eden.AST.UnaryOp = function(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
Eden.AST.UnaryOp.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.UnaryOp.prototype.getDependencies = function(out) {
	this.r.getDependencies(out);
}

Eden.AST.UnaryOp.prototype.generate = function(ctx, scope, mode) {
	var r = this.r.generate(ctx, scope, mode);
	var res;	

	if (this.op == "!") {
		res = "!("+r+")";
	} else if (this.op == "&") {
		res = "context.lookup("+r+")";
		console.log(res);
	} else if (this.op == "-") {
		res = "-("+r+")";
	} else if (this.op == "*") {
		res = r + ".value("+scope+")";
	}

	return res;
}

Eden.AST.UnaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", Eden.AST.MODE_DYNAMIC);
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

