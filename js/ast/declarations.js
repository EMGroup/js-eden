/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Represent a list of declarations for local and para. Converts to a
 * javascript var when generated, or just creates a local symbol for lookup
 * when executed.
 */
Eden.AST.Declarations = function() {
	this.type = "declarations";
	Eden.AST.BaseStatement.apply(this);

	this.list = [];
	this.kind = "local";
};

Eden.AST.Declarations.prototype.toEdenString = function(scope, state) {
	var res = (this.kind == "local") ? "local " : "para ";
	var first = true;
	for (var d of this.list) {
		if (!first) res += ", ";
		first = false;
		res += d;
	}
	return res + ";";
}

Eden.AST.Declarations.prototype.execute = function(ctx, base, scope, agent) {
	if (this.kind == "local") {
		for (var i=0; i<this.list.length; i++) {
			var sym = new Eden.AST.Local(this.list[i]);
			scope.addIfNotExist(this.list[i], sym);
			ctx.locals[this.list[i]] = sym;  // Deprecated?
		}
	} else if (this.kind == "oracle") {
		for (var i=0; i<this.list.length; i++) {
			var sym = new Eden.AST.Local(this.list[i]);
			scope.addAlias(this.list[i], "$"+(i+1), sym);
			ctx.locals[this.list[i]] = sym;  // Deprecated?
		}
	}
}

Eden.AST.Declarations.prototype.generate = function(ctx,scope,options) {
	if (this.kind == "local") {
		var res = "var ";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = "local"; //new Eden.AST.Local(this.list[i]);
			res += this.list[i];
			if (i < this.list.length-1) res += ",";
		}
		res += ";\n";
		return res;
	// Oracles need initialising unlike plain locals.
	// These are for script expressions where scoping is used for parameters.
	} else if (this.kind = "oracle") {
		var res = "";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = "oracle";  //new Eden.AST.Local(this.list[i]);
			//res += "var "+this.list[i] + " = "+scope+".value(\""+this.list[i]+"\");\n";
			//res += "var "+this.list[i] + " = "+scope+".value(\"$"+(i+1)+"\");\n";
		}
		return res;
	}
}

Eden.AST.registerStatement(Eden.AST.Declarations);

