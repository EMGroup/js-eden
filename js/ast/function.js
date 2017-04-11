Eden.AST.Function = function() {
	this.type = "function";
	Eden.AST.BaseStatement.apply(this);

	this.body = undefined;
	this.name = "";
};

Eden.AST.Function.prototype.setBody = function(body) {
	this.body = body;
	if (body) {
		body.parent = this;
		this.errors.push.apply(this.errors, body.errors);
	}
}

Eden.AST.Function.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx, "scope");
	var res = "context.lookup(\""+this.name+"\").define("+body+", this, []);\n";
	return res;
}

Eden.AST.Function.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx,"scope");
	var sym = eden.root.lookup(this.name);
	sym.define(eval(body), this,[]);
}

Eden.AST.registerStatement(Eden.AST.Function);

