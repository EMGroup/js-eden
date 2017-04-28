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

	this.transpiles = [];
}

Eden.AST.Scope.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Scope.prototype.needsRebuild = function() { return true; }

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

/*Eden.AST.Scope.prototype.generateConstructor = function(ctx, scope, options) {
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
}*/

/*Eden.AST.Scope.prototype._generate_plain_range = function(ctx, options) {
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
}*/



/*Eden.AST.Scope.prototype._generate_GPU_opti = function(ctx, options) {
	this.mergeoptimised = true;
	this.exprs = {};
	this.exprnum = 0;

	var exprctx = {dependencies: {}, mathreplace: true, scopes: []};
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
	var duplicates = {};
	var kernelparams = [];

	// If something is already in names index then it must be a parameter...
	if (ctx.names) {
		for (var x in ctx.names) {
			params[x] = true;
			visited[x] = true;
		}
	}

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
					var src = expr.generate({dependencies: {}, mathreplace: true}, undefined, {bound: false, fulllocal: true});
					looplevel[x] = importdefs(expr.params);
					// Update the max level of these dependencies
					if (looplevel[x] > level) level = looplevel[x];
					// It may now have been visted?
					if (visited[x]) continue;

					// Append the expression to the correct loop level
					if (looplevel[x] == 0) {
						kernelparams.push(x);
					} else loopreruns[0] += "var obs_"+x+";\n";
					loopreruns[looplevel[x]] += "var obs_"+x + " = " + src + ";\n";
				// Check if this expression needs to be split up...
				} else if (expr.type == "binaryop" && expr.getSize() >= 8) {
					var exprs = me.split_expression(ctx,expr, true);
					//if (looplevel[x] == 0) loopreruns[0] += "var ";
					//else loopreruns[0] += "var obs_"+x+";\n";
					for (var j=1; j<exprs.length; j++) {
						looplevel[exprs[j].name] = importdefs(exprs[j].dependencies);
						// Update the max level of these dependencies
						if (looplevel[exprs[j].name] > level) level = looplevel[exprs[j].name];
						// It may now have been visted?
						//if (visited[x]) continue;

						// Append the expression to the correct loop level
						var hash = hashCode(exprs[j].source);
						// TODO This should check for hash collisions just in case!
						if (duplicates.hasOwnProperty(hash)) {
							console.log("DUPLICATE", exprs[j].source);
							loopreruns[looplevel[exprs[j].name]] += "var "+exprs[j].name + " = " + duplicates[hash] + ";\n";
						} else {
							loopreruns[looplevel[exprs[j].name]] += "var "+ exprs[j].name +" = " + exprs[j].source + ";\n";
							duplicates[hash] = exprs[j].name;
						}
					}
					loopreruns[loopreruns.length-1] += "var obs_"+x+" = " + exprs[0] + ";\n";
				} else {
					var src = expr.generate({dependencies: {}, mathreplace: true}, undefined, {bound: false, fulllocal: true});
					looplevel[x] = importdefs(sym.dependencies);
					// Update the max level of these dependencies
					if (looplevel[x] > level) level = looplevel[x];
					// It may now have been visted?
					if (visited[x]) continue;

					// Append the expression to the correct loop level
					//if (looplevel[x] == 0) loopreruns[0] += "var ";
					//else loopreruns[0] += "var obs_"+x+";\n";
					loopreruns[looplevel[x]] += "var obs_"+x + " = " + src + ";\n";
				}
			} else {
				switch (x) {
				case "sqrt" : loopreruns[0] += "var obs_"+x+" = Math.sqrt;\n"; break;
				case "maxn" : loopreruns[0] += "var obs_"+x+" = Math.max;\n"; break;
				case "minn" : loopreruns[0] += "var obs_"+x+" = Math.min;\n"; break;
				default: params.push(x); kernelparams.push(x);
				}
			}
			visited[x] = true;
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

	res += "var obs_width = obs_"+loopers[0]+"_end - obs_"+loopers[0]+"_start;\n";
	res += "var obs_height = obs_"+loopers[1]+"_end - obs_"+loopers[1]+"_start;\n";
	res += "var obs_depth = obs_"+loopers[2]+"_end - obs_"+loopers[2]+"_start;\n";

	// Merge dependencies
	for (var x in exprctx.dependencies) ctx.dependencies[x] = true;

	kernelparams.push("width");
	kernelparams.push("height");

	res += "var gpu = new GPU();\n";
	res += "var sfunc = gpu.createKernel(function(";
	for (var i=0; i<kernelparams.length; i++) {
		res += "obs_"+kernelparams[i];
		if (i < kernelparams.length-1) res += ", ";
	}
	res += ") {\n";

	if (loopers.length == 3) {
		res += "var index = this.thread.x;\n";
		res += "var obs_"+loopers[2]+" = index / (obs_width*obs_height);\n";
		res += "index -= obs_"+loopers[2]+" * obs_width * obs_height;\n";
		res += "var obs_"+loopers[1]+" = index / obs_width;\n";
		res += "index -= obs_"+loopers[1]+" * obs_width;\n";
		res += "var obs_"+loopers[0]+" = index;\n";
	}

	for (var i=0; i<loopers.length; i++) {
		//res += "for (var obs_"+loopers[i]+" = obs_"+loopers[i]+"_start; obs_"+loopers[i]+"<=obs_"+loopers[i]+"_end; obs_"+loopers[i]+"++) {\n";
		//res += "var obs_"+loopers[i]+" = this.thread.x / dy"+ ((i==0)?"x":(i==1)?"y":"z")+";\n";
		res += loopreruns[i+1];
	}

	res += "return "+express+";\n";

	res += "}).dimensions([length]).floatTextures(true).floatOutput(true);\n";

	//res += "]);\n";
	res += "console.time('scopeGPU');\n";
	res += "for (var i=0; i<100; i++) {";
	res += "var results = sfunc(";
	for (var i=0; i<kernelparams.length; i++) {
		res += "obs_"+kernelparams[i];
		if (i < kernelparams.length-1) res += ", ";
	}
	res += ");\n";
	res += "}\n";


	res += "console.timeEnd('scopeGPU');\n";

	if (options.bound) {
		res += "return new BoundValue(results,scope);\n";
	} else {
		res += "return results;\n";
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
	

	console.log("GPU VERSION",res);
	if (eden.gpu === undefined) eden.gpu = {};
	eden.gpu["gFunc_"+randomString(6)] = eval(res);
	//console.log("FUNC LEVEL",looplevel);
	return {source: res, params: params};
}*/

