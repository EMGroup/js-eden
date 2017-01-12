/**
 * Dollar numeric action parameters as used in expressions.
 */
Eden.AST.Parameter = function(index) {
	this.type = "parameter";
	this.index = index;
	this.errors = [];

	console.error("DEPRECATED PARAMETER");
}

Eden.AST.Parameter.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Parameter.prototype.generate = function(ctx, scope, options) {
	var res;

	// If -1 then get the number of parameters available.
	if (this.index == -1) {
		if (ctx && ctx.parameters) return ""+ctx.parameters.length;
		this.returnsbound = false;
		res = "0";
	} else {
		if (ctx && ctx.parameters) {
			// An action cannot be compiled if it uses action parameters...
			ctx.dirty = true;
			// Search the context for this parameter to determine scope binding
			var res = ctx.parameters[this.index-1];
			if (res instanceof BoundValue) this.returnsbound = true;
			else this.returnsbound = false;
			//return ""+res;
			// Generate run-time code to obtain parameters value.
			return "ctx.parameters["+this.index+"-1]";
		}
	}
}

