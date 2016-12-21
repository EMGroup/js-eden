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

Eden.AST.BaseStatement.setSource = function(start, end) {
	this.start = start;
	this.end = end;
	var p = this;
	while (p.parent) p = p.parent;
	if (p.base) {
		this.source = p.base.getSource(this);
	} else {
		console.error("NO BASE", this, p.type);
	}
}

Eden.AST.BaseStatement.getSource = function() {
	return this.source;
}

