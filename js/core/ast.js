/* AST Structures */


function fnEdenAST_error(err) {
	this.errors.unshift(err);
};

function fnEdenAST_left(left) {
	this.l = left;
	if (left.errors.length > 0) {
		this.errors.push.apply(this.errors, left.errors);
	}
};


////////////////////////////////////////////////////////////////////////////////

function EdenAST_Literal(type, literal) {
	this.type = "literal";
	this.parent = undefined;
	this.datatype = type;
	this.value = literal;
	this.errors = [];
	this.start = 0;
	this.end = 0;
}
EdenAST_Literal.prototype.error = fnEdenAST_error;

EdenAST_Literal.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Literal.prototype.generate = function(ctx) {
	switch (this.datatype) {
	case "NUMBER"	:	return this.value;
	case "LIST"		:	var res = "[";
						for (var i=0; i<this.value.length; i++) {
							res += this.value[i].generate(ctx,"scope");
							if (this.value[i].doesReturnBound && this.value[i].doesReturnBound()) {
								res += ".value";
							}
							if (i != this.value.length-1) res += ",";
						}
						res += "]";
						return res;
	case "CHARACTER":
	case "STRING"	:	var str = this.value.replace(/\n/g,"\\n");
						return "\""+str+"\"";
	case "BOOLEAN"	:	return this.value;
	case "JAVASCRIPT"	: return this.value;
	}
}

EdenAST_Literal.prototype.execute = function(root, ctx) {
	switch(this.datatype) {
	case "NUMBER"	:
	case "CHARACTER":
	case "BOOLEAN"	:
	case "STRING"	:	return this.value;
	case "LIST"		:	var rhs = "(function(context,scope) { return ";
						rhs += this.generate(ctx, "scope");
						rhs += ";})";
						return eval(rhs)(root,root.scope);
	}
}


//------------------------------------------------------------------------------

function EdenAST_Scope() {
	this.type = "scope";
	this.errors = [];
	this.range = false;
	this.overrides = {};
	this.primary = new EdenAST_Primary();
}

EdenAST_Scope.prototype.error = fnEdenAST_error;

EdenAST_Scope.prototype.prepend = function(extra) {
	this.primary.prepend(extra);
}

EdenAST_Scope.prototype.setObservable = function(obs) {
	this.primary.setObservable(obs);
}

EdenAST_Scope.prototype.getObservable = function() {
	return this.primary.getObservable();
}

EdenAST_Scope.prototype.doesReturnBound = function() {
	return this.primary.doesReturnBound();
}

EdenAST_Scope.prototype.addOverride = function(obs, exp1, exp2) {
	if (exp2) {
		this.range = true;
		this.overrides[obs] = { start: exp1, end: exp2 };
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
	} else {
		this.range = false;
		this.overrides[obs] = { start: exp1, end: undefined};
		this.errors.push.apply(this.errors, exp1.errors);
	}
}

EdenAST_Scope.prototype.generate = function(ctx, scope) {
	var res;

	//if (ctx.scopes.length > 0) {
		res = "new Scope(context, "+scope+", [";
	//} else {
	//	res = "new Scope(context, scope, [";
	//}

	for (var o in this.overrides) {
		var startstr = this.overrides[o].start.generate(ctx,scope);
		if (this.range) {
			if (this.overrides[o].start.doesReturnBound && this.overrides[o].start.doesReturnBound()) {
				startstr += ".value";
			}
		}
		res += "new ScopeOverride(\""+o+"\", " + startstr;
		if (this.overrides[o].end) {
			var endstr = this.overrides[o].end.generate(ctx,scope);
			if (this.overrides[o].end.doesReturnBound && this.overrides[o].end.doesReturnBound()) {
				endstr += ".value";
			}
			res += ", " + endstr + "),";
		} else {
			res += "),";
		}
	}
	res = res.slice(0,-1);
	res += "], "+this.range+", context.lookup(\""+this.primary.getObservable()+"\"))";
	ctx.scopes.push(res);
	return this.primary.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]");
}


