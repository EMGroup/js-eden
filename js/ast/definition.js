Eden.AST.Definition = function() {
	this.type = "definition";
	Eden.AST.BaseStatement.apply(this);

	this.expression = undefined;
	this.lvalue = undefined;
};

Eden.AST.Definition.prototype.reset = function() {
	this.executed = 0;
}

Eden.AST.Definition.prototype.setExpression = function(expr) {
	if (expr && expr.warning) this.warning = expr.warning;
	this.expression = expr;
	this.errors = expr.errors;
}

Eden.AST.Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
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

Eden.AST.Definition.prototype.generate = function(ctx,scope) {
	throw Eden.RuntimeError(null, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot generate defintions here");
};

Eden.AST.Definition.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var rhs;
	var name = (this.lvalue && this.lvalue.name) ? "def_"+this.lvalue.name : "";

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
		var expr = this.expression.toEdenString((scope) ? scope : eden.root.scope, state);

		if (state.isconstant) {
			expr = sym.name + " = " + expr + ";";
		} else {
			expr = sym.name + " is " + expr + ";";
		}

		//console.log(expr);

		// Second, reparse that code as a new AST node
		var stat = Eden.AST.parseStatement(expr);

		// FIXME: Check for errors
		stat.generated = true;
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

			console.log("Expr Parse State:", {
				isconstant: this.expression.isconstant,
				isdependant: this.expression.isdependant,
				isdynamic: this.expression.isdynamic,
				typeval: this.expression.typevalue
			});

			var deps = Object.keys(this.dependencies);
			sym.isasync = (this.expression.type == "async");
			//sym.eager = (this.expression.type == "scriptexpr");
			var f = new Function(["context","scope","cache"], rhs);
			f.displayName = name;  // FIXME: Non-standard

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
				err = new Eden.RuntimeError(base, Eden.RuntimeError.EXTENDSTATIC, this, "Can only define list items if the list is defined");
			} else {
				err = new Eden.RuntimeError(base, Eden.RuntimeError.UNKNOWN, this, e);
			}
			this.errors.push(err);
			err.line = this.line;
			eden.emit("error", [agent,this.errors[this.errors.length-1]]);
		}
	}
}

Eden.AST.registerStatement(Eden.AST.Definition);

