Eden.AST.BaseScript = function() {
	Eden.AST.BaseStatement.apply(this);
	this.statements = [];
	//this.oldstats = undefined;
	//this.patch = undefined;
	this.parameters = undefined;
	this.locals = undefined;
	this.indexed = false;
	this.subscripts = {};
}

Eden.AST.BaseScript.appendChild = function (ast) {
	this.statements.push(ast);
	if (this.statements.length > 1) {
		ast.previousSibling = this.statements[this.statements.length-2];
		this.statements[this.statements.length-2].nextSibling = ast;
	}
	ast.parent = this;
	//ast.buildID();

	// TODO My own id becomes out-of-date at this point...
	// Must use a lazy regeneration.
	if (this.indexed && this.id != 0) console.log("INVALIDATE ID",this);

	//if (ast.type != "dummy" && this.indexed && ast.addIndex === undefined) console.error("No index",ast);
	// WHY WAS THIS COMMENTED OUT!!!!!
	if (ast.type !== "dummy" && this.indexed) ast.addIndex(); //Eden.Index.update(ast);
	if (ast.type === "script" && ast.name) this.subscripts[ast.name] = ast;
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}
Eden.AST.BaseScript.append = Eden.AST.BaseScript.appendChild;

Eden.AST.BaseScript.insertAfter = function(after, ast) {
	var ix;
	for (ix = 0; ix<this.statements.length; ix++) {
		if (this.statements[ix] === after) break;
	}
	if (ix+1 < this.statements.length) {
		ast.previousSibling = this.statements[ix];
		ast.nextSibling = this.statements[ix+1];
		this.statements[ix].nextSibling = ast;
		this.statements[ix+1].previousSibling = ast;
		this.statements.splice(ix+1, 0, ast);
	} else if (ix < this.statements.length) {
		ast.previousSibling = this.statements[ix];
		ast.nextSibling = undefined;
		this.statements[ix].nextSibling = ast;
		this.statements.push(ast);
	} else {
		return;
	}

	ast.parent = this;	
	if (ast.type != "dummy" && this.indexed) ast.addIndex();
	if (ast.type === "script" && ast.name) this.subscripts[ast.name] = ast;
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}

	if (this.indexed && this.id != 0) console.log("INVALIDATE ID",this);
}

Eden.AST.BaseScript.insertBefore = function(before, ast) {
	var ix;
	for (ix = 0; ix<this.statements.length; ix++) {
		if (this.statements[ix] === before) break;
	}
	if (ix < this.statements.length) {
		if (ix > 0) {
			ast.nextSibling = this.statements[ix];
			ast.previousSibling = this.statements[ix-1];
			this.statements[ix].previousSibling = ast;
			this.statements[ix-1].nextSibling = ast;
		} else {
			ast.nextSibling = this.statements[ix];
			this.statements[ix].previousSibling = ast;
		}
		this.statements.splice(ix, 0, ast);
	} else {
		eden.emit("error", [new Eden.RuntimeError(undefined, Eden.RuntimeError.NOCHILD, this, "Statement is not a child when using insertBefore")]);
		return;
	}

	ast.parent = this;	
	if (ast.type != "dummy" && this.indexed) ast.addIndex();
	if (ast.type === "script" && ast.name) this.subscripts[ast.name] = ast;
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}

	//if (this.indexed && this.id != 0) console.log("INVALIDATE ID",this);
}

Eden.AST.BaseScript.removeChild = function(child) {
	var ix;
	for (ix = 0; ix < this.statements.length; ix++) {
		if (this.statements[ix] === child) break;
	}
	if (ix < this.statements.length) {
		this.statements.splice(ix,1);
	} else {
		eden.emit("error", [new Eden.RuntimeError(undefined, Eden.RuntimeError.NOCHILD, this, "Statement is not a child when using removeChild")]);
		return;
	}

	if (child.nextSibling) child.nextSibling.previousSibling = child.previousSibling;
	if (child.previousSibling) child.previousSibling.nextSibling = child.nextSibling;
	if (child.type === "script" && child.name && this.subscripts[child.name] === child) delete this.subscripts[child.name];
	child.destroy();
	//if (this.indexed && this.id != 0) console.log("INVALIDATE ID",this);
}

