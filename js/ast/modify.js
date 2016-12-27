/**
 * Modification operations such as +=. This AST node represents all of these.
 */
Eden.AST.Modify = function(kind, expression) {
	this.type = "modify";
	Eden.AST.BaseContext.apply(this);

	this.errors = (expression) ? expression.errors : [];
	this.kind = kind;
	this.expression = expression;
	this.lvalue = undefined;
};

/*Eden.AST.Modify.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}*/

Eden.AST.Modify.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Modify.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Modify.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Modify.prototype.generate = function(ctx, scope) {
	var lval = this.lvalue.generate(ctx);
	var result = lval;

	if (this.lvalue.islocal == false) result = scope+".assign("+lval+","+scope+".value("+lval+")";
	else result += " = " + lval;

	var express;
	if (this.expression) {
		express = this.expression.generate(ctx,scope,{bound: false, usevar: ctx.type == "scriptexpr"});
	}

	// TODO Convert to rt
	if (this.kind == "+=") {
		result += " + " + express;
	} else if (this.kind == "-=") {
		result += " - " + express;
	} else if (this.kind == "/=") {
		result += " / " + express;
	} else if (this.kind == "*=") {
		result += " * " + express;
	} else if (this.kind == "++") {
		result += "+1";
	} else if (this.kind == "--") {
		result += "-1";
	}

	if (this.lvalue.islocal == false) {
		result = result + ", Symbol.localJSAgent);\n";
	} else {
		result += ";\n";
	}
	return result;
};

Eden.AST.Modify.prototype.execute = function(ctx, base, scope, agent) {
	var _scopes = [];

	this.executed = 1;
	// TODO: allow this to work on list indices

	/*if (ctx && ctx.locals && ctx.locals.type != "declarations" && ctx.locals.hasOwnProperty(this.lvalue.name)) {
		if (this.kind == "++") {
			ctx.locals[this.lvalue.name]++;
		} else if (this.kind == "--") {
			ctx.locals[this.lvalue.name]--;
		} else {
			var rhs = "(function(context,scope) { return ";
			rhs += this.expression.generate(ctx, "scope");
			if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
				rhs += ".value";
			}
			rhs += ";})";

			//var scope = eden.root.scope;
			var context = eden.root;

			for (var i=0; i<this.scopes.length; i++) {
				_scopes.push(eval(this.scopes[i]));
			}

			this.scopes = [];

			var newval;

			switch (this.kind) {
			case "+="	: newval = rt.add(ctx.locals[this.lvalue.name], eval(rhs)(context,scope)); break;
			case "-="	: newval = rt.subtract(ctx.locals[this.lvalue.name], eval(rhs)(context,scope)); break;
			case "/="	: newval = rt.divide(ctx.locals[this.lvalue.name], eval(rhs)(context,scope)); break;
			case "*="	: newval = rt.multiply(ctx.locals[this.lvalue.name], eval(rhs)(context,scope)); break;
			}

			ctx.locals[this.lvalue.name] = newval;
		}
	} else {*/
		var sym = this.lvalue.getSymbol(ctx,base);

		if (this.kind == "++") {
			var newval = sym.value(scope)+1;
			//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
			sym.assign(newval, scope, agent);
		} else if (this.kind == "--") {
			var newval = sym.value(scope)-1;
			//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
			sym.assign(newval, scope, agent);
		} else {
			var rhs = "(function(context,scope) { return ";
			rhs += this.expression.generate(ctx, "scope",{bound: false});
			rhs += ";})";

			//var scope = eden.root.scope;
			var context = eden.root;

			for (var i=0; i<this.scopes.length; i++) {
				_scopes.push(eval(this.scopes[i]));
			}

			this.scopes = [];

			var newval;

			switch (this.kind) {
			case "+="	: newval = rt.add(sym.value(scope), eval(rhs)(context,scope)); break;
			case "-="	: newval = rt.subtract(sym.value(scope), eval(rhs)(context,scope)); break;
			case "/="	: newval = rt.divide(sym.value(scope), eval(rhs)(context,scope)); break;
			case "*="	: newval = rt.multiply(sym.value(scope), eval(rhs)(context,scope)); break;
			}

			//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
			sym.assign(newval, scope, agent);
		}
	//}
}

Eden.AST.Modify.prototype.error = fnEdenASTerror;

