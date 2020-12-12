Eden.AST.BaseExpression = function() {
	this.isconstant = true;		// Is a constant expression
	this.isdependant = false;	// Had execution context dependance
	this.isdynamic = false;		// Has dynamic dependency
	this.typevalue = Eden.AST.TYPE_UNKNOWN;
	this._is_eden_expression = true;
	this.isscoped = false;
	this.errors = [];
	this.warning = null;
}

/**
 * Merge expression state from leaf to root.
 * @param {BaseExpression} expr 
 */
Eden.AST.BaseExpression.mergeExpr = function(expr) {
	if (!expr) return;
	this.isconstant = this.isconstant && expr.isconstant;
	this.isdependant = this.isdependant || expr.isdependant;
	this.isdynamic = this.isdynamic || expr.isdynamic;
	this.isscoped = this.isscoped || expr.isscoped;
	if (this.typevalue === 0) {
		this.typevalue = expr.typevalue;
	} else if (expr.typevalue === 0) {

	} else if (expr.typevalue !== this.typevalue) {
		// TODO: Type trumps.
		this.typevalue = 0;
	}

	if (expr.errors && expr.errors.length > 0) {
		if (!this.errors) this.errors = [];
		this.errors.push.apply(this.errors, expr.errors);
	}
	if (expr.warning && !this.warning) this.warning = expr.warning; 
}

Eden.AST.BaseExpression.execute = function(ctx, base, scope) {
	var state = {
		isconstant: true,
		locals: ctx.locals,
		symbol: ctx.symbol
	};
	var rhs = Eden.AST.transpileExpressionNode(this, scope, state);
	return (new Function(["context","scope","cache"],rhs)).call((state.symbol)?state.symbol:null, scope.context, scope, (state.symbol)?scope.lookup(state.symbol.name):null);
}

Eden.AST.BaseExpression.toString = function() {
	return "__error__";
	var state = {
		isconstant: true
	};
	var res = this.toEdenString(eden.root.scope, state);  // FIXME: Don't refer to eden
	return "parse("+JSON.stringify(res)+")";
}

Eden.AST.BaseExpression.getEdenCode = Eden.AST.BaseExpression.toString;
