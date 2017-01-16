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

/**
 * Abstract Syntax Tree generator for JS-Eden code.
 * Each production in the grammar has a function in this class. It makes use
 * of the EdenStream class to tokenise the script, and the Eden.SyntaxError class to
 * report the errors found. To use, pass the script to the constructor.
 * @param code String containing the script.
 */
Eden.AST = function(code, imports, origin, options) {
	this.stream = (code !== undefined) ? new EdenStream(code) : undefined;
	this.data = new EdenSyntaxData();
	this.token = "INVALID";
	this.previous = "INVALID";
	this.src = "input";
	this.parent = undefined;
	this.scripts = {};			// Actions table
	//this.triggers = {};			// Guarded actions
	this.definitions = {};		// Definitions mapping
	//this.imports = (imports) ? imports : [];
	this.origin = origin;		// The agent owner of this script
	this.lastposition = 0;
	this.lastline = 0;
	this.errors = [];
	this.warnings = [];
	this.whens = [];
	this.options = options;

	if (!origin) console.error("NO ORIGIN", code);

	this.lastDoxyComment = undefined;
	this.mainDoxyComment = undefined;
	this.parentDoxy = undefined;

	if(this.stream) this.stream.data = this.data;

	this.stamp = Date.now();

	// Start parse with SCRIPT production
	if (!options || !options.noparse) {
		// Get First Token;
		this.next();
		this.script = this.pSCRIPT();
		this.script.base = this;
		this.script.name = origin.name;
		this.script.setSource(0,code.length, code);
		this.script.doxyComment = this.mainDoxyComment;
		if (!this.options || !this.options.noindex) this.script.addIndex();
		else this.script.buildID();
		this.errors = this.script.errors;
	}
}

/* Generic functions to be reused */
Eden.AST.fnEdenASTerror = function(err) {
	this.errors.unshift(err);
};

Eden.AST.fnEdenASTleft = function(left) {
	this.l = left;
	if (left.errors.length > 0) {
		this.errors.push.apply(this.errors, left.errors);
	}
};

// Debug controls
Eden.AST.debug = false;
Eden.AST.debugstep = false;
Eden.AST.debugstep_cb = undefined;
Eden.AST.debugspeed = 500;
Eden.AST.debugbreakpoint = undefined;
Eden.AST.debugbreakpoint_cb = undefined;
Eden.AST.debug_begin_cb = undefined;
Eden.AST.debug_end_cb = undefined;


Eden.AST.fromNode = function(node, origin) {
	var ast = new Eden.AST(node.getInnerSource(), undefined, origin, {noindex: true, noparse: true});
	ast.script = node;
	ast.whens = Eden.Selectors.queryWithin([node], ">>.type(when)");
	ast.errors = node.errors;
	return ast;
}


Eden.AST.prototype.destroy = function() {
	/*function clear(stat) {
		for (var i=0; i<stat.statements.length; i++) {
			if (stat.statements[i].type == "script") clear(stat.statements[i]);
			stat.statements[i].garbage();
		}
		stat.statements = undefined;
		//stat.parent = undefined;
	}
	clear(this.script);*/
	//this.script.garbage();
	var stats = Eden.Selectors.queryWithin([this.script], ">>");
	//console.log("DESTROY STATS",stats);
	for (var i=0; i<stats.length; i++) {
		//stats[i].executed = -1;
		//if (stats[i].executed == 0)
		Eden.Index.remove(stats[i]);
		//else stats[i].executed = -1;
		//var idix = Eden.Index.getByID(stats[i].id);
		/*if (stats[i].statements) stats[i].statements = undefined;
		stats[i].parent = undefined;*/
	}
	this.script = undefined;
	// Free memory.
	this.stream = undefined;
	this.lines = undefined;
	this.scripts = undefined;

	// Remove the whens
	for (var i=0; i<this.whens.length; i++) {
		if (this.whens[i].enabled) eden.project.removeAgent(this.whens[i]);
	}
}


/**
 * Recursive search of all imports for the required action code.
 */
