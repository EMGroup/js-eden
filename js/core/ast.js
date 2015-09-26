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
	if (this.datatype == "NUMBER") {
		return this.value;
	} else if (this.datatype == "LIST") {
		var res = "[";
		for (var i=0; i<this.value.length; i++) {
			res += this.value[i].generate(ctx);
			if (i != this.value.length-1) res += ",";
		}
		res += "]";
		return res;
	} else if (this.datatype == "STRING") {
		return "\""+this.value+"\"";
	}
}


//------------------------------------------------------------------------------

function EdenAST_Scope() {
	this.type = "scope";
	this.errors = [];
	this.range = false;
	this.overrides = {};
}

EdenAST_Scope.prototype.error = fnEdenAST_error;

EdenAST_Scope.prototype.prepend = function(obs, exp1, exp2) {
	if (exp2) {
		this.range = true;
		this.overrides[obs] = { start: exp1, end: exp2 };
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
	} else {
		this.overrides[obs] = { start: exp1, end: undefined};
		this.errors.push.apply(this.errors, exp1.errors);
	}
}

EdenAST_Scope.prototype.generate = function(ctx) {
	var res;

	if (this.range) {
		res = "[";
	} else {
		res = "new Scope(context, scope, [";
	}

	for (var o in this.overrides) {
		res += "new ScopeOverride(\""+o+"\", " + this.overrides[o].start.generate(ctx);
		if (this.overrides[o].end) {
			res += ", " + this.overrides[o].end.generate(ctx) + "),";
		} else {
			res += "),";
		}
	}
	res = res.slice(0,-1);
	if (this.range) {
		res += "]";
	} else {
		res += "], ";
	}
	return res;
}



//------------------------------------------------------------------------------

function EdenAST_UnaryOp(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
EdenAST_UnaryOp.prototype.error = fnEdenAST_error;

EdenAST_UnaryOp.prototype.generate = function(ctx) {
	var r = this.r.generate(ctx);
	return this.op+"("+r+")";
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

EdenAST_TernaryOp.prototype.generate = function(ctx) {
	var cond = this.condition.generate(ctx);
	var first = this.first.generate(ctx);
	var second = this.second.generate(ctx);
	return "("+cond+")?("+first+"):("+second+")";
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

EdenAST_BinaryOp.prototype.generate = function(ctx) {
	var left = this.l.generate(ctx);
	var right = this.r.generate(ctx);
	if (this.op == "//") {
		return "rt.concat(("+left+"),("+right+"))";
	} else {
		return "(" + left + ") " + this.op + " (" + right + ")";
	}
}



//------------------------------------------------------------------------------

function EdenAST_Length() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

EdenAST_Length.prototype.left = fnEdenAST_left;

EdenAST_Length.prototype.error = fnEdenAST_error;

EdenAST_Length.prototype.generate = function(ctx) {
	var left = this.l.generate(ctx);
	return left + ".length";
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

EdenAST_LValue.prototype.generate = function(ctx) {
	var res = "context.lookup(\"" + this.observable + "\")";
	for (var i=0; i<this.lvaluep; i++) {
		if (this.lvaluep[i].kind == "index") {
			res += ".get(" + this.lvaluep[i].indexexp.generate(ctx) + ")";
		}
	}
	return res;
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
	this.errors.push.apply(this.errors, pprop.errors);
}

EdenAST_LValueComponent.prototype.generate = function(ctx) {
	if (this.kind == "index") {
		return "[("+this.indexexp.generate(ctx)+")-1]";
	}
}

EdenAST_LValueComponent.prototype.error = fnEdenAST_error;



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

EdenAST_Definition.prototype.generate = function(ctx) {
	var result = this.lvalue.generate(ctx) + ".define(function(context, scope) {\n\treturn ";
	result = result + this.expression.generate(this);
	var deps = [];
	for (var d in this.dependencies) {
		deps.push(d);
	}
	result = result + ";\n}, this, "+JSON.stringify(deps)+");"
	return result;
};

EdenAST_Definition.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.expression.generate(this);
	rhs += ";})";
	var deps = [];
	for (var d in this.dependencies) {
		deps.push(d);
	}
	//console.log("RHS = " + rhs);
	root.lookup(this.lvalue.observable).define(eval(rhs), undefined, deps);
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
	var result = this.lvalue.generate(ctx) + ".assign(\n\t";
	result = result + this.expression.generate(ctx);
	result = result + ", scope);\n"
	return result;
};

EdenAST_Assignment.prototype.execute = function(root, ctx) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.expression.generate(ctx);
	rhs += ";})";
	root.lookup(this.lvalue.observable).assign(eval(rhs)(root,root.scope),root.scope);
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
		result += lval + ".value(scope)++";
	} else if (this.kind == "--") {
		result += lval + ".value(scope)--";
	}

	result = result + ", scope);\n"
	return result;
};

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
};

