/* AST Structures */


function fnEdenASTerror(err) {
	this.errors.unshift(err);
};

function fnEdenASTleft(left) {
	this.l = left;
	if (left.errors.length > 0) {
		this.errors.push.apply(this.errors, left.errors);
	}
};


////////////////////////////////////////////////////////////////////////////////

Eden.AST.Literal = function(type, literal) {
	this.type = "literal";
	this.parent = undefined;
	this.datatype = type;
	this.value = literal;
	this.errors = [];
	this.start = 0;
	this.end = 0;
}
Eden.AST.Literal.prototype.error = fnEdenASTerror;

Eden.AST.Literal.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Literal.prototype.generate = function(ctx) {
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

Eden.AST.Literal.prototype.execute = function(root, ctx) {
	switch(this.datatype) {
	case "NUMBER"	:
	case "CHARACTER":
	case "BOOLEAN"	:
	case "STRING"	:	return this.value;
	case "LIST"		:	var rhs = "(function(context,scope) { return ";
						rhs += this.generate(ctx, "scope");
						rhs += ";})";
						return eval(rhs)(root,root.scope);
	case "JAVASCRIPT"	: return eval(this.value);
	}
}


//------------------------------------------------------------------------------

Eden.AST.Scope = function() {
	this.type = "scope";
	this.errors = [];
	this.range = false;
	this.overrides = {};
	this.primary = new Eden.AST.Primary();
}

Eden.AST.Scope.prototype.error = fnEdenASTerror;

Eden.AST.Scope.prototype.prepend = function(extra) {
	this.primary.prepend(extra);
}

Eden.AST.Scope.prototype.setObservable = function(obs) {
	this.primary.setObservable(obs);
}

Eden.AST.Scope.prototype.getObservable = function() {
	return this.primary.getObservable();
}

Eden.AST.Scope.prototype.doesReturnBound = function() {
	return this.primary.doesReturnBound();
}

Eden.AST.Scope.prototype.addOverride = function(obs, exp1, exp2) {
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

Eden.AST.Scope.prototype.generate = function(ctx, scope) {
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

Eden.AST.Index = function() {
	this.type = "index";
	this.expression = undefined;
	this.errors = [];
}

Eden.AST.Index.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Index.prototype.generate = function(ctx, scope) {
	var ix = this.expression.generate(ctx, scope);
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		ix += ".value";
	}
	return "[("+ix+")-1]";
}

Eden.AST.Index.prototype.error = fnEdenASTerror;


//------------------------------------------------------------------------------

Eden.AST.ScopePath = function() {
	this.type = "scopepath";
	this.errors = [];
	this.primary = undefined;
	this.path = new Eden.AST.Primary();
	this.scopestr = undefined;
}

Eden.AST.ScopePath.prototype.prepend = function(extra) {
	this.path.prepend(extra);
}

Eden.AST.ScopePath.prototype.setObservable = function(obs) {
	this.path.setObservable(obs);
}

Eden.AST.ScopePath.prototype.getObservable = function() {
	return this.primary.getObservable();
}

Eden.AST.ScopePath.prototype.doesReturnBound = function() {
	return this.primary.doesReturnBound();
}

Eden.AST.ScopePath.prototype.getScopeString = function() {
	return this.scopestr;
}

Eden.AST.ScopePath.prototype.setPrimary = function(prim) {
	this.primary = prim;
	if (this.primary.errors.length > 0) {
		this.errors.push.apply(this.errors, prim.errors);
	}
}

Eden.AST.ScopePath.prototype.generate = function(ctx, scope) {
	ctx.scopes.push(this.path.generate(ctx, scope)+".scope");
	this.scopestr = "_scopes[" + (ctx.scopes.length-1) + "]";
	return this.primary.generate(ctx, "_scopes["+(ctx.scopes.length-1)+"]");
}

Eden.AST.ScopePath.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Parameter = function(index) {
	this.type = "parameter";
	this.index = index;
	this.errors = [];
}

Eden.AST.Parameter.prototype.error = fnEdenASTerror;

Eden.AST.Parameter.prototype.generate = function(ctx, scope) {
	if (ctx && ctx.getParameterByNumber) {
		ctx.dirty = true;
		return ""+ctx.getParameterByNumber(this.index);
	}
}



//------------------------------------------------------------------------------

Eden.AST.UnaryOp = function(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
Eden.AST.UnaryOp.prototype.error = fnEdenASTerror;

Eden.AST.UnaryOp.prototype.generate = function(ctx, scope) {
	var r = this.r.generate(ctx, scope);
	if (this.r.doesReturnBound && this.r.doesReturnBound()) {
		r += ".value";
	}
	if (this.op == "!") {
		return "!("+r+")";
	} else if (this.op == "&") {
		return r;
	} else if (this.op == "-") {
		return "-("+r+")";
	} else if (this.op == "*") {
		return r + ".value("+scope+")";
	}
}



//------------------------------------------------------------------------------

Eden.AST.TernaryOp = function(op) {
	this.type = "ternaryop";
	this.op = op;
	this.errors = [];
	this.first = undefined;
	this.second = undefined;
	this.condition = undefined;
	this.returnsbound = true;
}
Eden.AST.TernaryOp.prototype.error = fnEdenASTerror;

Eden.AST.TernaryOp.prototype.setFirst = function(first) {
	this.first = first;
	if (first.errors.length > 0) {
		this.errors.push.apply(this.errors, first.errors);
	}
};

Eden.AST.TernaryOp.prototype.setSecond = function(second) {
	this.second = second;
	if (second.errors.length > 0) {
		this.errors.push.apply(this.errors, second.errors);
	}
};

Eden.AST.TernaryOp.prototype.setCondition = function(cond) {
	this.condition = cond;
	if (cond.errors.length > 0) {
		this.errors.push.apply(this.errors, cond.errors);
	}
};

Eden.AST.TernaryOp.prototype.left = function(pleft) {
	if (this.condition === undefined) {
		this.condition = pleft;
	} else {
		this.first = pleft;
	}
};

Eden.AST.TernaryOp.prototype.doesReturnBound = function() {
	return this.returnsbound;
}

Eden.AST.TernaryOp.prototype.generate = function(ctx, scope) {
	var cond = this.condition.generate(ctx, scope);
	var first = this.first.generate(ctx, scope);
	var second = this.second.generate(ctx, scope);

	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		cond += ".value";
	}

	if (this.first.doesReturnBound && this.second.doesReturnBound && this.first.doesReturnBound() && this.second.doesReturnBound()) {
		return "("+cond+")?("+first+"):("+second+")";
	} else {
		if (this.first.doesReturnBound && this.first.doesReturnBound()) {
			first += ".value";
		}
		if (this.second.doesReturnBound && this.second.doesReturnBound()) {
			second += ".value";
		}
		this.returnsbound = false;
		return "("+cond+")?("+first+"):("+second+")";
	}
}

Eden.AST.TernaryOp.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope");
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}



//------------------------------------------------------------------------------

Eden.AST.BinaryOp = function(op) {
	this.type = "binaryop";
	this.op = op;
	this.errors = [];
	this.l = undefined;
	this.r = undefined;
}
Eden.AST.BinaryOp.prototype.left = fnEdenASTleft;
Eden.AST.BinaryOp.prototype.error = fnEdenASTerror;

Eden.AST.BinaryOp.prototype.setRight = function(right) {
	this.r = right;
	this.errors.push.apply(this.errors, right.errors);
}

Eden.AST.BinaryOp.prototype.generate = function(ctx, scope) {
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

Eden.AST.BinaryOp.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx);
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}



