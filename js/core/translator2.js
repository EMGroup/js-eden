/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */


/**
 * Abstract Syntax Tree generator for JS-Eden code.
 * Each production in the grammar has a function in this class. It makes use
 * of the EdenStream class to tokenise the script, and the Eden.SyntaxError class to
 * report the errors found. To use, pass the script to the constructor.
 * @param code String containing the script.
 */
Eden.AST = function(code, imports, origin, noparse) {
	this.stream = new EdenStream(code);
	this.data = new EdenSyntaxData();
	this.token = "INVALID";
	this.previous = "INVALID";
	this.src = "input";
	this.lines = [];
	this.parent = undefined;
	this.scripts = {};			// Actions table
	this.triggers = {};			// Guarded actions
	this.definitions = {};		// Definitions mapping
	this.imports = (imports) ? imports : [];
	this.origin = origin;		// The agent owner of this script

	if (!origin) console.error("NO ORIGIN", code);

	this.lastDoxyComment = undefined;
	this.mainDoxyComment = undefined;

	this.stream.data = this.data;

	// Get First Token;
	this.next();

	// Start parse with SCRIPT production
	if (!noparse) this.script = this.pSCRIPT();
}

// Debug controls
Eden.AST.debug = false;
Eden.AST.debugstep = false;
Eden.AST.debugstep_cb = undefined;
Eden.AST.debugspeed = 500;
Eden.AST.debugbreakpoint = undefined;
Eden.AST.debugbreakpoint_cb = undefined;
Eden.AST.debug_begin_cb = undefined;
Eden.AST.debug_end_cb = undefined;



/**
 * Recursive search of all imports for the required action code.
 */
Eden.AST.prototype.getActionByName = function(name) {
	var script = this.scripts[name];

	if (script === undefined) {
		for (var i=0; i<this.imports.length; i++) {
			if (this.imports[i] && this.imports[i].ast) {
				// Check this scripts actions for the one we want
				script = this.imports[i].ast.getActionByName(name);
				if (script) return script;
			}
		}
	}

	return script;
}



Eden.AST.prototype.generate = function() {
	return this.script.generate();
}



Eden.AST.prototype.execute = function(agent, cb) {
	//this.script.execute(undefined, this, root.scope);
	this.executeStatement(this.script, 0, agent, cb);
}



/**
 * Reset all statements that have been marked as executed previously. Used
 * by the input window gutter for polling changes of execution state.
 */
Eden.AST.prototype.clearExecutedState = function() {
	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i]) {
			if (this.lines[i].executed > 0) {
				this.lines[i].executed = 0;
			}
		}
	}
}


/* Execute a particular line of script.
 * If the statement is part of a larger statement block then execute
 * that instead (eg. a proc).
 */
Eden.AST.prototype.executeLine = function(lineno, agent, cb) {
	var line = lineno;
	// Make sure we are not in the middle of a proc or func.
	//while ((line > 0) && (this.lines[line] === undefined)) {
	//	line--;
	//}

	//console.log("Executeline: " + lineno);

	var statement;
	if (lineno == -1) {
		statement = this.script;
	} else {
		statement = this.lines[line];
	}
	if (statement === undefined) return;

	// Find root statement and execute that one
	statement = this.getBase(statement);

	// Execute only the currently changed root statement
	this.executeStatement(statement, line, agent, cb);
}



/**
 * Find the base/parent statement of a given statement. Used to make sure
 * statements inside functions etc are not executed directly and out of context.
 */
Eden.AST.prototype.getBase = function(statement) {
	var base = statement;
	while (base.parent && base.parent != this.script) base = base.parent;
	return base; 
}



/**
 * Return the start and end line of the statement block located at a particular
 * line. Returns an array of two items, startline and endline.
 */
Eden.AST.prototype.getBlockLines = function(lineno) {
	var line = lineno;
	var me = this;

	var startstatement = this.getBase(this.lines[line]);
	while (line > 0 && this.lines[line-1] && this.getBase(this.lines[line-1]) == startstatement) line--;
	var startline = line;

	while (line < this.lines.length-1 && this.lines[line+1] && (this.lines[line+1] === startstatement || this.lines[line+1].parent != this.script)) line++;
	var endline = line;

	return [startline,endline];
}


/**
 * Get the js-eden source code for a specific statement.
 */
Eden.AST.prototype.getSource = function(ast) {
	return this.stream.code.slice(ast.start,ast.end).trim();
}


Eden.AST.prototype.getRoot = function() {
	return this.script;
}



Eden.AST.prototype.getErrors = function() {
	return this.script.errors;
}



Eden.AST.prototype.hasErrors = function() {
	return this.script.errors.length > 0;
}


/**
 * Dump the AST as stringified JSON, or pretty print any error messages.
 * @return String of AST or errors.
 */
Eden.AST.prototype.prettyPrint = function() {
	var result = "";

	if (this.script.errors.length > 0) {
		for (var i = 0; i < this.script.errors.length; i++) {
			result = result + this.script.errors[i].prettyPrint() + "\n\n";
		}
	} else {
		result = JSON.stringify(this.script, function(key, value) {
			if (key == "errors") return undefined;
			if (key == "parent") {
				if (value) return true;
				else return undefined;
			} 
			return value;
		}, "    ");
	}

	return result;
};


/**
 * Move to next token. This skips comments, extracts doxygen comments and
 * parses out any embedded javascript. The javascript is parsed here instead of
 * in the lexer because it needs to deal with multi-line code.
 */
Eden.AST.prototype.next = function() {
	this.previous = this.token;
	this.token = this.stream.readToken();

	//Cache prev line so it isn't affected by comments
	var prevline = this.stream.prevline;

	//Skip comments
	while (true) {
		// Skip block comments
		if (this.token == "/*") {
			var count = 1;
			var isDoxy = false;
			var start = this.stream.position-2;
			var startline = this.stream.line;

			// Extra * after comment token means DOXY comment.
			if (this.stream.peek() == 42) isDoxy = true;

			// Find terminating comment token
			while (this.stream.valid() && (this.token != "*/" || count > 0)) {
				this.token = this.stream.readToken();
				// But make sure we count any inner comment tokens
				if (this.token == "/*") {
					count++;
				} else if (this.token == "*/") {
					count--;
				}
			}

			// Store doxy comment so next statement can use it, or if we are
			// at the beginning of the script then its the main doxy comment.
			if (isDoxy) {
				this.lastDoxyComment = new Eden.AST.DoxyComment(this.stream.code.substring(start, this.stream.position), startline, this.stream.line);
				if (startline == 1) this.mainDoxyComment = this.lastDoxyComment;
			}
			this.token = this.stream.readToken();
		// Skip line comments
		} else if (this.token == "##") {
			this.stream.skipLine();
			this.token = this.stream.readToken();
		// Extract javascript code blocks
		} else if (this.token == "${{") {
			var start = this.stream.position;
			var startline = this.stream.line;
			this.data.line = startline;

			// Go until terminating javascript block token
			while (this.stream.valid() && this.token != "}}$") {
				this.token = this.stream.readToken();
			}

			// Return code as value and generate JAVASCRIPT token
			this.data.value = this.stream.code.substring(start, this.stream.position-3);
			this.token = "JAVASCRIPT";
		} else {
			break;
		}
	}

	// Update previous line to ignore any comments.
	this.stream.prevline = prevline;
};



