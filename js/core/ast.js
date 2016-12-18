/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Abstract Syntax Tree Structures
 *
 * When a script is parsed a tree is constructed, and the structures at the
 * nodes and leaves of the tree are defined here. Each node and leaf has a type
 * and a list of errors. Most also have the following set of standard
 * functions:
 *     - error: to add a syntax or run-time error to this node.
 *     - setSource: statement nodes need to know start and end source position
 *     - generate: to generate javascript output from this node and its subtree
 *     - execute: to directly execute the tree, which may go via generate above
 *
 * Generate functions require two parameters: 1) a context which is a
 * definition, assignment, procedure, function or script. This gives the scope
 * of local variables etc. 2) A scope string, a string containing the name of
 * the javascript variable for the scope to use (scope as in js-eden scoping
 * not javascript scope).
 *
 * Execute functions require three parameters: 1) Root symbol table, as in
 * eden.root. 2) Context, same as for the generate function. 3) Base of the
 * abstract syntax tree so that it knows how to call actions defined elsewhere
 * within it.
 *
 * Additionally, each node may have type specific functions for setting node
 * specific children or data items during construction. On the whole, these
 * extra methods should bubble all errors found in child nodes up, ultimately
 * to the root node.
 *
 * @see translator2.js for the parser that generates the tree from these nodes.
 */


/* Generic functions to be reused */
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


Eden.AST.Local = function(name) {
	console.log("MAKE LOCAL",name);
	this.name = name;
	this.cvalue = undefined;
	this.definition = undefined;
}

Eden.AST.Local.prototype.assign = function(value, scope) {
	console.log("LOCAL ASSIGN",this.name,value,scope);
	this.cvalue = value;
}

Eden.AST.Local.prototype.define = function(def, agent, deps) {
	console.log("LOCAL DEFINE", def);
	this.definition = def;
}

Eden.AST.Local.prototype.value = function(scope) {
	console.log("LOCAL SCOPE", this.name, scope, this.cvalue);
	if (this.definition) {
		return this.definition.call(this, scope.context, scope);
	} else {
		return this.cvalue;
	}
}

//------------------------------------------------------------------------------


Eden.AST.Handle = function(name) {
	console.log("MAKE HANDLE",name);
	this.name = name;
	this.cvalue = undefined;
	this.definition = undefined;
}

Eden.AST.Handle.prototype.assign = function(value, scope) {
	console.log("HANDLE ASSIGN",this.name,value,scope);
	if (scope) scope.lookup(this.name).value = value;
	else this.cvalue = value;
}

Eden.AST.Handle.prototype.define = function(def, agent, deps) {
	console.log("HANDLE DEFINE", def);
	this.definition = def;
}

Eden.AST.Handle.prototype.value = function(scope) {
	console.log("HANDLE SCOPE", this.name, scope, this.cvalue);
	if (this.definition) {
		return this.definition.call(this, scope.context, scope);
	} else {
		if (scope) return scope.lookup(this.name).value;
		return this.cvalue;
	}
}

//------------------------------------------------------------------------------


Eden.AST.Context = function(parent) {
	this.symbols = {};
	this.parent = parent;
}

Eden.AST.Context.prototype.lookup = function(name) {
	console.log("LOOKUP CONTEXT",name);
	if (this.symbols[name]) return this.symbols[name];
	this.symbols[name] = new Eden.AST.Handle(name);
	return this.symbols[name];
}


////////////////////////////////////////////////////////////////////////////////

/**
 * A doxygen style comment node. The content is not parsed, the entire comment
 * is stored raw.
 * @param {String} content The string content of the comment.
 * @param {number} start Start character location in original source.
 * @param {number} end End character location in original source.
 * @see doxycomments.js
 */
Eden.AST.DoxyComment = function(content, start, end) {
	this.type = "doxycomment";
	this.content = content;
	this.startline = start;
	this.endline = end;
	this.tags = undefined;
	this.controls = undefined;
	this.parent = undefined;
}


////////////////////////////////////////////////////////////////////////////////

/**
 * Literals such as numbers, strings, lists and also JavaScript expressions.
 * These literals may or may not require execution to obtain their value.
 */
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

