/**
 * Scope node, as specified using "with" statement. This needs to store a bunch
 * of overrides and an expression to which these overrides are applied. It may
 * also contain range overrides and if this is the case the scope node range
 * property is set to true.
 */
Eden.AST.Scope = function() {
	this.type = "scope";
	this.errors = [];
	this.range = false;
	this.overrides = {};
	this.expression = undefined; // = new Eden.AST.Primary();
}

Eden.AST.Scope.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Scope.prototype.prepend = function(extra) {
	this.primary.prepend(extra);
}

/*Eden.AST.Scope.prototype.setObservable = function(obs) {
	this.primary.setObservable(obs);
}

Eden.AST.Scope.prototype.getObservable = function() {
	return this.primary.getObservable();
}*/

/**
 * Set the LHS expression the scope overrides are to be applied to.
 */
Eden.AST.Scope.prototype.setExpression = function(express) {
	this.expression = express;
	// Bubble errors if there are any
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

/**
 * Add child nodes for an override. First parameter is a string observable
 * name that has been parsed, and second is the first override value and the
 * third is an optional second value for a range override. The second and third
 * parameters are AST nodes containing a literal or expression.
 */
Eden.AST.Scope.prototype.addOverride = function(obs, exp1, exp2, exp3, isin) {
	this.errors.push.apply(this.errors, obs.errors);
	if (isin) this.range = true;
	if (exp3) {
		this.range = true;
		this.overrides[obs.observable] = { start: exp1, end: exp3, increment: exp2, components: obs.components, isin: isin };
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
		this.errors.push.apply(this.errors, exp3.errors);
	} else if (exp2) {
		this.range = true;
		this.overrides[obs.observable] = { start: exp1, end: exp2, components: obs.components, isin: isin };
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
	} else if (exp1) {
		this.overrides[obs.observable] = { start: exp1, end: undefined, components: obs.components, isin: isin};
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
	}
}

Eden.AST.Scope.prototype.generateConstructor = function(ctx, scope) {
	var res;

	//if (ctx.scopes.length > 0) {
		res = "new Scope(context, "+scope+", [";
	//} else {
	//	res = "new Scope(context, scope, [";
	//}

	// Generate script for each override expression.
	for (var o in this.overrides) {
		var over = this.overrides[o];
		var startstr;
		// TODO Don't use main range
		if (this.range) {
			startstr = over.start.generate(ctx,scope,{bound: false});
		} else {
			startstr = over.start.generate(ctx,scope,{bound: over.start.type == "primary" || over.start.type == "scope"});
		}
		res += "new ScopeOverride(\""+o+"\", " + startstr;
		if (over.end) {
			var endstr = this.overrides[o].end.generate(ctx,scope, {bound: false});

			if (over.increment) {
				var incstr = over.increment.generate(ctx,scope, {bound: false});
				res += ", " + endstr + ", " + incstr + "),";
			} else {
				res += ", " + endstr + "),";
			}
		} else {
			res += ", undefined, undefined, "+over.isin+"),";
		}
	}
	// remove last comma
	res = res.slice(0,-1);

	res += "], "+this.range+", this,true)"; //context.lookup(\""+this.primary.getObservable()+"\"))";
	return res;
}

Eden.AST.Scope.prototype.generate = function(ctx, scope, options) {
	// Add the scope generation string the the array of scopes in this context
	ctx.scopes.push(this.generateConstructor(ctx,scope));
	if (this.range) {
		var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
		var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"].clone()",options);
		var res = "(function() {\n";
		res += scopename + ".range = false;\n";
		res += "var results = [];\n";
		res += "var scoperesults = [];\n";
		res += "while(true) {\n";
		res += "var val = "+express;
		if (options.bound) {
			//res += ".value";
			res += ";\n\tif (val.value !== undefined) scoperesults.push(val.scope);\n\tval = val.value";
		}
		res += ";\n";
		res += "if (val !== undefined) results.push(val);\n";
		res += "if ("+scopename+".next() == false) break;\n";
		res += "}\n"+scopename+".range = true;\n";

		if (options.bound) {
			res += "if (cache) cache.scopes = scoperesults;\n return new BoundValue(results,"+scopename+");}).call(this)";
			//res += "if (cache) cache.scopes = scoperesults;\n return results;})()";
		} else {
			res += "return results;}).call(this)";
		}
		return res;
	} else {
		// Return the expression using the newly generated scope.
		return this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]", options);
	}
}

Eden.AST.Scope.prototype.execute = function(ctx, base, scope) {
	var context = {scopes: []};
	var gen = this.generate(context, "scope",{bound: false});
	var rhs = "(function(context,scope) {\n";

	if (context.scopes.length > 0) {
		rhs += "\tvar _scopes = [];\n";
		for (var i=0; i<context.scopes.length; i++) {
			rhs += "\t_scopes.push(" + context.scopes[i];
			rhs += ");\n";
			rhs += "if (this.def_scope) { _scopes["+i+"].mergeCache(this.def_scope["+i+"].cache); _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		rhs += "this.def_scope = _scopes;\n";
	}

	rhs += "return ";
	rhs += gen;
	rhs += ";})";
	console.log(rhs);
	return eval(rhs)(eden.root,scope);
}
