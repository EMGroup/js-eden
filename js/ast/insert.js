Eden.AST.Insert = function() {
	this.type = "insert";
	this.destination = undefined;
	this.index = undefined;
	this.value = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.executed = 0;
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

Eden.AST.Insert.prototype.generate = function(ctx, scope) {
	var ix = this.index.generate(ctx, scope, {bound: false});
	var val = this.value.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);
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
	eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 0, val);
	}, undefined);
}

Eden.AST.Insert.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Insert.prototype.error = fnEdenASTerror;

