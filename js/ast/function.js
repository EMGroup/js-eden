Eden.AST.Function = function() {
	this.type = "function";
	this.parent = undefined;
	this.errors = [];
	this.body = undefined;
	this.name = "";
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.doxyComment = undefined;
};

Eden.AST.Function.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Function.prototype.setBody = function(body) {
	this.body = body;
	if (body) {
		body.parent = this;
		this.errors.push.apply(this.errors, body.errors);
	}
}

Eden.AST.Function.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"}, []);\n";
	return res;
}

Eden.AST.Function.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx);
	var sym = eden.root.lookup(this.name);
	sym.eden_definition = base.getSource(this);	
	sym.define(eval(body), agent,[]);
}

Eden.AST.Function.prototype.error = fnEdenASTerror;

