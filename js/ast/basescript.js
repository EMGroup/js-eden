Eden.AST.BaseScript = function() {
	Eden.AST.BaseStatement.apply(this);
	this.statements = [];
	//this.oldstats = undefined;
	//this.patch = undefined;
	this.parameters = undefined;
	this.locals = undefined;
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
	var ln = 0;
	for (var i=0; i<this.statements.length; i++) {
		ln += this.statements[i].getNumberOfLines();
	}
	return ln;
}

