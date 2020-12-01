Eden.AST.FunctionCall = function() {
	this.type = "functioncall";
	Eden.AST.BaseStatement.apply(this);
	Eden.AST.BaseExpression.apply(this);

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

Eden.AST.FunctionCall.prototype.toEdenString = function(scope, state) {
	var res = "(";

	for (var i=0; i<this.params.length; ++i) {
		if (i > 0) res += ", ";
		res += this.params[i].toEdenString(scope, state);
	}

	return res + ")";
}

Eden.AST.FunctionCall.prototype.generateArgs = function(ctx, scope, options) {
	var res = "[";
	if (this.params) {
		for (var i=0; i<this.params.length; i++) {
			var express = this.params[i].generate(ctx, scope, options);
			res += "("+express+")";
			if (i != this.params.length-1) res += ",";
		}
	}
	return res + "]";
}

Eden.AST.FunctionCall.prototype.generate = function(ctx, scope, options) {
	if (this.lvalue === undefined) {
		var res = `(${scope}).call(this`;
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				res += ",";
				var express = this.params[i].generate(ctx, scope, options);
				res += "("+express+")";
			}
		}
		return res + ")";
	} else {
		var lvalstr = this.lvalue.generate(ctx,scope, options);
		var res = `${scope}.value(${lvalstr})(${scope}).call(context.lookup(${lvalstr})`;

		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				res += ",";
				var express = this.params[i].generate(ctx, scope,options);
				res += "("+express+")";
				//if (i != this.params.length-1) res += ",";
			}
		}
		
		return res + ");";
	}
}

Eden.AST.registerExpression(Eden.AST.FunctionCall);

Eden.AST.FunctionCall.prototype.execute = function(ctx, base, scope, agent) {
	if (!this.lvalue) return;

	this.executed = 1;
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var argsstr = this.generateArgs(ctx, "scope", {scope: scope});

	if (eden.peer) {
		func += "eden.peer.callProcedure(name, args);\n";
	}

	try {
		var args = eval(argsstr);
		sym.value(scope)(scope).apply(sym, args);
		//return (new Function(["context","scope","cache"],func)).call(ctx,eden.root,scope,scope.cache);
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