Eden.AST.Literal.prototype.generate = function(ctx,scope, options) {
	var res;

	switch (this.datatype) {
	case "NUMBER"	:	res = this.value; break;
	case "LIST"		:	res = "[";
						// Loop over each element and generate that also.
						for (var i=0; i<this.value.length; i++) {
							res += this.value[i].generate(ctx,scope, {bound: false});
							if (i != this.value.length-1) res += ",";
						}
						res += "]";
						break;
	case "CHARACTER":
	case "STRING"	:	var str = this.value.replace(/\n/g,"\\n");
						res = "\""+str+"\""; break;
	case "BOOLEAN"	:	res = this.value; break;
	case "JAVASCRIPT"	: res = this.value; break;
	}

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

/**
 * Execute this literal to obtain its actual javascript value, particularly
 * important for lists and JavaScript expression literals.
 */
Eden.AST.Literal.prototype.execute = function(ctx, base, scope) {
	switch(this.datatype) {
	case "NUMBER"	:
	case "CHARACTER":
	case "BOOLEAN"	:	return eval(this.value);
	case "STRING"	:	return eval("\""+this.value+"\"");
	case "LIST"		:	var rhs = "(function(context,scope) { return ";
						rhs += this.generate(ctx, "scope", {bound: false});
						rhs += ";})";
						return eval(rhs)(eden.root,scope);
	case "JAVASCRIPT"	: return eval(this.value);
	}
}


//------------------------------------------------------------------------------

/**
 * Scope LHS Override Pattern.
 */

Eden.AST.ScopePattern = function() {
	this.type = "scopepattern";
	this.observable = "NONAME";
	this.components = [];
	this.errors = [];
}

Eden.AST.ScopePattern.prototype.error = fnEdenASTerror;

Eden.AST.ScopePattern.prototype.setObservable = function(obs) {
	this.observable = obs;
}

Eden.AST.ScopePattern.prototype.addListIndex = function(express) {
	this.components.push(express);
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}


/**
 * Scope node, as specified using "with" statement. This needs to store a bunch
 * of overrides and an expression to which these overrides are applied. It may
 * also contain range overrides and if this is the case the scope node range
 * property is set to true.
 */
Eden.AST.Scope = function() {
	this.type = "scope";
	this.errors = [];
	this.range = false;
	this.overrides = {};
	this.expression = undefined; // = new Eden.AST.Primary();
}

Eden.AST.Scope.prototype.error = fnEdenASTerror;

Eden.AST.Scope.prototype.prepend = function(extra) {
	this.primary.prepend(extra);
}

/*Eden.AST.Scope.prototype.setObservable = function(obs) {
	this.primary.setObservable(obs);
}

Eden.AST.Scope.prototype.getObservable = function() {
	return this.primary.getObservable();
}*/

/**
 * Set the LHS expression the scope overrides are to be applied to.
 */
Eden.AST.Scope.prototype.setExpression = function(express) {
	this.expression = express;
	// Bubble errors if there are any
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

/**
 * Add child nodes for an override. First parameter is a string observable
 * name that has been parsed, and second is the first override value and the
 * third is an optional second value for a range override. The second and third
 * parameters are AST nodes containing a literal or expression.
 */
Eden.AST.Scope.prototype.addOverride = function(obs, exp1, exp2, exp3, isin) {
	this.errors.push.apply(this.errors, obs.errors);
	if (isin) this.range = true;
	if (exp3) {
		this.range = true;
		this.overrides[obs.observable] = { start: exp1, end: exp3, increment: exp2, components: obs.components, isin: isin };
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
		this.errors.push.apply(this.errors, exp3.errors);
	} else if (exp2) {
		this.range = true;
		this.overrides[obs.observable] = { start: exp1, end: exp2, components: obs.components, isin: isin };
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
		this.errors.push.apply(this.errors, exp2.errors);
	} else if (exp1) {
		this.overrides[obs.observable] = { start: exp1, end: undefined, components: obs.components, isin: isin};
		// Bubble errors of child nodes
		this.errors.push.apply(this.errors, exp1.errors);
	}
}

Eden.AST.Scope.prototype.generateConstructor = function(ctx, scope) {
	var res;

	//if (ctx.scopes.length > 0) {
		res = "new Scope(context, "+scope+", [";
	//} else {
	//	res = "new Scope(context, scope, [";
	//}

	// Generate script for each override expression.
	for (var o in this.overrides) {
		var over = this.overrides[o];
		var startstr;
		// TODO Don't use main range
		if (this.range) {
			startstr = over.start.generate(ctx,scope,{bound: false});
		} else {
			startstr = over.start.generate(ctx,scope,{bound: over.start.type == "primary" || over.start.type == "scope"});
		}
		res += "new ScopeOverride(\""+o+"\", " + startstr;
		if (over.end) {
			var endstr = this.overrides[o].end.generate(ctx,scope, {bound: false});

			if (over.increment) {
				var incstr = over.increment.generate(ctx,scope, {bound: false});
				res += ", " + endstr + ", " + incstr + "),";
			} else {
				res += ", " + endstr + "),";
			}
		} else {
			res += ", undefined, undefined, "+over.isin+"),";
		}
	}
	// remove last comma
	res = res.slice(0,-1);

	res += "], "+this.range+", this,true)"; //context.lookup(\""+this.primary.getObservable()+"\"))";
	return res;
}

Eden.AST.Scope.prototype.generate = function(ctx, scope, options) {
	// Add the scope generation string the the array of scopes in this context
	ctx.scopes.push(this.generateConstructor(ctx,scope));
	if (this.range) {
		var scopename = "_scopes["+(ctx.scopes.length-1)+"]";
		var express = this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"].clone()",options);
		var res = "(function() {\n";
		res += scopename + ".range = false;\n";
		res += "var results = [];\n";
		res += "var scoperesults = [];\n";
		res += "while(true) {\n";
		res += "var val = "+express;
		if (options.bound) {
			//res += ".value";
			res += ";\n\tif (val.value !== undefined) scoperesults.push(val.scope);\n\tval = val.value";
		}
		res += ";\n";
		res += "if (val !== undefined) results.push(val);\n";
		res += "if ("+scopename+".next() == false) break;\n";
		res += "}\n"+scopename+".range = true;\n";

		if (options.bound) {
			res += "if (cache) cache.scopes = scoperesults;\n return new BoundValue(results,"+scopename+");}).call(this)";
			//res += "if (cache) cache.scopes = scoperesults;\n return results;})()";
		} else {
			res += "return results;}).call(this)";
		}
		return res;
	} else {
		// Return the expression using the newly generated scope.
		return this.expression.generate(ctx,"_scopes["+(ctx.scopes.length-1)+"]", options);
	}
}


//------------------------------------------------------------------------------

/**
 * An individual list index. Usually this is some expression that needs to have
 * its value adjusted from js-eden 1 base to 0 base.
 */
Eden.AST.Index = function() {
	this.type = "index";
	this.expression = undefined;
	this.errors = [];
}

Eden.AST.Index.prototype.setExpression = function(express) {
	this.expression = express;
	// Bubble the errors
	if (express.errors.length > 0) {
		this.errors.push.apply(this.errors,express.errors);
	}
}

Eden.AST.Index.prototype.generate = function(ctx, scope, options) {
	var ix = this.expression.generate(ctx, scope, {bound: false});
	// Return final string with -1 adjustment applied.
	return "[rt.index("+ix+")]";
}

Eden.AST.Index.prototype.error = fnEdenASTerror;


//------------------------------------------------------------------------------

/**
 * A Dot notation scope path structure. There is a scope on the left, applied
 * to some primary observable name on the right. Most functions in this node
 * forward on to children.
 */
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

Eden.AST.ScopePath.prototype.setBackticks = function(btick) {
	this.path.setBackticks(btick);
}

Eden.AST.ScopePath.prototype.getObservable = function() {
	return this.primary.getObservable();
}

Eden.AST.ScopePath.prototype.getScopeString = function() {
	return this.scopestr;
}

Eden.AST.ScopePath.prototype.setPrimary = function(prim) {
	this.primary = prim;
	// Bubble errors from children
	if (this.primary.errors.length > 0) {
		this.errors.push.apply(this.errors, prim.errors);
	}
}

Eden.AST.ScopePath.prototype.generate = function(ctx, scope, options) {
	// Add scope to list of scopes in the context
	//console.log(ctx);
	//ctx.scopes.push(this.path.generate(ctx, scope, true)+".scope");
	var path = this.path.generate(ctx, scope, {bound: true, scopeonly: true})
	//this.scopestr = "_scopes[" + (ctx.scopes.length-1) + "]";
	// And then use that scope to access the primary.
	//return this.primary.generate(ctx, "_scopes["+(ctx.scopes.length-1)+"]");
	return this.primary.generate(ctx, path, options);
}

Eden.AST.ScopePath.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

/**
 * Dollar numeric action parameters as used in expressions.
 */
Eden.AST.Parameter = function(index) {
	this.type = "parameter";
	this.index = index;
	this.errors = [];

	console.error("DEPRECATED PARAMETER");
}

Eden.AST.Parameter.prototype.error = fnEdenASTerror;

Eden.AST.Parameter.prototype.generate = function(ctx, scope, options) {
	var res;

	// If -1 then get the number of parameters available.
	if (this.index == -1) {
		if (ctx && ctx.parameters) return ""+ctx.parameters.length;
		this.returnsbound = false;
		res = "0";
	} else {
		if (ctx && ctx.parameters) {
			// An action cannot be compiled if it uses action parameters...
			ctx.dirty = true;
			// Search the context for this parameter to determine scope binding
			var res = ctx.parameters[this.index-1];
			if (res instanceof BoundValue) this.returnsbound = true;
			else this.returnsbound = false;
			//return ""+res;
			// Generate run-time code to obtain parameters value.
			return "ctx.parameters["+this.index+"-1]";
		}
	}
}



//------------------------------------------------------------------------------

/**
 * Unary Operators.
 */
Eden.AST.UnaryOp = function(op, right) {
	this.type = "unaryop";
	this.op = op;
	this.errors = right.errors;
	this.r = right;
}
Eden.AST.UnaryOp.prototype.error = fnEdenASTerror;

Eden.AST.UnaryOp.prototype.generate = function(ctx, scope, options) {
	var r = this.r.generate(ctx, scope, {bound: false, usevar: options.usevar});
	var res;	

	if (this.op == "!") {
		res = "!("+r+")";
	} else if (this.op == "&") {
		res = "context.lookup("+r+")";
		console.log(res);
	} else if (this.op == "-") {
		res = "-("+r+")";
	} else if (this.op == "*") {
		res = r + ".value("+scope+")";
	}

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
}

Eden.AST.UnaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}



//------------------------------------------------------------------------------