//------------------------------------------------------------------------------

Eden.AST.Length = function() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

Eden.AST.Length.prototype.left = fnEdenASTleft;

Eden.AST.Length.prototype.error = fnEdenASTerror;

Eden.AST.Length.prototype.generate = function(ctx, scope) {
	var left = this.l.generate(ctx, scope);
	// Get value out of a BoundValue
	if (this.l.doesReturnBound && this.l.doesReturnBound()) {
		left += ".value";
	}
	return "rt.length(" + left + ")";
}



//------------------------------------------------------------------------------

Eden.AST.LValue = function(observable, lvaluep) {
	this.type = "lvalue";
	this.errors = [];
	this.observable = observable;
	this.lvaluep = lvaluep;
	this.islocal = false;

	for (var i = 0; i < lvaluep.length; i++) {
		this.errors.push.apply(this.errors, lvaluep[i].errors);
	}
};

Eden.AST.LValue.prototype.error = fnEdenASTerror;

Eden.AST.LValue.prototype.hasListIndices = function() {
	return this.lvaluep && this.lvaluep.length > 0 && this.lvaluep[0].kind == "index";
}

Eden.AST.LValue.prototype.generateCompList = function(ctx, scope) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += this.lvaluep[i].indexexp.generate(ctx,scope);
		if (i < this.lvaluep.length-1) res += ",";
	}
	res += "]";
	return res;
}

Eden.AST.LValue.prototype.generateIdStr = function() {
	return "\""+this.generateCompList()+"\"";
}

Eden.AST.LValue.prototype.executeCompList = function(ctx) {
	var res = [];
	for (var i=0; i<this.lvaluep.length; i++) {
		if (this.lvaluep[i].kind == "index") {
			res.push(eval(this.lvaluep[i].indexexp.generate(ctx, "scope")));
		}
	}
	return res;
}

Eden.AST.LValue.prototype.generate = function(ctx) {
	if (ctx && ctx.locals && ctx.locals.list.indexOf(this.observable) != -1) {
		this.islocal = true;
		var res = this.observable;
		for (var i=0; i<this.lvaluep.length; i++) {
			res += this.lvaluep[i].generate(ctx, "scope");
		}
		return res;
	}
	if (ctx && ctx.params && ctx.params.list.indexOf(this.observable) != -1) {
		this.islocal = true;
		var res = this.observable;
		for (var i=0; i<this.lvaluep.length; i++) {
			res += this.lvaluep[i].generate(ctx, "scope");
		}
		return res;
	}

	// TODO: Pointer dependencies currently causing huge page redraw problems.
	//if (ctx && ctx.dependencies) {
	//	ctx.dependencies[this.observable] = true;
	//}

	return "context.lookup(\"" + this.observable + "\")";
}

