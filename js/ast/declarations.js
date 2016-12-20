Eden.AST.Declarations = function() {
	this.type = "declarations";
	Eden.AST.BaseStatement.apply(this);

	this.list = [];
	this.kind = "local";
};

Eden.AST.Declarations.prototype.error = fnEdenASTerror;

Eden.AST.Declarations.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Declarations.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Declarations.prototype.execute = function(ctx, base, scope, agent) {
	if (ctx) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
		}
	}
}

Eden.AST.Declarations.prototype.generate = function(ctx,scope,options) {
	if (this.kind == "local") {
		var res = "var ";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
			res += this.list[i];
			if (i < this.list.length-1) res += ",";
		}
		res += ";\n";
		return res;
	} else if (this.kind = "oracle") {
		var res = "";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
			res += "var "+this.list[i] + " = "+scope+".value(\""+this.list[i]+"\");\n";
		}
		return res;
	}
}

