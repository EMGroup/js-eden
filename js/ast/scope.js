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
	this.mergeoptimised = false;
	this.exprnum = 0;
	this.exprs = {};
	this.compiled = undefined;
	this.params = {};
}

Eden.AST.Scope.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Scope.prototype.needsRebuild = function() { return this.mergeoptimised; }

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
			startstr = over.start.generate(ctx,scope,{inline: (options)?options.inline:false, bound: false});
		} else {
			startstr = over.start.generate(ctx,scope,{bound: false}); //over.start.type == "primary" || over.start.type == "scope"});
		}
		res += "new ScopeOverride(\""+o+"\", " + startstr;
		if (over.end) {
			var endstr = this.overrides[o].end.generate(ctx,scope, {inline: (options)?options.inline:false, bound: false});

			if (over.increment) {
				var incstr = over.increment.generate(ctx,scope, {inline: (options)?options.inline:false, bound: false});
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
}

/**
 * Take large expressions and split them into smaller ones.
 */
Eden.AST.Scope.prototype.split_expression = function(ctx, expr) {
	var expr1 = "";
	var expr2 = "";
	var contexts = [];

	if (expr.l.type == "binaryop" && expr.l.getSize() >= 6) {
		var res = this.split_expression(ctx, expr.l);
		expr1 = "("+res[0]+")";
		for (var i=1;i<res.length;i++) contexts.push(res[i]);
	} else {
		expr1 = "expr_"+this.exprnum++;
		var expr1_ctx = {dependencies: {}, name: expr1};
		expr1_ctx.source = expr.l.generate(expr1_ctx, undefined, {bound: false, fulllocal: true});
		contexts.push(expr1_ctx);
	}

	if (expr.r.type == "binaryop" && expr.r.getSize() >= 6) {
		var res = this.split_expression(ctx, expr.r);
		expr2 = "("+res[0]+")";
		for (var i=1;i<res.length;i++) contexts.push(res[i]);
	} else {
		expr2 = "expr_"+this.exprnum++;
		var expr2_ctx = {dependencies: {}, name: expr2};
		expr2_ctx.source = expr.r.generate(expr2_ctx, undefined, {bound: false, fulllocal: true});
		contexts.push(expr2_ctx);
	}

	return [expr1 + " " + expr.op + " " + expr2].concat(contexts);
}

Eden.AST.Scope.prototype._generate_func_opti = function(ctx, options) {
	this.mergeoptimised = true;
	this.exprs = {};
	this.exprnum = 0;

	var exprctx = {dependencies: {}};
	var express = this.expression.generate(exprctx,undefined,{bound: false, fulllocal: true});
	var res = "";
	var reruns = "";
	var loopers = [];
	var loopers2 = {};
	var params = [];

	var me = this;
	var visited = {};
	var looplevel = {};
	var loopreruns = [];

	function importdefs(deps) {
		var level = 0;
		for (var x in deps) {
			// Record loop level...
			if (looplevel.hasOwnProperty(x) && looplevel[x] > level) level = looplevel[x];

			if (me.overrides[x] || visited[x]) continue;
			var sym = eden.root.lookup(x);
			if (sym.definition && sym.origin && sym.origin.type == "definition") {
				// Generate here to also get dependencies... could be done another way.
				var expr = sym.origin.expression;

				if (expr.type == "scope") {
					var src = expr.generate({dependencies: {}}, undefined, {bound: false, fulllocal: true});
					looplevel[x] = importdefs(expr.params);
					// Update the max level of these dependencies
					if (looplevel[x] > level) level = looplevel[x];
					// It may now have been visted?
					if (visited[x]) continue;

					// Append the expression to the correct loop level
					if (looplevel[x] == 0) loopreruns[0] += "var ";
					else loopreruns[0] += "var obs_"+x+";\n";
					loopreruns[looplevel[x]] += "obs_"+x + " = " + src + ";\n";
				} else if (expr.type == "binaryop" && expr.getSize() >= 8) {
					var exprs = me.split_expression(ctx,expr);
					//if (looplevel[x] == 0) loopreruns[0] += "var ";
					//else loopreruns[0] += "var obs_"+x+";\n";
					for (var j=1; j<exprs.length; j++) {
						looplevel[exprs[j].name] = importdefs(exprs[j].dependencies);
						// Update the max level of these dependencies
						if (looplevel[exprs[j].name] > level) level = looplevel[exprs[j].name];
						// It may now have been visted?
						//if (visited[x]) continue;

						// Append the expression to the correct loop level
						loopreruns[looplevel[exprs[j].name]] += "var "+ exprs[j].name +" = " + exprs[j].source + ";\n";
					}
					loopreruns[loopreruns.length-1] += "var obs_"+x+" = " + exprs[0] + ";\n";
				} else {
					var src = expr.generate({dependencies: {}}, undefined, {bound: false, fulllocal: true});
					looplevel[x] = importdefs(sym.dependencies);
					// Update the max level of these dependencies
					if (looplevel[x] > level) level = looplevel[x];
					// It may now have been visted?
					if (visited[x]) continue;

					// Append the expression to the correct loop level
					if (looplevel[x] == 0) loopreruns[0] += "var ";
					else loopreruns[0] += "var obs_"+x+";\n";
					loopreruns[looplevel[x]] += "obs_"+x + " = " + src + ";\n";
				}
			} else {
				switch (x) {
				case "maxn" : loopreruns[0] += "var obs_"+x+" = Math.max;\n"; break;
				case "minn" : loopreruns[0] += "var obs_"+x+" = Math.min;\n"; break;
				default: //loopreruns[0] += "var obs_"+x+" = eden.root.lookup(\""+x+"\").value(scope);\n";
				}

				switch (x) {
				case "maxn" :
				case "minn" : break;
				default: params.push(x);
				}
			}
			visited[x] = true;

			//if (ctx.dependencies[x]) {
			/*switch (x) {
			case "maxn" : res += "var obs_"+x+" = Math.max;\n"; break;
			case "minn" : res += "var obs_"+x+" = Math.min;\n"; break;
			default: res += "var obs_"+x+" = eden.root.lookup(\""+x+"\").value(scope);\n";
			}*/
			//}
		}
		return level;
	}

	var res2 = "";
	for (var x in this.overrides) {
		if (this.overrides[x].end === undefined) {
			res2 += "var obs_"+x+" = "+this.overrides[x].start.generate(ctx,undefined,{bound: false, fulllocal: true});
			res2 += ";\n";
		} else {
			res2 += "var obs_"+x+"_start = "+this.overrides[x].start.generate(ctx,undefined,{bound: false, fulllocal: true});
			res2 += ";\n";
			res2 += "var obs_"+x+"_end = "+this.overrides[x].end.generate(ctx,undefined,{bound: false, fulllocal: true});
			res2 += ";\n";
			res2 += "length += obs_" + x + "_end - obs_"+x+"_start + 1;\n";
			loopers.push(x);
		}
	}

	loopreruns[0] = "";
	for (var i=0; i<loopers.length; i++) {
		looplevel[loopers[i]] = i+1;
		loopreruns.push("");
	}
	importdefs(ctx.dependencies);
	res += loopreruns[0];
	loopreruns[0] = "";
	res += res2;
	importdefs(exprctx.dependencies);
	res += loopreruns[0];

	// Merge dependencies
	for (var x in exprctx.dependencies) ctx.dependencies[x] = true;

	// Only generate an array result if there are any loops
	if (loopers.length > 0) {
		res = "var ix = 0;\nvar length = 0;\n" + res;
		res += "var results = new Array();\n";
		res += "console.time('scopefuncopti');\n";
	}

	for (var i=0; i<loopers.length; i++) {
		res += "for (var obs_"+loopers[i]+" = obs_"+loopers[i]+"_start; obs_"+loopers[i]+"<=obs_"+loopers[i]+"_end; obs_"+loopers[i]+"++) {\n";
		res += loopreruns[i+1];
	}

	res += "var res = "+express+";\n";

	if (loopers.length > 0) {
		res += "if (res !== undefined) results[ix++] = res;\n";
	}

	for (var i=0; i<loopers.length; i++) {
		res += "}\n";
	}


	if (loopers.length > 0) {
		res += "results.length = ix;\n";
		res += "console.timeEnd('scopefuncopti');\n";

		if (options.bound) {
			res += "return new BoundValue(results,scope);\n";
		} else {
			res += "return results;\n";
		}
	} else {
		if (options.bound) {
			res += "return new BoundValue(res,scope);\n";
		} else {
			res += "return res;\n";
		}
	}

	var pstring = "(function(";
	this.params = {};
	for (var i=0; i<params.length; i++) {
		pstring += "obs_"+params[i];
		if (i < params.length-1) pstring += ", ";
		this.params[params[i]] = true;
	}
	pstring += ") {\n";
	res = pstring + res + "})";
	

	console.log("FUNC OPTI",res);
	//console.log("FUNC LEVEL",looplevel);
	return {source: res, params: params};
}

Eden.AST.Scope.prototype._generate_loop_opti = function(ctx, options, rangeindex) {
	//console.log("LOOP RANGE INDEX", rangeindex);
	var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
	var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]",{bound: false});
	var res = "(function() {\n";
	res += scopename + ".range = false;\n";
	res += "var ix = 0;\n";
	res += "var length = 0;\n";

	for (var i=0; i<rangeindex.length; i++) {
		res += "var looper"+i+" = " + scopename + ".overrides["+rangeindex[i]+"];\n";
		res += "length += looper"+i+".end - looper"+i+".start + 1;\n";
	}

	res += "var results = new Array(length);\n";

	for (var i=0; i<rangeindex.length; i++) {
		//res += "var scoperesults = new Array(looper.end - looper.start + 1);;\n";
		res += "for (var i"+i+"=looper"+i+".start; i"+i+"<=looper"+i+".end; i"+i+"++) {\n";
		res += "\tlooper"+i+".current = i"+i+";\n";
	}


		res += "\t"+scopename + ".resetCache();\n";
		res += "\t"+scopename + ".refresh();\n";
		res += "\tvar val = "+express;

		res += ";\n";
		res += "\tif (val !== undefined) results[ix++] = val;\n";
		//res += "if ("+scopename+".next() == false) break;\n";

	for (var i=0; i<rangeindex.length; i++) {
		res += "}\n";
	}

	res += scopename+".range = true;\n";


	res += "results.length = ix;\n";

	if (options.bound) {
		res += "return new BoundValue(results,"+scopename+");}).call(this)";
	} else {
		res += "return results;}).call(this)";
	}
	return res;
}

