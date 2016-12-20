/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Case statement. Directly converts to javascript and cannot be used when
 * directly executed.
 */
Eden.AST.Case = function() {
	this.type = "case";
	Eden.AST.BaseStatement.apply(this);

	this.datatype = "";
	this.literal = undefined;
};

Eden.AST.Case.prototype.setLiteral = function(datatype, literal) {
	this.datatype = datatype;
	this.literal = literal;
}

Eden.AST.Case.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Case.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Case.prototype.generate = function(ctx, scope) {
	if (typeof this.literal == "string") {
		return "case \"" + this.literal + "\": "; 
	} else {
		return "case " + this.literal + ": ";
	}
}

Eden.AST.Case.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Case not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

Eden.AST.Case.prototype.error = fnEdenASTerror;

