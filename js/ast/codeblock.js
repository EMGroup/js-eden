Eden.AST.CodeBlock = function() {
	this.type = "codeblock";
	Eden.AST.BaseContext.apply(this);
	this.params = undefined;
	this.locals = undefined;
	this.script = undefined;
	this.names = {};
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
			this.names[this.params.list[i]] = this.params.list[i];
		}
	}
	res += ") {\n";

	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
			this.names[this.locals.list[i]] = this.locals.list[i];
		}
	}

	this.scopes = [];
	var subscript = this.script.generate(this, "scope", {mode: Eden.AST.MODE_COMPILED});
	if (this.scopes.length > 0) {
		//console.log("scopes",this.scopes);
		res += "var _scopes = [];\n";
	}

	for (var x in this.dependencies) {
		if (this.names[x]) {

		} else {
			res += "var o"+x+" = ";
			switch(x) {
			case "sqrt": res += "Math.sqrt;\n"; break
			default: res += "eden.root.lookup(\""+x+"\").value();\n";
			}
		}
	}

	res += subscript + "})";
	return res;
}

Eden.AST.CodeBlock.prototype.generate = function(ctx) {
	var res = "(function(context, scope, cache) {\n";
	//res += "var lscope = new Scope(context,pscope,[";
	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
		}
	}
	//res += "]);\n";
	res += "return (function() {\n";
	//res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			//if (i != this.params.list.length-1) res += ",";
			res += "var " + this.params.list[i] + " = edenCopy(arguments["+i+"]);\n";
		}
	}
	//res += "]);\n";
	res += this.script.generate(this, "scope") + "}); })";
	return res;
}

Eden.AST.registerContext(Eden.AST.CodeBlock);

