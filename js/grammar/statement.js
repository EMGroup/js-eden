/**
 * STATEMENT PrimePrime Production
 * STATEMENT''	->
 *	is EXPRESSION |
 *  in EXPRESSION .. EXPRESSION |
 *	= EXPRESSION |
 *	+= EXPRESSION |
 *	-= EXPRESSION |
 *	/= EXPRESSION |
 *	*= EXPRESSION |
 *  ~> [ OLIST ] |
 *	++ |
 *	-- |
 *  ( ELIST )
 */
Eden.AST.prototype.pSTATEMENT_PP = function(allowrange) {
	if (this.token == "is") {
		this.next();
		var def = new Eden.AST.Definition();
		var parent = this.parent;
		this.parent = def;
		var expr = this.pEXPRESSION();
		def.expression = expr;
		def.errors = expr.errors;
		this.parent = parent;
		return def; //new Eden.AST.Definition(this.pEXPRESSION(), this.parent);
	} else if (this.token == "in") {
		this.next();

		if (!allowrange) {
			var range = new Eden.AST.Range();
			range.error(new Eden.SyntaxError(this, Eden.SyntaxError.RANGEBANNED));
			return range;
		}

		var range = new Eden.AST.Range(this.pEXPRESSION());
		if (this.token == "..") {
			this.next();
			range.setSecond(this.pEXPRESSION());
		}
		return range;
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
Eden.AST.prototype.pSTATEMENT_P = function(allowrange) {
	var lvalue = this.pLVALUE();
	if (lvalue.errors.length > 0) return lvalue;
	var formula = this.pSTATEMENT_PP(allowrange);
	formula.left(lvalue);
	if (formula.errors.length > 0) return formula;
	return formula;
};

/**
 * STATEMENT Production
 * STATEMENT ->
	{ SCRIPT } |
	when WHEN |
	proc ACTION |
	func FUNCTION |
	action NAMEDSCRIPT |
	for FOR |
	while WHILE |
	switch SWITCH |
	case CASE |
	default : |
	if IF |
	return EOPT ; |
	continue ; |
	break ; |
	? CODESELECTOR ; |
	insert INSERT |
	delete DELETE |
	append APPEND |
	shift SHIFT |
	require REQUIRE |
	after AFTER |
	import IMPORT |
	LVALUE STATEMENT'' ; |
	local LOCALS ; |
	auto LOCALS ; |
	wait EXPRESSION ; |
	epsilon
 */
Eden.AST.prototype.pSTATEMENT = function() {
	var start = this.stream.prevposition;
	var curline = this.stream.line - 1;
	var endline = -1;
	var stat = undefined;
	var end = -1;
	var doxy = this.lastDoxyComment;
	this.lastDoxyComment = this.parentDoxy;

	switch (this.token) {
	case "proc"		:	this.next(); stat = this.pACTION(); break;
	case "func"		:	this.next(); stat = this.pFUNCTION(); break;
	case "when"		:	this.next(); stat = this.pWHEN(); break;
	case "action"	:	this.next(); stat = this.pNAMEDSCRIPT(); break;
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
	//case "include"	:	this.next(); stat = this.pINCLUDE(); break;
	case "import"	:	this.next(); stat = this.pIMPORT(); break;
	case "local"	:
	case "auto"		:	stat = this.pLOCALS(); break;
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
							stat = script;
							break;
						}
						this.next();
						stat = script; break;
	case "JAVASCRIPT" : curline = this.data.line-1;
						var js = this.data.value;
						this.next();
						stat = new Eden.AST.Literal("JAVASCRIPT", js);
						//endline = this.stream.line;
						break;
	case "?"		  : this.next();
						stat = this.pQUERY();
						if (this.token != ";") {
							stat.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}
						break;
	case "`"		  :
	case "*"		  :
	case "OBSERVABLE" :	var lvalue = this.pLVALUE();
						if (lvalue.errors.length > 0) {
							stat = new Eden.AST.DummyStatement();
							stat.lvalue = lvalue;
							stat.errors = lvalue.errors;
							break;
						}
						var formula = this.pSTATEMENT_PP();
						formula.left(lvalue);

						if (formula.errors.length > 0) {
							stat = formula;
							// To correctly report multi-line def errors.
							//endline = this.stream.line;
							break;
						}
		
						if (this.token != ";") {
							formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}

						if (this.definitions[lvalue.name] === undefined) this.definitions[lvalue.name] = [];
						this.definitions[lvalue.name].push(formula);

						stat = formula; break;
	default : return undefined;
	}

	// Add statement properties
	end = this.lastposition;
	endline = this.lastline;
	stat.parent = this.parent;
	stat.doxyComment = doxy;
	stat.stamp = this.stamp;
	stat.numlines = endline - curline - 1;
	stat.setSource(start, end,this.stream.code.substring(start,end));

	return stat;
};



/**
 * STATEXPR Production
 * STATEXPR ->
	{ SCRIPT } |
	for FOR |
	while WHILE |
	switch SWITCH |
	case CASE |
	default : |
	if IF |
	return EOPT ; |
	continue ; |
	break ; |
	? CODESELECTOR ; |
	insert INSERT |
	delete DELETE |
	append APPEND |
	shift SHIFT |
	LVALUE STATEMENT'' ; |
	local LOCALS ; |
	auto LOCALS ; |
	epsilon
 */
Eden.AST.prototype.pSTATEXPR = function() {
	var start = this.stream.prevposition;
	//var curline = this.stream.line - 1;
	//var endline = -1;
	var stat = undefined;
	//var end = -1;
	var doxy = this.lastDoxyComment;
	this.lastDoxyComment = this.parentDoxy;

	switch (this.token) {
	case "proc"		:	
	case "func"		:	
	case "when"		:
	case "wait"		:
	case "do"		:
	case "require"	:
	case "after"	:
	case "import"	:	
	case "action"	:	stat = new Eden.AST.DummyStatement();
						stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
						break;
	case "for"		:	this.next(); stat = this.pFOR(); break;
	case "while"	:	this.next(); stat = this.pWHILE(); break;
	case "switch"	:	this.next(); stat = this.pSWITCH(); break;
	case "case"		:	this.next(); stat = this.pCASE(); break;
	case "insert"	:	this.next(); stat = this.pINSERT(); break;
	case "delete"	:	this.next(); stat = this.pDELETE(); break;
	case "append"	:	this.next(); stat = this.pAPPEND(); break;
	case "shift"	:	this.next(); stat = this.pSHIFT(); break;
	case "para"		:
	case "oracle"	:	stat = this.pPARAMS(); break;
	case "local"	:
	case "auto"		:	stat = this.pLOCALS(); break;
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
						//endline = this.stream.line;
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

	//this.lines[curline] = stat;
	//stat.line = curline;

	// Update statements start and end so original source can be extracted.
	//if (end == -1) {
	//	stat.setSource(start, this.stream.prevposition);
	//} else {
	//	stat.setSource(start, end);
	//}

	//var endline = this.stream.line;
	//for (var i=curline+1; i<endline; i++) {
	//	if (this.lines[i] === undefined || stat.errors.length > 0) this.lines[i] = stat;
	//}
	return stat;
};
