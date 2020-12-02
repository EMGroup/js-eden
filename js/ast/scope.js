/**
 * Scope node, as specified using "with" statement. This needs to store a bunch
 * of overrides and an expression to which these overrides are applied. It may
 * also contain range overrides and if this is the case the scope node range
 * property is set to true.
 */
Eden.AST.Scope = function() {
	this.type = "scope";
	Eden.AST.BaseExpression.apply(this);
	this.range = false;
	this.overrides = {};  // FIXME: This must be an array to maintain order!!
	this.expression = undefined; // = new Eden.AST.Primary();
}

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
	this.mergeExpr(express);
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

Eden.AST.Scope.prototype.toEdenString = function(scope, state) {
	var expr = "("+this.expression.toEdenString(scope, state) + " with ";
	if (state.isconstant) return expr;

	var first = true;

	for (var o in this.overrides) {
		var over = this.overrides[o];
		var overexpr = o;
		var ostate = {isconstant: true, locals: state.locals};

		if (!first) overexpr = ", "+overexpr;
		first = false;

		if (over.isin || over.end) overexpr += " in ";
		else overexpr += " = ";

		var sexpr = over.start.toEdenString(scope, ostate);
		if (ostate.isconstant) overexpr += Eden.AST.executeExpressionNode(over.start, scope, ostate);
		else overexpr += sexpr;
		ostate.isconstant = true;

		if (over.increment) {
			overexpr += ".."+over.increment.toEdenString(scope, state);
		}
		if (over.end) {
			overexpr += ".."+over.end.toEdenString(scope, state);
		}

		expr += overexpr;
	}

	return expr+")";
}

Eden.AST.Scope.prototype.generateConstructor = function(ctx, scope, options) {
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
			startstr = over.start.generate(ctx,scope,options);
		} else {
			startstr = over.start.generate(ctx,scope,options); //over.start.type == "primary" || over.start.type == "scope"});
		}

		res += "new ScopeOverride(\""+o+"\", " + startstr;
		if (over.end) {
			var endstr = this.overrides[o].end.generate(ctx,scope, options);

			if (over.increment) {
				var incstr = over.increment.generate(ctx,scope, options);
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

Eden.AST.Scope.prototype._generate_plain_range = function(ctx, options) {
	var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
	var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]",options);
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
}

Eden.AST.Scope.prototype._generate_loop_opti = function(ctx, options, rangeindex) {
	//console.log("LOOP RANGE INDEX", rangeindex);
	var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
	var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]",options);

	// TODO: Check that no reset on first loop is ok and a benefit

	var res =
	`(function() {
		${scopename}.range = false;
		var looper = ${scopename}.overrides[${rangeindex[0]}];
		var ix = 0;
		var loopsize = looper.end - looper.start+1;
		if (loopsize <= 0 || loopsize > 1000000 || isNaN(loopsize)) return [];
		var results = new Array(loopsize);
		for (var i=looper.start; i<=looper.end; i++) {
			if (i>looper.start) ${scopename}.resetCache();
			looper.current = i;
			${scopename}.refresh();
			var val = ${express};
			if (val !== undefined) results[ix++] = val;
		}
		${scopename}.range = true;
		if (results.length > ix) results.length = ix;
		return results;
	}).call(this)`;
	return res;
}

Eden.AST.Scope.prototype.generate = function(ctx, scope, options) {
	// Add the scope generation string the the array of scopes in this context
	ctx.scopes.push(this.generateConstructor(ctx,scope,options));

	var res = "";

	if (this.range) {
		// Check for any isin
		var isin = false;
		var rangeindex = [];
		var i = 0;
		for (var x in this.overrides) {
			if (this.overrides[x].end) {
				rangeindex.push(i);
			} else {
				if (this.overrides[x].isin) isin = true;
				break;
			}
			i++;
		}

		if (isin || rangeindex.length != 1) {
			res = this._generate_plain_range(ctx,options);
		} else {
			res = this._generate_loop_opti(ctx,options,rangeindex);
		}
	} else {
		var expr = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]", options);
		// Return the expression using the newly generated scope.
		if (this.expression.type == "async") {
			res = "(function(){ var _r = "+expr+"; _r.then(rr => { cache.value = rr; this.expireAsync(); }); return cache.value; }).call(this)";
		} else {
			res = expr;
		}
	}

	return res;
}

Eden.AST.registerExpression(Eden.AST.Scope);