Eden.AST.prototype.peekNext = function(count) {
	var res;
	var localdata = {value: ""};
	this.stream.data = localdata;
	this.stream.pushPosition();
	while (count > 0) {
		res = this.stream.readToken();
		count--;
	}
	this.stream.popPosition();
	this.stream.data = this.data;
	return res;
};



////////////////////////////////////////////////////////////////////////////////
//    Grammar Productions                                                     //
////////////////////////////////////////////////////////////////////////////////

/*
 * T'''' -> TA E''''''
 */
Eden.AST.prototype.pTERM = function() {
	var left = this.pTERM_A();
	var right = this.pEXPRESSION_PPPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}

/**
 * T -> T' { < T' | <= T' | > T' | >= T' | == T' | != T' }
 */
Eden.AST.prototype.pTERM_A = function() {
	var left = this.pTERM_P();

	// For all tokens of this precedence do...
	while (this.token == "<" || this.token == "<=" || this.token == ">"
			|| this.token == ">=" || this.token == "==" || this.token == "!=") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_P());
		left = binop;
	}

	return left;
}



/*
 * T' -> T'' { + T'' | - T'' | // T''}
 */
Eden.AST.prototype.pTERM_P = function() {
	var left = this.pTERM_PP();

	while (this.token == "+" || this.token == "-" || this.token == "//") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PP());
		left = binop;
	}

	return left;
}



/*
 * T'' -> T''' { * T''' | / T''' | % T''' | ^ T'''}
 */
Eden.AST.prototype.pTERM_PP = function() {
	var left = this.pTERM_PPP();

	while (this.token == "*" || this.token == "/" || this.token == "%"
			|| this.token == "^") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM_PPP());
		left = binop;
	}

	return left;
}



/*
 * T''' -> F E'''''	
 */
Eden.AST.prototype.pTERM_PPP = function() {
	var left = this.pFACTOR(); //this.pTERM_PPPP();
	var right = this.pEXPRESSION_PPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}



/*
 * T'''' -> F E''''''
 */
/*Eden.AST.prototype.pTERM_PPPP = function() {
	var left = this.pFACTOR();
	var right = this.pEXPRESSION_PPPPPP();

	if (right) {
		right.left(left);
		return right;
	}
	return left;
}*/



/*
 * E''''' -> # | epsilon
 */
Eden.AST.prototype.pEXPRESSION_PPPPP = function() {
	if (this.token == "#") {
		this.next();
		return new Eden.AST.Length();
	}
	return undefined;
}



/*
 * F ->
 *	( EXPRESSION ) |
 *	- number |
 *	number |
 *	string |
 *  boolean |
 *  character
 *  JAVASCRIPT |
 *	$ NUMBER |
 *	[ ELIST ] |
 *	& LVALUE |
 *	! PRIMARY |
 *	PRIMARY	
 */
Eden.AST.prototype.pFACTOR = function() {
	// Sub-expression
	if (this.token == "(") {
		this.next();

		// Parse the sub-expression
		var expression = this.pEXPRESSION();
		if (expression.errors.length > 0) return expression;

		// Remove closing bracket (or error).
		if (this.token != ")") {
			expression.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
		} else {
			this.next();
		}
		return expression;
	// Action parameters
	} else if (this.token == "$") {
		this.next();
		var index = 0;

		// Allow for # to get lengths
		if (this.token == "#") {
			index = -1;
		// Otherwise if not a valid number > 0 then error
		} else if (this.token != "NUMBER" || this.data.value < 1) {
			var p = new Eden.AST.Parameter(-1);
			p.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMNUMBER));
			return p;
		}

		index = this.data.value
		this.next();
		return new Eden.AST.Parameter(index);
	// Make a list literal
	} else if (this.token == "[") {
		this.next();

		var elist = [];
		// Check for basic empty case, if not then parse elements
		if (this.token != "]") {
			elist = this.pELIST();
		}

		var literal = new Eden.AST.Literal("LIST", elist);

		// Merge any errors found in the expressions
		for (var i = 0; i < elist.length; i++) {
			if (elist[i].errors.length > 0) {
				literal.errors.push.apply(literal.errors, elist[i].errors);
			}
		}
		if (literal.errors.length > 0) return literal;

		// Must have a closing bracket...
		if (this.token != "]") {
			literal.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTLITCLOSE));
		} else {
			this.next();
		}
		return literal;
	// Literal undefined
	} else if (this.token == "@") {
		this.next();
		return new Eden.AST.Literal("UNDEFINED", "@");
	// Should NOT be encountered here anymore!!!?
	} else if (this.token == "JAVASCRIPT") {
		var lit = new Eden.AST.Literal("JAVASCRIPT", this.data.value);
		this.next();
		return lit;
	// Numeric literal
	} else if (this.token == "NUMBER") {
		var lit = new Eden.AST.Literal("NUMBER", this.data.value);
		this.next();
		return lit
	// Unary negation operator
	} else if (this.token == "-") {
		this.next();
		var negop = new Eden.AST.UnaryOp("-", this.pFACTOR());
		return negop;
	// String literal
	// TODO Multi-line strings
	} else if (this.token == "STRING") {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		if (!this.data.error) this.next();
		// Allow multiple strings to be combined as lines
		while (this.data.error == false && this.token == "STRING") {
			lit.value += "\n"+this.data.value;
			this.next();
		}

		if (this.data.error) {
			if (this.data.value == "LINEBREAK") {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRLINE));
			} else {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRCLOSE));
			}
		}

		return lit;
	// Boolean literal
	} else if (this.token == "BOOLEAN") {
		var lit = new Eden.AST.Literal("BOOLEAN", this.data.value);
		this.next();
		return lit;
	// Character literal
	} else if (this.token == "CHARACTER") {
		var lit = new Eden.AST.Literal("CHARACTER", this.data.value);
		if (this.data.error) {
			if (this.data.value == "") {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITCHAREMPTY));
			} else {
				lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITCHARCLOSE));
			}
			return lit;
		}
		this.next();
		return lit;
	// Unary boolean not
	} else if (this.token == "!") {
		this.next();
		var f = this.pFACTOR();
		return new Eden.AST.UnaryOp("!", f);
	// Unary address of operator
	} else if (this.token == "&") {
		this.next();
		var lvalue = this.pLVALUE();
		return new Eden.AST.UnaryOp("&", lvalue);
	// Unary dereference operator
	} else if (this.token == "*") {
		this.next();
		var lvalue = this.pFACTOR();
		return new Eden.AST.UnaryOp("*", lvalue);
	// Otherwise it must be some primary (observable or backticks)
	} else {
		var primary = this.pPRIMARY();
		return primary;
	}
}



