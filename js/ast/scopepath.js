/**
 * A Dot notation scope path structure. There is a scope on the left, applied
 * to some primary observable name on the right. Most functions in this node
 * forward on to children.
 */
Eden.AST.ScopePath = function() {
	this.type = "scopepath";
	this.errors = [];
	this.primary = undefined;
	this.path = new Eden.AST.Primary();
	this.scopestr = undefined;
}

Eden.AST.ScopePath.prototype.prepend = function(extra) {
	this.path.prepend(extra);
}

Eden.AST.ScopePath.prototype.setObservable = function(obs) {
	this.path.setObservable(obs);
}

Eden.AST.ScopePath.prototype.setBackticks = function(btick) {
	this.path.setBackticks(btick);
}

Eden.AST.ScopePath.prototype.getObservable = function() {
	return this.primary.getObservable();
}

Eden.AST.ScopePath.prototype.getScopeString = function() {
	return this.scopestr;
}

Eden.AST.ScopePath.prototype.setPrimary = function(prim) {
	this.primary = prim;
	// Bubble errors from children
	if (this.primary.errors.length > 0) {
		this.errors.push.apply(this.errors, prim.errors);
	}
}

Eden.AST.ScopePath.prototype.generate = function(ctx, scope, options) {
	// Generate the expression to get the scope
	var path = this.path.generate(ctx, scope, {bound: true, scopeonly: true})
	// Generate the primary within the above calculated scope
	return this.primary.generate(ctx, path, options);
}

Eden.AST.ScopePath.prototype.error = Eden.AST.fnEdenASTerror;