//------------------------------------------------------------------------------

function EdenAST_Index() {
	this.type = "index";
	this.expression = undefined;
	this.errors = [];
}

EdenAST_Index.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

EdenAST_Index.prototype.generate = function(ctx, scope) {
	var ix = this.expression.generate(ctx, scope);
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		ix += ".value";
	}
	return "[("+ix+")-1]";
}


//------------------------------------------------------------------------------

function EdenAST_ScopePath() {
	this.type = "scopepath";
	this.errors = [];
	this.primary = undefined;
	this.path = new EdenAST_Primary();
	this.scopestr = undefined;
}

EdenAST_ScopePath.prototype.prepend = function(extra) {
	this.path.prepend(extra);
}

EdenAST_ScopePath.prototype.setObservable = function(obs) {
	this.path.setObservable(obs);
}

EdenAST_ScopePath.prototype.getObservable = function() {
	return this.primary.getObservable();
}

EdenAST_ScopePath.prototype.doesReturnBound = function() {
	return this.primary.doesReturnBound();
}

EdenAST_ScopePath.prototype.getScopeString = function() {
	return this.scopestr;
}

EdenAST_ScopePath.prototype.setPrimary = function(prim) {
	this.primary = prim;
	if (this.primary.errors.length > 0) {
		this.errors.push.apply(this.errors, prim.errors);
	}
}

EdenAST_ScopePath.prototype.generate = function(ctx, scope) {
	ctx.scopes.push(this.path.generate(ctx, scope)+".scope");
	this.scopestr = "_scopes[" + (ctx.scopes.length-1) + "]";
	return this.primary.generate(ctx, "_scopes["+(ctx.scopes.length-1)+"]");
}



//------------------------------------------------------------------------------

function EdenAST_UnaryOp(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
EdenAST_UnaryOp.prototype.error = fnEdenAST_error;

EdenAST_UnaryOp.prototype.generate = function(ctx, scope) {
	var r = this.r.generate(ctx, scope);
	if (this.op == "!") {
		return "!("+r+")";
	} else if (this.op == "&") {
		return r;
	}
}



//------------------------------------------------------------------------------

function EdenAST_TernaryOp(op) {
	this.type = "ternaryop";
	this.op = op;
	this.errors = [];
	this.first = undefined;
	this.second = undefined;
	this.condition = undefined;
}
EdenAST_TernaryOp.prototype.error = fnEdenAST_error;

EdenAST_TernaryOp.prototype.setFirst = function(first) {
	this.first = first;
	if (first.errors.length > 0) {
		this.errors.push.apply(this.errors, first.errors);
	}
};

EdenAST_TernaryOp.prototype.setSecond = function(second) {
	this.second = second;
	if (second.errors.length > 0) {
		this.errors.push.apply(this.errors, second.errors);
	}
};

EdenAST_TernaryOp.prototype.setCondition = function(cond) {
	this.condition = cond;
	if (cond.errors.length > 0) {
		this.errors.push.apply(this.errors, cond.errors);
	}
};

EdenAST_TernaryOp.prototype.left = function(pleft) {
	if (this.condition === undefined) {
		this.condition = pleft;
	} else {
		this.first = pleft;
	}
};

EdenAST_TernaryOp.prototype.generate = function(ctx, scope) {
	var cond = this.condition.generate(ctx, scope);
	var first = this.first.generate(ctx, scope);
	var second = this.second.generate(ctx, scope);

	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		cond += ".value";
	}
	if (this.first.doesReturnBound && this.first.doesReturnBound()) {
		first += ".value";
	}
	if (this.second.doesReturnBound && this.second.doesReturnBound()) {
		second += ".value";
	}

	return "("+cond+")?("+first+"):("+second+")";
}

EdenAST_TernaryOp.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope");
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}



//------------------------------------------------------------------------------

function EdenAST_BinaryOp(op) {
	this.type = "binaryop";
	this.op = op;
	this.errors = [];
	this.l = undefined;
	this.r = undefined;
}
EdenAST_BinaryOp.prototype.left = fnEdenAST_left;
EdenAST_BinaryOp.prototype.error = fnEdenAST_error;