/**
 * PRIMARY Production
 * PRIMARY -> observable PRIMARY' | ` EXPRESSION ` PRIMARY'
 */
Eden.AST.prototype.pPRIMARY = function() {
	// Backticks on RHS
	if (this.token == "`") {
		this.next();
		// Parse the backticks expression
		var btick = this.pEXPRESSION();
		if (btick.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			primary.setBackticks(btick);
			return primary;
		}	

		// Closing backtick missing?
		if (this.token != "`") {
			var primary = new Eden.AST.Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return primary;
		} else {
			this.next();
		}

		// Check for other components like '.' and '['.
		var primary = this.pPRIMARY_P();
		if (primary.errors.length > 0) return primary;

		primary.setBackticks(btick);
		primary.setObservable("__BACKTICKS__");
		return primary;
	// Plain observable
	} else if (this.token == "OBSERVABLE") {
		var observable = this.data.value;
		this.next();
		// Check for '.', '[' and '('... plus 'with'
		var primary = this.pPRIMARY_P();
		primary.setObservable(observable);
		return primary;
	// Missing primary so give an error
	} else {
		var primary = new Eden.AST.Primary();
		primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADFACTOR));
		return primary;
	}
}



/**
 * PRIMARY Prime Production
 * PRIMARY' ->
 *	( ELIST ) PRIMARY''
 *	| . PRIMARY
 *	| [ EXPRESSION ] PRIMARY'''
 *	| PRIMARY''''
 */
Eden.AST.prototype.pPRIMARY_P = function() {
	// Do we have a list index to add
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();

		// Can't be empty, needs an index
		if (this.token == "]") {
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			index.setExpression(express);
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		// And try to find more components...
		var primary = this.pPRIMARY_PPP();
		//if (primary.errors.length > 0) return primary;
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	// Do we have a function call?
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();	

		// Check for base case of no parameters
		if (this.token == ")") {
			this.next();
			// Check for other components...
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		// Otherwise we have parameters so parse them
		} else {
			// Expression list.
			var elist = this.pELIST();
			func.setParams(elist);
			if (func.errors.length > 0) {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				return primary;
			}

			// Check for closing bracket
			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0) return primary;
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
			} else {
				this.next();
			}

			// Get more components...
			var primary = this.pPRIMARY_PP();
			if (primary.errors.length > 0) return primary;
			primary.prepend(func);
			return primary;
		}
	// Scope path
	} else if (this.token == ".") {
		this.next();
		var rhs = this.pPRIMARY();
		var scopepath = new Eden.AST.ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;
	// Go to end, check for "with"
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Prime Prime Production.
 * PRIMARY'' ->
 *	( ELIST ) PRIMARY''
 *	| [ EXPRESSION ] PRIMARY''
 *	| PRIMARY''''
 */
Eden.AST.prototype.pPRIMARY_PP = function() {
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();

		// Can't be empty, needs an index
		if (this.token == "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			index.setExpression(express);
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0)	{
					return primary;
				}
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
			} else {
				this.next();
			}

			var primary = this.pPRIMARY_PP();
			primary.prepend(func);
			return primary;
		}
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Triple Prime.
 * PRIMARY''' ->
 *	. PRIMARY
 *	| ( ELIST ) PRIMARY''
 *	| [ EXPRESSION ] PRIMARY''
 *	| PRIMARY''''
 */
Eden.AST.prototype.pPRIMARY_PPP = function() {
	if (this.token == "[") {
		this.next();
		var index = new Eden.AST.Index();
		// Can't be empty, needs an index
		if (this.token == "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		}

		var express = this.pEXPRESSION();
		if (express.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			index.setExpression(express);
			primary.prepend(index);
			return primary;
		}

		// Check for index literal less than 1.
		if (express.type == "literal" && express.datatype == "NUMBER") {
			if (express.value < 1) {
				index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
				var primary = new Eden.AST.Primary();
				primary.prepend(index);
				return primary;
			}
		}

		// Must close ]
		if (this.token != "]") {
			index.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
			var primary = new Eden.AST.Primary();
			primary.prepend(index);
			return primary;
		} else {
			this.next();
		}

		var primary = this.pPRIMARY_PP();
		index.setExpression(express);
		primary.prepend(index);
		return primary;
	} else if (this.token == "(") {
		this.next();
		var func = new Eden.AST.FunctionCall();		

		if (this.token == ")") {
			this.next();
			var primary = this.pPRIMARY_PP();
			//if (primary.errors.length > 0) return primary;
			primary.prepend(func);
			return primary;
		} else {
			var elist = this.pELIST();
			func.setParams(elist);

			if (this.token != ")") {
				var primary = new Eden.AST.Primary();
				primary.prepend(func);
				if (func.errors.length > 0)	{
					return primary;
				}
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
				return primary;
			} else {
				this.next();
			}

			var primary = this.pPRIMARY_PP();
			if (primary.errors.length > 0) return primary;
			primary.prepend(func);
			return primary;
		}
	} else if (this.token == ".") {
		this.next();
		var rhs = this.pPRIMARY();
		if (rhs.errors.length > 0) return rhs;
		var scopepath = new Eden.AST.ScopePath();
		scopepath.setPrimary(rhs);
		return scopepath;
	} else {
		return this.pPRIMARY_PPPP();
	}
}


/**
 * Primary Quad Prime Production. DEFUNCT
 * PRIMARY'''' -> with SCOPE | epsilon
 */
Eden.AST.prototype.pPRIMARY_PPPP = function() {
	/*if (this.token == "with") {
		this.next();
		return this.pSCOPE();
	} else {*/
		return new Eden.AST.Primary();
	//}
}



/**
 * SCOPE Production
 * SCOPE -> ( SCOPE' ) | SCOPE'
 */
Eden.AST.prototype.pSCOPE = function() {
	if (this.token == "(") {
		this.next();
		var scope = this.pSCOPE_P();
		if (this.token != ")") {
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPECLOSE));
			return scope;
		} else {
			this.next();
		}
		return scope;
	}
	return this.pSCOPE_P();
}



Eden.AST.prototype.pSCOPEPATTERN = function() {
	var sname = new Eden.AST.ScopePattern();
	if (this.token != "OBSERVABLE") {
		sname.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPENAME));
		return sname;
	}
	sname.setObservable(this.data.value);
	this.next();

	while (true) {
		if (this.token == "[") {
			this.next();
			var express = this.pEXPRESSION();
			sname.addListIndex(express);
			if (express.errors.length > 0) return sname;
			if (this.token != "]") {
				sname.error(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return sname;
			}
			this.next();
		} else if (this.token == ".") {

		} else {
			break;
		}
	}

	return sname;
}