Eden.AST.TernaryOp = function(op) {
	this.type = "ternaryop";
	this.op = op;
	this.errors = [];
	this.first = undefined;
	this.second = undefined;
	this.condition = undefined;
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

Eden.AST.TernaryOp.prototype.generate = function(ctx, scope, options) {
	var cond = this.condition.generate(ctx, scope, {bound: false, usevar: options.usevar});
	var first = this.first.generate(ctx, scope, options);
	var second = this.second.generate(ctx, scope, options);

	return "(("+cond+")?("+first+"):("+second+"))";
}

Eden.AST.TernaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope",{bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
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

Eden.AST.BinaryOp.prototype.generate = function(ctx, scope, options) {
	var opts = {bound: false, usevar: options.usevar};
	var left = this.l.generate(ctx, scope, opts);
	var right = this.r.generate(ctx, scope, opts);
	var opstr;

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

	var res;
	if (opstr != "RAW") {
		res = "rt."+opstr+"(("+left+"),("+right+"))";
	} else {
		res = "(" + left + ") " + this.op + " (" + right + ")";
	}

	if (options.bound) {
		return "new BoundValue("+res+", "+scope+")";
	} else {
		return res;
	}
}

Eden.AST.BinaryOp.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope",{bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
}



//------------------------------------------------------------------------------

Eden.AST.Length = function() {
	this.type = "length";
	this.errors = [];
	this.l = undefined;
}

Eden.AST.Length.prototype.left = fnEdenASTleft;

Eden.AST.Length.prototype.error = fnEdenASTerror;

Eden.AST.Length.prototype.generate = function(ctx, scope, options) {
	var left = this.l.generate(ctx, scope, {bound: false, usevar: options.usevar});

	if (options.bound) {
		return "new BoundValue(rt.length("+left+"), "+scope+")";
	} else {
		return "rt.length(" + left + ")";
	}
}

Eden.AST.Length.prototype.execute = function(ctx, base, scope, agent) {
	return rt.length(this.l.execute(ctx,base,scope,agent));
}


//------------------------------------------------------------------------------
//
// END OF EXPRESSIONS, START OF STATEMENTS
//
//------------------------------------------------------------------------------

Eden.AST.LValue = function() {
	this.type = "lvalue";
	this.errors = [];
	this.name = undefined;
	this.express = undefined;
	this.primary = undefined;
	this.lvaluep = undefined;
	this.islocal = false;
};

Eden.AST.LValue.prototype.error = fnEdenASTerror;


Eden.AST.LValue.prototype.setExtras = function(extras) {
	this.lvaluep = extras;
	if (extras) {
		for (var i = 0; i < extras.length; i++) {
			this.errors.push.apply(this.errors, extras[i].errors);
		}
	}
}


Eden.AST.LValue.prototype.setObservable = function(name) {
	this.name = name;
}

Eden.AST.LValue.prototype.setPrimary = function(primary) {
	this.primary = primary;
	if (primary && primary.errors.length > 0) {
		this.errors.push.apply(this.errors, primary.errors);
	}
}

Eden.AST.LValue.prototype.setExpression = function(express) {
	this.express = express;
	if (express && express.errors.length > 0) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

Eden.AST.LValue.prototype.getSymbol = function(ctx, base, scope) {
	if (ctx && ctx.locals && ctx.locals.type != "declarations" && ctx.locals.hasOwnProperty(this.name)) {
		this.islocal = true;
		return ctx.locals[this.name];
	}

	if (this.name) return eden.root.lookup(this.name);

	if (this.primary) {
		var sym = this.primary.execute(ctx,base,scope);
		if (sym instanceof BoundValue) sym = sym.value;
		return sym;
	}
	if (this.express) {
		//console.log(this.express);
		var name = this.express.execute(ctx,base,scope);
		//console.log(name);
		if (name instanceof BoundValue) name = name.value;
		return eden.root.lookup(name);
	}
}


Eden.AST.LValue.prototype.hasListIndices = function() {
	return this.lvaluep && this.lvaluep.length > 0 && this.lvaluep[0].kind == "index";
}

Eden.AST.LValue.prototype.generateCompList = function(ctx, scope) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += "rt.index("+this.lvaluep[i].indexexp.generate(ctx,scope,{bound:false})+")";
		if (i < this.lvaluep.length-1) res += ",";
	}
	res += "]";
	return res;
}

Eden.AST.LValue.prototype.generateIndexList = function(ctx, scope) {
	var res = "[";
	for (var i=0; i<this.lvaluep.length; i++) {
		res += "rt.index("+this.lvaluep[i].indexexp.generate(ctx,scope,{bound: false})+")";
		if (i < this.lvaluep.length-1) res += "][";
	}
	res += "]";
	return res;
}

Eden.AST.LValue.prototype.generateIdStr = function() {
	return "\""+this.generateCompList()+"\"";
}

Eden.AST.LValue.prototype.executeCompList = function(ctx, scope) {
	var res = [];
	for (var i=0; i<this.lvaluep.length; i++) {
		if (this.lvaluep[i].kind == "index") {
			var iexp = this.lvaluep[i].indexexp.generate(ctx, "scope", {bound: false});
			res.push(rt.index(eval("(function(context,scope) { return "+iexp+"; })")(eden.root,scope)));
		}
	}
	return res;
}

Eden.AST.LValue.prototype.generate = function(ctx, scope) {
	if (this.name) {
		if (ctx && ctx.locals) {
			if (ctx.locals.type == "declarations" && ctx.locals.list.indexOf(this.name) != -1) {
				this.islocal = true;
				var res = this.name;
				for (var i=0; i<this.lvaluep.length; i++) {
					res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
				}
				return res;
			} else if (ctx.locals.hasOwnProperty(this.name)) {
				this.islocal = true;
				var res = this.name;
				for (var i=0; i<this.lvaluep.length; i++) {
					res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
				}
				return res;
			}
		}
		if (ctx && ctx.params && ctx.params.list.indexOf(this.name) != -1) {
			this.islocal = true;
			var res = this.name;
			for (var i=0; i<this.lvaluep.length; i++) {
				res += this.lvaluep[i].generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
			}
			return res;
		}

		return "\"" + this.name + "\"";
	}

	if (this.primary) return this.primary.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
	if (this.express) return this.express.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});

	// TODO: Pointer dependencies currently causing huge page redraw problems.
	//if (ctx && ctx.dependencies) {
	//	ctx.dependencies[this.observable] = true;
	//}
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

Eden.AST.LValueComponent.prototype.generate = function(ctx, scope) {
	if (this.kind == "index") {
		return "[rt.index("+this.indexexp.generate(ctx, scope, {bound: false})+")]";
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

	console.error("DEPRECATED USE OF AFTER");
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
	var statement = "(function() {" + this.statement.generate(ctx, scope, {bound: false})+"})";
	var express = this.expression.generate(ctx,scope,{bound: false});
	return "setTimeout("+statement+", "+express+");\n";
}

Eden.AST.After.prototype.execute = function(ctx, base, scope) {
	var statement = "(function() { var scope = eden.root.scope;\n" + this.statement.generate(ctx, "root.scope")+"})";
	setTimeout(eval(statement),this.expression.execute(ctx,base,scope));
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
	return "edenUI.loadPlugin("+this.expression.generate(ctx, "scope",{bound: false})+");";
}

Eden.AST.Require.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	edenUI.loadPlugin(this.expression.execute(ctx, base, scope));
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

	console.error("DEPRECATED USE OF INCLUDE");
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

Eden.AST.Include.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	eden.root.base.include2(this.expression.execute(ctx, base, scope));
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
	this.tag = "default";
	this.line = undefined;
}

