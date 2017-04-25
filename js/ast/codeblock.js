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

Eden.AST.CodeBlock.prototype.generateInner = function(ctx) {
	var res = "(function(";
	//res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			//if (i != this.params.list.length-1) res += ",";
			// TODO Compile time check that parameters are not assigned to!!!
			res += this.params.list[i];
			if (i < this.params.list.length-1) res += ", ";
		}
	}
	res += ") {\n";

	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
		}
	}

	this.scopes = [];
	var subscript = this.script.generate(this, "scope", {fulllocal: true});
	if (this.scopes.length > 0) {
		//console.log("scopes",this.scopes);
		res += "var _scopes = [];\n";
	}

	for (var x in this.dependencies) {
		res += "var obs_"+x+" = ";
		switch(x) {
		case "sqrt": res += "Math.sqrt;\n"; break
		default: res += "eden.root.lookup(\""+x+"\").value();\n";
		}
	}

	res += subscript + "})";
	return res;
}

Eden.AST.CodeBlock.prototype.generate = function(ctx) {
	var res = "(function(context, scope) {\n";
	//res += "var lscope = new Scope(context,pscope,[";
	
	//res += "]);\n";
	res += "return (function(";
	//res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			//if (i != this.params.list.length-1) res += ",";
			// TODO Compile time check that parameters are not assigned to!!!
			res += this.params.list[i];
			if (i < this.params.list.length-1) res += ", ";
		}
	}
	res += ") {\n";

	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
		}
	}

	this.scopes = [];
	var subscript = this.script.generate(this, "scope", {fulllocal: true});
	if (this.scopes.length > 0) {
		//console.log("scopes",this.scopes);
		res += "var _scopes = [];\n";
	}

	for (var x in this.dependencies) {
		res += "var obs_"+x+" = ";
		switch(x) {
		case "sqrt": res += "Math.sqrt;\n"; break
		default: res += "eden.root.lookup(\""+x+"\").value();\n";
		}
	}

	res += subscript + "}); })";
	return res;
}

Eden.AST.registerContext(Eden.AST.CodeBlock);

