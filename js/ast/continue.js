Eden.AST.Continue = function() {
	this.type = "continue";
	Eden.AST.BaseStatement.apply(this);
};

Eden.AST.Continue.prototype.error = fnEdenASTerror;

Eden.AST.Continue.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Declarations.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Continue.prototype.generate = function(ctx, scope) {
	return "continue; ";
}

Eden.AST.Continue.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Continue not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

