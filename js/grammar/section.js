Eden.AST.prototype.pSECTION = function() {
	var depth = 1;
	while (this.stream.peek() == 35) {
		depth++;
		this.stream.skip();
	}
	var name = this.stream.readLine().trim();
	if (this.stream.valid()) {
		this.stream.position--;
		this.stream.line--;
	}
	//console.log("SECTION",name);
	this.next();
	
	stat = new Eden.AST.Section();
	stat.name = name;
	stat.depth = depth;
	//stat.doxyComment = this.lastDoxyComment;
	//this.lastDoxyComment = undefined;
	return stat;
}