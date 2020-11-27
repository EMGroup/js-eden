Eden.AST.Action = function() {
	this.type = "action";
	Eden.AST.BaseStatement.apply(this);

	this.kindofaction = "touch";
	this.triggers = [];
	this.body = undefined;
	this.name = "";
};

Eden.AST.Action.prototype.kind = function(k) {
	this.kindofaction = k;
};

Eden.AST.Action.prototype.setBody = function(body) {
	this.body = body;
	if (body) {
		body.parent = this;
		this.errors.push.apply(this.errors, body.errors);
	}
}

Eden.AST.Action.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", this)";
	if (this.triggers.length > 0) {
		res += ".observe("+JSON.stringify(this.triggers)+");\n";
	}
	return res;
}

Eden.AST.Action.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx);
	var sym = eden.root.lookup(this.name);
	eden.root.f["func_"+this.name] = eval(body);
	if (this.triggers.length > 0) {
		sym.assign(eden.root.f["func_"+this.name], scope, this).observe(this.triggers);
	} else {
		sym.assign(eden.root.f["func_"+this.name], scope, this);
	}
}

Eden.AST.registerStatement(Eden.AST.Action);