/**
 * SCOPE Prime Production
 * SCOPE' -> observable SCOPE''
 */
Eden.AST.prototype.pSCOPE_P = function() {
	var obs = this.pSCOPEPATTERN();
	var isin = false;
	if (obs.errors.length > 0) {
		var scope = new Eden.AST.Scope();
		scope.addOverride(obs, undefined, undefined, undefined, false);
		return scope;
	}

	if (this.token != "is" && this.token != "=" && this.token != "in") {
		var scope = new Eden.AST.Scope();
		scope.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPEEQUALS));
		return scope;
	}
	if (this.token == "in") isin = true;
	this.next();
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		var scope = new Eden.AST.Scope();
		scope.addOverride(obs, expression, undefined, undefined, false);
		return scope;
	}

	var exp2 = undefined;
	if (this.token == "..") {
		this.next();
		exp2 = this.pEXPRESSION();
		if (exp2.errors.length > 0) {
			var scope = new Eden.AST.Scope();
			scope.addOverride(obs, expression, exp2, undefined, false);
			return scope;
		}
	}

	var exp3 = undefined;
	if (this.token == "..") {
		this.next();
		exp3 = this.pEXPRESSION();
		if (exp3.errors.length > 0) {
			var scope = new Eden.AST.Scope();
			scope.addOverride(obs, expression, exp2, exp3, false);
			return scope;
		}
	}

	var scope = this.pSCOPE_PP();
	scope.addOverride(obs, expression, exp2, exp3, isin);
	return scope;
}



/**
 * Scope Prime Prime Production
 * SCOPE'' -> , SCOPE | epsilon
 */
Eden.AST.prototype.pSCOPE_PP = function() {
	if (this.token == ",") {
		this.next();
		return this.pSCOPE_P();
	} else {
		return new Eden.AST.Scope();
	}
}



/**
 * ELIST Production
 * ELIST -> EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pELIST = function() {
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		return [expression];
	}
	var list = this.pELIST_P();
	list.unshift(expression);
	return list;
}



/**
 * ELIST Prime Production
 * ELIST' -> , EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pELIST_P = function() {
	var result = [];
	while (this.token == ",") {
		this.next();
		var expression = this.pEXPRESSION();
		result.push(expression);
		if (expression.errors.length > 0) {
			return result;
		}
	}
	return result;
}



/*
 * E'''''' ->
 *  ? EXPRESSION : EXPRESSION |
 *  if EXPRESSION else EXPRESSION |
 *  epsilon
 */
Eden.AST.prototype.pEXPRESSION_PPPPPP = function() {
	if (this.token == "?") {
		this.next();
		var tern = new Eden.AST.TernaryOp("?");
		tern.setFirst(this.pEXPRESSION());

		if (tern.errors.length > 0) return tern;

		if (this.token != ":") {
			tern.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.TERNIFCOLON));
			return tern;
		} else {
			this.next();
		}
		
		tern.setSecond(this.pEXPRESSION());
		return tern;
	} else if (this.token == "if") {
		this.next();
		var tern = new Eden.AST.TernaryOp("?");
		tern.setCondition(this.pEXPRESSION());

		if (tern.errors.length > 0) return tern;

		if (this.token != "else") {
			tern.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.TERNIFCOLON));
			return tern;
		} else {
			this.next();
		}
		
		tern.setSecond(this.pEXPRESSION());
		return tern;
	}
	return undefined;
}



/**
 * EXPRESSION Production
 * EXPRESSION -> T { && T | || T }
 */
Eden.AST.prototype.pEXPRESSION_PLAIN = function() {
	var left = this.pTERM();

	while (this.token == "&&" || this.token == "||") {
		var binop = new Eden.AST.BinaryOp(this.token);
		this.next();
		binop.left(left);
		binop.setRight(this.pTERM());
		left = binop;
	}

	return left;
}



/**
 * Scoped Expression Production
 * SCOPEDEXP -> EXPRESSION { with SCOPE | epsilon }
 */
Eden.AST.prototype.pEXPRESSION = function() {
	var plain = this.pEXPRESSION_PLAIN();

	if (this.token == "with" || this.token == "::") {
		this.next();
		var scope = this.pSCOPE();
		scope.setExpression(plain);
		return scope;
	} else {
		return plain;
	}
}


/**
 * ACTION Production
 * ACTION -> observable : OLIST ACTIONBODY
 */
Eden.AST.prototype.pACTION = function() {
	var action = new Eden.AST.Action();
	var parent = this.parent;
	this.parent = action;

	if (this.token == "OBSERVABLE") {
		action.name = this.data.value;
		this.next();
	} else {
		action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PROCNAME));
		this.parent = parent;
		return action;
	}

	if (this.token == ":") {
		this.next();

		var olist = this.pOLIST();
		if (olist.length == 0) {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNOWATCH));
			this.parent = parent;
			return action;
		} else if (olist[olist.length-1] == "NONAME") {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCOMMAS));
			this.parent = parent;
			return action;
		}
		action.triggers = olist;
	}

	action.setBody(this.pFUNCBODY());
	this.parent = parent;
	return action;
}


/**
 * WHEN Production
 * WHEN -> ( EXPRESSION ) STATEMENT
 */
Eden.AST.prototype.pWHEN = function() {
	var when = new Eden.AST.When();
	var parent = this.parent;
	this.parent = when;

	if (this.token != "(") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENOPEN));
		this.parent = parent;
		return when;
	} else {
		this.next();
	}

	when.setExpression(this.pEXPRESSION());
	if (when.errors.length > 0) {
		this.parent = parent;
		return when;
	}

	if (this.token != ")") {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENCLOSE));
		this.parent = parent;
		return when;
	} else {
		this.next();
	}

	when.setStatement(this.pSTATEMENT());
	if (when.errors.length > 0) {
		this.parent = parent;
		return when;
	}
	if (when.statement === undefined) {
		when.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.WHENNOSTATEMENT));
		when.active = true;
		this.parent = parent;
		return when;
	}

	if (this.token == "with" || this.token == "::") {
		this.next();
		var scope = this.pSCOPE();
		when.setScope(scope);
		if (scope.errors.length > 0) return when;
	}

	// Compile the expression and log dependencies
	when.compile(this);

	this.parent = parent;
	return when;
}



/**
 * OLIST Production.
 * OLIST -> observable OLIST'
 */
Eden.AST.prototype.pOLIST = function() {
	if (this.token != "OBSERVABLE") {
		return [];
	}

	var observable = this.data.value;
	this.next();

	var prime = this.pOLIST_P();
	prime.unshift(observable);
	return prime;
}


/**
 * OLIST Prime Production
 * OLIST' -> , observable OLIST' | epsilon
 */
