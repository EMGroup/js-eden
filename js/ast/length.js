Eden.AST.Length = function() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

Eden.AST.Length.prototype.left = fnEdenASTleft;

Eden.AST.Length.prototype.error = fnEdenASTerror;

Eden.AST.Length.prototype.generate = function(ctx, scope, options) {
	var left = this.l.generate(ctx, scope, {bound: false, usevar: options.usevar});

	if (options.bound) {
		return "new BoundValue(rt.length("+left+"), "+scope+")";
	} else {
		return "rt.length(" + left + ")";
	}
}

Eden.AST.Length.prototype.execute = function(ctx, base, scope, agent) {
	return rt.length(this.l.execute(ctx,base,scope,agent));
}