EdenAST_BinaryOp.prototype.setRight = function(right) {
	this.r = right;
	this.errors.push.apply(this.errors, right.errors);
}

EdenAST_BinaryOp.prototype.generate = function(ctx, scope) {
	var left = this.l.generate(ctx, scope);
	var right = this.r.generate(ctx, scope);
	var opstr;

	// Get values out of any BoundValues
	if (this.l.doesReturnBound && this.l.doesReturnBound()) {
		left += ".value";
	}
	if (this.r.doesReturnBound && this.r.doesReturnBound()) {
		right += ".value";
	}

	switch(this.op) {
	case "//"	: opstr = "concat"; break;
	case "+"	: opstr = "add"; break;
	case "-"	: opstr = "subtract"; break;
	case "/"	: opstr = "divide"; break;
	case "*"	: opstr = "multiply"; break;
	case "=="	: opstr = "equal"; break;
	case "%"	: opstr = "mod"; break;
	case "^"	: opstr = "pow"; break;
	default		: opstr = "RAW";
	}

	if (opstr != "RAW") {
		return "rt."+opstr+"(("+left+"),("+right+"))";
	} else {
		return "(" + left + ") " + this.op + " (" + right + ")";
	}
}

EdenAST_BinaryOp.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx);
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}



//------------------------------------------------------------------------------

function EdenAST_Length() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

EdenAST_Length.prototype.left = fnEdenAST_left;

EdenAST_Length.prototype.error = fnEdenAST_error;

EdenAST_Length.prototype.generate = function(ctx, scope) {
	var left = this.l.generate(ctx, scope);
	// Get value out of a BoundValue
	if (this.l.doesReturnBound && this.l.doesReturnBound()) {
		left += ".value";
	}
	return "rt.length(" + left + ")";
}



//------------------------------------------------------------------------------

function EdenAST_LValue(observable, lvaluep) {
	this.type = "lvalue";
	this.errors = [];
	this.observable = observable;
	this.lvaluep = lvaluep;

	for (var i = 0; i < lvaluep.length; i++) {
		this.errors.push.apply(this.errors, lvaluep[i].errors);
	}
};

EdenAST_LValue.prototype.error = fnEdenAST_error;

EdenAST_LValue.prototype.hasListIndices = function() {
	return this.lvaluep && this.lvaluep.length > 0 && this.lvaluep[0].kind == "index";
}

EdenAST_LValue.prototype.generateCompList = function(ctx) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += this.lvaluep[i].indexexp.generate(ctx);
	}
	res += "]";
	return res;
}

EdenAST_LValue.prototype.generateIdStr = function() {
	return "\""+this.generateCompList()+"\"";
}

EdenAST_LValue.prototype.executeCompList = function(ctx) {
	var res = [];
	for (var i=0; i<this.lvaluep.length; i++) {
		if (this.lvaluep[i].kind == "index") {
			res.push(eval(this.lvaluep[i].indexexp.generate(ctx)));
		}
	}
	return res;
}

EdenAST_LValue.prototype.generate = function(ctx) {
	return "context.lookup(\"" + this.observable + "\")";
}

function EdenAST_LValueComponent(kind) {
	this.type = "lvaluecomponent";
	this.errors = [];
	this.kind = kind;
	this.indexexp = undefined;
	this.observable = undefined;
};

EdenAST_LValueComponent.prototype.index = function(pindex) {
	this.indexexp = pindex;
	this.errors.push.apply(this.errors, pindex.errors);
};

EdenAST_LValueComponent.prototype.property = function(pprop) {
	this.observable = pprop;
	//this.errors.push.apply(this.errors, pprop.errors);
}

EdenAST_LValueComponent.prototype.generate = function(ctx) {
	if (this.kind == "index") {
		return "[("+this.indexexp.generate(ctx)+")-1]";
	//} else if (this.kind == "property") {
	//	return "[context.lookup(\""+obs+"\").value(scope)[0][1].indexOf(\""+this.observable+"\")+1]";
	}
}