Eden.AST.prototype.pOLIST_P = function() {
	var olist = [];
	while (this.token == ",") {
		this.next();
		if (this.token == "OBSERVABLE") {
			olist.push(this.data.value);
			this.next();
		} else {
			olist.push("NONAME");
			return olist;
		}
	}

	return olist;
}



/**
 * ACTIONBODY Production
 * ACTIONBODY -> { LOCALS SCRIPT }
 */
Eden.AST.prototype.pACTIONBODY = function() {
	var codebody = new Eden.AST.CodeBlock();
	var parent = this.parent;
	this.parent = codebody;

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	// An action body can have locals but no paras
	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	this.parent = parent;
	return codebody;
}



/**
 * PARAMS Production
 * PARAS -> para OLIST ; PARAS | epsilon
 */
Eden.AST.prototype.pPARAMS = function() {
	var params = new Eden.AST.Declarations();

	// Get all parameter aliases.
	while (this.token == "para") {
		this.next();

		var olist = this.pOLIST();
		params.list.push.apply(params.list,olist);

		if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMNAME));
			return params;
		}

		if (this.token == ";") {
			this.next();
		} else {
			params.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PARAMSEMICOLON));
			return params;
		}
	}

	return params;
}



/**
 * LOCALS Production
 * LOCALS -> auto OLIST ; LOCALS | local OLIST ; LOCALS | epsilon
 */
Eden.AST.prototype.pLOCALS = function() {
	var locals = new Eden.AST.Declarations();

	// Get all locals, there may be many lines of such declarations
	while (this.token == "auto" || this.token == "local") {
		this.next();

		var olist = this.pOLIST();
		locals.list.push.apply(locals.list,olist);

		if (olist.length == 0 || olist[olist.length-1] == "NONAME") {
			locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALNAME));
			return locals;
		}

		if (this.token == ";") {
			this.next();
		} else {
			locals.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LOCALSEMICOLON));
			return locals;
		}
	}

	return locals;
}



/**
 * IF Production
 * IF -> ( EXPRESSION ) STATEMENT IF'
 */
Eden.AST.prototype.pIF = function() {
	var ifast = new Eden.AST.If();
	var parent = this.parent;
	this.parent = ifast;

	// Force if statements to have brackets around condition
	if (this.token != "(") {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDOPEN));
		this.parent = parent;
		return ifast;
	} else {
		this.next();
	}

	ifast.setCondition(this.pEXPRESSION());
	if (ifast.errors.length > 0) {
		this.parent = parent;
		return ifast;
	}

	// Must close said bracket
	if (this.token != ")") {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDCLOSE));
		this.parent = parent;
		return ifast;
	} else {
		this.next();
	}

	ifast.setStatement(this.pSTATEMENT());
	if (ifast.errors.length > 0) {
		this.parent = parent;
		return ifast;
	}

	// Can't have an if without a statement
	if (ifast.statement === undefined) {
		ifast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFNOSTATEMENT));
		this.parent = parent;
		return ifast;
	}

	// Get the optional else part.
	ifast.setElse(this.pIF_P());
	this.parent = parent;
	return ifast;
}



/**
 * IF Prime Production
 * IF' -> else STATEMENT | epsilon
 */
Eden.AST.prototype.pIF_P = function() {
	if (this.token == "else") {
		this.next();
		return this.pSTATEMENT();
	}
	// Doesn't have to exist...
	return undefined;
}



/**
 * FOR Production
 * FOR -> ( STATEMENT'_OPT ; EXPRESSION_OPT ; STATEMENT'_OPT ) STATEMENT
 */
Eden.AST.prototype.pFOR = function() {
	var forast = new Eden.AST.For();
	var parent = this.parent;
	this.parent = forast;

	if (this.token != "(") {
		forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FOROPEN));
		this.parent = parent;
		return forast;
	} else {
		this.next();
	}

	if (this.token == ";") {
		this.next();
	} else {
		forast.setStart(this.pSTATEMENT_P());
		if (forast.errors.length > 0) {
			this.parent = parent;
			return forast;
		}

		if (this.token != ";") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORSTART));
			this.parent = parent;
			return forast;
		} else {
			this.next();
		}
	}

	if (this.token == ";") {
		this.next();
	} else {
		forast.setCondition(this.pEXPRESSION());
		if (forast.errors.length > 0) {
			this.parent = parent;
			return forast;
		}

		if (this.token != ";") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCOND));
			this.parent = parent;
			return forast;
		} else {
			this.next();
		}
	}

	if (this.token == ")") {
		this.next();
	} else {
		forast.setIncrement(this.pSTATEMENT_P());
		if (forast.errors.length > 0) {
			this.parent = parent;
			return forast;
		}

		if (this.token != ")") {
			forast.error(new Eden.SyntaxError(this, Eden.SyntaxError.FORCLOSE));
			this.parent = parent;
			return forast;
		} else {
			this.next();
		}
	}

	forast.setStatement(this.pSTATEMENT());
	this.parent = parent;
	return forast;
}


/**
 * WHILE Production
 * WHILE -> ( EOPT ) STATEMENT
 */
Eden.AST.prototype.pWHILE = function() {
	var w = new Eden.AST.While();
	var parent = this.parent;
	this.parent = w;

	if (this.token != "(") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILEOPEN));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	w.setCondition(this.pEXPRESSION());
	if (w.errors.length > 0) {
		this.parent = parent;
		return w;
	}

	if (this.token != ")") {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILECLOSE));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	w.setStatement(this.pSTATEMENT());

	if (w.statement === undefined) {
		w.error(new Eden.SyntaxError(this, Eden.SyntaxError.WHILENOSTATEMENT));
		this.parent = parent;
		return w;
	}

	this.parent = parent;
	return w;
}



/**
 * Do Production
 * DO -> observable ELIST;
 */
Eden.AST.prototype.pDO = function() {
	var w = new Eden.AST.Do();
	var parent = this.parent;
	this.parent = w;

	if (this.token == "{") {
		this.next();
		var script = this.pSCRIPT();
		if (this.token != "}") {
			w.setScript(script);
			w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
			this.parent = parent;
			return w;
		}
		this.next();
		w.setScript(script);
		this.parent = parent;
		return w;
	} else if (this.token != "OBSERVABLE") {
		w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DONAME));
		this.parent = parent;
		return w;
	} else {
		w.setName(this.data.value);
		this.next();
	}

	if (this.token != ";") {
		var elist = this.pELIST();

		for (var i=0; i<elist.length; i++) {
			w.addParameter(elist[i]);
			if (w.errors.length > 0) {
				this.parent = parent;
				return w;
			}
		}
	}

	if (this.token != ";") {
		w.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		this.parent = parent;
		return w;
	} else {
		this.next();
	}

	this.parent = parent;
	return w;
}



/**
 * SWITCH Production
 * SWITCH -> ( EXPRESSION ) STATEMENT
 */
