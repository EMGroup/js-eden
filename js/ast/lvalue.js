Eden.AST.LValue = function() {
	this.type = "lvalue";
	Eden.AST.BaseExpression.apply(this);
	this.name = undefined;
	this.express = undefined;
	this.primary = undefined;
	this.lvaluep = undefined;
	this.islocal = false;
	this.source = "";
};

Eden.AST.LValue.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.LValue.prototype.isDynamic = function() {
	return this.express !== undefined;
}

Eden.AST.LValue.prototype.toEdenString = function(scope, state) {
	if (this.name) return this.name;
	if (this.primary) return this.primary.toEdenString(scope, state);
	if (this.express) {
		var obs;
		var ctx = {dependencies: {}, isconstant: true, scopes: [], locals: state.locals};
		var expr = "return "+this.express.generate(ctx, "scope", {bound: false, scope: scope})+";";

		if (ctx.isconstant) {
			var val = (new Function(["context","scope"], expr))(eden.root, scope);
			obs = val;
		} else {
			obs = "`"+this.express.toEdenString(scope, state)+"`";
		}

		return obs;
	}
}


Eden.AST.LValue.prototype.setExtras = function(extras) {
	this.lvaluep = extras;
	if (extras) {
		for (var i = 0; i < extras.length; i++) {
			this.errors.push.apply(this.errors, extras[i].errors);
		}
	}
}


Eden.AST.LValue.prototype.setObservable = function(name) {
	this.name = name;
}

Eden.AST.LValue.prototype.setPrimary = function(primary) {
	this.primary = primary;
	if (primary && primary.errors.length > 0) {
		this.errors.push.apply(this.errors, primary.errors);
	}
}

Eden.AST.LValue.prototype.setExpression = function(express) {
	this.express = express;
	if (express && express.errors.length > 0) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.LValue.prototype.getSymbol = function(ctx, base, scope) {
	if (ctx && ctx.locals && ctx.locals.type != "declarations" && ctx.locals.hasOwnProperty(this.name)) {
		this.islocal = true;
		return ctx.locals[this.name];
	}

	if (this.name) return eden.root.lookup(this.name);

	if (this.primary) {
		var sym = this.primary.execute(ctx,base,scope);
		if (sym instanceof BoundValue) sym = sym.value;
		return sym;
	}
	if (this.express) {
		//console.log(this.express);
		var name = this.express.execute(ctx,base,scope);
		//console.log(name);
		if (name instanceof BoundValue) name = name.value;
		return eden.root.lookup(name);
	}
}


Eden.AST.LValue.prototype.hasListIndices = function() {
	return this.lvaluep && this.lvaluep.length > 0 && this.lvaluep[0].kind == "index";
}

Eden.AST.LValue.prototype.generateCompList = function(ctx, scope) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += "rt.index("+this.lvaluep[i].indexexp.generate(ctx,scope,{bound:false})+")";
		if (i < this.lvaluep.length-1) res += ",";
	}
	res += "]";
	return res;
}

Eden.AST.LValue.prototype.generateIndexList = function(ctx, scope) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += "rt.index("+this.lvaluep[i].indexexp.generate(ctx,scope,{bound: false})+")";
		if (i < this.lvaluep.length-1) res += "][";
	}
	res += "]";
	return res;
}

Eden.AST.LValue.prototype.generateIdStr = function() {
	return "\""+this.generateCompList()+"\"";
}

Eden.AST.LValue.prototype.executeCompList = function(ctx, scope) {
	var res = [];
	for (var i=0; i<this.lvaluep.length; i++) {
		if (this.lvaluep[i].kind == "index") {
			var iexp = this.lvaluep[i].indexexp.generate(ctx, "scope", {bound: false});
			res.push(rt.index((new Function(["context","scope"], "return "+iexp+";"))(eden.root,scope)));
		}
	}
	return res;
}

Eden.AST.LValue.prototype.generate = function(ctx, scope) {
	if (this.name) {
		if (ctx && ctx.locals) {
			if (ctx.locals.type == "declarations" && ctx.locals.list.indexOf(this.name) != -1) {
				this.islocal = true;
				var res = this.name;
				for (var i=0; i<this.lvaluep.length; i++) {
					res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
				}
				return res;
			} else if (ctx.locals.hasOwnProperty(this.name)) {
				this.islocal = true;
				var res = this.name;
				for (var i=0; i<this.lvaluep.length; i++) {
					res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
				}
				return res;
			}
		}
		if (ctx && ctx.params && ctx.params.list.indexOf(this.name) != -1) {
			this.islocal = true;
			var res = this.name;
			for (var i=0; i<this.lvaluep.length; i++) {
				res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
			}
			return res;
		}

		return "\"" + this.name + "\"";
	}

	if (this.primary) return this.primary.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
	if (this.express) return this.express.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});

	// TODO: Pointer dependencies currently causing huge page redraw problems.
	//if (ctx && ctx.dependencies) {
	//	ctx.dependencies[this.observable] = true;
	//}
}

Eden.AST.registerExpression(Eden.AST.LValue);



Eden.AST.LValueComponent = function(kind) {
	this.type = "lvaluecomponent";
	Eden.AST.BaseExpression.apply(this);
	this.kind = kind;
	this.indexexp = undefined;
	this.observable = undefined;
};

Eden.AST.LValueComponent.prototype.toEdenString = function(scope, state) {
	// FIXME: This should not be allowed here.
	return "";
}

Eden.AST.LValueComponent.prototype.index = function(pindex) {
	this.indexexp = pindex;
	this.errors.push.apply(this.errors, pindex.errors);
};

Eden.AST.LValueComponent.prototype.property = function(pprop) {
	this.observable = pprop;
	//this.errors.push.apply(this.errors, pprop.errors);
}

Eden.AST.LValueComponent.prototype.generate = function(ctx, scope) {
	if (this.kind == "index") {
		return "[rt.index("+this.indexexp.generate(ctx, scope, {bound: false})+")]";
	//} else if (this.kind == "property") {
	//	return "[context.lookup(\""+obs+"\").value(scope)[0][1].indexOf(\""+this.observable+"\")+1]";
	}
}

Eden.AST.registerExpression(Eden.AST.LValueComponent);