EdenAST_LValueComponent.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Require() {
	this.type = "require";
	this.errors = [];
	this.expression = undefined;
	this.start = 0;
	this.end = 0;
}

EdenAST_Require.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

EdenAST_Require.prototype.generate = function(ctx) {
	return "edenUI.loadPlugin("+this.expression.generate(ctx, "scope")+");";
}

EdenAST_Require.prototype.execute = function(root, ctx, base) {
	edenUI.loadPlugin(this.expression.execute(root, ctx));
}

EdenAST_Require.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}



//------------------------------------------------------------------------------

function EdenAST_Include() {
	this.type = "include";
	this.errors = [];
	this.expression = undefined;
	this.start = 0;
	this.end = 0;
}

EdenAST_Include.prototype.prepend = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

EdenAST_Include.prototype.generate = function(ctx) {
	return "eden.include2("+this.expression.generate(ctx, "scope")+");";
}

EdenAST_Include.prototype.execute = function(root, ctx, base) {
	eden.include2(this.expression.execute(root, ctx));
}

EdenAST_Include.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}


//------------------------------------------------------------------------------

function EdenAST_Append() {
	this.type = "append";
	this.destination = undefined;
	this.index = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
}

EdenAST_Append.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

EdenAST_Append.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

EdenAST_Append.prototype.generate = function(ctx) {
	var express = this.index.generate(ctx, "scope");
	if (this.index.doesReturnBound && this.index.doesReturnBound()) {
		express += ".value";
	}
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.push("+express+"); }, this);";
}

EdenAST_Append.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Append.prototype.error = fnEdenAST_error;


//------------------------------------------------------------------------------

function EdenAST_Definition(expression) {
	this.type = "definition";
	this.parent = undefined;
	this.errors = expression.errors;
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	this.dependencies = {};
	this.scopes = [];
};

EdenAST_Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Definition.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Definition.prototype.generateDef = function(ctx) {
	var result = "function(context, scope, cache) {\n";
	var express = this.expression.generate(this, "scope");

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
		}
	}

	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		result += "\t var result = "+express+";\n";

		// Save the resulting values scope binding into the cache entry.
		result += "\tif (cache) cache.scope = result.scope;\n";

		// Make sure to copy a value if its an ungenerated one.
		if (this.scopes.length == 0) {
			result += "\treturn edenCopy(result.value);\n}";
		} else {
			result += "\treturn result.value;\n}";
		}
	} else {
		result += "\tif (cache) cache.scope = scope;\n";
		result += "\treturn " + express + ";\n}";
	}

	
	return result;
}

EdenAST_Definition.prototype.generate = function(ctx) {
	var result = this.lvalue.generate(ctx);

	if (this.lvalue.hasListIndices()) {
		var clist = this.lvalue.generateCompList(this);
		result += ".addExtension("+this.lvalue.generateIdStr()+", function(context, scope, value) {\n\tvalue";
		result += clist + " = ";
		result += this.expression.generate(this, "scope");

		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}

		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}

		result = result + ";\n}, undefined, this, "+JSON.stringify(deps);
		result += ");\n";
		return result;
	} else {
	 	result += ".define(" + this.generateDef(ctx);
		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}
		result = result + ", this, "+JSON.stringify(deps)+");\n";
		return result;
	}
};

EdenAST_Definition.prototype.execute = function(root, ctx, base) {
	//console.log("RHS = " + rhs);
	var source = base.getSource(this);
	var sym = root.lookup(this.lvalue.observable);

	if (this.lvalue.hasListIndices()) {
		var rhs = "(function(context,scope,value) { value";
		rhs += this.lvalue.generateCompList(this) + " = ";
		rhs += this.expression.generate(this, "scope");
		rhs += ";})";
		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}
		sym.addExtension(this.lvalue.generateIdStr(), eval(rhs), source, undefined, deps);
	} else {
		var rhs = "("+this.generateDef(ctx)+")";
		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}
		sym.eden_definition = base.getSource(this);
		sym.define(eval(rhs), undefined, deps);
	}
		
}

