Eden.AST.Query = function() {
	this.type = "query";
	Eden.AST.BaseStatement.apply(this);
	Eden.AST.BaseExpression.apply(this);
	this.selector = undefined;
	this.observable = undefined;
	this.restypes = [];
	this.modexpr = undefined;
	this.kind = "=";
	this._expr = undefined;
	this._selector = null;
	this._modexpr = null;
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
	
	//if (this.restypes.length == 0) {
		//res = "Eden.Selectors.query("+this.selector.generate(ctx,scope,{bound: false})+", null, {minimum: 1}, (r) => {})";
		/*if (!this._expr) {
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
		}*/
	//} else {
		var selsrc = this.selector.generate(ctx,scope,{bound: false});

		if (this.modexpr) {
			var err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot use '?' on lhs here");
			this.errors.push(err);
			options.scope.context.instance.emit("error", [EdenSymbol.defaultAgent,err]);
			return "";

			var modexpr = this.modexpr.generate(ctx,scope,{bound: false});

			switch (this.kind) {
			case "="	: res = "Eden.Selectors.assign("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			case "+="	: res = "Eden.Selectors.append("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			case "//="	: res = "Eden.Selectors.concat("+selsrc+", \""+this.restypes.join(",")+"\", "+modexpr+")"; break;
			}
		} else {
			/*if (ctx.type != "definition" && ctx.type != "assignment") {
				var err = new Eden.RuntimeError(ctx, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot use '?' here");
				this.errors.push(err);
				eden.emit("error", [EdenSymbol.defaultAgent,err]);
				return "";	
			}*/
			if (this.restypes.length == 0) {
				res = "Eden.Selectors.queryWithinSync(null, "+selsrc+", \"value\", {minimum: 1, options: {self: this.origin}})";
			} else {
				res = "Eden.Selectors.queryWithinSync(null, "+selsrc+", \""+this.restypes.join(",")+"\", {minimum: 1, options: {self: this.origin}})";
			//res = "Eden.Selectors.query("+selsrc+", \""+this.restypes.join(",")+"\", {minimum: 1, returnvalue: cache.value}, (s) => { cache.value = s; this.expireAsync(); })";
			}
			//}
	}

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

Eden.AST.registerExpression(Eden.AST.Query);

Eden.AST.Query.prototype.execute = function(ctx,base,scope, agent) {
	this.executed = 1;

	if (this.observable) {
		var val = scope.context.lookup(this.observable).value(scope);
		console.log(val);
		base.lastresult = val;
		//if (ctx.cb) ctx.cb(val);
		return;
	}

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
			return this._expr; //.execute(ctx,base,scope,agent);
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

