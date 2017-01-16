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

Eden.AST.BaseStatement.buildID = function() {
	var hash = 0;
	var ch;
	var hashstr = this.source;
	//if (this.parent) hashstr += this.parent.id;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}

	if (this.name && this.type != "do") {
		this.id = this.name +"@"+ hash;
	} else if (this.lvalue) {
		this.id = this.lvalue.name + "@" + hash;
	} else {
		this.id = this.type +"@"+ hash;
	}
}

Eden.AST.BaseStatement.addIndex = function() {
	if (this.type == "dummy") console.trace("ADDING DUMMY INDEX");
	this.buildID();
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].addIndex();
		}
	}
	Eden.Index.update(this);
}

Eden.AST.BaseStatement.removeIndex = function() {
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].removeIndex();
		}
	}
	Eden.Index.remove(this);
}

Eden.AST.BaseStatement.destroy = function() {
	if (this.executed < 1) Eden.Index.remove(this);
	this.parent = undefined;
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].destroy();
		}
	}
	this.executed = -1;
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
}

Eden.AST.BaseStatement.getSource = function() {
	return this.source;
}

Eden.AST.BaseStatement.getOrigin = function() {
	var p = this;
	while (p.parent) p = p.parent;
	if (p.base) return p.base.origin;
	else return undefined;
}

