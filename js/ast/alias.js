Eden.AST.Alias = function() {
	this.type = "script";
	Eden.AST.BaseStatement.apply(this);
	this.name = undefined;
	this.active = false;
	this.selector = undefined;
	this._statements = null;
	this.lock = 1;
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

Eden.AST.Alias.prototype.setAttributes = function(attribs) {
	return true;
}

Eden.AST.Alias.prototype.execute = function(ctx, base, scope, agent) {
	//return Eden.Selectors.query(this.selector.execute(ctx,base,scope,agent));

	var filtered = [];
	this.executed = 1;

	// TODO Optimise by compiling if possible
	// Blocking statements would need special treatment and it may not always
	// be possible to compile them simply.

	if (this.locals && this.locals.list.length > 0) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.locals.list.length; i++) {
			ctx.locals[this.locals.list[i]] = new Eden.AST.Local(this.locals.list[i]);
		}
	}

	// Remove nested scripts that shouldn't be executed
	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "script" && this.statements[i].type != "section") filtered.push(this.statements[i]);
	}
	return filtered;
}

Eden.AST.Alias.prototype.generate = function(ctx, scope, options) {

}

//Eden.AST.registerStatement(Eden.AST.Alias);
Eden.AST.registerScript(Eden.AST.Alias);

Eden.AST.Alias.prototype.getNumberOfLines = function() {
	return this.numlines;
}

Object.defineProperty(Eden.AST.Alias.prototype, "statements", {
	get: function() {
		if (!this._statements && this.selector) {
			var stats = this.selector.execute(this, (eden.project) ? eden.project.ast : {}, eden.root.scope, this);
			Eden.Selectors.query(stats, undefined, {minimum: 1}, (r) => {
				if (r.length == 1 && r[0].type == "script") {
					this._statements = r[0].statements;
					// Swap parent to attach locally
					r[0].parent = this.parent;
				} else {
					// TODO: Change parent of each statement?
					this._statements = r;
				}

				for (let i=0; i<this._statements.length; i++) {
					if (this._statements[i].type != "dummy") {
						this._statements[i].addIndex();
					}
				}
			});
		} return (this._statements) ? this._statements : []; }
});

Eden.AST.Alias.addIndex = function() {
	this.buildID();
	Eden.Index.update(this);
}

Eden.AST.Alias.removeIndex = function() {
	Eden.Index.remove(this);
}

Eden.AST.Alias.prototype.destroy = function() {
	if (this.executed < 1) Eden.Index.remove(this);

	if (this._statements) {
		for (var i=0; i<this._statements.length; i++) {
			this._statements[i].destroy();
		}
	}
	this.executed = -1;
	// Note, means can't search historical scripts structurally.
	this._statements = undefined;
	this.base = undefined;
	this.parent = undefined;
	this.nextSibling = undefined;
	this.previousSibling = undefined;
}

Eden.AST.Alias.prototype.getInnerSource = function() {
	var res = "";
	for (var i=0; i<this._statements.length; i++) {
		res += this._statements[i].getSource();
	}
	return res;
}

