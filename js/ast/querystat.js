Eden.AST.Query = function() {
	this.type = "query";
	Eden.AST.BaseStatement.apply(this);
	this.selector = undefined;
	this.restypes = [];
	this.modexpr = undefined;
	this.kind = "=";
	this._expr = undefined;
}

Eden.AST.Query.prototype.setSelector = function(selector) {
	this.selector = selector;
	if (selector && selector.errors.length > 0) {
		this.errors.push.apply(this.errors, selector.errors);
	} else {

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
	var res = "";

	var err = new Eden.RuntimeError(null, Eden.RuntimeError.ACTIONNAME, this, "Cannot use '?' here");
	err.line = this.line;
	this.errors.push(err);
	return "";
	
	if (this.restypes.length == 0) {
		//res = "Eden.Selectors.query("+this.selector.generate(ctx,scope,{bound: false})+", null, {minimum: 1}, (r) => {})";
		if (!this._expr) {
			let s = this.selector.execute(ctx,this,scope,this);
			Eden.Selectors.query(s, undefined, {minimum: 1}, (r) => {
				if (r.length > 0 && r[0].expression) {
					if (r.length > 1) {
						ctx.warning = new Eden.RuntimeWarning(this, Eden.RuntimeWarning.AMBIGUITY, "Multiple results for query");
					}
					this._expr = r[0];
					// How to re-expire containing definition?
					//let g = r[0].expression.generate(ctx, scope, options);
					//console.log("EXPIRE GEN CTX", s, ctx, g);
					ctx.execute(ctx, this, scope, this);
					console.log("RE EXECUTE");
				}
			});
		} else {
			res = this._expr.expression.generate(ctx, scope, options);
		}
	} else {
		var selsrc = this.selector.generate(ctx,scope,{bound: false});

		if (this.modexpr) {
			var modexpr = this.modexpr.generate(ctx,scope,{bound: false});

			switch (this.kind) {
			case "="	: res = "Eden.Selectors.assign("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			case "+="	: res = "Eden.Selectors.append("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			case "//="	: res = "Eden.Selectors.concat("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			}
		} else {
			//res = "Eden.Selectors.query("+selsrc+", \""+this.restypes.join(",")+"\", null, s => { cache.value = s; this.expireAsync(); })";
		}
	}
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
		if (!this._expr) {
			Eden.Selectors.query(this.selector.execute(ctx,base,scope,agent), this.restypes, {minimum: 1}, (res) => {
				//console.log(res);
				base.lastresult = res;
				this._expr = res[0];
				// How to re-expire containing definition?
				//console.log("EXPIRE CTX", ctx);
				if (ctx.cb) ctx.cb(res);
			});
		} else {
			return this._expr.execute(ctx,base,scope,agent);
		}
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

