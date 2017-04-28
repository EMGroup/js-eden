Eden.AST.Scope.Transpile = function(scope, ctx) {
	this.name = "sFunc_"+ctx.name+randomString(6);
	this.scope = scope;
	this.uses = {};
	this.params = {};
	this.paramsList = [];
	this.replacements = {};
	this.parallel = false;
	this.async = false;
}

Eden.AST.Scope.Transpile.prototype.cleanUp = function() {
	delete eden.s[this.name];
}

Eden.AST.Scope.Transpile.prototype.test = function(params, replacements) {
	if (!params) return true;
	for (var i=0; i<params.length; i++) {
		if (this.uses[params[i]] && !this.params[params[i]]) return false;
	}
	// TODO Check for replacements...
	return true;
}

/**
 * Take large expressions and split them into smaller ones.
 */
Eden.AST.Scope.Transpile.prototype.split_expression = function(ctx, expr, mathreplace) {
	var expr1 = "";
	var expr2 = "";
	var contexts = [];

	if (expr.l.type == "binaryop" && expr.l.getSize() >= 6) {
		var res = this.split_expression(ctx, expr.l, mathreplace);
		expr1 = "("+res[0]+")";
		for (var i=1;i<res.length;i++) contexts.push(res[i]);
	} else {
		expr1 = "expr_"+this.exprnum++;
		var expr1_ctx = {dependencies: {}, name: expr1, mathreplace: mathreplace};
		expr1_ctx.source = expr.l.generate(expr1_ctx, undefined, {bound: false, fulllocal: true});
		contexts.push(expr1_ctx);
	}

	if (expr.r.type == "binaryop" && expr.r.getSize() >= 6) {
		var res = this.split_expression(ctx, expr.r, mathreplace);
		expr2 = "("+res[0]+")";
		for (var i=1;i<res.length;i++) contexts.push(res[i]);
	} else {
		expr2 = "expr_"+this.exprnum++;
		var expr2_ctx = {dependencies: {}, name: expr2, mathreplace: mathreplace};
		expr2_ctx.source = expr.r.generate(expr2_ctx, undefined, {bound: false, fulllocal: true});
		contexts.push(expr2_ctx);
	}

	return [expr1 + " " + expr.op + " " + expr2].concat(contexts);
}

Eden.AST.Scope.Transpile.prototype.build = function(ctx) {
	var res = this.buildSource(ctx);
	if (!eden.s) eden.s = {};
	eden.s[this.name] = eval(res);
}

Eden.AST.Scope.Transpile.prototype.getSource = function() {
	var res = "eden.s."+ this.name + "(";

	for (var i=0; i<this.paramsList.length; i++) {
		res += "o"+this.paramsList[i];
		if (i < this.paramsList.length - 1) res += ", ";
	}
	
	res += ")";
	return res;
}

