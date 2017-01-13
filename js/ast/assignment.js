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
	Eden.AST.BaseContext.apply(this);

	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
	this.compiled = undefined;
	this.dirty = false;
	this.value = undefined;
};

/*Eden.AST.Assignment.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		var p = this.parent.getParameterByNumber(index);
		//console.log("Param "+index+" = " + p);
		return p;
	}
	return undefined;
}*/

Eden.AST.Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Assignment.prototype.generate = function(ctx,scope) {
	var result = this.lvalue.generate(ctx, scope);

	if (this.lvalue.islocal) {
		result += " = ";
		result += this.expression.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
		result += ";\n";
		return result;
	} else if (this.lvalue.hasListIndices()) {
		result = scope+".listAssign("+result+",";
		result += this.expression.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
		result += ", Symbol.localJSAgent, false, ";
		result += this.lvalue.generateCompList(ctx, scope);
		result += ");\n";
		return result;
	} else {
		result = scope+".assign("+result+",";
		result += this.expression.generate(ctx, scope,{bound: false, usevar: ctx.type == "scriptexpr"});
		result += ", Symbol.localJSAgent);\n"
		return result;
	}
};



/**
 * Compile the right-hand-side into a javascript function. If already compiled
 * it does nothing.
 */
Eden.AST.Assignment.prototype.compile = function(ctx) {
	if (this.compiled && !this.dirty) return;
	this.dirty = false;

	if (ctx) ctx.scopes = this.scopes;
	else ctx = this;

	var rhs = "(function(context,scope,cache,ctx) { \n";
	var express = this.expression.generate(ctx, "scope", {bound: true});

	if (ctx && ctx.dirty) {
		ctx.dirty = false;
		this.dirty = true;
	}

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		rhs += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			rhs += "\t_scopes.push(" + this.scopes[i];
			rhs += ");\n";
		}

		rhs += "for(var i=0; i<_scopes.length; i++) _scopes[i].rebuild();\n";
		//rhs += "if (this.def_scope) {\nfor (var i=0; i<_scopes.length; i++) {\n_scopes[i].cache = this.def_scope[i].cache;\n_scopes[i].reset();\n}\n} else {\nfor(var i=0; i<_scopes.length; i++) _scopes[i].rebuild();\nthis.def_scope = _scopes;\n}\n";
	}

	rhs += "var result = " + express + ";";
	rhs += "if (cache) cache.scope = result.scope;";

	rhs += "return result.value;";
	rhs += "})";

	this.compiled = eval(rhs);
}

Eden.AST.Assignment.prototype.execute = function(ctx, base, scope, agent) {
	if (this.expression === undefined) return;
	this.executed = 1;
	this.compile(ctx);

	if (this.doxyComment) {
		//eden.dictionary[this.lvalue.name] = this.doxyComment;
		eden.updateDictionary(this.lvalue.name, this.doxyComment);
	}

	try {
		//if (ctx && ctx.locals && ctx.locals.hasOwnProperty(this.lvalue.name)) {
		//	// TODO ALLOW LIST INDEX ASSIGNS
		//	this.value = this.compiled.call(ctx,eden.root,scope,undefined,ctx);
		//	ctx.locals[this.lvalue.name] = this.value;
		//} else {
			var sym = this.lvalue.getSymbol(ctx,base,scope);
			if (this.lvalue.hasListIndices()) {
				this.value = this.compiled.call(sym,eden.root,scope,sym.cache,ctx);
				var complist = this.lvalue.executeCompList(ctx, scope);
				sym.listAssign(this.value, scope, this, false, complist);
			} else {
				this.value = this.compiled.call(sym,eden.root,scope,sym.cache,ctx);
				sym.assign(this.value,(this.lvalue.islocal) ? undefined : scope, this);
			}
		//}
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


