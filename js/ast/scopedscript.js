Eden.AST.ScopedScript = function(statements, scope) {
	this.type = "scopedscript";
	this.statements = statements;
	this.scope = scope;
}

Eden.AST.ScopedScript.prototype.execute = function(ctx,base,scope,agent) {
	return this.statements;
}