Eden.AST.prototype.pSWITCH = function() {
	var swi = new Eden.AST.Switch();
	var parent = this.parent;
	this.parent = swi;

	if (this.token != "(") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHOPEN));
		this.parent = parent;
		return swi;
	} else {
		this.next();
	}

	swi.setExpression(this.pEXPRESSION());
	if (swi.errors.length > 0) {
		this.parent = parent;
		return swi;
	}

	if (this.token != ")") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHCLOSE));
		this.parent = parent;
		return swi;
	} else {
		this.next();
	}

	// Force a switch to be followed by a script
	if (this.token != "{") {
		swi.error(new Eden.SyntaxError(this, Eden.SyntaxError.SWITCHSCRIPT));
		this.parent = parent;
		return swi;
	}

	swi.setStatement(this.pSTATEMENT());
	this.parent = parent;
	return swi;
}



/**
 * FUNCTION Production
 * FUNCTION -> observable FUNCBODY
 */
Eden.AST.prototype.pFUNCTION = function() {
	var func = new Eden.AST.Function();
	var parent = this.parent;
	this.parent = func;

	if (this.token == "OBSERVABLE") {
		func.name = this.data.value;
		this.next();
	} else {
		func.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCNAME));
		this.parent = parent;
		return func;
	}

	func.setBody(this.pFUNCBODY());
	this.parent = parent;
	return func;
}



/**
 * FUNCBODY Production
 * FUNCBODY -> { PARAS LOCALS SCRIPT }
 */
Eden.AST.prototype.pFUNCBODY = function() {
	var codebody = new Eden.AST.CodeBlock();
	var parent = this.parent;
	this.parent = codebody;

	if (this.token != "{") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCOPEN));
		this.parent = parent;
		return codebody;
	} else {
		this.next();
	}

	codebody.setParams(this.pPARAMS());
	if (codebody.params.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setLocals(this.pLOCALS());
	if (codebody.locals.errors.length > 0) {
		this.parent = parent;
		return codebody;
	}
	codebody.setScript(this.pSCRIPT());

	if (this.token != "}") {
		codebody.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCLOSE));
		this.parent = parent;
		return codebody;
	} else {
		//this.next();
	}

	this.parent = parent;
	return codebody;
}


/**
 * LVALUE Prime Production
 * LVALUE' -> [ EXPRESSION ] LVALUE' | . observable LVALUE' | epsilon
 * Returns an array of lvalue extra details, possibly empty.
 */
Eden.AST.prototype.pLVALUE_P = function() {
	var components = [];

	// Get all lvalue extras such as list indices and object properties.
	// This production is tail recursive so loop it.
	while (true) {
		// So we are using a list element as an lvalue?
		if (this.token == "[") {
			this.next();

			// Make an index tree element.
			var comp = new Eden.AST.LValueComponent("index");
			var expression = this.pEXPRESSION();
			comp.index(expression);
			components.push(comp);

			if (expression.errors.length > 0) {
				comp.errors.unshift(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
			}

			if (comp.indexexp.type == "literal" &&
				comp.indexexp.datatype == "NUMBER" &&
				comp.indexexp.value < 1) {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
			}

			if (this.token != "]") {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return components;
			}
			this.next();
		} else {
			break;
		}
	}
	return components;
};



/**
 * LVALUE Production
 * LVALUE -> observable LVALUE' | * PRIMARY LVALUE' | ` EXPRESSION ` LVALUE'
 */
Eden.AST.prototype.pLVALUE = function() {
	var lvalue = new Eden.AST.LValue();

	if (this.token == "*") {
		this.next();
		lvalue.setPrimary(this.pPRIMARY());
	} else if (this.token == "`") {
		this.next();
		lvalue.setExpression(this.pEXPRESSION());
		if (lvalue.errors.length > 0) return lvalue;

		// Closing backtick required
		if (this.token != '`') {
			lvalue.error(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return lvalue;
		}
		this.next();
	} else if (this.token == "OBSERVABLE") {
		lvalue.setObservable(this.data.value);
		this.next();
	} else {
		lvalue.error(new Eden.SyntaxError(this, Eden.SyntaxError.LVALUE));
		return lvalue;
	}

	lvalue.setExtras(this.pLVALUE_P());
	return lvalue;
};



/**
 * STATEMENT PrimePrime Production
 * STATEMENT''	->
 *	is EXPRESSION |
 *	= EXPRESSION |
 *	+= EXPRESSION |
 *	-= EXPRESSION |
 *	/= EXPRESSION |
 *	*= EXPRESSION |
 *	++ |
 *	-- |
 *  ( ELIST )
 */
Eden.AST.prototype.pSTATEMENT_PP = function() {
	if (this.token == "is") {
		this.next();
		return new Eden.AST.Definition(this.pEXPRESSION());
	} else if (this.token == "=") {
		this.next();
		return new Eden.AST.Assignment(this.pEXPRESSION());
	} else if (this.token == "+=") {
		this.next();
		return new Eden.AST.Modify("+=", this.pEXPRESSION());
	} else if (this.token == "-=") {
		this.next();
		return new Eden.AST.Modify("-=", this.pEXPRESSION());
	} else if (this.token == "/=") {
		this.next();
		return new Eden.AST.Modify("/=", this.pEXPRESSION());
	} else if (this.token == "*=") {
		this.next();
		return new Eden.AST.Modify("*=", this.pEXPRESSION());
	} else if (this.token == "~>") {
		this.next();
		var subscribers = new Eden.AST.Subscribers();

		if (this.token != "[") {
			subscribers.error(new Eden.SyntaxError(this, Eden.SyntaxError.SUBSCRIBEOPEN));
			return subscribers;
		} else {
			this.next();
		}

		subscribers.setList(this.pOLIST());
		if (subscribers.errors.length > 0) return subscribers;

		if (this.token != "]") {
			subscribers.error(new Eden.SyntaxError(this, Eden.SyntaxError.SUBSCRIBECLOSE));
			return subscribers;
		} else {
			this.next();
		}

		return subscribers;
	} else if (this.token == "++") {
		this.next();
		return new Eden.AST.Modify("++", undefined);
	} else if (this.token == "--") {
		this.next();
		return new Eden.AST.Modify("--", undefined);
	} else if (this.token == "(") {
		var fcall = new Eden.AST.FunctionCall();
		this.next();

		if (this.token != ")") {
			fcall.setParams(this.pELIST());
			if (fcall.errors.length > 0) return fcall;

			if (this.token != ")") {
				fcall.error(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCLOSE));
				return fcall;
			}
		}

		this.next();
		return fcall;
	}

	var errors = [];
	errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DEFINITION));

	var errast = new Eden.AST.Assignment(undefined);
	errast.errors.unshift(errors[0]);
	return errast;
};



/**
 * STATEMENT Prime Production
 * STATEMENT' -> LVALUE STATEMENT''
 */
