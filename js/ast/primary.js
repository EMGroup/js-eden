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
Eden.AST.Primary.prototype.generate = function(ctx, scope, mode) {
	var res;
	var obs = this.observable;
	var subed = false;

	if (ctx.names && ctx.names[this.observable]) {
		obs = ctx.names[this.observable];
		subed = true;
	}

	// We have a backticks expression? Use that instead...
	if (obs == "__BACKTICKS__") {
		var id = 0;
		//console.log("CTX",ctx);
		// Need to give each backtick a unique number in a given context.
		if (ctx && ctx.backtickCount !== undefined) {
			id = ctx.backtickCount;
			ctx.backtickCount++;
		}

		// A dynamic dependency must be added if we are in a definition
		if (ctx && ctx.type == "definition") {
			res = "this.subscribeDynamic(btick++," + this.backtick.generate(ctx, scope,mode)+", "+scope+")";
		} else {
			res = this.backtick.generate(ctx,scope, mode);
		}

		obs = res;
		subed = true;
	// Some embeded javascript so just use this directly.
	} else if (obs == "__JAVASCRIPT__") {
		res = this.backtick.generate(ctx, scope, mode);
		// Generate each extra
		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope,mode);
		}

		return res;
	} else {
		// Record the use of this primary as a dependency
		if (ctx && ctx.dependencies) ctx.dependencies[this.observable] = true;

		switch (mode) {
		case Eden.AST.MODE_COMPILED		:	res = (!subed && ctx.prefix)?ctx.prefix+obs:obs; break;
		case Eden.AST.MODE_DYNAMIC		:	res = (subed)?obs:scope+".value(\""+obs+"\")"; break;
		default:
		}
	}

	// Extras are the list indices or function calls
	if (this.extras.length > 0) {
		// Function calls should embed compiled function references...
		if (!subed && this.extras[0].type == "functioncall") {
			res = "eden.f.func_"+obs;
		}

		// Generate each extra
		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope,mode);
		}
	}

	return res;
}

Eden.AST.Primary.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", Eden.AST.MODE_DYNAMIC);
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}

Eden.AST.Primary.prototype.error = Eden.AST.fnEdenASTerror;