Eden.AST.LValueComponent = function(kind) {
	this.type = "lvaluecomponent";
	this.errors = [];
	this.kind = kind;
	this.indexexp = undefined;
	this.observable = undefined;
};

Eden.AST.LValueComponent.prototype.index = function(pindex) {
	this.indexexp = pindex;
	this.errors.push.apply(this.errors, pindex.errors);
};

Eden.AST.LValueComponent.prototype.property = function(pprop) {
	this.observable = pprop;
	//this.errors.push.apply(this.errors, pprop.errors);
}

Eden.AST.LValueComponent.prototype.generate = function(ctx) {
	if (this.kind == "index") {
		return "[("+this.indexexp.generate(ctx)+")-1]";
	//} else if (this.kind == "property") {
	//	return "[context.lookup(\""+obs+"\").value(scope)[0][1].indexOf(\""+this.observable+"\")+1]";
	}
}

Eden.AST.LValueComponent.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.After = function () {
	this.type = "after";
	this.errors = [];
	this.expression = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.After.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.After.prototype.setStatement = function(state) {
	this.statement = state;
	if (state.errors.length > 0) {
		this.errors.push.apply(this.errors,state.errors);
	}
}

Eden.AST.After.prototype.generate = function(ctx, scope) {
	if (scope === undefined) scope = "eden.root.scope";
	var statement = "(function() {" + this.statement.generate(ctx, scope)+"})";
	var express = this.expression.generate(ctx,scope);
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		express += ".value";
	}
	return "setTimeout("+statement+", "+express+");\n";
}

Eden.AST.After.prototype.execute = function(root, ctx, base) {
	var statement = "(function() { var scope = eden.root.scope;\n" + this.statement.generate(ctx, "root.scope")+"})";
	setTimeout(eval(statement),this.expression.execute(root,ctx,base));
}

Eden.AST.After.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.After.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Require = function() {
	this.type = "require";
	this.errors = [];
	this.expression = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.Require.prototype.setExpression = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Require.prototype.generate = function(ctx) {
	return "edenUI.loadPlugin("+this.expression.generate(ctx, "scope")+");";
}

Eden.AST.Require.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	edenUI.loadPlugin(this.expression.execute(root, ctx));
}

Eden.AST.Require.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Require.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Include = function() {
	this.type = "include";
	this.errors = [];
	this.expression = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.Include.prototype.prepend = function(express) {
	this.expression = express;
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Include.prototype.generate = function(ctx) {
	return "eden.include2("+this.expression.generate(ctx, "scope")+");";
}

Eden.AST.Include.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	root.base.include2(this.expression.execute(root, ctx));
}

Eden.AST.Include.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Include.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Import = function() {
	this.type = "import";
	this.errors = [];
	this.path = "";
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.options = [];
}

Eden.AST.Import.prototype.setPath = function(path) {
	this.path = path;
}

Eden.AST.Import.prototype.addOption = function(opt) {
	if (opt == "enabled") {
		if (this.options.indexOf("enabled") >= 0) return true;
		if (this.options.indexOf("disabled") >= 0) return false;
	} else if (opt == "disabled") {
		if (this.options.indexOf("enabled") >= 0) return false;
		if (this.options.indexOf("disabled") >= 0) return true;
	} else if (opt == "local") {
		if (this.options.indexOf("local") >= 0) return true;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return false;
	} else if (opt == "remote") {
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return true;
		if (this.options.indexOf("rebase") >= 0) return false;
	}  else if (opt == "rebase") {
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return true;
	} else if (opt == "hidden") {
		if (this.options.indexOf("hidden") >= 0) return true;
		if (this.options.indexOf("visible") >= 0) return false;
	} else if (opt == "visible") {
		if (this.options.indexOf("hidden") >= 0) return false;
		if (this.options.indexOf("visible") >= 0) return true;
	}

	this.options.push(opt);
	return true;
}

Eden.AST.Import.prototype.generate = function(ctx) {
	return "Eden.Agent.importAgent(\""+this.path+"\");";
}

Eden.AST.Import.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var ag = Eden.Agent.importAgent(this.path, this.options);
	if (ag) {
		for (var i=0; i<base.imports.length; i++) {
			if (base.imports[i] === ag) return;
		}
		base.imports.push(ag);
	}
}

Eden.AST.Import.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Import.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Append = function() {
	this.type = "append";
	this.destination = undefined;
	this.index = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
}

Eden.AST.Append.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Append.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Append.prototype.generate = function(ctx) {
	var express = this.index.generate(ctx, "scope");
	if (this.index.doesReturnBound && this.index.doesReturnBound()) {
		express += ".value";
	}
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.push("+express+"); }, this);";
}

Eden.AST.Append.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var val = this.index.execute(root,ctx,base);
	root.lookup(this.destination.observable).mutate(root.scope, function(s) {
		root.scope.lookup(s.name).value.push(val);
	}, undefined);
}