EdenAST_Definition.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Assignment(expression) {
	this.type = "assignment";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	this.scopes = [];
};

EdenAST_Assignment.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Assignment.prototype.generate = function(ctx) {
	var result = this.lvalue.generate(ctx);

	if (this.lvalue.hasListIndices()) {
		result += ".listAssign(";
		result += this.expression.generate(this, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}
		result += ", scope, undefined, false, ";
		result += this.lvalue.generateCompList(ctx);
		result += ");\n";
		return result;
	} else {
		result += ".assign(\n\t";
		result += this.expression.generate(this, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}
		result += ", scope);\n"
		return result;
	}
};

EdenAST_Assignment.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.expression.generate(this, "scope");
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		rhs += ".value";
	}
	rhs += ";})";

	if (this.lvalue.hasListIndices()) {
		root.lookup(this.lvalue.observable).listAssign(eval(rhs)(root,root.scope), root.scope, undefined, false, this.lvalue.executeCompList());
	} else {
		root.lookup(this.lvalue.observable).assign(eval(rhs)(root,root.scope),root.scope);
	}
};

EdenAST_Assignment.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Modify(kind, expression) {
	this.type = "modify";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.kind = kind;
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_Modify.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Modify.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Modify.prototype.generate = function(ctx) {
	var lval = this.lvalue.generate(ctx);
	var result = lval + ".assign(\n\t";

	// TODO Convert to rt
	if (this.kind == "+=") {
		result += lval + ".value(scope) + ";
		result += this.expression.generate(ctx);
	} else if (this.kind == "-=") {
		result += lval + ".value(scope) - ";
		result += this.expression.generate(ctx);
	} else if (this.kind == "/=") {
		result += lval + ".value(scope) / ";
		result += this.expression.generate(ctx);
	} else if (this.kind == "*=") {
		result += lval + ".value(scope) * ";
		result += this.expression.generate(ctx);
	} else if (this.kind == "++") {
		result += lval + ".value(scope)+1";
	} else if (this.kind == "--") {
		result += lval + ".value(scope)-1";
	}

	result = result + ", scope);\n"
	return result;
};

EdenAST_Modify.prototype.execute = function(root, ctx) {
	// TODO: allow this to work on list indices
	var sym = root.lookup(this.lvalue.observable);

	if (this.kind == "++") {
		sym.assign(sym.value(root.scope)+1, root.scope);
	} else if (this.kind == "--") {
		sym.assign(sym.value(root.scope)-1, root.scope);
	} else {
		var rhs = "(function(context,scope) { return ";
		rhs += this.expression.generate(this, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			rhs += ".value";
		}
		rhs += ";})";

		switch (this.kind) {
		case "+="	: sym.assign(rt.add(sym.value(), eval(rhs)(root,root.scope)), root.scope); break;
		case "-="	: sym.assign(rt.subtract(sym.value(), eval(rhs)(root,root.scope)), root.scope); break;
		case "/="	: sym.assign(rt.divide(sym.value(), eval(rhs)(root,root.scope)), root.scope); break;
		case "*="	: sym.assign(rt.multiply(sym.value(), eval(rhs)(root,root.scope)), root.scope); break;
		}
	}
}

EdenAST_Modify.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Subscribers() {
	this.type = "subscribers";
	this.errors = [];
	this.list = [];
	this.lvalue = undefined;
};

EdenAST_Subscribers.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Subscribers.prototype.setList = function(list) {
	this.list = list;
}

EdenAST_Subscribers.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Primary() {
	this.type = "primary";
	this.errors = [];
	this.observable = "";
	this.extras = [];
	this.backtick = undefined;
	this.returnsbound = true;
};

EdenAST_Primary.prototype.setBackticks = function(backtick) {
	this.backtick = backtick;
	this.errors.push.apply(this.errors, backtick.errors);
};

EdenAST_Primary.prototype.setObservable = function(obs) {
	this.observable = obs;
}

EdenAST_Primary.prototype.getObservable = function() {
	return this.observable;
}

EdenAST_Primary.prototype.doesReturnBound = function() {
	return this.returnsbound;
}

EdenAST_Primary.prototype.prepend = function(extra) {
	this.extras.unshift(extra);
	if (extra.type == "functioncall") {
		this.returnsbound = false;
	}
	if (extra.errors.length > 0) {
		this.errors.push.apply(this.errors, extra.errors);
	}
};

EdenAST_Primary.prototype.generate = function(ctx, scope) {
	var res = "context.lookup(";

	if (this.observable == "__BACKTICKS__") {
		res += this.backtick.generate(ctx, scope) + ")";
	} else {
		if (ctx && ctx.dependencies) ctx.dependencies[this.observable] = true;
		res += "\""+this.observable+"\")";
	}

	if (this.extras.length == 0) {
		//if (ctx.scopes.length > 0) {
			res += ".boundValue("+scope+")";
		//} else {
		//	res += ".boundValue(scope)";
		//}
	} else {
		this.returnsbound = false;
		//if (ctx.scopes.length > 0) {
			res += ".value("+scope+")";
		//} else {
		//	res += ".value(scope)";
		//}
		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope);
		}
	}

	return res;
}

