Eden.AST.BinaryOp = function(op) {
	this.type = "binaryop";
	this.op = op;
	this.errors = [];
	this.l = undefined;
	this.r = undefined;
	this.warning = undefined;

	if (this.op == "&" || this.op == "and") this.op = "&&";
	else if (this.op == "|" || this.op == "or") this.op = "||";
}
Eden.AST.BinaryOp.prototype.left = Eden.AST.fnEdenASTleft;
Eden.AST.BinaryOp.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.BinaryOp.prototype.setRight = function(right) {
	this.r = right;
	this.errors.push.apply(this.errors, right.errors);
	if (right && right.warning) this.warning = right.warning;
}

Eden.AST.BinaryOp.prototype.generate = function(ctx, scope, options) {
	var opts = {bound: false, usevar: options.usevar, fulllocal: options.fulllocal};
	var left = this.l.generate(ctx, scope, opts);
	var right = this.r.generate(ctx, scope, opts);
	var opstr;

	switch(this.op) {
	case "//"	: opstr = "concat"; break;
	/*case "+"	: opstr = "add"; break;
	case "-"	: opstr = "subtract"; break;
	case "/"	: opstr = "divide"; break;
	case "*"	: opstr = "multiply"; break;*/
	case "=="	: opstr = "equal"; break;
	case "%"	: opstr = "mod"; break;
	case "^"	: opstr = "pow"; break;
	default		: opstr = "RAW";
	}

	var res;
	if (opstr != "RAW") {
		res = "rt."+opstr+"(("+left+"),("+right+"))";
	} else {
		res = "(" + left + ") " + this.op + " (" + right + ")";
	}

	if (options.bound) {
		return "new BoundValue("+res+", "+scope+")";
	} else {
		return res;
	}
}

Eden.AST.BinaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope",{bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