Eden.AST.prototype.getActionByName = function(name) {
	var script;

	if (name.indexOf("/") == -1) {
		script = this.scripts[name];

		if (script === undefined) {
			for (var i=0; i<this.imports.length; i++) {
				if (this.imports[i] && this.imports[i].ast) {
					// Check this scripts actions for the one we want
					script = this.imports[i].ast.getActionByName(name);
					if (script) return script;
				}
			}
		}
	}

	/*var ag = Eden.Agent.agents[name];
	if (ag && ag.ast && ag.ast.script && ag.ast.script.errors.length == 0) {
		return ag.ast.script;
	}*/

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
 * Construct an AST statement node from a string. It correctly sets up the node
 * and you cannot just create the object directly. The parent of the statement
 * remains unset and must be set manually (if needed).
 */
Eden.AST.parseStatement = function(src) {
	var ast = new Eden.AST(src, undefined, {}, {noparse: true, noindex: true});
	ast.next();
	var stat = ast.pSTATEMENT();
	stat.setSource(0,src.length, src);
	stat.stamp = ast.stamp;
	var numlines = src.match("\n");
	if (numlines === null) stat.numlines = 0;
	else stat.numlines = numlines.length;
	return stat;
}

Eden.AST.parseScript = function(src) {
	var ast = new Eden.AST(src, undefined, {}, {noparse: true, noindex: true});
	ast.next();
	var script = ast.pSCRIPT();
	script.setSource(0,src.length, src);
	script.stamp = ast.stamp;
	var numlines = src.match("\n");
	if (numlines === null) script.numlines = 0;
	else script.numlines = numlines.length;
	return script;
}

Eden.AST.parseExpression = function(src) {
	var ast = new Eden.AST(src, undefined, {}, {noparse: true, noindex: true});
	ast.next();
	var expr = ast.pEXPRESSION();
	return expr;
}


Eden.AST.registerStatement = function(stat) {
	stat.prototype.getOrigin = Eden.AST.BaseStatement.getOrigin;
	stat.prototype.hasErrors = Eden.AST.BaseStatement.hasErrors;
	stat.prototype.setSource = Eden.AST.BaseStatement.setSource;
	stat.prototype.getSource = Eden.AST.BaseStatement.getSource;
	stat.prototype.getNumberOfLines = Eden.AST.BaseStatement.getNumberOfLines;
	stat.prototype.getStartLine = Eden.AST.BaseStatement.getStartLine;
	stat.prototype.getEndLine = Eden.AST.BaseStatement.getEndLine;
	stat.prototype.getRange = Eden.AST.BaseStatement.getRange;
	stat.prototype.error = Eden.AST.fnEdenASTerror;
	stat.prototype.addIndex = Eden.AST.BaseStatement.addIndex;
	stat.prototype.removeIndex = Eden.AST.BaseStatement.removeIndex;
	stat.prototype.destroy = Eden.AST.BaseStatement.destroy;
	stat.prototype.buildID = Eden.AST.BaseStatement.buildID;
}

Eden.AST.registerScript = function(stat) {
	Eden.AST.registerStatement(stat);
	stat.prototype.getStatementByLine = Eden.AST.BaseScript.getStatementByLine;
	stat.prototype.getRelativeLine = Eden.AST.BaseScript.getRelativeLine;
	stat.prototype.getNumberOfLines = Eden.AST.BaseScript.getNumberOfLines;
	stat.prototype.append = Eden.AST.BaseScript.append;
	stat.prototype.appendChild = Eden.AST.BaseScript.appendChild;
	stat.prototype.removeChild = Eden.AST.BaseScript.removeChild;
	stat.prototype.insertBefore = Eden.AST.BaseScript.insertBefore;
	stat.prototype.replaceChild = Eden.AST.BaseScript.replaceChild;
	stat.prototype.addIndex = Eden.AST.BaseScript.addIndex;
	stat.prototype.removeIndex = Eden.AST.BaseScript.removeIndex;
	stat.prototype.destroy = Eden.AST.BaseScript.destroy;
	stat.prototype.buildID = Eden.AST.BaseScript.buildID;
}

Eden.AST.registerContext = function(stat) {
	Eden.AST.registerScript(stat);
}



/**
 * Find the base/parent statement of a given statement. Used to make sure
 * statements inside functions etc are not executed directly and out of context.
 */
Eden.AST.prototype.getBase = function(statement, ctx) {
	if (ctx === undefined) console.error("Undefined context in getBase");
	var base = statement;
	while (base && base.parent && base.parent !== ctx) base = base.parent;
	return base; 
}



/**
 * Return the start and end line of the statement block located at a particular
 * line. Returns an array of two items, startline and endline.
 */
Eden.AST.prototype.getBlockLines = function(lineno, ctx) {
	var line = lineno;
	var me = this;

	var startstatement = this.getBase(this.lines[line],ctx);
	while (line > 0 && this.lines[line-1] && this.getBase(this.lines[line-1],ctx) == startstatement) line--;
	var startline = line;

	while (line < this.lines.length-1 && this.lines[line+1] && (this.lines[line+1] === startstatement
			|| this.lines[line+1].parent !== ctx)) line++;
	var endline = line;

	return [startline,endline];
}


/**
 * Get the js-eden source code for a specific statement.
 */
Eden.AST.prototype.getSource = function(ast) {
	//return this.stream.code.slice(ast.start,ast.end).trim();
	return this.script.getSource();
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
	this.lastposition = this.stream.position;
	this.lastline = this.stream.line;
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
				this.lastDoxyComment = new Eden.AST.DoxyComment(this.stream.code.substring(start+3, this.stream.position-2).trim(), startline, this.stream.line);
				this.lastDoxyComment.parent = this.parentDoxy;
				if (this.lastDoxyComment.content.endsWith("@{")) {
					this.parentDoxy = this.lastDoxyComment;
				} else if (this.lastDoxyComment.content.startsWith("@}")) {
					if (this.parentDoxy) this.parentDoxy = this.parentDoxy.parent;
				}
				//if (startline == 1) this.mainDoxyComment = this.lastDoxyComment;
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
			this.stream.prevposition = start-3;
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







