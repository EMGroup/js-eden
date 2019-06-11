/**
 * Append statement. Adds an item to the end of an existing list. It takes a
 * destination lvalue, an expression index and an expression value to be
 * appended.
 */
Eden.AST.Shift = function() {
	this.type = "shift";
	Eden.AST.BaseStatement.apply(this);

	this.destination = undefined;
}

Eden.AST.Shift.prototype.setDest = function(dest) {
	this.destination = dest;
	// Pass errors up the tree.
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Shift.prototype.generate = function(ctx, scope) {
	var lvalue = this.destination.generate(ctx, scope);

	if (this.destination.islocal) {
		return lvalue + ".shift();\n";
	} else {
		return scope + ".mutate("+lvalue+", function(s) { scope.lookup(s.name).value.shift(); }, this);";
	}
}

Eden.AST.Shift.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	var sym = eden.root.lookup(this.destination.name);
	var val2 = sym.value(scope);
	val2.shift();
	sym.assign(val2, scope, this);
}

Eden.AST.registerStatement(Eden.AST.Shift);

