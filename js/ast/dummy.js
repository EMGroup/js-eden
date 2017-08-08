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

Eden.AST.DummyStatement.prototype.setSource = function(start, end, src) {
	this.start = Math.max(this.start, start);
	this.end = end;
	if (this.source) {
		this.source += src;
	} else {
		this.source = src;
	}
}

Eden.AST.DummyStatement.prototype.buildID = function() {
	var hash = 0;
	var ch;
	var hashstr = this.source + ((this.previousSibling) ? this.previousSibling.getSource() : "");
	if (this.doxyComment) hashstr = this.doxyComment.content + hashstr;
	//if (this.parent) hashstr += this.parent.id;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}

	//if (this.previousSibling) {
		//if (this.previousSibling.id == 0) this.previousSibling.buildID();
	//	this.id = this.type + "@" + this.previousSibling.id; // +"@"+ hash;
	//} else {
		this.id = this.type + "@" + hash;
	//}
}

