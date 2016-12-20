Eden.AST.DummyStatement = function() {
	this.type = "dummy";
	this.parent = undefined;
	this.errors = [];
	
}

Eden.AST.DummyStatement.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.DummyStatement.prototype.generate = function() {
	return "";
}

Eden.AST.DummyStatement.prototype.execute = function() {
}

Eden.AST.DummyStatement.prototype.error = fnEdenASTerror;

