Eden.AST.ScriptExpr = function() {
	this.type = "scriptexpr";
	Eden.AST.BaseExpression.apply(this);

	//this.statements = [];
	//this.locals = {};
	//this.dependencies = {};
	this.script = null;
};

/*Eden.AST.ScriptExpr.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}*/

Eden.AST.ScriptExpr.prototype.toEdenString = function(scope, state) {
	var res = "func {\n";
	for (var i = 0; i < this.script.statements.length; i++) {
		res += this.script.statements[i].toEdenString(scope, state)+"\n";
	}
	res += "}";
	return res;
}

Eden.AST.ScriptExpr.prototype.setScript = function(script) {
	this.script = script;
	if (script && script.errors) {
		this.errors.push.apply(this.errors, script.errors);
	}
}

Eden.AST.ScriptExpr.prototype.generate = function(ctx, scope, options) {

	var funcdef = "if (!scope) { console.warn('No function scope'); throw 'No scope'; }\n";
	funcdef += "var context = scope.context;\n";

	var opts = Object.assign({}, options);
	opts.usevar = true;

	if (!options.scope) {
		console.error("Missing scope");
		throw "Missing scope";
	}

	var nctx = {
		dependencies: ctx.dependencies,
		locals: {}
	};

	var paras = [];
	var paracount = 0;

	//var result = "((scope !== eden.root.scope) ? (function(escope) {\nescope.isolate = true;\nvar context = new Eden.AST.Context(context);\nescope.context = context;\n";
	for (var i = 0; i < this.script.statements.length; i++) {
		// Special case for oracles.
		/*if (this.script.statements[i].type == "declarations" && this.script.statements[i].kind == "oracle") {
			for (var j=0; j<this.script.statements[i].list.length; j++) {
				//paracount++;
				//ctx.dependencies["$"+paracount] = true;
				//ctx.isconstant = false;
				paras.push(this.script.statements[i].list[j]);
			}
		}*/
		funcdef += this.script.statements[i].generate(nctx, "scope", opts);
	}

	for (var p in nctx.locals) {
		if (nctx.locals[p] == "oracle") paras.push(p);
	}

	var name;
	if (options.funcindex === undefined) options.funcindex = 0;
	if (options.symbol) {
		name = options.symbol.name;
		if (options.funcindex++ != 0) name += options.funcindex;
	} else {
		console.error("No symbol for func");
		return "";
	}

	funcdef = `return function func_${name}(${paras.join(",")}){ ${funcdef} };`;

	this.script.setName(null,name);
	this.script.addIndex();

	try {
		var f = new Function(["scope"], funcdef);
		options.scope.context.f["func_"+name] = f;
	} catch (e) {
		console.error("Func compile error: "+name,e,funcdef);
	}

	//result = result + "}).call(this,new Scope(context,"+scope+",[],false,this,false)) : undefined)";
	
	//return `((${scope} !== eden.root.scope)?rt.f.func_${name}.call(this,${scope}) : "__FUNC__")`;
	return `context.f.func_${name}`;
}

Eden.AST.registerExpression(Eden.AST.ScriptExpr);

