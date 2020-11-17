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

Eden.AST.ScriptExpr.prototype.generate = function(ctx, scope) {
	var result = "(function(escope) {\nescope.isolate = true;\nif (cache) cache.scope = escope;\nvar context = new Eden.AST.Context(context);\nescope.context = context;\n";
	for (var i = 0; i < this.statements.length; i++) {
		// Special case for oracles.
		if (this.statements[i].type == "declarations" && this.statements[i].kind == "oracle") {
			for (var j=0; j<this.statements[i].list.length; j++) {
				ctx.dependencies[this.statements[i].list[j]] = true;
				ctx.isconstant = false;
			}
		}
		result = result + this.statements[i].generate(this, "escope", {bound: false});
	}
	result = result + "}).call(this,new Scope(context,"+scope+",[],false,this,false))";
	
	return result;
}