Eden.AST.Append.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Append.prototype.error = fnEdenASTerror;


//------------------------------------------------------------------------------

Eden.AST.Insert = function() {
	this.type = "insert";
	this.destination = undefined;
	this.index = undefined;
	this.value = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.Insert.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Insert.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Insert.prototype.setValue = function(value) {
	this.value = value;
	if (value.errors.length > 0) {
		this.errors.push.apply(this.errors, value.errors);
	}
}

Eden.AST.Insert.prototype.generate = function(ctx) {
	var ix = this.index.generate(ctx, "scope");
	if (this.index.doesReturnBound && this.index.doesReturnBound()) {
		ix += ".value";
	}
	var val = this.value.generate(ctx, "scope");
	if (this.value.doesReturnBound && this.value.doesReturnBound()) {
		val += ".value";
	}
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(("+ix+")-1, 0, ("+val+")); }, this);";
}

Eden.AST.Insert.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var ix = this.index.execute(root,ctx,base);
	var val = this.value.execute(root,ctx,base);
	root.lookup(this.destination.observable).mutate(root.scope, function(s) {
		root.scope.lookup(s.name).value.splice(ix-1, 0, val);
	}, undefined);
}

Eden.AST.Insert.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Insert.prototype.error = fnEdenASTerror;




//------------------------------------------------------------------------------

Eden.AST.Delete = function() {
	this.type = "delete";
	this.destination = undefined;
	this.index = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.executed = 0;
}

Eden.AST.Delete.prototype.setDest = function(dest) {
	this.destination = dest;
	if (dest.errors.length > 0) {
		this.errors.push.apply(this.errors, dest.errors);
	}
}

Eden.AST.Delete.prototype.setIndex = function(index) {
	this.index = index;
	if (index.errors.length > 0) {
		this.errors.push.apply(this.errors, index.errors);
	}
}

Eden.AST.Delete.prototype.generate = function(ctx) {
	var ix = this.index.generate(ctx, "scope");
	if (this.index.doesReturnBound && this.index.doesReturnBound()) {
		ix += ".value";
	}
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(("+ix+")-1, 1); }, this);";
}

Eden.AST.Delete.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var ix = this.index.execute(root,ctx,base);
	root.lookup(this.destination.observable).mutate(root.scope, function(s) {
		root.scope.lookup(s.name).value.splice(ix-1, 1);
	}, undefined);
}

Eden.AST.Delete.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Delete.prototype.error = fnEdenASTerror;


//------------------------------------------------------------------------------

Eden.AST.Definition = function(expression) {
	this.type = "definition";
	this.parent = undefined;
	this.errors = expression.errors;
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	this.dependencies = {};
	this.scopes = [];
	this.backtickCount = 0;
	this.executed = 0;
};

Eden.AST.Definition.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}

Eden.AST.Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Definition.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Definition.prototype.generateDef = function(ctx) {
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

Eden.AST.Definition.prototype.generate = function(ctx) {
	var result = this.lvalue.generate(ctx);

	if (this.lvalue.islocal) {
		// TODO Report error, this is invalid;
		return "";
	} else if (this.lvalue.hasListIndices()) {
		var clist = this.lvalue.generateCompList(this, "scope");
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

Eden.AST.Definition.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var source = base.getSource(this);
	var sym = root.lookup(this.lvalue.observable);

	if (this.lvalue.hasListIndices()) {
		var rhs = "(function(context,scope,value) { value";
		rhs += this.lvalue.generateCompList(this, "scope") + " = ";
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
		sym.define(eval(rhs), {name: "execute"}, deps);
	}
		
}

Eden.AST.Definition.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Assignment = function(expression) {
	this.type = "assignment";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	this.scopes = [];
	this.backtickCount = 0;
	this.executed = 0;
	this.compiled = undefined;
	this.dirty = false;
	this.value = undefined;
};

Eden.AST.Assignment.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		var p = this.parent.getParameterByNumber(index);
		//console.log("Param "+index+" = " + p);
		return p;
	}
	return undefined;
}

Eden.AST.Assignment.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Assignment.prototype.generate = function(ctx) {
	var result = this.lvalue.generate(ctx);

	if (this.lvalue.islocal) {
		result += " = ";
		result += this.expression.generate(ctx, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}
		result += ";\n";
		return result;
	} else if (this.lvalue.hasListIndices()) {
		result += ".listAssign(";
		result += this.expression.generate(ctx, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}
		result += ", scope, this, false, ";
		result += this.lvalue.generateCompList(ctx, "scope");
		result += ");\n";
		return result;
	} else {
		result += ".assign(\n\t";
		result += this.expression.generate(this, "scope");
		if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
			result += ".value";
		}
		result += ", scope, this);\n"
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

	var rhs = "(function(context,scope) { \n";
	var express = this.expression.generate(this, "scope");

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		rhs += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			rhs += "\t_scopes.push(" + this.scopes[i];
			rhs += ");\n";
		}
	}

	rhs += "return " + express;

	// Remove the scope if a boundValue is returned.
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		rhs += ".value";
	}
	rhs += ";})";

	this.compiled = eval(rhs);
}