EdenAST_Primary.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope");
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}

EdenAST_Primary.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_If() {
	this.type = "if";
	this.parent = undefined;
	this.errors = [];
	this.condition = "";
	this.statement = undefined;
	this.elsestatement = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_If.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_If.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
};

EdenAST_If.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

EdenAST_If.prototype.setElse = function(statement) {
	this.elsestatement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

EdenAST_If.prototype.generate = function(ctx) {
	var res = "if (";
	res += this.condition.generate(ctx, "scope");
	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		res += ".value";
	}
	res += ") ";
	res += this.statement.generate(ctx) + " ";
	if (this.elsestatement) {
		res += "\nelse " + this.elsestatement.generate(ctx) + "\n";
	}
	return res;
}

EdenAST_If.prototype.execute = function(root, ctx) {
	var cond = "(function(context,scope) { return ";
	cond += this.condition.generate(ctx, "scope");
	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		cond += ".value";
	}
	cond += ";})";
	if (eval(cond)(root,root.scope)) {
		this.statement.execute(root, ctx);
	} else {
		if (this.elsestatement) {
			return this.elsestatement.execute(root, ctx);
		}
	}
}

EdenAST_If.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Switch() {
	this.type = "switch";
	this.parent = undefined;
	this.errors = [];
	this.expression = "";
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_Switch.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Switch.prototype.setExpression = function(expression) {
	this.expression = expression;
	this.errors.push.apply(this.errors, expression.errors);
};

EdenAST_Switch.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
};

EdenAST_Switch.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_FunctionCall() {
	this.type = "functioncall";
	this.parent = undefined;
	this.errors = [];
	this.lvalue = undefined;
	this.params = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_FunctionCall.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_FunctionCall.prototype.setParams = function(params) {
	this.params = params;
	for (var i = 0; i < params.length; i++) {
		this.errors.push.apply(this.errors, params[i].errors);
	}
};

EdenAST_FunctionCall.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_FunctionCall.prototype.generate = function(ctx, scope) {
	if (this.lvalue === undefined) {
		var res = "(";
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				var express = this.params[i].generate(ctx, scope);
				if (this.params[i].doesReturnBound && this.params[i].doesReturnBound()) {
					express += ".value";
				}
				res += "("+express+")";
				if (i != this.params.length-1) res += ",";
			}
		}
		return res + ")";
	} else {
		var res = this.lvalue.generate(ctx) + ".value(scope)(";
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				var express = this.params[i].generate(ctx, scope);
				res += "("+express+")";
				if (i != this.params.length-1) res += ",";
			}
		}
		return res + ")";
	}
}

