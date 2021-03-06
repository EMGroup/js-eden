Eden.AST.Insert = function() {
	this.type = "insert";
	Eden.AST.BaseStatement.apply(this);

	this.destination = undefined;
	this.index = undefined;
	this.value = undefined;
}

Eden.AST.Insert.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Insert.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Insert.prototype.setValue = function(value) {
	this.value = value;
	if (value.errors.length > 0) {
		this.errors.push.apply(this.errors, value.errors);
	}
}

Eden.AST.Insert.prototype.generate = function(ctx, scope, options) {
	var ix = this.index.generate(ctx, scope, options);
	var val = this.value.generate(ctx, scope, options);
	var lvalue = this.destination.generate(ctx,scope,options);
	if (this.destination.islocal) {
		return lvalue + ".splice(rt.index("+ix+"), 0, ("+val+"));";
	} else {
		return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(rt.index("+ix+"), 0, ("+val+")); }, this);";
	}
}

Eden.AST.Insert.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	var ix = this.index.execute(ctx,base,scope);
	var val = this.value.execute(ctx,base,scope);
	if (ix instanceof BoundValue) ix = ix.value;
	if (val instanceof BoundValue) val = val.value;
	scope.context.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 0, val);
	}, this);
}

Eden.AST.registerStatement(Eden.AST.Insert);

