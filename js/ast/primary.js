/**
 * Represents the RHS use of an observable, backticks or normal, along with
 * any list indices or function calls.
 */
Eden.AST.Primary = function() {
	this.type = "primary";
	Eden.AST.BaseExpression.apply(this);
	this.observable = "";
	this.extras = [];
	this.backtick = undefined;
	this.isconstant = false;
	this.isstatic = false;
	this.isrequired = false;
	this.attrib = "";
};

/**
 * Set the expression used to generate an observable name string.
 * @param backtick An expression of type string.
 */
Eden.AST.Primary.prototype.setBackticks = function(backtick) {
	this.backtick = backtick;
	this.mergeExpr(backtick);
	this.typevalue = Eden.AST.TYPE_UNKNOWN;
	this.isdynamic = true;
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
	if (extra.warning && !this.warning) this.warning = extra.warning;
};

Eden.AST.Primary.prototype.setAttributes = function(attribs) {
	for (var a in attribs) {
		switch(a) {
		case "changed"		:
		case "source"		:
		case "expression"	:
		case "dependencies"	:
		case "subscribers"	: this.attrib = a; break;
		case "static"		: this.isstatic = true; break;
		case "require"		: this.isrequired = true; break;
		case "number"		: if (this.typevalue != 0) return false; this.typevalue = Eden.AST.TYPE_NUMBER; break;
		case "string"		: if (this.typevalue != 0) return false; this.typevalue = Eden.AST.TYPE_STRING; break;
		case "boolean"		: if (this.typevalue != 0) return false; this.typevalue = Eden.AST.TYPE_BOOLEAN; break;
		case "object"		: if (this.typevalue != 0) return false; this.typevalue = Eden.AST.TYPE_OBJECT; break;
		case "list"			: if (this.typevalue != 0) return false; this.typevalue = Eden.AST.TYPE_LIST; break;
		default: return false;
		}
	}
	return true;
}

function scopehash(hashstr) {
	var hash = 0;
	var ch;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}
	return hash;
}

Eden.AST.Primary.prototype.toEdenString = function(scope, state) {
	var obs;

	state.isconstant = false;

	if (this.observable == "__BACKTICKS__") {
		var ctx = {dependencies: {}, isconstant: true, scopes: [], locals: state.locals};
		var expr = "return "+this.backtick.generate(ctx, "scope", {bound: false, scope: scope})+";";

		if (ctx.isconstant) {
			//console.log(expr);
			var val = (new Function(["context","scope"], expr))(scope.context, scope);
			if (!Eden.isValidIdentifier(val)) {
				return "__error__";
			} else {
				obs = val;
			}
		} else {
			obs = "`"+this.backtick.toEdenString(scope, state)+"`";
		}
	} else {
		obs = this.observable;
		if (state.locals && state.locals.hasOwnProperty(obs)) state.isconstant = true;
	}

	for (var i=0; i<this.extras.length; i++) {
		if (this.extras[i].type == "index") obs += "[";
		obs += this.extras[i].toEdenString(scope, state);
		if (this.extras[i].type == "index") obs += "]";
	}

	return obs;
}

Eden.AST.Primary.prototype._checkFunction = function(scope) {
	var fsym = scope.context.lookup(this.observable);
	if (fsym.origin && fsym.origin.isstatic && scope.context.f.hasOwnProperty("func_"+this.observable)) {
		console.log("has static function: "+this.observable);
		return true;
	}
	return false;
}

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
	var varscandidate = false;

	// Check if this primary is a local variable in this context.
	if (ctx && ctx.locals) {
		if (ctx.locals.type == "declarations") {
			if (ctx.locals.list.indexOf(this.observable) != -1) {
				res = this.observable;
				return res;
			}
		} else if (ctx.locals.hasOwnProperty(this.observable)) {
			//console.log("FOUND LOCAL",this.observable, options);
			// Otherwise we need to eval the value and embed it
			// TODO only if ctx is of type definition??
			ctx.dirty = true;
			if (options.usevar) {
				res = this.observable;
			} else if (options.indef) {
				res = JSON.stringify(ctx.locals[this.observable].value(options.scope)); //"ctx.locals[\""+this.observable+"\"]";
			} else {
				var val = ctx.locals[this.observable].value(options.scope);
				res = `${scope}.value("${this.observable}")`;
				if (val === undefined) console.error("Local variable undefined", this.observable);
			}

			return res;
		}
	}

	// Check if this primary is a parameter in this context.
	if (ctx && ctx.params) {
		var ix = ctx.params.list.indexOf(this.observable);
		if (ix != -1) {
			res = this.observable;
			return res;
		}
	}

	// We have a backticks expression? Use that instead...
	if (this.observable == "__BACKTICKS__") {

		var tmpdeplog;
		var tmpdynsrc;
		
		if (ctx) {
			tmpdeplog = ctx.isconstant;
			ctx.isconstant = true;
			tmpdynsrc = ctx.dynamic_source;
		}

		var btickgen = this.backtick.generate(ctx, scope,options);

		if (!ctx || ctx.isconstant || ctx.type != "definition") {
			if (ctx && ctx.isconstant && ctx.type == "definition") {
				try {
					btickgen = (new Function("return "+btickgen+";"))();
				} catch (e) {
					console.error(e);
					return "\"__error__\"";
				}
				if (!this.isstatic) ctx.dependencies[btickgen] = true;
				tmpdeplog = false;
				
				if (!Eden.isValidIdentifier(btickgen)) {
					btickgen = "__error__";
				}

				btickgen = JSON.stringify(btickgen);
			}

			res = btickgen;

		} else {
			if (this.isstatic) {
				res = btickgen;
			} else {
			// A dynamic dependency must be added if we are in a definition
				res = "this.subscribeDynamic(0," + btickgen +", "+scope+")";
			}

		}

		if (ctx) ctx.isconstant = tmpdeplog;

	} else {
		// Record the use of this primary as a dependency
		if (ctx && ctx.dependencies && !this.isstatic) {
			ctx.dependencies[this.observable] = true;
			ctx.isconstant = false;
		}

		res = "\""+this.observable+"\"";
		//varscandidate = options.indef; // && scope == "scope";
	}

	if (this.attrib.length === 0) {
		if (this.typevalue != 0) {
			switch (this.typevalue) {
			case Eden.AST.TYPE_NUMBER		: res = `${scope}.assertNumber(${res},this)`; break;
			case Eden.AST.TYPE_STRING		: res = `${scope}.assertString(${res},this)`; break;
			case Eden.AST.TYPE_LIST			: res = `${scope}.assertList(${res},this)`; break;
			case Eden.AST.TYPE_OBJECT		: res = `${scope}.assertObject(${res},this)`; break;
			case Eden.AST.TYPE_BOOLEAN		: res = `${scope}.assertBoolean(${res},this)`; break;
			}
		} else if (this.isrequired) {
			res = `${scope}.assertValid(${res},this)`;
		} else if (!varscandidate) {
			res = scope+".value("+res+")";
		} else {
			//res = scope+".value("+res+")";
			//ctx.vars[res] = "v_"+this.observable;
			var obsname = this.observable+"_"+scopehash(scope);
			ctx.vars[obsname] = scope;
			res = scope+".v(v_"+obsname+")";
		}
	} else {
		switch (this.attrib) {
		case "changed"		: res = `${scope}.symbol(${res}).hasChanged()`; break;
		case "source"		: res = `${scope}.symbol(${res}).getSource()`; break;
		default: res = scope+".value("+res+")";
		}
	}

	return res;
}

Eden.AST.registerExpression(Eden.AST.Primary);

