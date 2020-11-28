Eden.AST.BinaryOp = function(op) {
	this.type = "binaryop";
	this.op = op;
	this.errors = [];
	this.l = undefined;
	this.r = undefined;
	this.warning = undefined;
	this.typevalue = Eden.AST.TYPE_UNKNOWN;

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
	var opts = options; //{bound: false, usevar: options.usevar};
	if (ctx && ctx.isdynamic) ctx.dynamic_source += "(";
	var left = this.l.generate(ctx, scope, opts);
	if (ctx && ctx.isdynamic) ctx.dynamic_source += " " + this.op + " ";
	var right = this.r.generate(ctx, scope, opts);
	if (ctx && ctx.isdynamic) ctx.dynamic_source += ")";
	var opstr;

	var tval = (this.l.typevalue === this.r.typevalue) ? this.l.typevalue : (this.l.typevalue === Eden.AST.TYPE_UNKNOWN) ? this.r.typevalue : this.l.typevalue;

	switch(this.op) {
	case "//"	: opstr = "concat"; break;
	case "+"	: opstr = "add"; break;
	case "-"	: opstr = "subtract"; break;
	case "/"	: opstr = "divide"; break;
	case "*"	: opstr = "multiply"; break;
	case "=="	: opstr = "equal"; break;
	case "!="	: opstr = "notequal"; break;
	case "%"	: opstr = "mod"; break;
	case "^"	: opstr = "pow"; break;
	default		: opstr = "RAW";
	}

	if (tval === Eden.AST.TYPE_NUMBER) {
		if (this.l.typevalue === this.r.typevalue) {
			opstr = "RAW";
		} else {
			if (this.op == "+") {
				opstr = "addA";
			} else if (this.op == "-") {
				opstr = "subtractA";
			} else if (this.op == "==") {
				opstr = "RAW";
			} else if (this.op == "!=") {
				opstr = "RAW";
			} else {
			}
		}
	} else if (tval === Eden.AST.TYPE_STRING) {
		if (this.op == "//") {
			opstr = "concatS";
		} else if (this.op == "==") {
			opstr = "RAW";
		} else if( this.op == "!=") {
			opstr = "RAW";
		}
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
	var rhs = "return ";
	rhs += this.generate(ctx, "scope",{bound: false});
	rhs += ";";
	return (new Function(["context","scope"],rhs))(eden.root,scope);
}

