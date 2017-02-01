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

Eden.AST.Section.prototype.setName = function(name) {
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

Eden.AST.Section.prototype.generate = function(ctx, scope) {
	return "";
}

Eden.AST.Section.prototype.execute = function(ctx,base,scope,agent) {
	var stats = [];
	var node = this.nextSibling;
	while (node && (node.type != "section" || node.depth > this.depth)) {
		if (node.type != "dummy" && node.type != "script" && node.type != "section") stats.push(node);
		node = node.nextSibling;
	}
	return stats;
}

Eden.AST.registerStatement(Eden.AST.Section);

Eden.AST.Section.prototype.getRange = function(relative) {
	var sl = this.getStartLine(relative);
	var node = this.nextSibling;
	while (node && node.nextSibling && (node.nextSibling.type != "section" || node.nextSibling.depth > this.depth)) {
		node = node.nextSibling;
	}
	if (node && node.type == "dummy") node = node.previousSibling;
	var el = (node) ? node.getEndLine(relative) : sl+this.getNumberOfLines();
	return [sl,el];
}

