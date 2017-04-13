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
	var res = "(function(context, scope) {\n";
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

	var subscript = this.script.generate(this, "scope");

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		res += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			res += "\t_scopes.push(" + this.scopes[i];
			res += ");\n";
			//result += "_scopes["+i+"].rebuild();\n";
			// TODO Figure out how to do this optimisation without massive memory copies.
			res += "if (this.def_scope) { _scopes["+i+"].mergeCache(this.def_scope["+i+"].cache); _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		//result += "this.def_scope = _scopes;\n";
	}

	res += subscript + "}); })";
	return res;
}

Eden.AST.registerContext(Eden.AST.CodeBlock);