EdenAST_FunctionCall.prototype.execute = function(root, ctx) {
	var func = "(function(context,scope) { return " + this.generate(ctx, "scope") + "; })";
	return eval(func)(root,root.scope);
}

EdenAST_FunctionCall.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Action() {
	this.type = "action";
	this.parent = undefined;
	this.kindofaction = "touch";
	this.errors = [];
	this.triggers = [];
	this.body = undefined;
	this.name = "";
	this.start = 0;
	this.end = 0;
};

EdenAST_Action.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Action.prototype.kind = function(k) {
	this.kindofaction = k;
};

EdenAST_Action.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

EdenAST_Action.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"Script\"})";
	if (this.triggers.length > 0) {
		res += ".observe("+JSON.stringify(this.triggers)+");\n";
	}
	return res;
}

EdenAST_Action.prototype.execute = function(root, ctx, base) {
	var body = this.body.generate(ctx);
	var sym = root.lookup(this.name);
	sym.eden_definition = base.getSource(this);
	if (this.triggers.length > 0) {
		sym.define(eval(body), {name: "Script"}, []).observe(this.triggers);
	} else {
		sym.define(eval(body), {name: "Script"}, []);
	}
}

EdenAST_Action.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Function() {
	this.type = "function";
	this.parent = undefined;
	this.errors = [];
	this.body = undefined;
	this.name = "";
	this.start = 0;
	this.end = 0;
};

EdenAST_Function.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Function.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

EdenAST_Function.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"Script\"}, []);\n";
	return res;
}

EdenAST_Function.prototype.execute = function(root,ctx,base) {
	var body = this.body.generate(ctx);
	var sym = root.lookup(this.name);
	sym.eden_definition = base.getSource(this);	
	sym.define(eval(body), {name: "Script"},[]);
}

EdenAST_Function.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Return() {
	this.type = "return";
	this.parent = undefined;
	this.errors = [];
	this.result = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_Return.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Return.prototype.error = fnEdenAST_error;

EdenAST_Return.prototype.setResult = function(result) {
	this.result = result;
	this.errors.push.apply(this.errors, result.errors);
}

EdenAST_Return.prototype.generate = function(ctx) {
	if (this.result) {
		var res = this.result.generate(ctx, "scope");
		if (this.result.doesReturnBound && this.result.doesReturnBound()) {
			res += ".value";
		}
		return "return " + res + ";\n";
	} else {
		return "return;\n";
	}
}



//------------------------------------------------------------------------------

function EdenAST_While() {
	this.type = "while";
	this.parent = undefined;
	this.errors = [];
	this.condition = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_While.prototype.error = fnEdenAST_error;

EdenAST_While.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_While.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

EdenAST_While.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}



//------------------------------------------------------------------------------

function EdenAST_For() {
	this.type = "for";
	this.parent = undefined;
	this.errors = [];
	this.sstart = undefined;
	this.condition = undefined;
	this.inc = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
};

EdenAST_For.prototype.error = fnEdenAST_error;

EdenAST_For.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_For.prototype.setStart = function(start) {
	this.sstart = start;
	if (start) {
		this.errors.push.apply(this.errors, start.errors);
	}
}

EdenAST_For.prototype.setCondition = function(condition) {
	this.condition = condition;
	if (condition) {
		this.errors.push.apply(this.errors, condition.errors);
	}
}

EdenAST_For.prototype.setIncrement = function(inc) {
	this.inc = inc;
	if (inc) {
		this.errors.push.apply(this.errors, inc.errors);
	}
}

EdenAST_For.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

EdenAST_For.prototype.generate = function(ctx) {
	var res = "for (";
	if (this.sstart) {
		res += this.sstart.generate(ctx) + " ";
	} else res += "; ";
	if (this.condition) {
		res += this.condition.generate(ctx, "scope") + "; ";
	} else res += "; ";
	var incer = this.inc.generate(ctx);
	if (incer.charAt(incer.length-2) == ";") incer = incer.slice(0,-2);
	res += incer + ")\n";
	res += this.statement.generate(ctx);
	return res;
}

EdenAST_For.prototype.execute = function(root, ctx, base) {
	if (this.sstart) {
		this.sstart.execute(root,ctx,base);
	}

	var express = this.condition.generate(ctx, "scope");
	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		express += ".value";
	}
	var expfunc = eval("(function(context,scope){ return " + express + "; })");

	for (; expfunc(root,root.scope); this.inc.execute(root,ctx,base)) {
		this.statement.execute(root,ctx,base);
	}
}



