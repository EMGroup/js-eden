Eden.AST.Function = function() {
	this.type = "function";
	Eden.AST.BaseStatement.apply(this);

	this.body = undefined;
	this.name = "";
};

Eden.AST.Function.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Function.prototype.getSource = Eden.AST.BaseStatement.getSource;

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

