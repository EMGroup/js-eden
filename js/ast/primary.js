Eden.AST.Primary = function() {
	this.type = "primary";
	this.errors = [];
	this.observable = "";
	this.extras = [];
	this.backtick = undefined;
};

Eden.AST.Primary.prototype.setBackticks = function(backtick) {
	this.backtick = backtick;
	this.errors.push.apply(this.errors, backtick.errors);
};

Eden.AST.Primary.prototype.setObservable = function(obs) {
	this.observable = obs;
}

Eden.AST.Primary.prototype.getObservable = function() {
	return this.observable;
}

Eden.AST.Primary.prototype.prepend = function(extra) {
	this.extras.unshift(extra);
	if (extra.type == "functioncall") {
		this.returnsbound = false;
	}
	if (extra.errors.length > 0) {
		this.errors.push.apply(this.errors, extra.errors);
	}
};

Eden.AST.Primary.prototype.generate = function(ctx, scope, options) {
	var res;

	// Check if this primary is a local variable.
	if (ctx && ctx.locals) {
		if (ctx.locals.type == "declarations") {
			if (ctx.locals.list.indexOf(this.observable) != -1) {
				console.log("OUT OF DATE DECLARATIONS");
				res = this.observable;
				for (var i=0; i<this.extras.length; i++) {
					res += this.extras[i].generate(ctx, scope, {bound: false});
				}
				if (options.bound) {
					return "new BoundValue("+res+","+scope+")";
				} else {
					return res;
				}
			}
		} else if (ctx.locals.hasOwnProperty(this.observable)) {
			//console.log("FOUND LOCAL",this.observable);
			// Otherwise we need to eval the value and embed it
			// TODO only if ctx is of type definition??
			ctx.dirty = true;
			if (options.usevar) {
				res = this.observable;
			} else if (options.indef) {
				res = JSON.stringify(ctx.locals[this.observable].value()); //"ctx.locals[\""+this.observable+"\"]";
			} else {
				res = ctx.locals[this.observable].value();
			}
			for (var i=0; i<this.extras.length; i++) {
				res += this.extras[i].generate(ctx, scope, {bound: false});
			}

			if (options.bound) {
				return "new BoundValue("+res+","+scope+")";
			} else {
				return res;
			}
		}
	}

	// Check if this primary is a parameter.
	if (ctx && ctx.params) {
		var ix = ctx.params.list.indexOf(this.observable);
		if (ix != -1) {
			res = this.observable;
			for (var i=0; i<this.extras.length; i++) {
				res += this.extras[i].generate(ctx, scope, {bound: false});
			}

			if (options.bound) {
				return "new BoundValue("+res+","+scope+")";
			} else {
				return res;
			}
		}
	}

	if (this.observable == "__BACKTICKS__") {
		var id = 0;
		if (ctx && ctx.backtickCount !== undefined) {
			id = ctx.backtickCount;
			ctx.backtickCount++;
		}
		if (ctx && ctx.type == "definition") {
			res = "this.subscribeDynamic(" + id + "," + this.backtick.generate(ctx, scope,{bound: false, usevar: options.usevar})+")";
		} else {
			res = this.backtick.generate(ctx,scope, {bound: false, usevar: options.usevar});
		}
		//console.log("BTICK: ",res);
	} else {
		if (ctx && ctx.dependencies) ctx.dependencies[this.observable] = true;
		res = "\""+this.observable+"\"";
	}

	if (this.extras.length == 0) {
		if (!options.bound) {
			res = scope+".value("+res+")";
		} else {
			if (options.scopeonly) {
				res = scope+".scope("+res+")";
			} else {
				res = scope+".boundValue("+res+")";
			}
		}
	} else {
		//if (!options.bound) {
			res = scope+".value("+res+")";
		//} else {
		//	res += ".boundValue("+scope+",";
		//}

		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope,{bound: false, usevar: options.usevar});
		}

		//if (options.bound) res += ")";

		if (options.bound) {
			res = "new BoundValue("+res+","+scope+")";
		}
	}

	return res;
}

Eden.AST.Primary.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

Eden.AST.Primary.prototype.error = fnEdenASTerror;

