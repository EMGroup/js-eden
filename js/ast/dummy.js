Eden.AST.DummyStatement = function() {
	this.type = "dummy";
	Eden.AST.BaseStatement.apply(this);
}

Eden.AST.DummyStatement.prototype.generate = function() {
	return "";
}

Eden.AST.DummyStatement.prototype.execute = function() {
}

Eden.AST.registerStatement(Eden.AST.DummyStatement);