Eden.AST.BaseScript.replaceChild = function(oldchild, newchild) {
	//console.log("REPLACE",this,oldchild,newchild);
	var oix;
	if (typeof oldchild == "number") {
		oix = oldchild;
	} else {
		var ix;
		for (ix = 0; ix<this.statements.length; ix++) {
			if (this.statements[ix] === oldchild) break;
		}
		if (ix >= this.statements.length) {
			eden.emit("error", [new Eden.RuntimeError(undefined, Eden.RuntimeError.NOCHILD, this, "Statement is not a child when using replaceChild")]);
			return;
		}
		oix = ix;
	}

	
	newchild.nextSibling = this.statements[oix].nextSibling;
	if (newchild.nextSibling) newchild.nextSibling.previousSibling = newchild;
	newchild.previousSibling = this.statements[oix].previousSibling;
	if (newchild.previousSibling) newchild.previousSibling.nextSibling = newchild;
	this.statements[oix].destroy();

	//var oldsub = this.statements[oix].subscribers;

	this.statements[oix] = newchild;
	newchild.parent = this;
	if (newchild.type != "dummy" && this.indexed) newchild.addIndex();
	if (newchild.type === "script" && newchild.name) this.subscripts[newchild.name] = newchild;
	if (oldchild.type === "script" && oldchild.name && this.subscripts[oldchild.name] === child) delete this.subscripts[oldchild.name];
	if (this.indexed && this.id != 0) console.log("INVALIDATE ID",this);
}

Eden.AST.BaseScript.destroy = function() {
	if (this.executed < 1) Eden.Index.remove(this);
	for (var i=0; i<this.statements.length; i++) {
		this.statements[i].destroy();
	}
	this.executed = -1;
	// Note, means can't search historical scripts structurally.
	this.statements = undefined;
	this.base = undefined;
	this.parent = undefined;
	this.nextSibling = undefined;
	this.previousSibling = undefined;
}

Eden.AST.BaseScript.addIndex = function() {
	if (this.indexed) return;
	if (this.id == 0) this.buildID();
	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "dummy") this.statements[i].addIndex();
	}
	this.indexed = true;
	Eden.Index.update(this);
}

Eden.AST.BaseScript.addIndexReverse = function() {
	if (this.indexed) return;
	if (this.id == 0) this.buildID();
	if (this.parent) this.parent.addIndexReverse();
	this.indexed = true;
	Eden.Index.update(this);
}

Eden.AST.BaseScript.removeIndex = function() {
	if (!this.indexed) return;
	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "dummy") this.statements[i].removeIndex();
	}
	this.indexed = false;
	Eden.Index.remove(this);
}

Eden.AST.BaseScript.buildID = function() {
	var hash = 0;
	var ch;
	var hashstr = this.getSource(); //this.prefix+this.postfix;
	//if (this.parent) hashstr += this.parent.id;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}

	this.id = this.type +"@"+ hash;
}

Eden.AST.BaseScript.getStatementByLine = function(line, base) {
	var ln = 0;
	if (base && this.parent) ln = this.parent.getRelativeLine(this, base);

	if (ln > line) return undefined;
	if (this.statements === undefined) return;

	for (var i=0; i<this.statements.length; i++) {
		var nl = this.statements[i].getNumberOfLines();
		if (line >= ln && line <= ln+nl && this.statements[i].type != "dummy") {
			return this.statements[i];
		}
		ln += nl;
	}

	return undefined;
}

Eden.AST.BaseScript.getRelativeLine = function(stat, base) {
	var ln = 0;

	if (base) {
		if (base !== this && this.parent) ln = this.parent.getRelativeLine(this, base);
	}

	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i] === stat) return ln;
		ln += this.statements[i].getNumberOfLines();
	}

	return -1;
}

Eden.AST.BaseScript.getNumberOfLines = function() {
	// Add self lines.
	// And sum of child lines.
	if (this.statements === undefined) {
		console.error("No Statements",this);
	}

	var ln = this.numlines;
	for (var i=0; i<this.statements.length; i++) {
		ln += this.statements[i].getNumberOfLines();
	}
	return ln;
}

Eden.AST.BaseScript.getNumberOfInnerLines = function() {
	// Add self lines.
	// And sum of child lines.
	if (this.statements === undefined) {
		console.error("No Statements",this);
	}

	var ln = 0;
	for (var i=0; i<this.statements.length; i++) {
		ln += this.statements[i].getNumberOfLines();
	}
	return ln;
}
