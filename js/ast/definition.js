Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseContext.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
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

function scopehash(hashstr) {
	var hash = 0;
	var ch;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}
	return hash;
}

function removeHash(str) {
	var ix = str.lastIndexOf("_");
	return str.substring(0,ix);
}

Eden.AST.Definition.prototype.generateDef = function(ctx,scope) {
	var dobound = false; //(this.expression.type == "primary" && this.expression.extras.length == 0) || this.expression.type == "scope";
	var result = ""; //"function "+name+"(context, scope, cache) {\n";
	this.locals = (ctx) ? ctx.locals : undefined;
	this.params = (ctx) ? ctx.params : undefined;
	this.backtickCount = 0;
	this.dynamic_source = "";
	this.vars = Object.create(null);
	var express = this.expression.generate(this, "scope", {bound: dobound, indef: true});

	/*if (this.expression.typevalue == 0) {
		console.log("TYPE unknown for "+name);
	}*/

	var scopedvars = {};

	for (var v in this.vars) {
		var sv = this.vars[v];
		if (!scopedvars.hasOwnProperty(sv)) scopedvars[sv] = "";
		scopedvars[sv] += "\tlet v_"+v+" = "+sv+".l(\""+removeHash(v)+"\");\n";
	}

	if (scopedvars.hasOwnProperty("scope")) result += scopedvars["scope"];

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		//result += "if (!this.def_scope) cache.scopes = null;\n"
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
			result += "\tif (cache.scopes && "+i+" < cache.scopes.length) { _scopes["+i+"].mergeCache(cache.scopes["+i+"]); _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
			if (scopedvars.hasOwnProperty("_scopes["+i+"]")) result += scopedvars["_scopes["+i+"]"];
		}

		//result += "if (scope === context.scope) this.def_scope = _scopes;\n";
		result += "cache.scopes = _scopes;\n";
	}

	if (this.expression.type == "async") {
		result += "\tvar _r = rt.flattenPromise(" + express + ");\n";
		result += "\treturn _r;";
	} else if (dobound) {
		result += "\t var result = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		//result += "\tif (cache) cache.scope = result.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.scopes.length == 0) {
			result += "\treturn edenCopy(result.value);";
		} else {
			result += "\treturn result.value;";
		}
	} else {
		//result += "\tif (cache) cache.scope = scope;\n";
		result += "\treturn " + express + ";";
	}
	
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
	var name = (this.lvalue && this.lvalue.name) ? "def_"+this.lvalue.name : "";

	// If LValue is dynamic then need to generate a new AST node here...
	if (this.lvalue.isDynamic()) {
		// First, generate dynamic eden code
		var state = {isconstant: true, locals: ctx.locals};
		var expr = this.expression.toString((scope) ? scope : eden.root.scope, state);

		if (state.isconstant) {
			expr = sym.name + " = " + expr + ";";
		} else {
			expr = sym.name + " is " + expr + ";";
		}

		console.log(expr);

		// Second, reparse that code as a new AST node
		var stat = Eden.AST.parseStatement(expr);
		stat.generated = true;
		stat.addIndex();

		// Third, execute that node.
		stat.execute(ctx, base, scope, agent);
	} else {

		this.scopes = [];
		this.dependencies = {};
		this.backtickCount = 0;

		try {
			if (this.lvalue.hasListIndices()) {
				rhs = "value";
				rhs += this.lvalue.generateIndexList(this, "scope") + " = ";
				rhs += this.expression.generate(this, "scope", {bound: false});
				rhs += ";";
				var deps = [];
				for (var d in this.dependencies) {
					deps.push(d);
				}
				var source = base.getSource(this);
				sym.addExtension(this.lvalue.generateIdStr(), new Function(["context","scope","cache"], rhs), source, undefined, deps);
			} else {
				rhs = this.generateDef(ctx);
				var deps = [];
				for (var d in this.dependencies) {
					deps.push(d);
				}

				if (this.isdynamic) {
					if (!this.sources) this.sources = {};
					this.sources[sym.name] = sym.name + " is " + this.dynamic_source + ";";
				}

				sym.isasync = (this.expression.type == "async");
				var f = new Function(["context","scope","cache"], rhs);
				f.displayName = name;  // FIXME: Non-standard
				sym.define(f, this, deps, rhs);
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
}

Eden.AST.registerStatement(Eden.AST.Definition);

