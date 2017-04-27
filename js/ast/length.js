Eden.AST.Length = function() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

Eden.AST.Length.prototype.left = Eden.AST.fnEdenASTleft;

Eden.AST.Length.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Length.prototype.generate = function(ctx, scope, mode) {
	var left = this.l.generate(ctx, scope, mode);

	return "rt.length(" + left + ")";
}

Eden.AST.Length.prototype.execute = function(ctx, base, scope, agent) {
	return rt.length(this.l.execute(ctx,base,scope,agent));
}