EdenAST_Primary.prototype.setBackticks = function(backtick) {
	this.backtick = backtick;
	this.errors.push.apply(this.errors, backtick.errors);
};

EdenAST_Primary.prototype.setExtras = function(extras) {
	this.extras = extras;
	for (var i = 0; i < extras.length; i++) {
		this.errors.push.apply(this.errors, extras[i].errors);
	}
};

EdenAST_Primary.prototype.generate = function(ctx) {
	if (ctx) ctx.dependencies[this.observable] = true;
	var res = "context.lookup(\""+this.observable+"\")";
	var i = 0;
	if (this.extras.length >= 1 && this.extras[0].type == "scope") {
		if (this.extras[0].range) {
			res += ".multiValue(context,scope," + this.extras[0].generate(ctx) + ", context.lookup(\""+this.observable+"\"))";
		} else {
			res += ".value(" + this.extras[0].generate(ctx) + "context.lookup(\""+this.observable+"\")))";
		}		
		i = 1;
	} else {
		res += ".value(scope)";
	}

	for (; i < this.extras.length; i++) {
		res += this.extras[i].generate(ctx);
	}
	return res;
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
	res += this.condition.generate(ctx) + ") ";
	res += this.statement.generate(ctx) + " ";
	if (this.elsestatement) {
		res += "\nelse " + this.elsestatement.generate(ctx) + "\n";
	}
	return res;
}

EdenAST_If.prototype.execute = function(root, ctx) {
	var cond = "(function(context,scope) { return ";
	cond += this.condition.generate(ctx) + ";})";
	if (eval(cond)(root,root.scope)) {
		return eval(this.statement.generate(ctx));
	} else {
		if (this.elsestatement) {
			return eval(this.elsestatement.generate(ctx));
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

EdenAST_FunctionCall.prototype.generate = function(ctx) {
	if (this.lvalue === undefined) {
		var res = "(";
		for (var i=0; i<this.params.length; i++) {
			var express = this.params[i].generate(ctx);
			res += "("+express+")";
			if (i != this.params.length-1) res += ",";
		}
		return res + ")";
	} else {
		var res = this.lvalue.generate(ctx) + ".value(scope)(";
		for (var i=0; i<this.params.length; i++) {
			var express = this.params[i].generate(ctx);
			res += "("+express+")";
			if (i != this.params.length-1) res += ",";
		}
		return res + ")";
	}
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
		return "return " + this.result.generate(ctx) + ";\n";
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
	this.params = [];
	this.locals = [];
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

EdenAST_Script.prototype.execute = function(root, ctx) {
	for (var i = 0; i < this.statements.length; i++) {
		this.statements[i].execute(root,ctx);
	}
}

EdenAST_Script.prototype.generate = function(ctx) {
	var result = "(function (root, eden, includePrefix, done) {(function(context, rt) {";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx);
	}
	result = result + "}).call(this, root, rt);})";
	return result;
}
