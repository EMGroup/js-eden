Eden.AST.Action = function() {
	this.type = "action";
	Eden.AST.BaseStatement.apply(this);

	this.kindofaction = "touch";
	this.triggers = [];
	this.body = undefined;
	this.name = "";
};

Eden.AST.Action.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Action.prototype.getSource = Eden.AST.BaseStatement.getSource;

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
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"})";
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
	sym.eden_definition = base.getSource(this);
	if (this.triggers.length > 0) {
		sym.define(eval(body), agent, []).observe(this.triggers);
	} else {
		sym.define(eval(body), agent, []);
	}
}

Eden.AST.Action.prototype.error = fnEdenASTerror;

