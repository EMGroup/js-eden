Eden.AST.Delete = function() {
	this.type = "delete";
	Eden.AST.BaseStatement.apply(this);

	this.destination = undefined;
	this.index = undefined;
}

Eden.AST.Delete.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Delete.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Delete.prototype.generate = function(ctx,scope,options) {
	var ix = this.index.generate(ctx, scope, options);
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(rt.index("+ix+"), 1); }, this);";
}

Eden.AST.Delete.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	var ix = this.index.execute(ctx,base,scope);
	if (ix instanceof BoundValue) ix = ix.value;
	scope.context.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 1);
	}, this);
}

Eden.AST.registerStatement(Eden.AST.Delete);

