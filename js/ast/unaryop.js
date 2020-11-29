/**
 * Unary Operators.
 */
Eden.AST.UnaryOp = function(op, right) {
	this.type = "unaryop";
	Eden.AST.BaseExpression.apply(this);
	this.op = op;
	this.r = right;
	this.mergeExpr(right);
}
Eden.AST.UnaryOp.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.UnaryOp.prototype.toEdenString = function(scope, state) {
	if (this.op == "sub") {
		var ctx = {dependencies: {}, isconstant: true, scopes: []};
		var expr = "return "+this.r.generate(ctx, "scope", {bound: false, scope: scope})+";";
		var f = new Function(["context","scope"], expr);
		var val = f(eden.root, scope);
		return Eden.edenCodeForValue(val);
	}

	switch (this.op) {
	case "*"	:
	case "&"	: return `${this.op}${this.r.toEdenString(scope, state)}`;
	case "!"	:
	case "-"	: return `${this.op}(${this.r.toEdenString(scope, state)})`;
	}
	
}

Eden.AST.UnaryOp.prototype.generate = function(ctx, scope, options) {
	if (this.op == "sub") {
		var state = {
			isconstant: true,
			locals: ctx.locals
		}
		var val = Eden.AST.executeExpressionNode(this.r, (options.scope) ? options.scope : eden.root.scope, state);
		// TODO: If AST returned, call generate on that.
		val = Eden.edenCodeForValue(val);
		ctx.dependant = true;  // Mark as context dependant source
		return val;
	}

	var tmpconst;
	if (ctx) {
		tmpconst = ctx.isconstant;
		ctx.isconstant = true;
	}

	var r = this.r.generate(ctx, scope, options);
	var res;
	
	var wasconst = false;

	if (ctx) {
		wasconst = ctx.isconstant;
		ctx.isconstant = tmpconst && wasconst;
	}

	if (this.op == "!") {
		res = "!("+r+")";
	} else if (this.op == "&") {
		if (ctx && ctx.dependencies) {
			if (this.r.name) {
				//ctx.dependencies[this.r.name] = true;
				//ctx.isconstant = false;
			} else if (wasconst) {
				var btickval = "ERROR";
				try {
					btickval = (new Function("return "+r+";"))();
					console.log("Btick eval "+r);
				} catch (e) {
					console.error("Backtick evaluation error",e);
				}
				//if (ctx.dependencies) ctx.dependencies[btickval] = true;
				btickval = JSON.stringify(btickval);
				r = btickval;
				//ctx.isconstant = false;
			} else {
				//r = "this.subscribeDynValue(0, " + r + ", "+scope+")";
				//ctx.isconstant = false;
			}
		}
		res = "context.lookup("+r+")";
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

Eden.AST.registerExpression(Eden.AST.UnaryOp);

