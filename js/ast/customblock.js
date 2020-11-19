/*
 * Copyright (c) 2020, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Condition statement. Directly converts to javascript and cannot be used when
 * directly executing (generates a runtime error).
 */
Eden.AST.CustomBlock = function() {
	this.type = "custom";
	Eden.AST.BaseStatement.apply(this);
	this.name = null;
	this.text = null;
};

Eden.AST.CustomBlock.prototype.setName = function(name) {
	this.name = name;
	var tags = name.match(/#[\w]+/g);
	if (tags !== null) {
		if (this.tags === undefined) {
			this.tags = tags;
		} else {
			this.tags = this.tags.concat(tags);
		}
	}
}

Eden.AST.CustomBlock.prototype.generate = function(ctx, scope) {
	return "";
}

Eden.AST.CustomBlock.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;
	eden.root.lookup("script_"+this.name+"_execute").assign(this.text, scope);
	var stats = [];
	return stats;
}

Eden.AST.registerStatement(Eden.AST.CustomBlock);
