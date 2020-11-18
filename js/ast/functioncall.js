Eden.AST.FunctionCall = function() {
	this.type = "functioncall";
	Eden.AST.BaseStatement.apply(this);

	this.lvalue = undefined;
	this.params = undefined;
};

Eden.AST.FunctionCall.prototype.setParams = function(params) {
	this.params = params;
	for (var i = 0; i < params.length; i++) {
		this.errors.push.apply(this.errors, params[i].errors);
	}
};

Eden.AST.FunctionCall.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.FunctionCall.prototype.generateArgs = function(ctx, scope) {
	var res = "[";
	if (this.params) {
		for (var i=0; i<this.params.length; i++) {
			var express = this.params[i].generate(ctx, scope, {bound: false});
			res += "("+express+")";
			if (i != this.params.length-1) res += ",";
		}
	}
	return res + "]";
}

Eden.AST.FunctionCall.prototype.generate = function(ctx, scope) {
	if (this.lvalue === undefined) {
		if (ctx && ctx.isdynamic) ctx.dynamic_source += "(";
		var res = "(";
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				var express = this.params[i].generate(ctx, scope, {bound: false});
				res += "("+express+")";
				if (i != this.params.length-1) {
					if (ctx && ctx.isdynamic) ctx.dynamic_source += ", ";
					res += ",";
				}
			}
		}
		if (ctx && ctx.isdynamic) ctx.dynamic_source += ")";
		return res + ")";
	} else {
		var lvalstr = this.lvalue.generate(ctx,scope);
		var res = scope + ".value("+lvalstr+").call(context.lookup("+lvalstr+")";

		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				res += ",";
				var express = this.params[i].generate(ctx, scope,{bound: false});
				res += "("+express+")";
				//if (i != this.params.length-1) res += ",";
			}
		}
		
		return res + ");";
	}
}

Eden.AST.FunctionCall.prototype.execute = function(ctx, base, scope, agent) {
	if (!this.lvalue) return;

	this.executed = 1;
	var func = "(function(context,scope,cache) { ";
	func += "let name = "+this.lvalue.generate(ctx,scope)+";\n";
	func += "let args = "+this.generateArgs(ctx, "scope")+";\n";

	if (eden.peer) {
		func += "eden.peer.callProcedure(name, args);\n";
	}

	func += "return scope.value(name).apply(context.lookup(name),args); })";

	try {
		return eval(func).call(ctx,eden.root,scope,scope.cache);
	} catch(e) {
		var err = new Eden.RuntimeError(base, Eden.RuntimeError.FUNCCALL, this, e);
		this.errors.push(err);
		err.line = this.line;
		eden.emit("error", [agent,err]);
		console.error(func);
		//throw e;
	}
}

Eden.AST.registerStatement(Eden.AST.FunctionCall);

