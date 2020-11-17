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

Eden.AST.UnaryOp.prototype.generate = function(ctx, scope, options) {
	if (this.op == "eval") {
		var val = this.r.execute(ctx, null, eden.root.scope);
		return Eden.edenCodeForValue(val);
	}

	var r = this.r.generate(ctx, scope, {bound: false, usevar: options.usevar});
	var res;	

	if (this.op == "!") {
		res = "!("+r+")";
	} else if (this.op == "&") {
		res = "context.lookup("+r+")";
		if (ctx && ctx.dependencies && this.r.name) ctx.dependencies[this.r.name] = true;
	} else if (this.op == "-") {
		res = "-("+r+")";
	} else if (this.op == "*") {
		//res = r + ".value("+scope+")";
		//res = "rt.deref(" + r + ", " + scope + ")";
		res = "this.subscribeDynValue(0, " + r + ", "+scope+")";
		//ctx.backtickCount++;
	}

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

Eden.AST.UnaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

