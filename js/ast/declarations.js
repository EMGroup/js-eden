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

Eden.AST.Declarations.prototype.execute = function(ctx, base, scope, agent) {
	/*if (ctx) {
		// Shouldn't be needed!
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
		}
	}*/

	for (var i=0; i<this.list.length; i++) {
		scope.add(this.list[i], new Eden.AST.Local(this.list[i]));
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
	// Oracles need initialising unlike plain locals.
	// These are for script expressions where scoping is used for parameters.
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

Eden.AST.registerStatement(Eden.AST.Declarations);

