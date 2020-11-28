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

Eden.AST.BinaryOp.prototype.toString = function(scope, state) {
	return `(${this.l.toString(scope, state)} ${this.op} ${this.r.toString(scope, state)})`;
}

Eden.AST.BinaryOp.prototype.generate = function(ctx, scope, options) {
	var opts = options; //{bound: false, usevar: options.usevar};
	//if (ctx && ctx.isdynamic) ctx.dynamic_source += "(";
	var left = this.l.generate(ctx, scope, opts);
	//if (ctx && ctx.isdynamic) ctx.dynamic_source += " " + this.op + " ";
	var right = this.r.generate(ctx, scope, opts);
	//if (ctx && ctx.isdynamic) ctx.dynamic_source += ")";
	var opstr;

	var tval = 0;
	// Type selection rules
	if (this.l.typevalue === this.r.typevalue) tval = this.l.typevalue;
	else if (this.l.typevalue === Eden.AST.TYPE_STRING || this.r.typevalue === Eden.AST.TYPE_STRING) tval = Eden.AST.TYPE_STRING;
	else if (this.l.typevalue === 0) tval = this.r.typevalue;
	else tval = this.l.typevalue;

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

	var op = this.op;

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
			if (this.l.typevalue === this.r.typevalue) {
				opstr = "RAW";
				op = " + ";
			} else opstr = "concatS";
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
		res = "(" + left + ") " + op + " (" + right + ")";
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

