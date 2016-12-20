Eden.AST.FunctionCall = function() {
	this.type = "functioncall";
	this.parent = undefined;
	this.errors = [];
	this.lvalue = undefined;
	this.params = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.line = undefined;
};

Eden.AST.FunctionCall.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

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

Eden.AST.FunctionCall.prototype.generate = function(ctx, scope) {
	if (this.lvalue === undefined) {
		var res = "(";
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				var express = this.params[i].generate(ctx, scope, {bound: false});
				res += "("+express+")";
				if (i != this.params.length-1) res += ",";
			}
		}
		return res + ")";
	} else {
		var lvalstr = this.lvalue.generate(ctx);
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
	this.executed = 1;
	var func = "(function(context,scope) { return " + this.generate(ctx, "scope") + "; })";

	try {
		return eval(func).call(ctx,eden.root,scope);
	} catch(e) {
		var err = new Eden.RuntimeError(base, Eden.RuntimeError.FUNCCALL, this, e);
		this.errors.push(err);
		err.line = this.line;
		Eden.Agent.emit("error", [agent,err]);
		//throw e;
	}
}

Eden.AST.FunctionCall.prototype.error = fnEdenASTerror;
