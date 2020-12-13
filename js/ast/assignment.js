/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Assignment statement. Has an lvalue and an expression used to modify a symbol.
 * The executed version has its expression compiled. Note, constructor should
 * not take arguments.
 */
Eden.AST.Assignment = function(expression) {
	this.type = "assignment";
	Eden.AST.BaseStatement.apply(this);

	this.errors = (expression) ? expression.errors : [];
	if (expression && expression.warning) this.warning = expression.warning;
	this.expression = expression;
	this.lvalue = undefined;
	this.compiled = undefined;
	this.dirty = false;
	this.value = undefined;
	this.isstatic = false;
};

Eden.AST.Assignment.prototype.setExpression = function(expr) {
	this.expression = expr;
	if (expr && expr.errors.length > 0) this.errors = expr.errors;
	if (expr && expr.warning && !this.warning) this.warning = expr.warning;
}

Eden.AST.Assignment.prototype.reset = function() {
	this.executed = 0;
	this.dirty = true;
}

Eden.AST.Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue && lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
	if (!this.warning && lvalue.warning) this.warning = lvalue.warning;
};

Eden.AST.Assignment.prototype.setAttributes = function(attribs) {
	for (var a in attribs) {
		switch (a) {
		default: return false;
		}
	}

	return true;
}

/* For inside func and proc only */
Eden.AST.Assignment.prototype.generate = function(ctx,scope, options) {
	if (!options) console.warn("Missing assignment generator options");
	
	var result = this.lvalue.generate(ctx, scope, options);

	if (this.lvalue.islocal) {
		result += " = ";
		result += this.expression.generate(ctx, scope, options);
		result += ";\n";
		return result;
	} else if (this.lvalue.hasListIndices()) {
		result = scope+".listAssign("+result+",";
		result += this.expression.generate(ctx, scope, options);
		result += ", EdenSymbol.localJSAgent, false, ";
		result += this.lvalue.generateCompList(ctx, scope);
		result += ");\n";
		return result;
	} else {
		result = scope+".assign("+result+",";
		result += this.expression.generate(ctx, scope, options);
		result += ", EdenSymbol.localJSAgent);\n"
		return result;
	}
};

/**
 * Compile the right-hand-side into a javascript function. If already compiled
 * it does nothing.
 */
Eden.AST.Assignment.prototype.compile = function(ctx, scope, sym) {
	// FIXME: Need to check if caching compile is safe or not.
	// This depends on any use of eval, local variables etc.
	//if (this.compiled && !this.dirty) return;
	this.dirty = false;

	var state = {
		statement: this,
		symbol: sym,
		isconstant: true,
		dependant: false,
		locals: ctx.locals
		//dependencies: this.dependencies
	};
	var rhs = Eden.AST.transpileExpressionNode(this.expression, scope, state);
	this.compiled = new Function(["context","scope","cache"],rhs);
}

Eden.AST.Assignment.prototype.execute = function(ctx, base, scope, agent) {
	if (this.expression === undefined) return;
	this.executed = 1;

	if (this.doxyComment) {
		scope.context.instance.updateDictionary(this.lvalue.name, this.doxyComment);
	}

	try {
		var sym = this.lvalue.getSymbol(ctx,base,scope);
		this.compile(ctx, scope, sym);
		var value;
		if (this.lvalue.hasListIndices()) {
			value = this.compiled.call(sym, scope.context, scope, scope.lookup(sym.name));
			var complist = this.lvalue.executeCompList(ctx, scope);
			sym.listAssign(value, scope, this, false, complist);
		} else {
			value = this.compiled.call(sym, scope.context, scope, scope.lookup(sym.name));

			if (sym.origin && sym.origin.lvalue) {
				var oldlval = sym.origin.lvalue;
				if (oldlval.isstatic) {
					this.warning = new Eden.RuntimeWarning(this, Eden.RuntimeWarning.UNKNOWN, "Changing a [static] symbol");
				}

				var symtype = (this.lvalue.typevalue !== 0) ? this.lvalue.typevalue : oldlval.typevalue;
				if (!Eden.AST.typeCheck(symtype, value)) {
					throw "Type Error";
				}
			}
			sym.assign(value, scope, this);
		}

		if (value === undefined) {
			this.warning = new Eden.RuntimeWarning(this, Eden.RuntimeWarning.UNDEFINED);
		}
	} catch(e) {
		//this.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.ASSIGNEXEC, this, e));
		var err;

		if (e === 0) return;  // Deliberate discard

		if (e instanceof Eden.RuntimeError) {
			err = e;
			//err.context = base;
			err.statement = this;
		} else if (/[0-9][0-9]*/.test(e.message)) {
			err = new Eden.RuntimeError(scope.context, parseInt(e.message), this, e.message);
		} else {
			err = new Eden.RuntimeError(scope.context, 0, this, e);
		}

		err.line = this.line;

		this.errors.push(err);
		scope.context.instance.emit("error", [(agent) ? agent : {name: "Unknown"},err]);
		//else console.log(err.prettyPrint());
	}
};

Eden.AST.registerStatement(Eden.AST.Assignment);