Eden.AST.Assignment.prototype.execute = function(root, ctx, base) {
	if (this.expression === undefined) return;
	this.executed = 1;
	this.compile(ctx);

	try {
		if (this.lvalue.hasListIndices()) {
			this.value = this.compiled(root,root.scope);
			root.lookup(this.lvalue.observable).listAssign(this.value, root.scope, {name: "execute"}, false, this.lvalue.executeCompList());
		} else {
			this.value = this.compiled(root,root.scope);
			root.lookup(this.lvalue.observable).assign(this.value,root.scope, {name: "execute"});
		}
	} catch(e) {
		this.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.ASSIGNEXEC, this, e));
	}
};

Eden.AST.Assignment.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Modify = function(kind, expression) {
	this.type = "modify";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.kind = kind;
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.Modify.prototype.getParameterByNumber = function(index) {
	if (this.parent && this.parent.getParameterByNumber) {
		return this.parent.getParameterByNumber(index);
	}
	return undefined;
}

Eden.AST.Modify.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Modify.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Modify.prototype.generate = function(ctx) {
	var lval = this.lvalue.generate(ctx);
	var result = lval;

	if (this.lvalue.islocal == false) result += ".assign(\n\t";
	else result += " = ";

	// TODO Convert to rt
	if (this.kind == "+=") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += " + " + this.expression.generate(ctx);
	} else if (this.kind == "-=") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += " - " + this.expression.generate(ctx);
	} else if (this.kind == "/=") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += " / " + this.expression.generate(ctx);
	} else if (this.kind == "*=") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += " * " + this.expression.generate(ctx);
	} else if (this.kind == "++") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += "+1";
	} else if (this.kind == "--") {
		result += lval;
		if (this.lvalue.islocal == false) result += ".value(scope)";
		result += "-1";
	}

	if (this.lvalue.islocal == false) {
		result = result + ", scope);\n";
	} else {
		result += ";\n";
	}
	return result;
};

Eden.AST.Modify.prototype.execute = function(root, ctx) {
	this.executed = 1;
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

Eden.AST.Modify.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Subscribers = function() {
	this.type = "subscribers";
	this.errors = [];
	this.list = [];
	this.lvalue = undefined;
};

Eden.AST.Subscribers.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Subscribers.prototype.setList = function(list) {
	this.list = list;
}

Eden.AST.Subscribers.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Primary = function() {
	this.type = "primary";
	this.errors = [];
	this.observable = "";
	this.extras = [];
	this.backtick = undefined;
	this.returnsbound = true;
};

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

Eden.AST.Primary.prototype.doesReturnBound = function() {
	return this.returnsbound;
}

Eden.AST.Primary.prototype.prepend = function(extra) {
	this.extras.unshift(extra);
	if (extra.type == "functioncall") {
		this.returnsbound = false;
	}
	if (extra.errors.length > 0) {
		this.errors.push.apply(this.errors, extra.errors);
	}
};

Eden.AST.Primary.prototype.generate = function(ctx, scope) {
	// Check if this primary is a local variable.
	if (ctx && ctx.locals && ctx.locals.list.indexOf(this.observable) != -1) {
		this.returnsbound = false;
		var res = this.observable;
		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope);
		}
		return res;
	}
	// Check if this primary is a parameter.
	if (ctx && ctx.params) {
		var ix = ctx.params.list.indexOf(this.observable);
		if (ix != -1) {
			this.returnsbound = false;
			var res = this.observable;
			for (var i=0; i<this.extras.length; i++) {
				res += this.extras[i].generate(ctx, scope);
			}
			return res;
		}
	}

	var res; // = "context.lookup(";

	if (this.observable == "__BACKTICKS__") {
		var id = 0;
		if (ctx && ctx.backtickCount !== undefined) {
			id = ctx.backtickCount;
			ctx.backtickCount++;
		}
		res = "context.currentObservable.subscribeDynamic(" + id + "," + this.backtick.generate(ctx, scope);
		if (this.backtick.doesReturnBound && this.backtick.doesReturnBound()) {
			res += ".value";
		}
		res += ")";
	} else {
		if (ctx && ctx.dependencies) ctx.dependencies[this.observable] = true;
		res = "context.lookup(\""+this.observable+"\")";
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

Eden.AST.Primary.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope");
	rhs += ";})";
	return eval(rhs)(root,root.scope);
}

Eden.AST.Primary.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.If = function() {
	this.type = "if";
	this.parent = undefined;
	this.errors = [];
	this.condition = "";
	this.statement = undefined;
	this.elsestatement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.If.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.If.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
};

