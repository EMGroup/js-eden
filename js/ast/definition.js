Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseContext.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
	this.name = "__";
	this.dorebuild = false;
};

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
	this.name = this.lvalue.name;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Definition.prototype.generateDef = function(ctx,scope) {
	//this.name = this.lvalue.name;
	var dobound = false; //(this.expression.type == "primary" && this.expression.extras.length == 0) || this.expression.type == "scope";
	var result = "function(context, scope, cache) {\n";
	this.locals = (ctx) ? ctx.locals : undefined;
	this.params = (ctx) ? ctx.params : undefined;
	this.backtickCount = 0;
	var express = this.expression.generate(this, "scope", Eden.AST.MODE_DYNAMIC);

	if (this.backtickCount > 0) {
		result += "var btick = 0;\n";
	} 

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
			//result += "_scopes["+i+"].rebuild();\n";
			// TODO Figure out how to do this optimisation without massive memory copies.
			result += "_scopes["+i+"].rebuild();\n";
		}

		//result += "this.def_scope = _scopes;\n";
	}

	//result += "\tif (cache) cache.scope = scope;\n";
	result += "\treturn " + express + ";\n}";

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
		result += this.expression.generate(this, "scope", Eden.AST.MODE_DYNAMIC);

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

Eden.AST.Definition.prototype.expire = function() {
	if (this.expression.type == "scope") {
		this.expression.cleanUp();
	}
}

Eden.AST.Definition.prototype.rebuild = function(sym) {
	this.dependencies = {};
	console.log("Rebuilt " + sym.name);

	this.dorebuild = true;

	try {
		var rhs = "("+this.generateDef(this)+")";
		sym.definition = eval(rhs);
		/*sym.clearObservees();
		sym.clearDependencies();

		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}

		sym.subscribe(deps);*/
	} catch(e) {
		console.error(this, e);
	}

	this.dorebuild = false;
}

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
			/*rhs = "(function(context,scope,value) { value";
			rhs += this.lvalue.generateIndexList(this, "scope") + " = ";
			rhs += this.expression.generate(this, "scope", Eden.AST.MODE_DYNAMIC);
			rhs += ";})";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}
			var source = base.getSource(this);
			sym.addExtension(this.lvalue.generateIdStr(), eval(rhs), source, undefined, deps);*/
		} else {
			//rhs = "("+this.generateDef(ctx)+")";
			var deps = [];
			var dependencies = {};
			this.expression.getDependencies(dependencies);
			for (var d in dependencies) {
				deps.push(d);
			}
			//sym.eden_definition = this.getSource();
			//if (agent === undefined) {
			//	console.trace("UNDEF AGENT: " + source);
			//}
			//console.log("DEF",rhs);
			this.dorebuild = true;
			sym.define(noop, this, deps);
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

Eden.AST.Definition.prototype.needsRebuild = function() {
	if (this.dorebuild) return true;
	if (this.expression && this.expression.type == "scope") return this.expression.needsRebuild();
	else false;
}

