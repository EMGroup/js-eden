/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Condition statement. Directly converts to javascript and cannot be used when
 * directly executing (generates a runtime error).
 */
Eden.AST.Section = function() {
	this.type = "section";
	Eden.AST.BaseStatement.apply(this);
	this.name = undefined;
	this.depth = 1;
};

Eden.AST.Section.prototype.generate = function(ctx, scope) {
	return "";
}

Eden.AST.Section.prototype.execute = function(ctx,base,scope,agent) {
}

Eden.AST.registerStatement(Eden.AST.Section);

