Eden.AST.Indexed = function() {
	this.type = "indexed";
	Eden.AST.BaseExpression.apply(this);
	this.indexes = [];
	this.expression = undefined;
}

Eden.AST.Indexed.prototype.left = Eden.AST.fnEdenASTleft;

Eden.AST.Indexed.prototype.setExpression = function(expr) {
	this.expression = expr;
	if (expr && expr.errors.length > 0) {
		this.errors.push.apply(this.errors, expr.errors);
	}
}

Eden.AST.Indexed.prototype.addIndex = function(index) {
	this.indexes.push(index);
	if (index && index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Indexed.prototype.toEdenString = function(scope, state) {
	var ixres = "";
	for (var i=0; i<this.indexes.length; i++) {
		ixres += this.indexes[i].toEdenString(scope, state);
	}
	return "("+this.expression.toEdenString(scope,state)+")"+ixres;
}

Eden.AST.Indexed.prototype.generate = function(ctx, scope, options) {
	var ixres = "";
	for (var i=0; i<this.indexes.length; i++) {
		ixres += this.indexes[i].generate(ctx,scope,options);
	}

	var res = "("+this.expression.generate(ctx,scope,{bound:false})+")"+ixres;
	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

Eden.AST.registerExpression(Eden.AST.Indexed);