Eden.AST.Import.prototype.setPath = function(path) {
	this.path = path;
}

Eden.AST.Import.prototype.setTag = function(tag) {
	this.tag = tag;
}

/**
 * Checks the validity of options being added and prevents conflicting
 * combinations.
 */
Eden.AST.Import.prototype.addOption = function(opt) {
	if (opt == "local") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return true;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return false;
	} else if (opt == "remote") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return true;
		if (this.options.indexOf("rebase") >= 0) return false;
	}  else if (opt == "rebase") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return true;
	}  else if (opt == "noexec") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("noexec") >= 0) return true;
		if (this.options.indexOf("force") >= 0) return false;
	}  else if (opt == "force") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("noexec") >= 0) return false;
		if (this.options.indexOf("force") >= 0) return true;
	} else if (opt == "remove") {
		if (this.options.length > 0) return false;
		//return true;
	}

	this.options.push(opt);
	return true;
}

/*Eden.AST.Import.prototype.generate = function(ctx) {
	return "Eden.Agent.importAgent(\""+this.path+"\");";
}*/

/*Eden.AST.Import.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	var me = this;

	if (eden.peer && agent && !agent.loading) eden.peer.imports(this.path, this.tag, this.options);

	Eden.Agent.importAgent(this.path, this.tag, this.options, function(ag, msg) {
		if (ag) {
			for (var i=0; i<base.imports.length; i++) {
				if (base.imports[i] === ag) return;
			}
			base.imports.push(ag);
		} else {
			me.executed = 3;
			me.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.NOAGENT, me, "\""+me.path+"@"+me.tag+"\" does not exist: "+msg));
			if (me.parent) me.parent.executed = 3;
		}
	});
}*/

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

Eden.AST.Append.prototype.generate = function(ctx, scope) {
	var express = this.index.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);

	if (this.destination.islocal) {
		return lvalue + ".push("+express+");\n";
	} else {
		return scope + ".mutate("+lvalue+", function(s) { scope.lookup(s.name).value.push("+express+"); }, this);";
	}
}

Eden.AST.Append.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	var val = this.index.execute(ctx,base, scope);
	if (val instanceof BoundValue) val = val.value;
	/*eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().push(val);
	}, undefined);*/

	var sym = eden.root.lookup(this.destination.name);
	var val2 = sym.value(scope);
	val2.push(val);
	//console.log("VALUE: ", sym.value(scope));
	sym.assign(val2, scope, agent);
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

Eden.AST.Insert.prototype.generate = function(ctx, scope) {
	var ix = this.index.generate(ctx, scope, {bound: false});
	var val = this.value.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);
	if (this.destination.islocal) {
		return lvalue + ".splice(rt.index("+ix+"), 0, ("+val+"));";
	} else {
		return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(rt.index("+ix+"), 0, ("+val+")); }, this);";
	}
}

Eden.AST.Insert.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	var ix = this.index.execute(ctx,base,scope);
	var val = this.value.execute(ctx,base,scope);
	if (ix instanceof BoundValue) ix = ix.value;
	if (val instanceof BoundValue) val = val.value;
	eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 0, val);
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

Eden.AST.Delete.prototype.generate = function(ctx,scope) {
	var ix = this.index.generate(ctx, scope, {bound: false});
	var lvalue = this.destination.generate(ctx);
	return lvalue + ".mutate(scope, function(s) { scope.lookup(s.name).value.splice(rt.index("+ix+"), 1); }, this);";
}

