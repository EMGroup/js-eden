Eden.AST.Break = function() {
	this.type = "break";
	Eden.AST.BaseStatement.apply(this);
};

Eden.AST.Break.prototype.error = fnEdenASTerror;

Eden.AST.Break.prototype.setSource = Eden.AST.BaseStatement.setSource();

Eden.AST.Break.prototype.generate = function(ctx, scope) {
	return "break; ";
}

Eden.AST.Break.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Break not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

