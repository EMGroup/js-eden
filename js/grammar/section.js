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
	} else {
		this.errors.push(new Eden.SyntaxError(this,Eden.SyntaxError.NEWLINE));
	}
	//console.log("SECTION",name);
	this.next();
	
	stat = new Eden.AST.Section();
	stat.setName(name);
	stat.depth = depth;
	//stat.doxyComment = this.lastDoxyComment;
	//this.lastDoxyComment = undefined;
	return stat;
}

Eden.AST.prototype.pCUSTOM_SECTION = function() {
	this.next();
	if (this.token != "OBSERVABLE") {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
		return lit;
	}

	var endtoken = this.data.value;

	// Must be at end of a line
	if (this.stream.get() != 10) {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
		return lit;
	}
	//this.stream.line++;

	// Scan looking for endtoken
	var res = "";
	while (this.stream.valid()) {
		var cachepos = this.stream.position;
		var line = this.stream.readLine();
		if (line.startsWith("%eden")) {
			this.stream.position = cachepos + 5;
			break;
		}
		res += line;
	}

	if (!this.stream.valid()) {
		this.errors.push(new Eden.SyntaxError(this,Eden.SyntaxError.NEWLINE));
	}

	this.next();

	var block = new Eden.AST.CustomBlock();
	block.text = res; //JSON.stringify(res); //res.slice(0,-1).replace(/\\/g,"\\\\").replace(/"/g, "\\\""));
	block.setName(endtoken);
	console.log("CUSTOM BLOCK", block);
	return block;
}
