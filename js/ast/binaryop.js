Eden.AST.BinaryOp = function(op) {
	this.type = "binaryop";
	Eden.AST.BaseExpression.apply(this);
	this.op = op;
	this.l = undefined;
	this.r = undefined;

	if (this.op == "&" || this.op == "and") this.op = "&&";
	else if (this.op == "|" || this.op == "or") this.op = "||";

	switch(op) {
	case ">"	:
	case "<"	:
	case ">="	:
	case "<="	:
	case "=="	:
	case "!="	:	this.typevalue = Eden.AST.TYPE_BOOLEAN; break;
	case "*"	:
	case "/"	:
	case "^"	:
	case "%"	:	this.typevalue = Eden.AST.TYPE_NUMBER; break;
	}
}
Eden.AST.BinaryOp.prototype.left = Eden.AST.fnEdenASTleft;

Eden.AST.BinaryOp.prototype.setRight = function(right) {
	this.r = right;
	this.mergeExpr(right);
}

Eden.AST.BinaryOp.prototype.toEdenString = function(scope, state) {
	return `(${this.l.toEdenString(scope, state)} ${this.op} ${this.r.toEdenString(scope, state)})`;
}

Eden.AST.BinaryOp.prototype.generate = function(ctx, scope, options) {
	var opts = options;
	var left = this.l.generate(ctx, scope, opts);
	var right = this.r.generate(ctx, scope, opts);
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
            // Raw ^ means XOR not power.
            if (this.op !== "^") {
			    opstr = "RAW";
            }
		} else {
			if (this.op === "+") {
				opstr = "addA";
			} else if (this.op === "-") {
				opstr = "subtractA";
			} else if (this.op === "==") {
				opstr = "RAW";
			} else if (this.op === "!=") {
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


	return res;
}

Eden.AST.registerExpression(Eden.AST.BinaryOp);
