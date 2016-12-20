Eden.AST.Case = function() {
	this.type = "case";
	this.parent = undefined;
	this.datatype = "";
	this.literal = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

Eden.AST.Case.prototype.setLiteral = function(datatype, literal) {
	this.datatype = datatype;
	this.literal = literal;
}

Eden.AST.Case.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Case.prototype.generate = function(ctx, scope) {
	if (typeof this.literal == "string") {
		return "case \"" + this.literal + "\": "; 
	} else {
		return "case " + this.literal + ": ";
	}
}

Eden.AST.Case.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Case not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

Eden.AST.Case.prototype.error = fnEdenASTerror;

