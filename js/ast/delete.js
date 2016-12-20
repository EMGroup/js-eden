Eden.AST.Delete = function() {
	this.type = "delete";
	this.destination = undefined;
	this.index = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.executed = 0;
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

Eden.AST.Delete.prototype.generate = function(ctx,scope) {
	var ix = this.index.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(rt.index("+ix+"), 1); }, this);";
}

Eden.AST.Delete.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	var ix = this.index.execute(ctx,base,scope);
	if (ix instanceof BoundValue) ix = ix.value;
	eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 1);
	}, undefined);
}

Eden.AST.Delete.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Delete.prototype.error = fnEdenASTerror;

