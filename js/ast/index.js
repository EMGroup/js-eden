/**
 * An individual list index. Usually this is some expression that needs to have
 * its value adjusted from js-eden 1 base to 0 base.
 */
Eden.AST.Index = function() {
	this.type = "index";
	Eden.AST.BaseExpression.apply(this);
	this.expression = undefined;
	this.errors = [];
}

Eden.AST.Index.prototype.setExpression = function(express) {
	this.expression = express;
	// Bubble the errors
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Index.prototype.toEdenString = function(scope, state) {
	return `[${this.expression.toEdenString(scope,state)}]`;
}

Eden.AST.Index.prototype.generate = function(ctx, scope, options) {
	var ix = this.expression.generate(ctx, scope, {bound: false});
	// Return final string with -1 adjustment applied.
	if (this.expression.type == "literal" && this.expression.datatype == "NUMBER") {
		return "["+ix+"-1]";
	} else {
		return "[rt.index("+ix+")]";
	}
}

Eden.AST.registerExpression(Eden.AST.Index);

