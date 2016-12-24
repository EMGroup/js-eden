Eden.AST.Return = function() {
	this.type = "return";
	Eden.AST.BaseStatement.apply(this);

	this.result = undefined;
};

Eden.AST.Return.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Return.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Return.prototype.error = fnEdenASTerror;

Eden.AST.Return.prototype.setResult = function(result) {
	this.result = result;
	this.errors.push.apply(this.errors, result.errors);
}

Eden.AST.Return.prototype.generate = function(ctx,scope) {
	if (this.result) {
		var res = this.result.generate(ctx, scope,{bound: false, usevar: ctx.type == "scriptexpr"});
		return "return " + res + ";\n";
	} else {
		return "return;\n";
	}
}

Eden.AST.Return.prototype.execute = function(ctx,base,scope,agent) {
	// Can't use a return inside procedures/scripts.
	// TODO Might be desirable, somehow.
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Return not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