Eden.AST.prototype.pSTATEMENT_P = function() {
	var lvalue = this.pLVALUE();
	if (lvalue.errors.length > 0) return lvalue;
	var formula = this.pSTATEMENT_PP();
	formula.left(lvalue);
	if (formula.errors.length > 0) return formula;
	return formula;
};



/**
 * CASE Production
 * CASE -> STRING : | NUMBER : | CHARACTER :
 */
Eden.AST.prototype.pCASE = function() {
	var cas = new Eden.AST.Case();

	if (this.token == "STRING" || this.token == "NUMBER") {
		cas.setLiteral(this.token, this.data.value);
		this.next();
	} else {
		cas.error(new Eden.SyntaxError(this, Eden.SyntaxError.CASELITERAL));
		return cas;
	}

	if (this.token != ":") {
		cas.error(new Eden.SyntaxError(this, Eden.SyntaxError.CASECOLON));
		return cas;
	} else {
		this.next();
	}

	return cas;
}



/**
 * INSERT Production
 * INSERT -> LVALUE , EXPRESSION , EXPRESSION ;
 */
Eden.AST.prototype.pINSERT = function() {
	var insert = new Eden.AST.Insert();
	
	insert.setDest(this.pLVALUE());
	if (insert.errors.length > 0) return insert;

	if (this.token != ",") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.INSERTCOMMA));
		return insert;
	} else {
		this.next();
	}

	insert.setIndex(this.pEXPRESSION());
	if (insert.errors.length > 0) return insert;

	if (this.token != ",") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.INSERTCOMMA));
		return insert;
	} else {
		this.next();
	}

	insert.setValue(this.pEXPRESSION());
	if (insert.errors.length > 0) return insert;

	if (this.token != ";") {
		insert.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return insert;
	} else {
		this.next();
	}

	return insert;
}



/**
 * DELETE Production
 * DELETE -> LVALUE , EXPRESSION ;
 */
Eden.AST.prototype.pDELETE = function() {
	var del = new Eden.AST.Delete();
	
	del.setDest(this.pLVALUE());
	if (del.errors.length > 0) return del;

	if (this.token != ",") {
		del.error(new Eden.SyntaxError(this, Eden.SyntaxError.DELETECOMMA));
		return del;
	} else {
		this.next();
	}

	del.setIndex(this.pEXPRESSION());
	if (del.errors.length > 0) return del;

	if (this.token != ";") {
		del.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return del;
	} else {
		this.next();
	}

	return del;
}



/**
 * APPEND Production
 * APPEND -> LVALUE , EXPRESSION ;
 */
Eden.AST.prototype.pAPPEND = function() {
	var append = new Eden.AST.Append();
	
	append.setDest(this.pLVALUE());
	if (append.errors.length > 0) return append;

	if (this.token != ",") {
		append.error(new Eden.SyntaxError(this, Eden.SyntaxError.APPENDCOMMA));
		return append;
	} else {
		this.next();
	}

	append.setIndex(this.pEXPRESSION());
	if (append.errors.length > 0) return append;

	if (this.token != ";") {
		append.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return append;
	} else {
		this.next();
	}

	return append;
}



/**
 * SHIFT Production
 * SHIFT -> LVALUE ;
 */
Eden.AST.prototype.pSHIFT = function() {
	var shif = new Eden.AST.Shift();

	shif.setDest(this.pLVALUE());
	if (shif.errors.length > 0) return shif;

	if (this.token != ";") {
		shif.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return shif;
	} else {
		this.next();
	}

	return shif;
}



/**
 * REQUIRE Production
 * REQUIRE -> EXPRESSION ;
 */
Eden.AST.prototype.pREQUIRE = function() {
	var req = new Eden.AST.Require();
	var express = this.pEXPRESSION();
	req.setExpression(express);
	return req;
}



/**
 * AFTER Production
 * AFTER -> ( EXPRESSION ) STATEMENT
 */
Eden.AST.prototype.pAFTER = function() {
	var after = new Eden.AST.After();

	if (this.token != "(") {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTEROPEN));
		return after;
	} else {
		this.next();
	}

	var express = this.pEXPRESSION();
	after.setExpression(express);
	if (after.errors.length > 0) return after;

	if (this.token != ")") {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTEROPEN));
		return after;
	} else {
		this.next();
	}

	var statement = this.pSTATEMENT();
	if (statement === undefined) {
		after.error(new Eden.SyntaxError(this, Eden.SyntaxError.AFTERNOSTATEMENT));
	}

	after.setStatement(statement);
	return after;
}



/**
 * INCLUDE Production
 * INCLUDE -> ( EXPRESSION ) ; INCLUDE'
 */
Eden.AST.prototype.pINCLUDE = function() {
	var express = this.pEXPRESSION();
	var inc = new Eden.AST.Include();//this.pINCLUDE_P();
	inc.prepend(express);
	return inc;
}



/**
 * IMPORT Production
 * IMPORT -> name IMPORT'
 * IMPORT' -> / IMPORT | IMPORT''
 * IMPORT'' -> enabled IMPORT'' | disabled IMPORT'' | local IMPORT'' |
 *					remote IMPORT'' | rebase IMPORT'' | readonly IMPORT'' |
 * 					;
 */
Eden.AST.prototype.pIMPORT = function() {
	var imp = new Eden.AST.Import();

	if (this.token != "OBSERVABLE" && Language.keywords[this.token] === undefined) {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTPATH));
		return imp;
	}

	var path = this.data.value;
	this.next();

	while (this.token == "/") {
		this.next();
		if (this.token != "OBSERVABLE" && Language.keywords[this.token] === undefined) {
			imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTPATH));
			return imp;
		}
		path += "/" + this.data.value;
		this.next();
	}

	// Check for a version tag
	if (this.token == "@") {
		this.next();
		if (this.token == "OBSERVABLE" || this.token == "NUMBER") {
			imp.setTag(this.data.value);
		} else {
			imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTTAG));
			return imp;
		}
		this.next();
	}

	if (this.token != ";" && this.token != "OBSERVABLE" && this.token != "local") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return imp;
	}

	while (this.token == "OBSERVABLE" || this.token == "local") {
		if (Language.importoptions[this.data.value]) {
			if (imp.addOption(this.data.value) == false) {
				imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTCOMB));
				return imp;
			}
		} else {
			imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTOPTION));
			return imp;
		}
		this.next();
	}

	if (this.token != ";") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return imp;
	}
	this.next();

	imp.setPath(path);
	return imp;
}



Eden.AST.prototype.pWAIT = function() {
	var wait = new Eden.AST.Wait();

	if (this.token == ";") {
		this.next();
		return wait;
	} else {
		var express = this.pEXPRESSION();
		wait.setDelay(express);

		if (this.token != ";") {
			wait.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
			return wait;
		}
		this.next();
	}
	return wait;
}



