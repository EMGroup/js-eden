Eden.AST.DummyStatement = function() {
	this.type = "dummy";
	Eden.AST.BaseStatement.apply(this);
}

Eden.AST.DummyStatement.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.DummyStatement.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.DummyStatement.prototype.generate = function() {
	return "";
}

Eden.AST.DummyStatement.prototype.execute = function() {
}

Eden.AST.DummyStatement.prototype.error = fnEdenASTerror;