Eden.AST.Delete.prototype.execute = function(ctx, base, scope) {
	this.executed = 1;
	var ix = this.index.execute(ctx,base,scope);
	if (ix instanceof BoundValue) ix = ix.value;
	eden.root.lookup(this.destination.name).mutate(scope, function(s) {
		s.value().splice(ix-1, 1);
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
	this.locals = undefined;
	this.params = undefined;
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

Eden.AST.Definition.prototype.generateDef = function(ctx,scope) {
	var dobound = (this.expression.type == "primary" && this.expression.extras.length == 0) || this.expression.type == "scope";
	var result = "function(context, scope, cache) {\n";
	this.locals = (ctx) ? ctx.locals : undefined;
	this.params = (ctx) ? ctx.params : undefined;
	var express = this.expression.generate(this, "scope", {bound: dobound, indef: true});

	// Generate array of all scopes used in this definition (if any).
	if (this.scopes.length > 0) {
		result += "\tvar _scopes = [];\n";
		for (var i=0; i<this.scopes.length; i++) {
			result += "\t_scopes.push(" + this.scopes[i];
			result += ");\n";
			result += "if (this.def_scope) { _scopes["+i+"].cache = this.def_scope["+i+"].cache; _scopes["+i+"].reset(); } else _scopes["+i+"].rebuild();\n";
		}

		result += "this.def_scope = _scopes;\n";
	}

	if (dobound) {
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

	//console.log(result);
	
	return result;
}

Eden.AST.Definition.prototype.generate = function(ctx,scope) {
	var result = this.lvalue.generate(ctx,scope);
	this.scopes = [];
	this.dependencies = {};

	if (this.lvalue.islocal) {
		// TODO Report error, this is invalid;
		return "";
	} else if (this.lvalue.hasListIndices()) {
		var clist = this.lvalue.generateIndexList(this, scope);
		result += ".addExtension("+this.lvalue.generateIdStr()+", function(context, scope, value) {\n\tvalue";
		result += clist + " = ";
		result += this.expression.generate(this, "scope", {bound: false});

		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}

		result = result + ";\n}, undefined, this, "+JSON.stringify(deps);
		result += ");\n";
		return result;
	} else {
	 	result = scope+".define(" +result+"," + this.generateDef(ctx, scope);
		var deps = [];
		for (var d in this.dependencies) {
			deps.push(d);
		}
		result = result + ", this, "+JSON.stringify(deps)+");\n";
		return result;
	}
};

Eden.AST.Definition.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	//console.log("RHS = " + rhs);
	var source = base.getSource(this);
	var sym = this.lvalue.getSymbol(ctx,base,scope);
	var rhs;

	this.scopes = [];
	this.dependencies = {};
	this.backtickCount = 0;

	//if (eden.peer) eden.peer.broadcast(source);

	if (this.doxyComment) {
		//eden.dictionary[this.lvalue.name] = this.doxyComment;
		eden.updateDictionary(this.lvalue.name, this.doxyComment);
	}

	try {
		if (this.lvalue.hasListIndices()) {
			rhs = "(function(context,scope,value) { value";
			rhs += this.lvalue.generateIndexList(this, "scope") + " = ";
			rhs += this.expression.generate(this, "scope", {bound: false});
			rhs += ";})";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}
			sym.addExtension(this.lvalue.generateIdStr(), eval(rhs), source, undefined, deps);
		} else {
			rhs = "("+this.generateDef(ctx)+")";
			var deps = [];
			for (var d in this.dependencies) {
				deps.push(d);
			}
			sym.eden_definition = base.getSource(this);
			//if (agent === undefined) {
			//	console.trace("UNDEF AGENT: " + source);
			//}
			console.log("DEF",rhs);
			sym.define(eval(rhs), agent, deps, rhs);
		}
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
		Eden.Agent.emit("error", [agent,this.errors[this.errors.length-1]]);
	}	
}

Eden.AST.Definition.prototype.error = fnEdenASTerror;

//------------------------------------------------------------------------------


Eden.AST.Range = function(expression) {
	this.type = "range";
	this.parent = undefined;
	this.errors = (expression) ? expression.errors : [];
	this.expression = expression;
	this.lvalue = undefined;
	this.start = 0;
	this.end = 0;
	//this.scopes = [];
	//this.backtickCount = 0;
	//this.executed = 0;
	//this.compiled = undefined;
	//this.dirty = false;
	//this.value = undefined;
	//this.dependencies = {};
	//this.bound = false;
};

Eden.AST.Range.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Range.prototype.setSecond = function(expr) {
	this.second = expr;
	if (expr && expr.errors) this.errors.push.apply(this.errors, expr.errors);
}

Eden.AST.Range.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Range.prototype.error = fnEdenASTerror;



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
	//this.def_scope = undefined;
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

Eden.AST.Assignment.prototype.generate = function(ctx,scope) {
	var result = this.lvalue.generate(ctx);

	if (this.lvalue.islocal) {
		result += " = ";
		result += this.expression.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
		result += ";\n";
		return result;
	} else if (this.lvalue.hasListIndices()) {
		result = scope+".listAssign("+result+",";
		result += this.expression.generate(ctx, scope, {bound: false, usevar: ctx.type == "scriptexpr"});
		result += ", this, false, ";
		result += this.lvalue.generateCompList(ctx, scope);
		result += ");\n";
		return result;
	} else {
		result = scope+".assign("+result+",";
		result += this.expression.generate(ctx, scope,{bound: false, usevar: ctx.type == "scriptexpr"});
		result += ", this);\n"
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
				sym.listAssign(this.value, scope, agent, false, complist);
			} else {
				this.value = this.compiled.call(sym,eden.root,scope,sym.cache,ctx);
				sym.assign(this.value,(this.lvalue.islocal) ? undefined : scope, agent);
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
		if (agentobj) Eden.Agent.emit("error", [agentobj,err]);
		else console.log(err.prettyPrint());
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
	this.scopes = [];
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

Eden.AST.Modify.prototype.generate = function(ctx, scope) {
	var lval = this.lvalue.generate(ctx);
	var result = lval;

	if (this.lvalue.islocal == false) result = scope+".assign("+lval+","+scope+".value("+lval+")";
	else result += " = " + lval;

	var express;
	if (this.expression) {
		express = this.expression.generate(ctx,scope,{bound: false});
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
		result = result + ", this);\n";
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

			/*console.log(_scopes);
			console.log(this.scopes);
			console.log(rhs);*/

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



//------------------------------------------------------------------------------

Eden.AST.Subscribers = function() {
	this.type = "subscribers";
	this.errors = [];
	this.list = [];
	this.lvalue = undefined;
	this.start = undefined;
	this.end = undefined;
};

Eden.AST.Subscribers.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Subscribers.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Subscribers.prototype.execute = function(ctx, base, scope) {
	
}

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

Eden.AST.Primary.prototype.prepend = function(extra) {
	this.extras.unshift(extra);
	if (extra.type == "functioncall") {
		this.returnsbound = false;
	}
	if (extra.errors.length > 0) {
		this.errors.push.apply(this.errors, extra.errors);
	}
};

Eden.AST.Primary.prototype.generate = function(ctx, scope, options) {
	var res;

	// Check if this primary is a local variable.
	if (ctx && ctx.locals) {
		if (ctx.locals.type == "declarations") {
			if (ctx.locals.list.indexOf(this.observable) != -1) {
				console.log("OUT OF DATE DECLARATIONS");
				res = this.observable;
				for (var i=0; i<this.extras.length; i++) {
					res += this.extras[i].generate(ctx, scope, {bound: false});
				}
				if (options.bound) {
					return "new BoundValue("+res+","+scope+")";
				} else {
					return res;
				}
			}
		} else if (ctx.locals.hasOwnProperty(this.observable)) {
			//console.log("FOUND LOCAL",this.observable);
			// Otherwise we need to eval the value and embed it
			// TODO only if ctx is of type definition??
			ctx.dirty = true;
			if (options.usevar) {
				res = this.observable;
			} else if (options.indef) {
				res = JSON.stringify(ctx.locals[this.observable].value()); //"ctx.locals[\""+this.observable+"\"]";
			} else {
				res = ctx.locals[this.observable].value();
			}
			for (var i=0; i<this.extras.length; i++) {
				res += this.extras[i].generate(ctx, scope, {bound: false});
			}

			if (options.bound) {
				return "new BoundValue("+res+","+scope+")";
			} else {
				return res;
			}
		}
	}

	// Check if this primary is a parameter.
	if (ctx && ctx.params) {
		var ix = ctx.params.list.indexOf(this.observable);
		if (ix != -1) {
			res = this.observable;
			for (var i=0; i<this.extras.length; i++) {
				res += this.extras[i].generate(ctx, scope, {bound: false});
			}

			if (options.bound) {
				return "new BoundValue("+res+","+scope+")";
			} else {
				return res;
			}
		}
	}

	if (this.observable == "__BACKTICKS__") {
		var id = 0;
		if (ctx && ctx.backtickCount !== undefined) {
			id = ctx.backtickCount;
			ctx.backtickCount++;
		}
		if (ctx && ctx.type == "definition") {
			res = "this.subscribeDynamic(" + id + "," + this.backtick.generate(ctx, scope,{bound: false, usevar: options.usevar})+")";
		} else {
			res = this.backtick.generate(ctx,scope, {bound: false, usevar: options.usevar});
		}
		//console.log("BTICK: ",res);
	} else {
		if (ctx && ctx.dependencies) ctx.dependencies[this.observable] = true;
		res = "\""+this.observable+"\"";
	}

	if (this.extras.length == 0) {
		if (!options.bound) {
			res = scope+".value("+res+")";
		} else {
			if (options.scopeonly) {
				res = scope+".scope("+res+")";
			} else {
				res = scope+".boundValue("+res+")";
			}
		}
	} else {
		//if (!options.bound) {
			res = scope+".value("+res+")";
		//} else {
		//	res += ".boundValue("+scope+",";
		//}

		for (var i=0; i<this.extras.length; i++) {
			res += this.extras[i].generate(ctx, scope,{bound: false, usevar: options.usevar});
		}

		//if (options.bound) res += ")";

		if (options.bound) {
			res = "new BoundValue("+res+","+scope+")";
		}
	}

	return res;
}

Eden.AST.Primary.prototype.execute = function(ctx, base, scope) {
	var rhs = "(function(context,scope) { return ";
	rhs += this.generate(ctx, "scope", {bound: false});
	rhs += ";})";
	return eval(rhs)(eden.root,scope);
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
		statement.parent = this;
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.setElse = function(statement) {
	this.elsestatement = statement;
	if (statement) {
		statement.parent = this;
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.generate = function(ctx, scope) {
	var res = "if (";
	res += this.condition.generate(ctx, scope,{bound: false});
	res += ") ";
	res += this.statement.generate(ctx, scope) + " ";
	if (this.elsestatement) {
		res += "\nelse " + this.elsestatement.generate(ctx, scope) + "\n";
	}
	return res;
}

Eden.AST.If.prototype.getCondition = function(ctx) {
	var cond = "(function(context,scope,ctx) { return ";
	cond += this.condition.generate(ctx, "scope",{bound: false});
	cond += ";})";
	return eval(cond);
}

Eden.AST.If.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	
	if (this.getCondition(ctx)(eden.root,scope,ctx)) {
		return [this.statement];
	} else {
		this.executed = 2;
		if (this.elsestatement) {
			return [this.elsestatement];
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
	this.line = undefined;
	this.compiled = undefined;
};

Eden.AST.Switch.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Switch.prototype.setExpression = function(expression) {
	this.expression = expression;
	if (expression) this.errors.push.apply(this.errors, expression.errors);
};

Eden.AST.Switch.prototype.setStatement = function(statement) {
	this.statement = statement;
	this.errors.push.apply(this.errors, statement.errors);
};

Eden.AST.Switch.prototype.generate = function(ctx, scope) {
	if (scope === undefined) scope = "eden.root.scope";
	var res = "switch(";
	res += this.expression.generate(ctx,scope,{bound: false});
	res += ") " + this.statement.generate(ctx,scope);
	return res;
};

Eden.AST.Switch.prototype.getSelector = function(ctx) {
	if (this.compiled) return this.compiled;

	var cond = "(function(context,scope) { return ";
	cond += this.expression.generate(ctx, "scope",{bound: false});
	cond += ";})";
	this.compiled = eval(cond);
	return this.compiled;
}

Eden.AST.Switch.prototype.execute = function(ctx, base, scope, agent) {
	// TODO REWORK FOR NEW EXECUTION PROCESS
	/*var swi = "(function(context,scope) { ";
	swi += this.generate(ctx, "scope");
	swi += " })";
	eval(swi)(eden.root, scope);*/

	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Switch not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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
	this.line = undefined;
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
				var express = this.params[i].generate(ctx, scope, {bound: false});
				res += "("+express+")";
				if (i != this.params.length-1) res += ",";
			}
		}
		return res + ")";
	} else {
		var lvalstr = this.lvalue.generate(ctx);
		var res = scope + ".value("+lvalstr+").call("+lvalstr;
		if (this.params) {
			for (var i=0; i<this.params.length; i++) {
				res += ",";
				var express = this.params[i].generate(ctx, scope,{bound: false});
				res += "("+express+")";
				//if (i != this.params.length-1) res += ",";
			}
		}
		return res + ");";
	}
}

Eden.AST.FunctionCall.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	var func = "(function(context,scope) { return " + this.generate(ctx, "scope") + "; })";

	try {
		return eval(func).call(ctx,eden.root,scope);
	} catch(e) {
		var err = new Eden.RuntimeError(base, Eden.RuntimeError.FUNCCALL, this, e);
		this.errors.push(err);
		err.line = this.line;
		Eden.Agent.emit("error", [agent,err]);
		//throw e;
	}
}

Eden.AST.FunctionCall.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.DummyStatement = function() {
	this.type = "dummy";
	this.parent = undefined;
	this.errors = [];
	
}

Eden.AST.DummyStatement.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.DummyStatement.prototype.generate = function() {
	return "";
}

Eden.AST.DummyStatement.prototype.execute = function() {
}

Eden.AST.DummyStatement.prototype.error = fnEdenASTerror;



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
	this.line = undefined;
	this.doxyComment = undefined;
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
	if (body) {
		body.parent = this;
		this.errors.push.apply(this.errors, body.errors);
	}
}

Eden.AST.Action.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"})";
	if (this.triggers.length > 0) {
		res += ".observe("+JSON.stringify(this.triggers)+");\n";
	}
	return res;
}

Eden.AST.Action.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx);
	var sym = eden.root.lookup(this.name);
	sym.eden_definition = base.getSource(this);
	if (this.triggers.length > 0) {
		sym.define(eval(body), agent, []).observe(this.triggers);
	} else {
		sym.define(eval(body), agent, []);
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
	this.doxyComment = undefined;
};

Eden.AST.Function.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Function.prototype.setBody = function(body) {
	this.body = body;
	if (body) {
		body.parent = this;
		this.errors.push.apply(this.errors, body.errors);
	}
}

Eden.AST.Function.prototype.generate = function(ctx) {
	var body = this.body.generate(ctx);
	var res = "context.lookup(\""+this.name+"\").define("+body+", {name: \"execute\"}, []);\n";
	return res;
}

Eden.AST.Function.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;

	if (this.doxyComment) {
		//eden.dictionary[this.name] = this.doxyComment;
		eden.updateDictionary(this.name, this.doxyComment);
	}

	var body = this.body.generate(ctx);
	var sym = eden.root.lookup(this.name);
	sym.eden_definition = base.getSource(this);	
	sym.define(eval(body), agent,[]);
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

Eden.AST.Return.prototype.generate = function(ctx,scope) {
	if (this.result) {
		var res = this.result.generate(ctx, scope,{bound: false, usevar: ctx.type == "scriptexpr"});
		return "return " + res + ";\n";
	} else {
		return "return;\n";
	}
}

Eden.AST.Return.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Return not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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
	this.line = undefined;
	this.compiled = undefined;
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

Eden.AST.While.prototype.generate = function(ctx, scope) {
	var res = "while (" + this.condition.generate(ctx,scope,{bound: false});
	res += ") ";
	res += this.statement.generate(ctx, scope) + "\n";
	return res;
}

Eden.AST.While.prototype.getCondition = function(ctx) {
	if (this.compiled) {
		return this.compiled;
	} else {
		var express = this.condition.generate(ctx, "scope", {bound: false});
		var expfunc = eval("(function(context,scope){ return " + express + "; })");
		this.compiled = expfunc;
		return expfunc;
	}
}

Eden.AST.While.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	// A tail recursive while loop...
	if (this.getCondition(ctx)(eden.root,scope)) {
		return [this.statement, this];
	}
}



//------------------------------------------------------------------------------

Eden.AST.Do = function() {
	this.type = "do";
	this.parent = undefined;
	this.errors = [];
	/*this.condition = undefined;
	this.statement = undefined;*/
	this.name = undefined;
	this.script = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.parameters = [];
	this.params = []; // The evaluated params
	this.scope = undefined;
	this.compScope = undefined;
	this.nscope = undefined;
	this.selector = undefined;
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

Eden.AST.Do.prototype.setScript = function(script) {
	this.script = script;
	if (this.script && this.script.errors.length > 0) {
		this.errors.push.apply(this.errors, script.errors);
	}
}

Eden.AST.Do.prototype.setName = function(name) {
	this.name = name;
}

Eden.AST.Do.prototype.setScope = function(scope) {
	this.scope = scope;
	if (scope && scope.errors.length > 0) {
		this.errors.push.apply(this.errors, scope.errors);
	}
}

Eden.AST.Do.prototype.getScope = function(ctx) {
	if (this.scope && this.compScope === undefined) {
		try {
			this.compScope = eval("(function (context, scope) { var s = " + this.scope.generateConstructor(ctx, "scope") + "; s.rebuild(); return s; })");
		} catch (e) {

		}
	}
	return this.compScope;
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

Eden.AST.Do.prototype.getParameters = function(ctx,base,scope) {
	var params = [];
	for (var i=0; i<this.parameters.length; i++) {
		params.push(this.parameters[i].execute(ctx,base,scope));
	}
	return params;
}


Eden.AST.Do.prototype.execute = function(ctx,base,scope, agent) {
	this.executed = 1;

	var script;
	if (this.script) {
		script = this.script;
	} else {
		script = base.getActionByName(this.name);
	}

	if (script) {
		return script.execute(ctx,base, scope, agent);
	} else {
		this.executed = 3;
		var err = new Eden.RuntimeError(base, Eden.RuntimeError.ACTIONNAME, this, "Action '"+this.name+"' does not exist");
		if (this.parent) this.parent.executed = 3;
		err.line = this.line;
		this.errors.push(err);
		Eden.Agent.emit("error", [agent,err]);
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
	this.line = undefined;
	this.compiled = undefined;
	this.started = false;
	this.list = undefined;
	this.index = 0;
	this.dirty = false;
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

Eden.AST.For.prototype.generate = function(ctx,scope) {
	var res = "for (";
	if (this.sstart) {
		res += this.sstart.generate(ctx,scope) + " ";
	} else res += "; ";
	if (this.condition) {
		res += this.condition.generate(ctx, "scope",{bound: false, usevar: ctx.type == "scriptexpr"}) + "; ";
	} else res += "; ";
	var incer = this.inc.generate(ctx,scope);
	if (incer.charAt(incer.length-2) == ";") incer = incer.slice(0,-2);
	res += incer + ")\n";
	res += this.statement.generate(ctx,scope);
	return res;
}

Eden.AST.For.prototype.getCondition = function(ctx) {
	if (this.compiled && this.dirty == false) {
		return this.compiled;
	} else {
		var express = this.condition.generate(ctx, "scope",{bound: false, usevar: ctx.type == "scriptexpr"});
		if (ctx.dirty) {
			this.dirty = true;
			ctx.dirty = false;
		}

		var expfunc = eval("(function(context,scope){ return " + express + "; })");
		this.compiled = expfunc;
		return expfunc;
	}
}

Eden.AST.For.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	if (this.sstart && this.sstart.type == "range") {
		if (this.list === undefined) {
			if (this.sstart.second) {
				this.index = this.sstart.expression.execute(ctx,base,scope,agent);
				this.list = this.sstart.second.execute(ctx,base,scope,agent);
				if (this.index instanceof BoundValue) this.index = this.index.value;
				if (this.list instanceof BoundValue) this.list = this.list.value;
			} else {
				this.list = this.sstart.expression.execute(ctx,base,scope,agent);
				this.index = 0;
			}
		}
		var sym = this.sstart.lvalue.getSymbol(ctx,base,scope); //root.lookup(this.sstart.lvalue.getSymbol);

		if (this.sstart.second) {
			if (this.index <= this.list) {
				sym.assign(this.index, scope, agent);
				this.index++;
				return [this.statement, this];
			} else {
				this.index = 0;
				this.list = undefined;
				return;
			}
		} else if (Array.isArray(this.list)) {
			//for (var i=0; i<this.list.length; i++) {
			if (this.index < this.list.length) {
				if (this.list[this.index] instanceof BoundValue) {
					sym.assign(this.list[this.index].value,scope,agent);
					var cache = scope.lookup(sym.name);
					if (cache) cache.scope = this.list[this.index].scope;
					//console.log(cache);
				} else {
					sym.assign(this.list[this.index],scope,agent);
				}
				this.index++;
				return [this.statement, this];
			} else {
				this.index = 0;
				this.list = undefined;
				return;
			}
		} else if (this.list instanceof BoundValue) {
			if (this.index < this.list.value.length) {
				if (this.list.scopes) {
					sym.assign(this.list.value[this.index],scope,agent);
					var cache = scope.lookup(sym.name);
					if (cache) cache.scope = this.list.scopes[this.index];
				} else {
					if (this.list.value[this.index] instanceof BoundValue) {
						sym.assign(this.list.value[this.index].value,scope,agent);
						var cache = scope.lookup(sym.name);
						if (cache) cache.scope = this.list.value[this.index].scope;
						//console.log(cache);
					} else {
						sym.assign(this.list.value[this.index],scope,agent);
						var cache = scope.lookup(sym.name);
						if (cache) cache.scope = this.list.scope;
					}
				}
				this.index++;
				return [this.statement, this];
			} else {
				this.index = 0;
				this.list = undefined;
				return;
			}

		}
	} else if (this.sstart && !this.started) {
		this.started = true;
		return [this.sstart,this];
	}

	if (this.getCondition(ctx)(eden.root,scope)) {
		return [this.statement, this.inc, this];
	} else {
		this.started = false;
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

Eden.AST.Default.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Default not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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
	if (typeof this.literal == "string") {
		return "case \"" + this.literal + "\": "; 
	} else {
		return "case " + this.literal + ": ";
	}
}

Eden.AST.Case.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Case not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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

Eden.AST.Continue.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Continue not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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

Eden.AST.Break.prototype.execute = function(ctx,base,scope,agent) {
	var err = new Eden.RuntimeError(base, Eden.RuntimeError.NOTSUPPORTED, this, "Break not supported here");
	err.line = this.line;
	this.errors.push(err);
	Eden.Agent.emit("error", [agent,err]);
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
	source += this.delay.generate(ctx, "scope",{bound: false});
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
	this.parent = undefined;
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
	if (script) {
		script.parent = this;
		this.errors.push.apply(this.errors, script.errors);
	}
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
	this.name = "*When";
	this.id = undefined;
	this.errors = [];
	this.expression = undefined;
	this.statement = undefined;
	this.start = 0;
	this.end = 0;
	this.executed = 0;
	this.parent = undefined;
	this.dependencies = {};
	this.active = false;
	this.compiled = undefined;
	this.scope = undefined;
	this.compScope = undefined;
	this.base = undefined;
	this.scopes = [];
	this.doxyComment = undefined;
	this.local = false;
	this.locals = undefined;
	this.dirty = false;
};

Eden.AST.When.prototype.addTrigger = function(base, d, scope) {
	var trigs = base.triggers[d];
	if (trigs) {
		for (var i=0; i<trigs.length; i++) if (trigs[i].statement === this) return;
		base.triggers[d].push({statement: this, scope: scope});
	} else {
		trigs = [{statement: this, scope: scope}];
		base.triggers[d] = trigs;
	}
}

Eden.AST.When.prototype.getSource = function() {
	return this.base.getSource(this);
}

Eden.AST.When.prototype.getLine = function() { return this.line; }

Eden.AST.When.prototype.doDebug = function() {
	return this.doxyComment && this.doxyComment.getControls()["@debug"];
}

Eden.AST.When.prototype.setScope = function (scope) {
	this.scope = scope;
}

Eden.AST.When.prototype.subscribeDynamic = function(position, dependency, scope) {
	//console.log("Subscribe Dyn: ", dependency, scope);
	/*if (this.base.triggers[dependency]) {
		if (this.base.triggers[dependency].indexOf(this) == -1) {
			this.base.triggers[dependency].push(this);
		}
	} else {
		var trigs = [this];
		this.base.triggers[dependency] = trigs;
	}*/
	this.addTrigger(this.base, dependency, scope);
	return eden.root.lookup(dependency);
}

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
	if (this.base) this.name = "*When:"+this.base.origin.name+":"+this.line;
}

Eden.AST.When.prototype.generate = function() {
	return "";
}

Eden.AST.When.prototype.compile = function(base) {
	this.base = base;
	var cond = "(function(context,scope) { try { return ";
	cond += this.expression.generate(this, "scope",{bound: false});
	cond += "; } catch(e) {} })";
	this.compiled = eval(cond);

	if (this.scope && this.compScope === undefined) {
		try {
			this.compScope = eval("(function (context, scope) { var s = " + this.scope.generateConstructor(this, "scope") + "; s.rebuild(); return s; })");
		} catch (e) {
			//var err;

			//if (/[0-9][0-9]*/.test(e.message)) {
			//	err = new Eden.RuntimeError(base, parseInt(e.message), this, e.message);
			//} else {
			//	err = new Eden.RuntimeError(base, 0, this, e);
			//}

			//err.line = this.line;

			//this.errors.push(err);
			//if (base.origin) Eden.Agent.emit("error", [base.origin,err]);
			//console.error(e);
		}
	}

	// Register with base to be triggered
	for (var d in this.dependencies) {
		this.addTrigger(base, d);
	}

	return "";
}

Eden.AST.When.prototype.trigger = function(base, scope) {
	//console.trace("TRIGGER", this.name, scope);
	if (base === undefined) base = this.base;
	if (this.active == false) {
		this.active = true;
		var res = this.executeReal(this, base, (scope) ? scope : eden.root.scope);
		//console.log(res);
		if (res && (eden.peer === undefined || eden.peer.authoriseWhen(this))) {
			base.executeStatements(res, -1, this, undefined, this);
		} else {
			this.active = false;
		}
	} else {
		//this.retrigger = true;
	}
}

Eden.AST.When.prototype.executeReal = function(ctx, base, scope) {
	//if (this.active) return;
	//this.active = true;
	this.executed = 1;
	//this.compile(base);

	//console.log("Exec When: " + base.getSource(this));

	if (this.doxyComment && this.doxyComment.getControls()["@local"]) this.local = true;

	// Reset local variables
	this.locals = {};
	var me = this;

	if (scope === undefined || scope === eden.root.scope) {
		if (this.compScope) scope = this.compScope.call(this, eden.root, eden.root.scope);
		else scope = eden.root.scope;
	}

	if (scope.range) {
		scope.range = false;
		var sscripts = [];

		//if (scope.first()) {
			while (true) {
				var cscope = scope.clone();
				if (this.compiled.call(this, eden.root,cscope)) {
					//sscripts.push(new Eden.AST.ScopedScript(this.statement.statements, cscope));
					console.log("RANGE WHEN:", cscope);
				} else {
					this.executed = 2;
				}
				if (scope.next() == false) break;
			}
		//}

		scope.range = true;
		return sscripts;
	} else {
		if (this.compiled.call(this,eden.root,scope)) {
			//console.log(this.name, scope);
			if (scope !== eden.root.scope && this.statement.type == "script") {
				return [new Eden.AST.ScopedScript(this.statement.statements, scope)];
			} else {
				return [this.statement];
			}
		} else {
			this.executed = 2;
		}
	}

	//this.active = false;
}

Eden.AST.When.prototype.execute = function(ctx,base,scope,agent) {
	//if (this.scope && this.compScope === undefined) {
	//	try {
	//		this.compScope = eval("(function (context, scope) { return " + this.scope.generateConstructor(this, "scope") + "; })").call(this, eden.root, eden.root.scope);
	//	} catch (e) {
			//var err;

			//if (/[0-9][0-9]*/.test(e.message)) {
			//	err = new Eden.RuntimeError(base, parseInt(e.message), this, e.message);
			//} else {
			//	err = new Eden.RuntimeError(base, 0, this, e);
			//}

			//err.line = this.line;

			//this.errors.push(err);
			//if (base.origin) Eden.Agent.emit("error", [base.origin,err]);
			//else console.log(err.prettyPrint());
	//	}
	//}
	if (agent && !agent.loading) base.executeStatements(this.executeReal(ctx,base,scope,agent), -1, this, undefined, this);
}

Eden.AST.When.prototype.error = fnEdenASTerror;



//------------------------------------------------------------------------------

Eden.AST.ScopedScript = function(statements, scope) {
	this.type = "scopedscript";
	this.statements = statements;
	this.scope = scope;
}

Eden.AST.ScopedScript.prototype.execute = function(ctx,base,scope,agent) {
	return this.statements;
}

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
	this.start = 0;
	this.end = 0;
	this.parent = undefined;
	this.line = undefined;
	this.kind = "local";
};

Eden.AST.Declarations.prototype.error = fnEdenASTerror;

Eden.AST.Declarations.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Declarations.prototype.execute = function(ctx, base, scope, agent) {
	if (ctx) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
		}
	}
}

Eden.AST.Declarations.prototype.generate = function(ctx,scope,options) {
	if (this.kind == "local") {
		var res = "var ";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
			res += this.list[i];
			if (i < this.list.length-1) res += ",";
		}
		res += ";\n";
		return res;
	} else if (this.kind = "oracle") {
		var res = "";
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.list.length; i++) {
			ctx.locals[this.list[i]] = new Eden.AST.Local(this.list[i]);
			res += "var "+this.list[i] + " = "+scope+".value(\""+this.list[i]+"\");\n";
		}
		return res;
	}
}

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
	this.locals = undefined;
	this.onfinish = undefined;
	this.base = undefined;
};