Eden.AST.Scope.Transpile.prototype.buildSource = function(ctx) {
	this.exprs = {};
	this.exprnum = 0;

	var namesindex = {};
	var exprctx = {name: ctx.name, dorebuild: ctx.dorebuild, dependencies: {}, scopes: [], names: namesindex, prefix: "o"};
	var express = this.scope.expression.generate(exprctx,undefined,Eden.AST.MODE_COMPILED);
	var res = "";
	var reruns = "";
	var loopers = [];
	var loopers2 = {};
	var params = this.params;
	var localctx = {name: ctx.name, dorebuild: ctx.dorebuild, dependencies: {}, scopes: [], names: namesindex, prefix: "o"};

	var me = this;
	var visited = this.uses;
	var looplevel = {};
	var loopreruns = [];
	var duplicates = {};

	function importdefs(deps, excludeover) {
		var level = 0;
		for (var x in deps) {
			// Record loop level...
			if (looplevel.hasOwnProperty(x) && looplevel[x] > level) level = looplevel[x];
			//else if (me.overrides[x]) level = 1;

			// TODO Why did I remove the overrides check? If I do it breaks in some cases
			// Because of overrides that depend on themselves on the right hand side?
			// TODO Treat main expression dependencies and override dependencies differently.
			if ((excludeover && me.scope.overrides[x]) || visited[x]) continue;
			//visited[x] = true;

			var sym = eden.root.lookup(x);
			/*if (sym.origin && sym.origin.type == "function") {
				loopreruns[1] += "const obs_"+x+" = eden.f.func_"+x+";\n";
				//level = 1;
			} else */if (sym.definition && sym.origin && sym.origin.type == "definition") {
				// Generate here to also get dependencies... could be done another way.
				var expr = sym.origin.expression;

				if (expr.type == "scope") {
					var scopectx = {dependencies: {}, dorebuild: ctx.dorebuild, name: ctx.name, scopes: [], names: namesindex, prefix: "o"};
					var src = expr.generateCustom(scopectx,Object.keys(visited));

					// Dependencies not influenced by overrides can be parameters and not calculated
					if (!excludeover) {
						looplevel[x] = 0;
					} else {
						looplevel[x] = importdefs(src.params, excludeover);

						// Update the max level of these dependencies
						if (looplevel[x] > level) level = looplevel[x];
						// It may now have been visted?
						if (visited[x]) continue;

						// Append the expression to the correct loop level
						if (looplevel[x] == 1) loopreruns[1] += "var ";
						else loopreruns[1] += "var o"+x+";\n";
						loopreruns[looplevel[x]] += "o"+x + " = " + src.getSource() + ";\n";
					}

					if (looplevel[x] == 0) {
						params[x] = true;
						//if (ctx.dependencies) ctx.dependencies[x] = true;
					}

				// Check if this expression needs to be split up...
				/*} else if (expr.type == "binaryop" && expr.getSize() >= 8) {
					var exprs = me.split_expression(ctx,expr);
					//if (looplevel[x] == 0) loopreruns[0] += "var ";
					//else loopreruns[0] += "var obs_"+x+";\n";
					for (var j=1; j<exprs.length; j++) {

						if (!excludeover) {
							looplevel[exprs[j].name] = 0;
						} else {
							looplevel[exprs[j].name] = importdefs(exprs[j].dependencies, excludeover);

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
						if (looplevel[exprs[j].name] == 0) params[exprs[j].name] = true;
					}
					loopreruns[loopreruns.length-1] += "var o"+x+" = " + exprs[0] + ";\n";*/
				} else {
					var tmpctx = {name: ctx.name, dorebuild: ctx.dorebuild, dependencies: {}, names: namesindex, prefix: "o"};
					var src = expr.generate(tmpctx, undefined, Eden.AST.MODE_COMPILED);

					if (!excludeover) {
						looplevel[x] = 0;
					} else {
						looplevel[x] = importdefs(tmpctx.dependencies, excludeover);

						// Update the max level of these dependencies
						if (looplevel[x] > level) level = looplevel[x];
						// It may now have been visted?
						if (visited[x]) continue;

						// Append the expression to the correct loop level
						if (looplevel[x] == 1) loopreruns[1] += "var ";
						else loopreruns[1] += "var o"+x+";\n";
						loopreruns[looplevel[x]] += "o"+x + " = " + src + ";\n";
					}

					if (looplevel[x] == 0) {
						params[x] = true;
						//if (ctx.dependencies) ctx.dependencies[x] = true;
					}
				}
			} else {
				/*switch (x) {
				case "sqrt" : loopreruns[1] += "var obs_"+x+" = Math.sqrt;\n"; break;
				case "maxn" : loopreruns[1] += "var obs_"+x+" = Math.max;\n"; break;
				case "minn" : loopreruns[1] += "var obs_"+x+" = Math.min;\n"; break;
				default: params[x] = true;
				}*/
				params[x] = true;
				//if (ctx.dependencies) ctx.dependencies[x] = true;
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
	for (var x in this.scope.overrides) {
		if (this.scope.overrides[x].end === undefined) {
			res2 += "var o"+x+" = "+this.scope.overrides[x].start.generate(localctx,undefined,Eden.AST.MODE_COMPILED);
			res2 += ";\n";
		} else {
			res2 += "const l"+x+"_start = "+this.scope.overrides[x].start.generate(localctx,undefined,Eden.AST.MODE_COMPILED);
			res2 += ";\n";
			res2 += "const l"+x+"_end = "+this.scope.overrides[x].end.generate(localctx,undefined,Eden.AST.MODE_COMPILED);
			res2 += ";\n";
			res2 += "length += l" + x + "_end - l"+x+"_start + 1;\n";
			loopers.push(x);
		}
	}

	loopreruns[0] = "";
	loopreruns[1] = "";
	for (var i=0; i<loopers.length; i++) {
		//looplevel[loopers[i]] = i+2;
		loopreruns.push("");
	}

	importdefs(localctx.dependencies, false);
	res += loopreruns[1];
	loopreruns[1] = "";
	res += res2;
	visited = {};
	looplevel = {};

	for (var x in this.scope.overrides) {
		looplevel[x] = 1;
	}
	for (var i=0; i<loopers.length; i++) {
		looplevel[loopers[i]] = i+2;
		//loopreruns.push("");
	}

	importdefs(exprctx.dependencies, true);
	res += loopreruns[1];
	//res += loopreruns[0];

	// Merge visted
	for (var x in visited) {
		this.uses[x] = true;
	}

	// Merge dependencies
	if (ctx.dependencies) {
		for (var x in localctx.dependencies) ctx.dependencies[x] = true;
		for (var x in exprctx.dependencies) ctx.dependencies[x] = true;
	}

	// Only generate an array result if there are any loops
	if (loopers.length > 0) {
		res = "var ix = 0;\nvar length = 0;\n" + res;
		res += "var results = new Array(length);\n";
		res += "console.time('scopefuncopti');\n";
	}

	for (var i=0; i<loopers.length; i++) {
		res += "for (var o"+loopers[i]+" = l"+loopers[i]+"_start; o"+loopers[i]+"<=l"+loopers[i]+"_end; o"+loopers[i]+"++) {\n";
		res += loopreruns[i+2];
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
		res += "return results;\n";
	} else {
		res += "return res;\n";
	}

	var pstring = "(function(";
	//this.params = params;
	params = [];
	for (var x in this.params) {
		params.push(x);
		//if (ctx.dependencies) ctx.dependencies[x] = true;
	}
	this.paramsList = params;
	for (var i=0; i<params.length; i++) {
		pstring += "o"+params[i];
		if (i < params.length-1) pstring += ", ";
	}
	pstring += ") {\n";
	res = pstring + res + "})";
	

	console.log("FUNC OPTI "+this.name,res);
	//console.log("FUNC LEVEL",looplevel);
	//return {source: res, params: params};

	return res;
}