Eden.AST.If.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.setElse = function(statement) {
	this.elsestatement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.generate = function(ctx) {
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

Eden.AST.If.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var cond = "(function(context,scope) { return ";
	cond += this.condition.generate(ctx, "scope");
	if (this.condition.doesReturnBound && this.condition.doesReturnBound()) {
		cond += ".value";
	}
	cond += ";})";
	if (eval(cond)(root,root.scope)) {
		this.statement.execute(root, ctx, base);
	} else {
		this.executed = 2;
		if (this.elsestatement) {
			return this.elsestatement.execute(root, ctx, base);
		}
	}
}

Eden.AST.If.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Switch = function() {
	this.type = "switch";
	this.parent = undefined;
	this.errors = [];
	this.expression = "";
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
};

Eden.AST.Switch.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Switch.prototype.setExpression = function(expression) {
	this.expression = expression;
	this.errors.push.apply(this.errors, expression.errors);
};

Eden.AST.Switch.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
};

Eden.AST.Switch.prototype.generate = function(ctx, scope) {
	if (scope === undefined) scope = "eden.root.scope";
	var res = "switch(";
	res += this.expression.generate(ctx,scope);
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		res += ".value";
	}
	res += ") " + this.statement.generate(ctx,scope);
	return res;
};

Eden.AST.Switch.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.FunctionCall = function() {
	this.type = "functioncall";
	this.parent = undefined;
	this.errors = [];
	this.lvalue = undefined;
	this.params = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.FunctionCall.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.FunctionCall.prototype.setParams = function(params) {
	this.params = params;
	for (var i = 0; i < params.length; i++) {
		this.errors.push.apply(this.errors, params[i].errors);
	}
};

Eden.AST.FunctionCall.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.FunctionCall.prototype.generate = function(ctx, scope) {
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
				if (this.params[i].doesReturnBound && this.params[i].doesReturnBound()) {
					express += ".value";
				}
				res += "("+express+")";
				if (i != this.params.length-1) res += ",";
			}
		}
		return res + ");";
	}
}

Eden.AST.FunctionCall.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var func = "(function(context,scope) { return " + this.generate(ctx, "scope") + "; })";
	try {
		return eval(func)(root,root.scope);
	} catch(e) {
		this.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.FUNCCALL, this, e));
	}
}

Eden.AST.FunctionCall.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Action = function() {
	this.type = "action";
	this.parent = undefined;
	this.kindofaction = "touch";
	this.errors = [];
	this.triggers = [];
	this.body = undefined;
	this.name = "";
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.Action.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Action.prototype.kind = function(k) {
	this.kindofaction = k;
};

Eden.AST.Action.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

Eden.AST.Action.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"})";
	if (this.triggers.length > 0) {
		res += ".observe("+JSON.stringify(this.triggers)+");\n";
	}
	return res;
}

Eden.AST.Action.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
	var body = this.body.generate(ctx);
	var sym = root.lookup(this.name);
	sym.eden_definition = base.getSource(this);
	if (this.triggers.length > 0) {
		sym.define(eval(body), {name: "execute"}, []).observe(this.triggers);
	} else {
		sym.define(eval(body), {name: "execute"}, []);
	}
}

Eden.AST.Action.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Function = function() {
	this.type = "function";
	this.parent = undefined;
	this.errors = [];
	this.body = undefined;
	this.name = "";
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.Function.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Function.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

Eden.AST.Function.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"}, []);\n";
	return res;
}

Eden.AST.Function.prototype.execute = function(root,ctx,base) {
	this.executed = 1;
	var body = this.body.generate(ctx);
	var sym = root.lookup(this.name);
	sym.eden_definition = base.getSource(this);	
	sym.define(eval(body), {name: "execute"},[]);
}

Eden.AST.Function.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Return = function() {
	this.type = "return";
	this.parent = undefined;
	this.errors = [];
	this.result = undefined;
	this.start = 0;
	this.end = 0;
};

Eden.AST.Return.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Return.prototype.error = fnEdenASTerror;

Eden.AST.Return.prototype.setResult = function(result) {
	this.result = result;
	this.errors.push.apply(this.errors, result.errors);
}

Eden.AST.Return.prototype.generate = function(ctx) {
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

Eden.AST.While = function() {
	this.type = "while";
	this.parent = undefined;
	this.errors = [];
	this.condition = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
};

Eden.AST.While.prototype.error = fnEdenASTerror;

Eden.AST.While.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.While.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

Eden.AST.While.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.While.prototype.generate = function(ctx) {
	var res = "while (" + this.condition.generate(ctx,"scope");
	if (this.condition.doesReturnBound && this.doesReturnBound()) {
		res += ".value";
	}
	res += ") ";
	res += this.statement.generate(ctx) + "\n";
	return res;
}



//------------------------------------------------------------------------------

Eden.AST.Do = function() {
	this.type = "do";
	this.parent = undefined;
	this.errors = [];
	/*this.condition = undefined;
	this.statement = undefined;*/
	this.name = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.parameters = [];
};

Eden.AST.Do.prototype.error = fnEdenASTerror;

Eden.AST.Do.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Do.prototype.addParameter = function(express) {
	this.parameters.push(express);
	if (express && express.errors.length > 0) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.Do.prototype.setName = function(name) {
	this.name = name;
}

/*Eden.AST.Do.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

Eden.AST.Do.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}*/



Eden.AST.Do.prototype.generate = function(ctx) {
	/*var res = "do\n";
	res += this.statement.generate(ctx) + "\n";
	res += "while (" + this.condition.generate(ctx,"scope");
	if (this.condition.doesReturnBound && this.doesReturnBound()) {
		res += ".value";
	}
	res += ");";
	return res;*/
	return "";
}


Eden.AST.Do.prototype.execute = function(root,ctx,base) {
	this.executed = 1;

	var script = base.getActionByName(this.name);

	if (script) {
		var params = [];
		for (var i=0; i<this.parameters.length; i++) {
			params.push(this.parameters[i].execute(root,ctx,base));
		}
		script.executeReal(root,ctx,base, params);
	} else {
		this.executed = 3;
		this.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.ACTIONNAME, this, "Action '"+this.name+"' does not exist"));
		if (this.parent) this.parent.executed = 3;
	}
}



