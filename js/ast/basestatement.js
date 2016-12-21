Eden.AST.BaseStatement = function() {
	this.start = 0;
	this.end = 0;
	this.parent = undefined;
	this.errors = [];
	this.executed = 0;
	this.line = 0;
	this.doxyComment = undefined;
	this.lock = 0;
	this.source = undefined;
}

Eden.AST.BaseStatement.setSource = function(start, end, src) {
	this.start = start;
	this.end = end;
	this.source = src;
}

Eden.AST.BaseStatement.getSource = function() {
	return this.source;
}

