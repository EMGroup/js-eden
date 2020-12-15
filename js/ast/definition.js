Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseStatement.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
	this.eager = false;
	this.volatile = false;
	this.isstatic = false;
};

Eden.AST.Definition.prototype.reset = function() {
	this.executed = 0;
}

Eden.AST.Definition.prototype.setAttributes = function(attribs) {
	for (var a in attribs) {
		switch (a) {
		case "eager"	: this.eager = true; break;
		case "volatile"	: this.volatile = true; break;
		case "static"	: this.isstatic = true; break;
		case "async"	: break;
		case "number"	:
		case "boolean"	:
		case "object"	:
		case "undefined":
		case "string"	:
		case "list"		: break;
		default: return false;
		}
	}

	return true;
}

Eden.AST.Definition.prototype.setExpression = function(expr) {
	if (expr && expr.warning) this.warning = expr.warning;
	this.expression = expr;
	this.errors = expr.errors;
}

Eden.AST.Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue && lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
	if (!this.warning && lvalue.warning) this.warning = lvalue.warning;
};

/**
 * Reverse search the expression to find the observable that determines a
 * particular component.
 * @param {Array} indices 
 */
Eden.AST.Definition.prototype.locatePrimary = function(indices) {
	var node = this.expression;

	for (var i=0; i<indices.length; ++i) {
		var ix = indices[i];
		if (node.type == "literal") {
			if (node.datatype == "LIST") {
				if (Array.isArray(node.value) && ix < node.value.length) {
					node = node.value[ix];
				} else return;
			} else if (node.datatype == "OBJECT") {
				node = node.value[ix];
			} else return;
		} else return;
	}

	if (node && node.type == "primary" && !node.backtick && node.extras.length == 0) {
		return node.observable;
	}
}

Eden.AST.Definition.prototype.generate = function(ctx,scope,options) {
	throw Eden.RuntimeError(options.scope.context, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot generate defintions here");
};

Eden.AST.Definition.prototype.safeEval = function(__name, __code) {
	return eval(`(function ${__name}(context,scope,cache){${__code}})`);
}

Eden.AST.Definition.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var rhs;
	var name = (this.lvalue && this.lvalue.name) ? "def_"+this.lvalue.name : "";

	// Identical definitions are a nop so save time
	if (this === sym.origin) {
		//console.log("Identical def", this.getSource());
		// TODO: But should the symbol be expired?
		return;
	}

	// FIXME: Also dynamic if a local variable is a dependency.
	var isdynamic = this.lvalue.isDynamic() || this.expression.isdependant;

	// If LValue is dynamic then need to generate a new AST node here...
	if (isdynamic) {
		// First, generate dynamic eden code
		var state = {
			isconstant: true,
			locals: ctx.locals,
			statement: this,
			symbol: sym
		};
		var expr = this.expression.toEdenString(scope, state);

		if (state.isconstant) {
			expr = sym.name + " = " + expr + ";";
		} else {
			expr = sym.name + " is " + expr + ";";
		}

		//console.log(expr);

		// Second, reparse that code as a new AST node
		var stat = Eden.AST.parseStatement(expr);

		// FIXME: Check for errors
		stat.generated = this;
		stat.parent = this.parent;
		stat.addIndex();

		// Third, execute that node.
		stat.execute(ctx, base, scope, agent);
	//Normal Lvalue so just generate definition and finish...
	} else {

		try {
			// Definition extensions are deprecated?
			/*if (this.lvalue.hasListIndices()) {
				rhs = "value";
				rhs += this.lvalue.generateIndexList(this, "scope") + " = ";
				rhs += this.expression.generate(this, "scope", {bound: false});
				rhs += ";";
				var deps = [];
				for (var d in this.dependencies) {
					deps.push(d);
				}
				var source = base.getSource(this);
				sym.addExtension(this.lvalue.generateIdStr(), new Function(["context","scope","cache"], rhs), source, undefined, deps);
			} else {*/


			var state = {
				statement: this,
				symbol: sym,
				isconstant: true,
				dependant: false,
				locals: ctx.locals,
				dependencies: this.dependencies
			};
			rhs = Eden.AST.transpileExpressionNode(this.expression, scope, state);

			var deps = Object.keys(this.dependencies);
			sym.isasync = (this.expression.type == "async");
			sym.eager = this.eager;
			sym.volatile = this.volatile;
			var f = this.safeEval(name, rhs) ;//new Function(["context","scope","cache"], rhs);

			if (sym.origin && sym.origin.isstatic) {
				this.warning = new Eden.RuntimeWarning(this, Eden.RuntimeWarning.UNKNOWN, "Changing a [static] symbol");
			}

			// FIXME: Why is constant status wrong?
			//if (!state.isconstant) {
				sym.define(f, this, deps);
			//} else {
			//	sym.assign(f.call(sym, eden.root, scope, scope.lookup(sym.name)), scope, this);
			//}
		} catch(e) {
			var err;
			console.log(rhs);
			if (e.message == Eden.RuntimeError.EXTENDSTATIC) {
				err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.EXTENDSTATIC, this, "Can only define list items if the list is defined");
			} else {
				err = new Eden.RuntimeError(scope.context, Eden.RuntimeError.UNKNOWN, this, e);
			}
			this.errors.push(err);
			err.line = this.line;
			scope.context.instance.emit("error", [agent,this.errors[this.errors.length-1]]);
		}
	}
}

Eden.AST.registerStatement(Eden.AST.Definition);