Eden.AST.Script.prototype.getSource = function() {
	var ast = this.base;
	if (ast === undefined) {
		var p = this;
		while (p.parent) p = p.parent;
		ast = this.base;
	}
	return this.base.getSource(this);
}

Eden.AST.Script.prototype.getInnerSource = function() {
	var ast = this.base;
	if (ast === undefined) {
		var p = this;
		while (p.parent) p = p.parent;
		ast = this.base;
	}
	return this.base.stream.code.slice(this.statements[0].start,this.statements[this.statements.length-1].end).trim();
}

Eden.AST.Script.prototype.getLine = function() {
	return this.line;
}

Eden.AST.Script.prototype.setLocals = function(locals) {
	this.locals = locals;
	if (locals) {
		this.errors.push.apply(this.errors, locals.errors);
	}
}

Eden.AST.Script.prototype.subscribeDynamic = function(ix,name) {
	console.log("SUBDYN: " + name);
	return eden.root.lookup(name);
}

Eden.AST.Script.prototype.getParameterByNumber = function(index) {
	if (this.parameters) {
		return this.parameters[index-1];
	}
	return undefined;
}

Eden.AST.Script.prototype.error = fnEdenASTerror;

Eden.AST.Script.prototype.setName = function(base, name) {
	this.name = "*Action:"+base.origin.name+":"+name;
	this.shortName = name;
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

Eden.AST.Script.prototype.execute = function(ctx, base, scope, agent) {
	var filtered = [];

	if (this.locals && this.locals.list.length > 0) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.locals.list.length; i++) {
			ctx.locals[this.locals.list[i]] = new Eden.AST.Local(this.locals.list[i]);
		}
	}

	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "script") filtered.push(this.statements[i]);
	}
	return filtered;
}

