/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Break statement. This doesn't really do anything but a direct translation
 * to javascript. Not supported in execution only mode.
 */
Eden.AST.Break = function() {
	this.type = "break";
	Eden.AST.BaseStatement.apply(this);
};

Eden.AST.Break.prototype.generate = function(ctx, scope) {
	return "break; ";
}

Eden.AST.Break.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Break not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
}

Eden.AST.registerStatement(Eden.AST.Break);

