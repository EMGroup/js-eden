Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseContext.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
};

Eden.AST.Definition.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}

Eden.AST.Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Definition.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Definition.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Definition.prototype.generateDef = function(ctx,scope) {
	var dobound = (this.expression.type == "primary" && this.expression.extras.length == 0) || this.expression.type == "scope";
	var result = "function(context, scope, cache) {\n";
	this.locals = (ctx) ? ctx.locals : undefined;
	this.params = (ctx) ? ctx.params : undefined;
	var express = this.expression.generate(this, "scope", {bound: dobound, indef: true});

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
			result += "if (this.def_scope) { _scopes["+i+"].cache = this.def_scope["+i+"].cache; _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		result += "this.def_scope = _scopes;\n";
	}

	if (dobound) {
		result += "\t var result = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		result += "\tif (cache) cache.scope = result.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.scopes.length == 0) {
			result += "\treturn edenCopy(result.value);\n}";
		} else {
			result += "\treturn result.value;\n}";
		}
	} else {
		result += "\tif (cache) cache.scope = scope;\n";
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
		result = result + ", this, "+JSON.stringify(deps)+");\n";
		return result;
	}
};

Eden.AST.Definition.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var source = base.getSource(this);
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var rhs;

	this.scopes = [];
	this.dependencies = {};
	this.backtickCount = 0;

	//if (eden.peer) eden.peer.broadcast(source);

	if (this.doxyComment) {
		//eden.dictionary[this.lvalue.name] = this.doxyComment;
		eden.updateDictionary(this.lvalue.name, this.doxyComment);
	}

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
			sym.addExtension(this.lvalue.generateIdStr(), eval(rhs), source, undefined, deps);
		} else {
			rhs = "("+this.generateDef(ctx)+")";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}
			sym.eden_definition = this.getSource();
			//if (agent === undefined) {
			//	console.trace("UNDEF AGENT: " + source);
			//}
			console.log("DEF",rhs);
			sym.define(eval(rhs), agent, deps, rhs);
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
		Eden.Agent.emit("error", [agent,this.errors[this.errors.length-1]]);
	}	
}

Eden.AST.Definition.prototype.error = fnEdenASTerror;

