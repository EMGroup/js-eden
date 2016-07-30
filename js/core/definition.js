Symbol.Definition = function() {
	this.compiled = undefined;
	this.baseAST = undefined;
	this.baseSource = "";
	this.extensions = {};
	this.dependencies = {};
	this.scopes = [];
	this.backtickCount = 0;
	this.deps = [];
}

Symbol.Definition.prototype.setBase = function(ast, base) {
	if (typeof ast == "function") {
		this.baseAST = undefined;
		this.compiled = ast;
	} else {
		this.baseAST = ast;
		this.compile();
		if (base) {
			this.baseSource = base.getSource(ast);
		}
	}
}

Symbol.Definition.prototype.setExtension = function(name, ast, base) {
	this.extensions[name] = { ast: ast, source: base.getSource(ast) };
	this.compile();
}

Symbol.Definition.prototype.evaluate = function(symbol, context, scope, cache) {
	if (this.compiled) {
		return this.compiled.call(symbol, context, scope, cache);
	}
}

Symbol.Definition.prototype.getBaseSource = function() {
	return this.baseSource;
}

Symbol.Definition.prototype.getFullSource = function() {
	var source = this.getBaseSource();
	for (var e in this.extensions) {
		source += "\n";
		source += this.extensions[e].source;
	}
	return source;
}

Symbol.Definition.prototype.compile = function() {
	var result = "(function(context, scope, cache) {\n";
	this.scopes = [];
	var express = this.baseAST.expression.generate(this, "scope", true);

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		//result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\tvar scope" + (i+1) + " = " + this.scopes[i];
			result += ";\n";
		}
	}

	if (this.baseAST.expression.doesReturnBound && this.baseAST.expression.doesReturnBound()) {
		result += "\t var result = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		result += "\tif (cache) cache.scope = result.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.scopes.length == 0) {
			result += "\treturn edenCopy(result.value);\n})";
		} else {
			result += "\treturn result.value;\n})";
		}
	} else {
		result += "\tif (cache) cache.scope = scope;\n";
		result += "\tvar result = " + express + ";\n";
		for (var e in this.extensions) {
			result += "\tresult" + this.extensions[e].ast.lvalue.generateIndexList(this, "scope") + " = ";
			result += this.extensions[e].ast.expression.generate(this, "scope");
			if (this.extensions[e].ast.expression.doesReturnBound && this.extensions[e].ast.expression.doesReturnBound()) {
				result += ".value";
			}
			result += ";\n";
		}
		result += "\treturn result;\n})";
	}

	console.log(result);
	this.compiled = eval(result);

	this.deps = [];
	for (var d in this.dependencies) {
		this.deps.push(d);
	}
}
