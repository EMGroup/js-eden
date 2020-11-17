/**
 * Represents the RHS use of an observable, backticks or normal, along with
 * any list indices or function calls.
 */
Eden.AST.Primary = function() {
	this.type = "primary";
	this.errors = [];
	this.observable = "";
	this.extras = [];
	this.backtick = undefined;
};

/**
 * Set the expression used to generate an observable name string.
 * @param backtick An expression of type string.
 */
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
	// Pass errors up to AST root.
	if (extra.errors.length > 0) {
		this.errors.push.apply(this.errors, extra.errors);
	}
};

/**
 * The generate function for a primary must do many checks to determine what
 * kind of primary it is. It may be a parameter, a local variable using a
 * javascript var, a local using a virtual symbol or a normal symbol in the
 * symbol table. It could also be a backticks expression and it may be requested
 * to return a value or a bound value. Note it also registers itself as a
 * dependency in the given context.
 *   @param ctx The expressions context, eg. definition or script assignment.
 *   @param scope String of variable containing the scope.
 *   @param options Includes: bound, usevar, scopeonly
 *   @return Javascript code string.
 */
Eden.AST.Primary.prototype.generate = function(ctx, scope, options) {
	var res;

	// Check if this primary is a local variable in this context.
	if (ctx && ctx.locals) {
		if (ctx.locals.type == "declarations") {
			if (ctx.locals.list.indexOf(this.observable) != -1) {
				//console.log("OUT OF DATE DECLARATIONS");
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
				//res = ctx.locals[this.observable].value();
				var val = Eden.edenCodeForValue(ctx.locals[this.observable].value());
				if (ctx && ctx.isdynamic) ctx.dynamic_source += val;
				res = val;
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

	// Check if this primary is a parameter in this context.
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

	// We have a backticks expression? Use that instead...
	if (this.observable == "__BACKTICKS__") {
		//var id = 0;
		//console.log("CTX",ctx);
		// Need to give each backtick a unique number in a given context.
		//if (ctx && ctx.backtickCount !== undefined) {
		//	id = ctx.backtickCount;
		//	ctx.backtickCount++;
		//}

		var tmpdeplog;
		var tmpdynsrc;
		
		if (ctx) {
			tmpdeplog = ctx.isconstant;
			ctx.isconstant = true;
			tmpdynsrc = ctx.dynamic_source;
		}

		var btickgen = this.backtick.generate(ctx, scope,{bound: false, usevar: options.usevar});

		if (!ctx || ctx.isconstant || ctx.type != "definition") {
			if (ctx && ctx.isconstant && ctx.type == "definition") {
				btickgen = eval(btickgen);
				console.log("Constant bticks: ", btickgen);
				ctx.dependencies[btickgen] = true;
				tmpdeplog = false;
				if (ctx && ctx.isdynamic) ctx.dynamic_source = tmpdynsrc + btickgen;
				btickgen = Eden.edenCodeForValue(btickgen);
			} else {
				if (ctx && ctx.isdynamic) ctx.dynamic_source = tmpdynsrc;
			}
			res = btickgen;
		} else {
			// A dynamic dependency must be added if we are in a definition
			res = "this.subscribeDynamic(0," + btickgen +", "+scope+")";
		}

		if (ctx) ctx.isconstant = tmpdeplog;

	} else {
		// Record the use of this primary as a dependency
		if (ctx && ctx.dependencies) {
			ctx.dependencies[this.observable] = true;
			ctx.isconstant = false;
		}
		if (ctx && ctx.isdynamic) ctx.dynamic_source += this.observable;
		res = "\""+this.observable+"\"";
	}

	// Extras are the list indices or function calls
	if (this.extras.length == 0) {
		// No extras so check what kind of value is wanted
		// Value only, scope only or both.
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
		// List indices and function calls only work on values not scopes.
		res = scope+".value("+res+")";

		// Generate each extra
		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope,{bound: false, usevar: options.usevar});
		}

		// If a bound value is requested, then generate a new/fake one.
		if (options.bound) {
			res = "new BoundValue("+res+","+scope+")";
		}

		// TODO Might be a scopeonly request
	}

	return res;
}

Eden.AST.Primary.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

Eden.AST.Primary.prototype.error = Eden.AST.fnEdenASTerror;