Eden.AST.Script.prototype.generate = function(ctx, scope) {
	var result = "{\n";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx, scope, {bound: false});
	}
	result = result + "}";
	return result;
}


//------------------------------------------------------------------------------

Eden.AST.ScriptExpr = function() {
	this.type = "scriptexpr";
	this.errors = [];
	this.statements = [];
	this.locals = {};
	this.dependencies = {};
};

Eden.AST.ScriptExpr.prototype.error = fnEdenASTerror;

Eden.AST.ScriptExpr.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

Eden.AST.ScriptExpr.prototype.generate = function(ctx, scope) {
	var result = "(function(escope) {\nescope.isolate = true;\nif (cache) cache.scope = escope;\nvar context = new Eden.AST.Context(context);\nescope.context = context;\n";
	for (var i = 0; i < this.statements.length; i++) {
		// Special case for oracles.
		if (this.statements[i].type == "declarations" && this.statements[i].kind == "oracle") {
			for (var j=0; j<this.statements[i].list.length; j++) {
				ctx.dependencies[this.statements[i].list[j]] = true;
			}
		}
		result = result + this.statements[i].generate(this, "escope", {bound: false});
	}
	result = result + "}).call(this,new Scope(context,"+scope+",[],false,this,false))";
	
	return result;
}


