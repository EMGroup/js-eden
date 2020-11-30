Eden.AST.ScriptExpr = function() {
	this.type = "scriptexpr";
	this.errors = [];
	this.statements = [];
	this.locals = {};
	this.dependencies = {};
};

Eden.AST.ScriptExpr.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.ScriptExpr.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

Eden.AST.ScriptExpr.prototype.generate = function(ctx, scope, options) {

	var funcdef = "if (!scope) scope = eden.root.scope;\n";

	var opts = Object.assign({}, options);
	opts.usevar = true;

	//var paras = [];
	var paracount = 0;

	//var result = "((scope !== eden.root.scope) ? (function(escope) {\nescope.isolate = true;\nvar context = new Eden.AST.Context(context);\nescope.context = context;\n";
	for (var i = 0; i < this.statements.length; i++) {
		// Special case for oracles.
		if (this.statements[i].type == "declarations" && this.statements[i].kind == "oracle") {
			for (var j=0; j<this.statements[i].list.length; j++) {
				paracount++;
				//ctx.dependencies["$"+paracount] = true;
				//ctx.isconstant = false;
				//paras.push(this.statements[i].list[j]);
			}
		}
		funcdef += this.statements[i].generate(ctx, "scope", opts);
	}

	var name;
	if (options.funcindex === undefined) options.funcindex = 0;
	if (options.symbol) {
		name = options.symbol.name;
		name += options.funcindex++;
	} else {
		console.error("No symbol for func");
		return "";
	}

	var f = new Function(["scope"], funcdef);
	Object.defineProperty(f, "name", { value: name });
	rt.f["func_"+name] = f;

	//result = result + "}).call(this,new Scope(context,"+scope+",[],false,this,false)) : undefined)";
	
	return `((${scope} !== eden.root.scope)?rt.f.func_${name}.call(this,${scope}) : "Function")`;
}