/*Eden.AST.Scope.prototype._generate_loop_opti = function(ctx, rangeindex) {
	//console.log("LOOP RANGE INDEX", rangeindex);
	var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
	var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]",Eden.AST.MODE_DYNAMIC);
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
}*/

Eden.AST.Scope.prototype.cleanUp = function() {
	for (var i=0; i<this.transpiles.length; i++) {
		//this.transpiles[i].cleanUp();
		console.log("Removing transpile", this.transpiles[i].name);
	}
	this.transpiles = [];
}

Eden.AST.Scope.prototype.findBySignature = function(ctx, params, replacements) {
	for (var i=0; i<this.transpiles.length; i++) {
		if (this.transpiles[i].test(params,replacements)) {
			var tpile = this.transpiles[i];
			console.log("Found existing: ",tpile.name);
			return tpile;
		}
	}

	var nsig = new Eden.AST.Scope.Transpile(this, ctx);
	this.transpiles.push(nsig);
	nsig.build(ctx);
	return nsig;
}

Eden.AST.Scope.prototype.generateCustom = function(ctx, params, replacements) {
	if (ctx.dorebuild) {
		//delete eden.s[this.compiled];
		//console.log("REMOVED SCOPECOMP",this.compiled);
		// TODO Need to clean up if compilation fails.
		//this.compiled = undefined;
		this.cleanUp();
	}

	// Any scope will cause a dirty assignment
	ctx.dirty = true;

	var transpile = this.findBySignature(ctx,params,replacements);
	// Make sure dependencies are carried forward.
	if (ctx.dependencies) {
		for (var x in transpile.uses) {
			ctx.dependencies[x] = true;
		}
	}
	return transpile;
}

Eden.AST.Scope.prototype.generate = function(ctx, scope, mode) {
	if (ctx.dorebuild) {
		this.cleanUp();
	}

	// Any scope will cause a dirty assignment
	ctx.dirty = true;

	var transpile = this.findBySignature([],[]);
	// Make sure dependencies are carried forward.
	if (ctx.dependencies) {
		for (var x in transpile.uses) {
			ctx.dependencies[x] = true;
		}
	}
	
	var res = "eden.s."+ transpile.name + "(";

	if (mode === Eden.AST.MODE_COMPILED) {
		for (var i=0; i<transpile.paramsList.length; i++) {
			res += "o"+transpile.paramsList[i];
			if (i < transpile.paramsList.length - 1) res += ", ";
		}
	} else {
		for (var i=0; i<transpile.paramsList.length; i++) {
			res += "eden.root.lookup(\""+transpile.paramsList[i]+"\").value()";
			if (i < transpile.paramsList.length - 1) res += ", ";
		}
	}
	res += ")";
	//this.compiled = res;
	return res;
}

Eden.AST.Scope.prototype.execute = function(ctx, base, scope) {
	var context = {scopes: []};
	var gen = this.generate(context, "scope",Eden.AST.MODE_DYNAMIC);
	var rhs = "(function(context,scope) {\n";

	/*if (context.scopes.length > 0) {
		rhs += "\tvar _scopes = [];\n";
		for (var i=0; i<context.scopes.length; i++) {
			rhs += "\t_scopes.push(" + context.scopes[i];
			rhs += ");\n";
			rhs += "if (this.def_scope) { _scopes["+i+"].mergeCache(this.def_scope["+i+"].cache); _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		rhs += "this.def_scope = _scopes;\n";
	}*/

	rhs += "return ";
	rhs += gen;
	rhs += ";})";
	//console.log(rhs);
	return eval(rhs)(eden.root,scope);
}

