Eden.AST.Append = function() {
	this.type = "append";
	this.destination = undefined;
	this.index = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
}

Eden.AST.Append.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Append.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Append.prototype.generate = function(ctx, scope) {
	var express = this.index.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);

	if (this.destination.islocal) {
		return lvalue + ".push("+express+");\n";
	} else {
		return scope + ".mutate("+lvalue+", function(s) { scope.lookup(s.name).value.push("+express+"); }, this);";
	}
}

Eden.AST.Append.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	var val = this.index.execute(ctx,base, scope);
	if (val instanceof BoundValue) val = val.value;
	/*eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().push(val);
	}, undefined);*/

	var sym = eden.root.lookup(this.destination.name);
	var val2 = sym.value(scope);
	val2.push(val);
	//console.log("VALUE: ", sym.value(scope));
	sym.assign(val2, scope, agent);
}

Eden.AST.Append.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Append.prototype.error = fnEdenASTerror;

