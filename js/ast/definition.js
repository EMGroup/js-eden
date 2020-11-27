Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseContext.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
	this.sources = null;
};

Eden.AST.Definition.prototype.reset = function() {
	this.executed = 0;
}


Eden.AST.Definition.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}

Eden.AST.Definition.prototype.setExpression = function(expr) {
	if (expr && expr.warning) this.warning = expr.warning;
	this.expression = expr;
	this.errors = expr.errors;
}

Eden.AST.Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Definition.prototype.locatePrimary = function(indices) {
	var node = this.expression;

	for (var i=0; i<indices.length; ++i) {
		var ix = indices[i];
		if (node.type == "literal") {
			if (node.datatype == "LIST") {
				if (Array.isArray(node.value) && ix < node.value.length) {
					node = node.value[ix];
				} else return;
			} else if (node.datatype == "OBJECT") {
				node = node.value[ix];
			} else return;
		} else return;
	}

	if (node && node.type == "primary" && !node.backtick && node.extras.length == 0) {
		return node.observable;
	}
}

Eden.AST.Definition.prototype.generateDef = function(ctx,scope) {
	var name = (this.lvalue && this.lvalue.name) ? "def_"+this.lvalue.name : "";
	var dobound = false; //(this.expression.type == "primary" && this.expression.extras.length == 0) || this.expression.type == "scope";
	var result = "function "+name+"(context, scope, cache) {\n";
	this.locals = (ctx) ? ctx.locals : undefined;
	this.params = (ctx) ? ctx.params : undefined;
	this.backtickCount = 0;
	this.dynamic_source = "";
	var express = this.expression.generate(this, "scope", {bound: dobound, indef: true});

	if (this.backtickCount > 0) {
		result += "var btick = 0;\n";
	} 

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		//result += "if (!this.def_scope) cache.scopes = null;\n"
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
			//result += "_scopes["+i+"].rebuild();\n";
			// TODO Figure out how to do this optimisation without massive memory copies.
			result += "if (cache.scopes && "+i+" < cache.scopes.length) { _scopes["+i+"].mergeCache(cache.scopes["+i+"]); _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		//result += "if (scope === context.scope) this.def_scope = _scopes;\n";
		result += "cache.scopes = _scopes;\n";
	}

	if (this.expression.type == "async") {
		//result += "\tif (cache) cache.scope = scope;\n";
		result += "\tvar _r = rt.flattenPromise(" + express + ");\n";
		//result += "\tvar _me = this;"
		//result += "\t_r.then(rr => { cache.value = rr; this.expireAsync(); });\n";
		//result += "\treturn cache.value;\n}";
		result += "\treturn _r;\n}";
	} else if (dobound) {
		result += "\t var result = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		//result += "\tif (cache) cache.scope = result.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.scopes.length == 0) {
			result += "\treturn edenCopy(result.value);\n}";
		} else {
			result += "\treturn result.value;\n}";
		}
	} else {
		//result += "\tif (cache) cache.scope = scope;\n";
		result += "\treturn " + express + ";\n}";
	}

	//console.log(result);
	
	return result;
}

Eden.AST.Definition.prototype.generate = function(ctx,scope) {
	var result = this.lvalue.generate(ctx,scope);
	this.scopes = [];
	this.dependencies = {};

	if (this.lvalue.islocal) {
		// TODO Report error, this is invalid;
		return "";
	} else if (this.lvalue.hasListIndices()) {
		var clist = this.lvalue.generateIndexList(this, scope);
		result += ".addExtension("+this.lvalue.generateIdStr()+", function(context, scope, value) {\n\tvalue";
		result += clist + " = ";
		result += this.expression.generate(this, "scope", {bound: false});

		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}

		result = result + ";\n}, undefined, this, "+JSON.stringify(deps);
		result += ");\n";
		return result;
	} else {
	 	result = scope+".define(" +result+"," + this.generateDef(ctx, scope);
		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}
		result = result + ", EdenSymbol.localJSAgent, "+JSON.stringify(deps)+");\n";
		return result;
	}
};

Eden.AST.Definition.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var rhs;

	this.scopes = [];
	this.dependencies = {};
	this.backtickCount = 0;

	//if (eden.peer) eden.peer.broadcast(source);

	//if (this.doxyComment) {
	//	//eden.dictionary[this.lvalue.name] = this.doxyComment;
	//	eden.updateDictionary(this.lvalue.name, this.doxyComment);
	//}

	try {
		if (this.lvalue.hasListIndices()) {
			rhs = "(function(context,scope,value) { value";
			rhs += this.lvalue.generateIndexList(this, "scope") + " = ";
			rhs += this.expression.generate(this, "scope", {bound: false});
			rhs += ";})";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}
			var source = base.getSource(this);
			sym.addExtension(this.lvalue.generateIdStr(), eval(rhs), source, undefined, deps);
		} else {
			rhs = "("+this.generateDef(ctx)+")";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}

			if (this.isdynamic) {
				if (!this.sources) this.sources = {};
				this.sources[sym.name] = sym.name + " is " + this.dynamic_source + ";";
			}

			//sym.eden_definition = this.getSource();
			//if (agent === undefined) {
			//	console.trace("UNDEF AGENT: " + source);
			//}
			//console.log("DEF",rhs);
			sym.isasync = (this.expression.type == "async");
			sym.define(eval(rhs), this, deps, rhs);
		}
	} catch(e) {
		var err;
		console.log(rhs);
		if (e.message == Eden.RuntimeError.EXTENDSTATIC) {
			err = new Eden.RuntimeError(base, Eden.RuntimeError.EXTENDSTATIC, this, "Can only define list items if the list is defined");
		} else {
			err = new Eden.RuntimeError(base, Eden.RuntimeError.UNKNOWN, this, e);
		}
		this.errors.push(err);
		err.line = this.line;
		eden.emit("error", [agent,this.errors[this.errors.length-1]]);
	}	
}

Eden.AST.registerStatement(Eden.AST.Definition);

