Eden.AST.CodeBlock = function() {
	this.type = "codeblock";
	Eden.AST.BaseContext.apply(this);
	this.params = undefined;
	this.locals = undefined;
	this.script = undefined;
};

Eden.AST.CodeBlock.prototype.setLocals = function(locals) {
	this.locals = locals;
	this.errors.push.apply(this.errors, locals.errors);
}

Eden.AST.CodeBlock.prototype.setParams = function(params) {
	this.params = params;
	this.errors.push.apply(this.errors, params.errors);
}

Eden.AST.CodeBlock.prototype.setScript = function(script) {
	this.script = script;
	if (script) {
		script.parent = this;
		this.errors.push.apply(this.errors, script.errors);
	}
}

Eden.AST.CodeBlock.prototype.generate = function(ctx) {
	var res = "";
	//res += "var lscope = new Scope(context,pscope,[";
	//res += "]);\n";
	res += "(function() {\nvar scope = eden.root.scope;\nvar context = eden.root;\n";
	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
		}
	}
	//res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			//if (i != this.params.list.length-1) res += ",";
			res += "var " + this.params.list[i] + " = edenCopy(arguments["+i+"]);\n";
		}
	}
	//res += "]);\n";
	res += this.script.generate(this, "scope") + "})";
	return res;
}

Eden.AST.registerContext(Eden.AST.CodeBlock);