Eden.AST.Scope.prototype.generate = function(ctx, scope, options) {
	var constructor = this.generateConstructor(ctx,scope,options);
	// Are we required to do a full optimisation? Some outer scope is needing it
	if (options.fulllocal) {
		//if (this.compiled) return this.compiled;
		var optifunc = this._generate_func_opti(ctx,options);
		var name = "sFunc_"+randomString(6);
		if (!eden.s) eden.s = {};
		eden.s[name] = eval(optifunc.source);
		console.log("Context",ctx);
		var res = "eden.s." + name + "(";
		for (var i=0; i<optifunc.params.length; i++) {
			res += "obs_"+optifunc.params[i];
			if (i < optifunc.params.length - 1) res += ", ";
		}
		res += ")";
		this.compiled = res;
		return res;
	// Its a range, so do some sort of optimisation.
	} else if (this.range) {
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

		if (isin || rangeindex.length == 0) {
			// Fall back, unoptimised if its a list iteration instead of a loop
			ctx.scopes.push(constructor);
			return this._generate_plain_range(ctx,options);
		} else {
			// More than one range loop results in full compilation
			if (rangeindex.length > 1) {
				//if (this.compiled) return this.compiled;
				var optifunc = this._generate_func_opti(ctx,options);
				var name = "sFunc_"+randomString(6);
				if (!eden.s) eden.s = {};
				eden.s[name] = eval(optifunc.source);
				//console.log("Context",ctx);
				var res = "eden.s." + name + "(";
				for (var i=0; i<optifunc.params.length; i++) {
					res += "eden.root.lookup(\""+optifunc.params[i]+"\").value(scope)";
					if (i < optifunc.params.length - 1) res += ", ";
				}
				res += ")";
				this.compiled = res;
				return res;
			// Otherwise, do a partial optimise using a for loop.
			} else {
				ctx.scopes.push(constructor);
				return this._generate_loop_opti(ctx,options,rangeindex);
			}
		}
	} else {
		// Unoptimised scoping...
		ctx.scopes.push(constructor);
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
	//console.log(rhs);
	return eval(rhs)(eden.root,scope);
}

