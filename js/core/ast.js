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
	this.datatype = type;
	this.value = literal;
	this.errors = [];
}
EdenAST_Literal.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_UnaryOp(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
EdenAST_UnaryOp.prototype.error = fnEdenAST_error;



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

EdenAST_TernaryOp.prototype.left = function(pleft) {
	this.condition = pleft;
};



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

EdenAST_BinaryOp.prototype.generate = function() {
	var left = (this.l.type == "lvalue") ? this.l.generate() + ".value()" : this.l.generate();
	var right = (this.r.type == "lvalue") ? this.r.generate() + ".value()" : this.r.generate();
	return left + " " + this.op + " " + right;
}



//------------------------------------------------------------------------------

function EdenAST_Length() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

EdenAST_Length.prototype.left = fnEdenAST_left;



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

EdenAST_LValue.prototype.generate = function() {
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
	this.errors.push.apply(this.errors, pprop.errors);
}

EdenAST_LValueComponent.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Definition(expression) {
	this.type = "definition";
	this.errors = expression.errors;
	this.expression = expression;
	this.lvalue = undefined;
};

EdenAST_Definition.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Definition.prototype.generate = function() {
	var result = this.lvalue.generate() + ".define(function(context) { return ";
	result = result + this.expression.generate();
	result = result + "; }, this, []);"
	return result;
};

EdenAST_Definition.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Assignment(expression) {
	this.type = "assignment";
	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
};

EdenAST_Assignment.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

EdenAST_Assignment.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Modify(kind, expression) {
	this.type = "modify";
	this.errors = (expression) ? expression.errors : [];
	this.kind = kind;
	this.expression = expression;
	this.lvalue = undefined;
};

EdenAST_Modify.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
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
	this.extras = undefined;
};

EdenAST_Primary.prototype.setExtras = function(extras) {
	this.extras = extras;
	for (var i = 0; i < extras.length; i++) {
		this.errors.push.apply(this.errors, extras[i].errors);
	}
};

EdenAST_Primary.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_If() {
	this.type = "if";
	this.errors = [];
	this.condition = "";
	this.statement = undefined;
	this.elsestatement = undefined;
};

EdenAST_If.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
};

EdenAST_If.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
};

EdenAST_If.prototype.setElse = function(statement) {
	this.elsestatement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
};

EdenAST_If.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Switch() {
	this.type = "switch";
	this.errors = [];
	this.expression = "";
	this.statement = undefined;
};

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
	this.errors = [];
	this.params = undefined;
};

EdenAST_FunctionCall.prototype.setParams = function(params) {
	this.params = params;
	for (var i = 0; i < params.length; i++) {
		this.errors.push.apply(this.errors, params[i].errors);
	}
};

EdenAST_FunctionCall.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Action() {
	this.type = "action";
	this.kindofaction = "touch";
	this.errors = [];
	this.triggers = [];
	this.body = undefined;
	this.name = "";
};

EdenAST_Action.prototype.kind = function(k) {
	this.kindofaction = k;
};

EdenAST_Action.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

EdenAST_Action.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Function() {
	this.type = "function";
	this.errors = [];
	this.body = undefined;
	this.name = "";
};

EdenAST_Function.prototype.setBody = function(body) {
	this.body = body;
	this.errors.push.apply(this.errors, body.errors);
}

EdenAST_Function.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Return() {
	this.type = "return";
	this.errors = [];
	this.result = undefined;
};

EdenAST_Return.prototype.error = fnEdenAST_error;

EdenAST_Return.prototype.setResult = function(result) {
	this.result = result;
	this.errors.push.apply(this.errors, result.errors);
}



//------------------------------------------------------------------------------

function EdenAST_For() {
	this.type = "for";
	this.errors = [];
	this.start = undefined;
	this.condition = undefined;
	this.inc = undefined;
	this.statement = undefined;
};

EdenAST_For.prototype.error = fnEdenAST_error;

EdenAST_For.prototype.setStart = function(start) {
	this.start = start;
	this.errors.push.apply(this.errors, start.errors);
}

EdenAST_For.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

EdenAST_For.prototype.setIncrement = function(inc) {
	this.inc = inc;
	this.errors.push.apply(this.errors, inc.errors);
}

EdenAST_For.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
}



//------------------------------------------------------------------------------

function EdenAST_Default() {
	this.type = "default";
	this.errors = [];
};

EdenAST_Default.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Case() {
	this.type = "case";
	this.datatype = "";
	this.literal = undefined;
	this.errors = [];
};

EdenAST_Case.prototype.setLiteral = function(datatype, literal) {
	this.datatype = datatype;
	this.literal = literal;
}

EdenAST_Case.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Continue() {
	this.type = "continue";
	this.errors = [];
};

EdenAST_Continue.prototype.error = fnEdenAST_error;



//------------------------------------------------------------------------------

function EdenAST_Break() {
	this.type = "break";
	this.errors = [];
};

EdenAST_Break.prototype.error = fnEdenAST_error;



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
	this.errors = [];
	this.statements = [];
};

EdenAST_Script.prototype.error = fnEdenAST_error;

EdenAST_Script.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

EdenAST_Script.prototype.generate = function() {
	var result = "(function (root, eden, includePrefix, done) {(function(context, rt) {";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate();
	}
	result = result + "}).call(this, root, rt);})";
	return result;
}
