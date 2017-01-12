Eden.AST.BaseStatement = function() {
	this.start = 0;
	this.end = 0;
	this.parent = undefined;
	this.errors = [];
	this.executed = 0;
	this.numlines = -1;
	this.doxyComment = undefined;
	this.lock = 0;
	this.source = undefined;
	this.id = 0;
	this.stamp = 0;
}

Eden.AST.BaseStatement.hasErrors = function() {
	return this.errors.length > 0;
}

Eden.AST.BaseStatement.getNumberOfLines = function() {
	return this.numlines;
}

/** Get start line relative to immediate parent. */
Eden.AST.BaseStatement.getStartLine = function(relative) {
	return (this.parent) ? this.parent.getRelativeLine(this, relative) : -1;
}

Eden.AST.BaseStatement.getEndLine = function(relative) {
	return this.getStartLine(relative) + this.getNumberOfLines();
}

Eden.AST.BaseStatement.getRange = function(relative) {
	var sl = this.getStartLine(relative);
	return [sl,sl+this.getNumberOfLines()];
}

Eden.AST.BaseStatement.setSource = function(start, end, src) {
	this.start = start;
	this.end = end;
	this.source = src;

	var hash = 0;
	var ch;
	var len = src.length;
	for (var i=0; i<len; i++) {
		ch = src.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}

	if (this.name && this.type != "do") {
		this.id = this.name +"@"+ hash;
	} else {
		this.id = this.type +"@"+ hash;
	}
}

Eden.AST.BaseStatement.getSource = function() {
	return this.source;
}

Eden.AST.BaseStatement.getOrigin = function() {
	var p = this;
	while (p.parent) p = p.parent;
	return p.base.origin;
}

