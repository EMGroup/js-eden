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
};

Eden.AST.Assignment.prototype.reset = function() {
	this.executed = 0;
	this.dirty = true;
}

Eden.AST.Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

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
Eden.AST.Assignment.prototype.compile = function(ctx, scope) {
	// FIXME: Need to check if caching compile is safe or not.
	// This depends on any use of eval, local variables etc.
	//if (this.compiled && !this.dirty) return;
	this.dirty = false;

	var state = {
		isconstant: true,
		locals: ctx.locals
	};
	var rhs = Eden.AST.transpileExpressionNode(this.expression, scope, state);
	this.compiled = new Function(["context","scope","cache"],rhs);
}

Eden.AST.Assignment.prototype.execute = function(ctx, base, scope, agent) {
	if (this.expression === undefined) return;
	this.executed = 1;
	this.compile(ctx, scope);

	if (this.doxyComment) {
		eden.updateDictionary(this.lvalue.name, this.doxyComment);
	}

	try {
		var sym = this.lvalue.getSymbol(ctx,base,scope);
		var value;
		if (this.lvalue.hasListIndices()) {
			value = this.compiled.call(sym, eden.root, scope, scope.lookup(sym.name));
			var complist = this.lvalue.executeCompList(ctx, scope);
			sym.listAssign(value, scope, this, false, complist);
		} else {
			value = this.compiled.call(sym, eden.root, scope, scope.lookup(sym.name));
			sym.assign(value, scope, this);
		}

		if (value === undefined) {
			this.warning = new Eden.RuntimeWarning(this, Eden.RuntimeWarning.UNDEFINED, this.source.split("=")[1].trim());
		}
	} catch(e) {
		//this.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.ASSIGNEXEC, this, e));
		var agentobj = agent;
		var err;

		if (e instanceof Eden.RuntimeError) {
			err = e;
			err.context = base;
			err.statement = this;
		} else if (/[0-9][0-9]*/.test(e.message)) {
			err = new Eden.RuntimeError(base, parseInt(e.message), this, e.message);
		} else {
			err = new Eden.RuntimeError(base, 0, this, e);
		}

		err.line = this.line;

		this.errors.push(err);
		if (agentobj) eden.emit("error", [agentobj,err]);
		else console.log(err.prettyPrint());
	}
};

Eden.AST.registerStatement(Eden.AST.Assignment);