/**
 * STATEMENT Production
 * STATEMENT ->
	{ SCRIPT } |
	when WHEN |
	proc ACTION |
	func FUNCTION |
	for FOR |
	while WHILE |
	switch SWITCH |
	case CASE |
	default : |
	if IF |
	return EOPT ; |
	continue ; |
	break ; |
	? LVALUE ; |
	insert INSERT |
	delete DELETE |
	append APPEND |
	shift SHIFT |
	require REQUIRE |
	await AWAIT |
	after AFTER |
	option OPTION |
	include INCLUDE |
	LVALUE STATEMENT'' ; |
	epsilon
 */
Eden.AST.prototype.pSTATEMENT = function() {
	var start = this.stream.prevposition;
	var curline = this.stream.line - 1;
	var endline = -1;
	var stat = undefined;
	var end = -1;
	var doxy = this.lastDoxyComment;
	this.lastDoxyComment = undefined;

	switch (this.token) {
	case "proc"		:	this.next(); stat = this.pACTION(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "func"		:	this.next(); stat = this.pFUNCTION(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "when"		:	this.next(); stat = this.pWHEN(); end = this.stream.prevposition; endline = this.stream.prevline; break;
	case "action"	:	this.next(); stat = this.pNAMEDSCRIPT(); end = this.stream.position; endline = this.stream.line; this.next(); break;
	case "for"		:	this.next(); stat = this.pFOR(); break;
	case "while"	:	this.next(); stat = this.pWHILE(); break;
	case "do"		:	this.next(); stat = this.pDO(); break;
	case "wait"		:	this.next(); stat = this.pWAIT(); break;
	case "switch"	:	this.next(); stat = this.pSWITCH(); break;
	case "case"		:	this.next(); stat = this.pCASE(); break;
	case "insert"	:	this.next(); stat = this.pINSERT(); break;
	case "delete"	:	this.next(); stat = this.pDELETE(); break;
	case "append"	:	this.next(); stat = this.pAPPEND(); break;
	case "shift"	:	this.next(); stat = this.pSHIFT(); break;
	case "require"	:	this.next(); stat = this.pREQUIRE(); break;
	case "after"	:	this.next(); stat = this.pAFTER(); break;
	case "include"	:	this.next(); stat = this.pINCLUDE(); break;
	case "import"	:	this.next(); stat = this.pIMPORT(); break;
	case "default"	:	this.next();
						var def = new Eden.AST.Default();
						if (this.token != ":") {
							def.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.DEFAULTCOLON));
						} else {
							this.next();
						}
						stat = def; break;
	case "if"		:	this.next(); stat = this.pIF(); break;
	case "return"	:	this.next();
						var ret = new Eden.AST.Return();

						if (this.token != ";") {
							ret.setResult(this.pEXPRESSION());
							if (ret.errors.length > 0) {
								stat = ret;
								break;
							}
						} else {
							this.next();
							stat = ret;
							break;
						}

						if (this.token != ";") {
							ret.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = ret; break;
	case "continue"	:	this.next();
						var cont = new Eden.AST.Continue();
						if (cont.errors.length > 0) {
							stat = cont;
							break;
						}

						if (this.token != ";") {
							cont.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = cont; break;
	case "break"	:	this.next();
						var breakk = new Eden.AST.Break();
						if (breakk.errors.length > 0) {
							stat = breakk;
							break;
						}

						if (this.token != ";") {
							breakk.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						stat = breakk; break;
	case "{"		:	this.next();
						var script = this.pSCRIPT();
						if (this.token != "}") {
							script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
							endline = this.stream.line;
							stat = script;
							break;
						}
						endline = this.stream.line;
						this.next();
						stat = script; break;
	case "JAVASCRIPT" : curline = this.data.line-1;
						var js = this.data.value;
						this.next();
						stat = new Eden.AST.Literal("JAVASCRIPT", js);
						endline = this.stream.line;
						break;
	case "`"		  :
	case "*"		  :
	case "OBSERVABLE" :	var lvalue = this.pLVALUE();
						if (lvalue.errors.length > 0) {
							stat = new Eden.AST.DummyStatement;
							stat.lvalue = lvalue;
							stat.errors = lvalue.errors;
							break;
						}
						var formula = this.pSTATEMENT_PP();
						formula.left(lvalue);

						if (formula.errors.length > 0) {
							stat = formula;
							// To correctly report multi-line def errors.
							endline = this.stream.line;
							break;
						}
		
						if (this.token != ";") {
							formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
						} else {
							// End source here to avoid bringing comments in
							end = this.stream.position;
							endline = this.stream.line;
							this.next();
						}

						if (this.definitions[lvalue.name] === undefined) this.definitions[lvalue.name] = [];
						this.definitions[lvalue.name].push(formula);

						stat = formula; break;
	default : return undefined;
	}
	
	stat.parent = this.parent;
	stat.doxyComment = doxy;

	this.lines[curline] = stat;
	stat.line = curline;

	// Update statements start and end so original source can be extracted.
	if (end == -1) {
		stat.setSource(start, this.stream.prevposition);
	} else {
		stat.setSource(start, end);
	}

	//var endline = this.stream.line;
	for (var i=curline+1; i<endline; i++) {
		if (this.lines[i] === undefined || stat.errors.length > 0) this.lines[i] = stat;
	}
	return stat;
};



Eden.AST.prototype.pNAMEDSCRIPT = function() {
	var name;

	// Expect an action name with same syntax as an observable name
	if (this.token != "OBSERVABLE") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNAME));
		return script;
	} else {
		name = this.data.value;
		this.next();
	}

	if (this.token != "{") {
		var script = new Eden.AST.Script();
		script.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONOPEN));
		return script;
	} else {
		this.next();
	}

	var script = this.pSCRIPT();
	if (script.errors.length > 0) return script;

	script.setName(this,name);

	if (this.token != "}") {
		script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
		return script;
	} else {
		//this.next();
	}

	this.scripts[name] = script;
	script.base = this;

	return script;
}



/**
 * SCRIPT Production
 * SCRIPT -> STATEMENT SCRIPT | epsilon
 */
Eden.AST.prototype.pSCRIPT = function() {
	var ast = new Eden.AST.Script();
	var parent = this.parent;
	this.parent = ast;

	ast.setLocals(this.pLOCALS());

	while (this.token != "EOF") {
		var statement = this.pSTATEMENT();

		if (statement !== undefined) {
			ast.append(statement);
			if (statement.errors.length > 0) {
				break;
				// Skip until colon
				/*while (this.token != ";" && this.token != "EOF") {
					this.next();
				}*/
			}
		} else {
			if (this.token != "}" && this.token != ";") {
				ast.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.STATEMENT));
			}
			if (this.token == ";") {
				this.next();
			} else {
				break;
			}
		}
	}

	this.parent = parent;
	return ast;
};

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.Eden.AST = Eden.AST;
}

