/**
 * Append statement. Adds an item to the end of an existing list. It takes a
 * destination lvalue, an expression index and an expression value to be
 * appended.
 */
Eden.AST.Append = function() {
	this.type = "append";
	Eden.AST.BaseStatement.apply(this);

	this.destination = undefined;
	this.index = undefined;
}

Eden.AST.Append.prototype.setDest = function(dest) {
	this.destination = dest;
	// Pass errors up the tree.
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Append.prototype.setIndex = function(index) {
	this.index = index;
	// Pass errors up the tree.
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Append.prototype.generate = function(ctx, scope, options) {
	var express = this.index.generate(ctx, scope, options);
	var lvalue = this.destination.generate(ctx, scope, options);

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
	sym.assign(val2, scope, this);
}

Eden.AST.registerStatement(Eden.AST.Append);

