Eden.AST.Default = function() {
	this.type = "default";
	Eden.AST.BaseStatement.apply(this);
};

Eden.AST.Default.prototype.error = fnEdenASTerror;

Eden.AST.Default.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Default.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Default.prototype.generate = function(ctx, scope) {
	return "default: ";
}

Eden.AST.Default.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Default not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

