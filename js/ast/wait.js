Eden.AST.Wait = function() {
	this.type = "wait";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.delay = undefined;
	this.executed = 0;
	this.compiled_delay = undefined;
};

Eden.AST.Wait.prototype.error = fnEdenASTerror;

Eden.AST.Wait.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Wait.prototype.setDelay = function(delay) {
	this.delay = delay;
	if (delay && delay.errors.length > 0) {
		this.errors.push.apply(this.errors, delay.errors);
	}
}

Eden.AST.Wait.prototype.compile = function(ctx) {
	if (this.delay === undefined) return;
	if (this.compiled_delay) return;
	var source = "(function(context,scope) { return ";
	source += this.delay.generate(ctx, "scope",{bound: false});
	source += ";})";
	this.compiled_delay = eval(source);
}

Eden.AST.Wait.prototype.generate = function(ctx, scope) {
	return "yield "+this.delay+";";
}