//------------------------------------------------------------------------------

Eden.AST.For = function() {
	this.type = "for";
	this.parent = undefined;
	this.errors = [];
	this.sstart = undefined;
	this.condition = undefined;
	this.inc = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
};

Eden.AST.For.prototype.error = fnEdenASTerror;

Eden.AST.For.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.For.prototype.setStart = function(start) {
	this.sstart = start;
	if (start) {
		this.errors.push.apply(this.errors, start.errors);
	}
}

Eden.AST.For.prototype.setCondition = function(condition) {
	this.condition = condition;
	if (condition) {
		this.errors.push.apply(this.errors, condition.errors);
	}
}

Eden.AST.For.prototype.setIncrement = function(inc) {
	this.inc = inc;
	if (inc) {
		this.errors.push.apply(this.errors, inc.errors);
	}
}

Eden.AST.For.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.For.prototype.generate = function(ctx) {
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

Eden.AST.For.prototype.execute = function(root, ctx, base) {
	this.executed = 1;
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

Eden.AST.Default = function() {
	this.type = "default";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

Eden.AST.Default.prototype.error = fnEdenASTerror;

Eden.AST.Default.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Default.prototype.generate = function(ctx, scope) {
	return "default: ";
}



//------------------------------------------------------------------------------

Eden.AST.Case = function() {
	this.type = "case";
	this.parent = undefined;
	this.datatype = "";
	this.literal = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

Eden.AST.Case.prototype.setLiteral = function(datatype, literal) {
	this.datatype = datatype;
	this.literal = literal;
}

Eden.AST.Case.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Case.prototype.generate = function(ctx, scope) {
	return "case " + this.literal + ": ";
}

Eden.AST.Case.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Continue = function() {
	this.type = "continue";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

Eden.AST.Continue.prototype.error = fnEdenASTerror;

Eden.AST.Continue.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Continue.prototype.generate = function(ctx, scope) {
	return "continue; ";
}



//------------------------------------------------------------------------------

Eden.AST.Break = function() {
	this.type = "break";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
};

Eden.AST.Break.prototype.error = fnEdenASTerror;

Eden.AST.Break.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Break.prototype.generate = function(ctx, scope) {
	return "break; ";
}



//------------------------------------------------------------------------------

Eden.AST.Wait = function() {
	this.type = "wait";
	this.parent = undefined;
	this.errors = [];
	this.start = 0;
	this.end = 0;
	this.delay = undefined;
	this.executed = 0;
	this.compiled_delay = undefined;
};

Eden.AST.Wait.prototype.error = fnEdenASTerror;

Eden.AST.Wait.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Wait.prototype.setDelay = function(delay) {
	this.delay = delay;
	if (delay && delay.errors.length > 0) {
		this.errors.push.apply(this.errors, delay.errors);
	}
}

Eden.AST.Wait.prototype.compile = function(ctx) {
	if (this.delay === undefined) return;
	if (this.compiled_delay) return;
	var source = "(function(context,scope) { return ";
	source += this.delay.generate(ctx, "scope");
	if (this.delay.doesReturnBound && this.delay.doesReturnBound()) {
		source += ".value";
	}
	source += ";})";
	this.compiled_delay = eval(source);
}

Eden.AST.Wait.prototype.generate = function(ctx, scope) {
	return "yield "+this.delay+";";
}



//------------------------------------------------------------------------------

Eden.AST.CodeBlock = function() {
	this.type = "codeblock";
	this.errors = [];
	this.params = undefined;
	this.locals = undefined;
	this.script = undefined;
};

Eden.AST.CodeBlock.prototype.error = fnEdenASTerror;

Eden.AST.CodeBlock.prototype.setLocals = function(locals) {
	this.locals = locals;
	this.errors.push.apply(this.errors, locals.errors);
}

Eden.AST.CodeBlock.prototype.setParams = function(params) {
	this.params = params;
	this.errors.push.apply(this.errors, params.errors);
}

Eden.AST.CodeBlock.prototype.setScript = function(script) {
	this.script = script;
	this.errors.push.apply(this.errors, script.errors);
}

Eden.AST.CodeBlock.prototype.generate = function(ctx) {
	var res = "(function(context, scope) {\n";
	//res += "var lscope = new Scope(context,pscope,[";
	if (this.locals && this.locals.list) {
		for (var i=0; i<this.locals.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.locals.list[i] + "\", undefined)";
			//if (i != this.locals.list.length-1) res += ",";
			res += "var " + this.locals.list[i] + ";\n";
		}
	}
	//res += "]);\n";
	res += "return (function() {\n";
	//res += "var scope = new Scope(context,lscope,[";
	if (this.params && this.params.list) {
		for (var i=0; i<this.params.list.length; i++) {
			//res += "new ScopeOverride(\"" + this.params.list[i] + "\", arguments["+(i)+"])";
			//if (i != this.params.list.length-1) res += ",";
			res += "var " + this.params.list[i] + " = edenCopy(arguments["+i+"]);\n";
		}
	}
	//res += "]);\n";
	res += this.script.generate(this, "scope") + "}); })";
	return res;
}



//------------------------------------------------------------------------------

Eden.AST.When = function() {
	this.type = "when";
	this.errors = [];
	this.expression = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.parent = undefined;
	this.dependencies = {};
	this.active = false;
};

Eden.AST.When.prototype.setExpression = function (express) {
	this.expression = express;
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.When.prototype.setStatement = function (statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.When.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.When.prototype.generate = function() {
	return "";
}

Eden.AST.When.prototype.compile = function(base) {
	var cond = "(function(context,scope) { return ";
	cond += this.expression.generate(this, "scope");
	if (this.expression.doesReturnBound && this.expression.doesReturnBound()) {
		cond += ".value";
	}
	cond += ";})";
	this.compiled = eval(cond);

	// Register with base to be triggered
	for (var d in this.dependencies) {
		if (base.triggers[d]) {
			if (base.triggers[d].indexOf(this) == -1) {
				base.triggers[d].push(this);
			}
		} else {
			var trigs = [this];
			base.triggers[d] = trigs;
		}
	}

	return "";
}

Eden.AST.When.prototype.execute = function(root, ctx, base) {
	if (this.active) return;
	this.active = true;
	this.executed = 1;
	//this.compile(base);

	if (this.compiled(root,root.scope)) {
		this.statement.execute(root, ctx, base);
	} else {
		this.executed = 2;
	}
	this.active = false;
}

Eden.AST.When.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.LList = function() {
	this.type = "lvaluelist";
	this.errors = [];
	this.llist = [];
};

Eden.AST.LList.prototype.append = function(lvalue) {
	this.llist.push(lvalue);
	this.errors.push.apply(this.errors, lvalue.errors);
};

Eden.AST.LList.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Declarations = function() {
	this.type = "declarations";
	this.errors = [];
	this.list = [];
};

Eden.AST.Declarations.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.Script = function() {
	this.type = "script";
	this.name = undefined;
	this.parent = undefined;
	this.errors = [];
	this.statements = [];
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.active = false;
	this.parameters = undefined;
};

Eden.AST.Script.prototype.getParameterByNumber = function(index) {
	if (this.parameters) {
		return this.parameters[index-1];
	}
	return undefined;
}

Eden.AST.Script.prototype.error = fnEdenASTerror;

Eden.AST.Script.prototype.setName = function(name) {
	this.name = name;
}

Eden.AST.Script.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Script.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

Eden.AST.Script.prototype.executeReal = function(root, ctx, base, parameters) {
	if (this.active) return;
	this.active = true;
	var gen = this.executeGenerator(root,ctx,base, parameters);
	runEdenAction(this, gen);
}

Eden.AST.Script.prototype.executeGenerator = function*(root, ctx, base, parameters) {
	this.executed = 1;
	for (var i = 0; i < this.statements.length; i++) {
		if (this.statements[i].type == "wait") {
			this.statements[i].executed = 1;
			this.statements[i].compile(ctx);
			if (this.statements[i].compiled_delay) {
				yield this.statements[i].compiled_delay(root,root.scope);
			} else {
				yield 0;
			}
		} else {
			this.parameters = parameters;
			this.statements[i].execute(root,this, base);
		}

		if (this.statements[i].errors.length > 0) {
			this.errors.push.apply(this.errors, this.statements[i].errors);
		}
	}
}

function runEdenAction(source, action) {
	if (action === undefined) {
		source.active = false;
	}
	var delay = action.next();
	//console.log("RunAction: " + delay.value);
	if (delay.done == false) {
		if (delay.value == 0) {
			runEdenAction(source, action);
		} else if (delay.value > 0) {
			setTimeout(function() {runEdenAction(source, action)}, delay.value);
		}
	} else {
		source.active = false;
	}
}

Eden.AST.Script.prototype.execute = function(root, ctx, base) {
	// Un named actions execute immediately.
	if (this.name === undefined) {
		this.executeReal(root,ctx,base);
	} else {
		// Add this named script to a local symbol table.
		//base.scripts[this.name] = this;
		//console.log("Added script: " + this.name);
	}
}

Eden.AST.Script.prototype.generate = function(ctx, scope) {
	var result = "{\n";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx, scope);
	}
	result = result + "}";
	return result;
}


