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
	var body = this.body.generate(ctx, "scope", {usevar: true, scope: eden.root.scope});
	var res = "context.lookup(\""+this.name+"\").define(function(){"+body+"}, this, []);\n";
	return res;
}

Eden.AST.Function.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx,"scope",{scope: scope});
	var sym = eden.root.lookup(this.name);

	try {
		rt.f["func_"+this.name] = new Function(body);
		sym.assign(rt.f["func_"+this.name], scope, this);
	} catch(e) {
		console.log(body);
		console.error("func "+sym.name,e);
	}
}

Eden.AST.registerStatement(Eden.AST.Function);

