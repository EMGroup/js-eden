Eden.AST.BaseStatement = function() {
	this.start = 0;
	this.end = 0;
	this.parent = undefined;
	this.errors = [];
	this.executed = 0;
	this.line = 0;
	this.doxyComment = undefined;
}

Eden.AST.BaseStatement.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}
