Eden.AST.Alias = function() {
	this.type = "script";
	Eden.AST.BaseStatement.apply(this);
	this.name = undefined;
	this.active = false;
	this.selector = undefined;
};

Eden.AST.Alias.prototype.setName = function(name) {
	this.name = name;
}

Eden.AST.Alias.prototype.setSelector = function(selector) {
	this.selector = selector;
	if (selector && selector.errors.length > 0) {
		this.errors.push.apply(this.errors, selector.errors);
	}
}

Eden.AST.Alias.prototype.execute = function(ctx, base, scope, agent) {
	return Eden.Selectors.query(this.selector.execute(ctx,base,scope,agent));
}

Eden.AST.Alias.prototype.generate = function(ctx, scope, options) {

}

Eden.AST.registerStatement(Eden.AST.Alias);

Object.defineProperty(Eden.AST.Alias.prototype, "statements", {
	get: function() { if (this.selector) { var stats = this.selector.execute(this, eden.project.ast, eden.root.scope, this); return Eden.Selectors.query(stats);} return []; }
});

Eden.AST.Alias.addIndex = function() {
	this.buildID();
	Eden.Index.update(this);
}

Eden.AST.Alias.removeIndex = function() {
	Eden.Index.remove(this);
}

Eden.AST.Alias.destroy = function() {
	if (this.executed < 1) Eden.Index.remove(this);
	this.parent = undefined;
	this.executed = -1;
}

