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
		this.extensions = {};
		this.compile();
		if (base) {
			this.baseSource = base.getSource(ast);
		}
	}
}

Symbol.Definition.prototype.setExtension = function(name, ast, base) {
	console.log("Add extension: " + name);
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

Symbol.Definition.prototype.runtimeError = function(e, agent) {
	var err;
	var agentobj = Eden.Agent.agents[agent];

	if (/[0-9][0-9]*/.test(e)) {
		err = new Eden.RuntimeError(undefined, parseInt(e), this.baseAST, e);
	} else {
		err = new Eden.RuntimeError(undefined, 0, this.baseAST, e);
	}

	if (agentobj) {
		err.line = agentobj.findDefinitionLine(this.baseAST.lvalue.name, this.baseSource);
	}

	this.baseAST.errors.push(err);
	if (agentobj) Eden.Agent.emit("error", [agentobj,err]);
	else console.log(err.prettyPrint());
}

Symbol.Definition.prototype.compile = function() {
	var result = "(function(context, scope, cache) {\n";
	this.dependencies = {};
	this.scopes = [];
	var express = this.baseAST.expression.generate(this, "scope", true, this.baseAST);

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		//result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\tvar scope" + (i+1) + " = " + this.scopes[i];
			result += ";\n";
		}
	}

	if (this.baseAST.expression.doesReturnBound && this.baseAST.expression.doesReturnBound()) {
		result += "\t var bresult = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		result += "\tif (cache) cache.scopes = bresult.scopes;\n ";
		result += "\tif (cache) cache.scope = bresult.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.baseAST.expression.type != "scope") {
			result += "\tvar result = edenCopy(bresult.value);\n";
		} else {
			result += "\tvar result = bresult.value;\n";
		}
	} else {
		result += "\tif (cache) cache.scope = scope;\n";
		result += "\tvar result = " + express + ";\n";
	}

	for (var e in this.extensions) {
		var ext = this.extensions[e];
		//console.log(ext);

		if (ext.ast.lvalue.lvaluep[0].kind == "scope") {
			var scopeindex = ext.ast.lvalue.lvaluep[0].generateIndices(this, "scope");
			var over = ext.ast.expression.generate(this,"scope");
			if (ext.ast.expression.doesReturnBound && ext.ast.expression.doesReturnBound()) {
				over += ".value";
			}

			var baseexp = this.baseAST.expression;
			while (baseexp.type == "scope") baseexp = baseexp.expression;

			if (scopeindex == "") {
				result += "cache.scope.baseScope().addOverride(new ScopeOverride(\""+ext.ast.lvalue.lvaluep[0].observable+"\","+over+"));\n";
				var express2 = baseexp.generate(this, "cache.scope", false);
				result += "result = "+express2+";\n";
			} else {
				result += "cache.scopes"+scopeindex+".baseScope().addOverride(new ScopeOverride(\""+ext.ast.lvalue.lvaluep[0].observable+"\","+over+"));\n";
				var express = baseexp.generate(this, "cache.scopes"+scopeindex, false);
				result += "result"+scopeindex+" = "+express+";\n";
			}
		} else {
			result += "\tresult" + this.extensions[e].ast.lvalue.generateIndexList(this, "scope") + " = ";
			result += this.extensions[e].ast.expression.generate(this, "scope");
			if (this.extensions[e].ast.expression.doesReturnBound && this.extensions[e].ast.expression.doesReturnBound()) {
				result += ".value";
			}
			result += ";\n";
		}
	}

	result += "\treturn result;\n})";

	/*
		For scope overrides: Get the raw expression with scopes removed (use a loop to undo scope chain to get expression).
			Then get the scope for the specified index.
			Then add all the new overrides to that scope.
			Finally, using the raw expression, regenerate the value for that index in the new scope.
	*/

	//console.log(result);
	this.compiled = eval(result);

	this.deps = [];
	for (var d in this.dependencies) {
		if (this.dependencies[d]) this.deps.push(d);
	}
}
