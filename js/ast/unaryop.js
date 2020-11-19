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
		var tmpconst = ctx.isconstant;
		var tmpdep = ctx.dependencies;
		var tmpdynsrc = ctx.dynamic_source;
		ctx.dependencies = {};
		var val = this.r.execute(ctx, null, eden.root.scope);
		ctx.isconstant = tmpconst;
		ctx.dependencies = tmpdep;
		val = Eden.edenCodeForValue(val);
		if (ctx && ctx.isdynamic) ctx.dynamic_source = tmpdynsrc + val;
		return val;
	}

	if (ctx && ctx.isdynamic) ctx.dynamic_source += this.op;

	var tmpconst;
	if (ctx) {
		tmpconst = ctx.isconstant;
		ctx.isconstant = true;
	}

	var r = this.r.generate(ctx, scope, {bound: false, usevar: options.usevar});
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
				ctx.dependencies[this.r.name] = true;
				ctx.isconstant = false;
			} else if (wasconst) {
				var btickval = "ERROR";
				try {
					btickval = eval(r);
				} catch (e) {

				}
				if (ctx.dependencies) ctx.dependencies[btickval] = true;
				btickval = JSON.stringify(btickval);
				r = btickval;
				ctx.isconstant = false;
			} else {
				r = "this.subscribeDynValue(0, " + r + ", "+scope+")";
				ctx.isconstant = false;
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

Eden.AST.UnaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

