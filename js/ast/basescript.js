Eden.AST.BaseScript = function() {
	Eden.AST.BaseStatement.apply(this);
	this.statements = [];
	this.oldstats = undefined;
	this.patch = undefined;
	this.parameters = undefined;
	this.locals = undefined;
}