//------------------------------------------------------------------------------

function EdenAST_Default() {
	this.type = "default";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

EdenAST_Default.prototype.error = fnEdenAST_error;

EdenAST_Default.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}



//------------------------------------------------------------------------------

function EdenAST_Case() {
	this.type = "case";
	this.parent = undefined;
	this.datatype = "";
	this.literal = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

EdenAST_Case.prototype.setLiteral = function(datatype, literal) {
	this.datatype = datatype;
	this.literal = literal;
}

EdenAST_Case.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Case.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Continue() {
	this.type = "continue";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

EdenAST_Continue.prototype.error = fnEdenAST_error;

EdenAST_Continue.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}



//------------------------------------------------------------------------------

function EdenAST_Break() {
	this.type = "break";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

EdenAST_Break.prototype.error = fnEdenAST_error;

EdenAST_Break.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}



//------------------------------------------------------------------------------

function EdenAST_CodeBlock() {
	this.type = "codeblock";
	this.errors = [];
	this.params = undefined;
	this.locals = undefined;
	this.script = undefined;
};

EdenAST_CodeBlock.prototype.error = fnEdenAST_error;

EdenAST_CodeBlock.prototype.setLocals = function(locals) {
	this.locals = locals;
	this.errors.push.apply(this.errors, locals.errors);
}

EdenAST_CodeBlock.prototype.setParams = function(params) {
	this.params = params;
	this.errors.push.apply(this.errors, params.errors);
}

EdenAST_CodeBlock.prototype.setScript = function(script) {
	this.script = script;
	this.errors.push.apply(this.errors, script.errors);
}

EdenAST_CodeBlock.prototype.generate = function(ctx) {
	var res = "(function(context, pscope) {\n";
	res += "var lscope = new Scope(context,pscope,[";
	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			if (i != this.locals.list.length-1) res += ",";
		}
	}
	res += "]);\n";
	res += "return (function() {\n";
	res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			if (i != this.params.list.length-1) res += ",";
		}
	}
	res += "]);\n";
	res += this.script.generate(ctx) + "}); })";
	return res;
}



//------------------------------------------------------------------------------

function EdenAST_ConditionalAction() {
	this.type = "conditionalaction";
	this.errors = [];
	this.expression = undefined;
	this.statement = undefined;
};

EdenAST_ConditionalAction.prototype.setExpression = function (express) {
	this.expression = express;
	this.errors.push.apply(this.errors, express.errors);
}

EdenAST_ConditionalAction.prototype.setStatement = function (statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
}

EdenAST_ConditionalAction.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_LList() {
	this.type = "lvaluelist";
	this.errors = [];
	this.llist = [];
};

EdenAST_LList.prototype.append = function(lvalue) {
	this.llist.push(lvalue);
	this.errors.push.apply(this.errors, lvalue.errors);
};

EdenAST_LList.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Declarations() {
	this.type = "declarations";
	this.errors = [];
	this.list = [];
};

EdenAST_Declarations.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Script() {
	this.type = "script";
	this.parent = undefined;
	this.errors = [];
	this.statements = [];
	this.start = 0;
	this.end = 0;
};

EdenAST_Script.prototype.error = fnEdenAST_error;

EdenAST_Script.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

EdenAST_Script.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

EdenAST_Script.prototype.execute = function(root, ctx, base) {
	for (var i = 0; i < this.statements.length; i++) {
		this.statements[i].execute(root,ctx, base);
	}
}

EdenAST_Script.prototype.generate = function(ctx) {
	var result = "{\n";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx);
	}
	result = result + "}";
	return result;
}
