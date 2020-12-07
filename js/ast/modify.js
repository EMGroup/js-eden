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
	if (expression && expression.warning) this.warning = expression.warning;
};

/*Eden.AST.Modify.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}*/

Eden.AST.Modify.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
	if (!this.warning && lvalue.warning) this.warning = lvalue.warning;
};

Eden.AST.Modify.prototype.generate = function(ctx, scope) {
	var lval = this.lvalue.generate(ctx,scope);
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
		result = result + ", EdenSymbol.localJSAgent);\n";
	} else {
		result += ";\n";
	}
	return result;
};

Eden.AST.Modify.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	
	var sym = this.lvalue.getSymbol(ctx,base, scope);

	if (this.kind == "++") {
		var newval = sym.value(scope)+1;
		//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
		sym.assign(newval, scope, this);
	} else if (this.kind == "--") {
		var newval = sym.value(scope)-1;
		//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
		sym.assign(newval, scope, this);
	} else {
		var state = {
			statement: this,
			symbol: sym,
			isconstant: true,
			dependant: false,
			locals: ctx.locals
			//dependencies: this.dependencies
		};
		var rhs = Eden.AST.transpileExpressionNode(this.expression, scope, state);


		var f = new Function(["context","scope","cache"], rhs);
		var newval;
		var valr = f.call(sym,scope.context,scope,scope.lookup(sym.name));


		switch (this.kind) {
		case "+="	: newval = rt.add(sym.value(scope), valr); break;
		case "-="	: newval = rt.subtract(sym.value(scope), valr); break;
		case "/="	: newval = rt.divide(sym.value(scope), valr); break;
		case "*="	: newval = rt.multiply(sym.value(scope), valr); break;
		case "//="	: newval = rt.concat(sym.value(scope), valr); break;
		}

		//if (eden.peer) eden.peer.assign(agent, sym.name, newval);
		sym.assign(newval, scope, this);
	}
}

Eden.AST.registerStatement(Eden.AST.Modify);

