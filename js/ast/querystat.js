Eden.AST.Query = function() {
	this.type = "query";
	Eden.AST.BaseStatement.apply(this);
	this.selector = undefined;
	this.restypes = [];
	this.modexpr = undefined;
	this.kind = "=";
}

Eden.AST.Query.prototype.setSelector = function(selector) {
	this.selector = selector;
	if (selector && selector.errors.length > 0) {
		this.errors.push.apply(this.errors, selector.errors);
	}
}

Eden.AST.Query.prototype.setResultTypes = function(restypes) {
	this.restypes = restypes;
}

Eden.AST.Query.prototype.setModify = function(expr, kind) {
	this.modexpr = expr;
	this.kind = kind;
	if (expr && expr.errors.length > 0) {
		this.errors.push.apply(this.errors, expr.errors);
	}
}

Eden.AST.Query.prototype.generate = function(ctx, scope, options) {
	var res = "Eden.Selectors.query("+this.selector.generate(ctx,scope,{bound: false})+", \""+this.restypes.join(",")+"\")";
	console.log("QUERY",res);

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

Eden.AST.Query.prototype.execute = function(ctx,base,scope, agent) {
	this.executed = 1;

	if (this.modexpr === undefined) {
		var res = Eden.Selectors.query(this.selector.execute(ctx,base,scope,agent), this.restypes);
		//console.log(res);
		base.lastresult = res;
	} else {
		var selector = this.selector.execute(ctx,base,scope,agent);
		var modexpr = this.modexpr.execute(ctx,base,scope,agent);

		switch(this.kind) {
		case "="	:	Eden.Selectors.assign(selector, this.restypes, modexpr);
						break;
		case "+="	:	Eden.Selectors.append(selector, this.restypes, modexpr);
						break;
		case "//="	:	Eden.Selectors.concat(selector, this.restypes, modexpr);
						break;
		}
	}
}

Eden.AST.registerStatement(Eden.AST.Query);

