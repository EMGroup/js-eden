Eden.AST.prototype.pDEFINITION = function() {
	this.next();
	var def = new Eden.AST.Definition();
	var parent = this.parent;
	this.parent = def;
	this.isdynamic = false;

	
	var attribs;
	if (this.version >= Eden.AST.VERSION_CS3 && this.token == ":") {
		this.next();
		attribs = this.pATTRIBUTES();
		if (!def.setAttributes(attribs)) {
			def.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
			this.parent = parent;
			return def;
		}
	}


	var expr = this.pEXPRESSION_ASYNC();
	def.setExpression(expr);

	// The source code of this definition is dynamic in nature
	if (this.isdynamic) def.isdynamic = true;

	//def.expression = expr;
	//def.errors = expr.errors;
	this.parent = parent;
	return def;
}

Eden.AST.prototype.pRANGE_STATEMENT = function() {
	this.next();

	/*if (!allowrange) {
		var range = new Eden.AST.Range();
		range.error(new Eden.SyntaxError(this, Eden.SyntaxError.RANGEBANNED));
		return range;
	}*/

	var range = new Eden.AST.Range(this.pEXPRESSION());

	if (this.token !== ".." && (range.expression.typevalue === Eden.AST.TYPE_NUMBER || range.expression.typevalue === Eden.AST.TYPE_BOOLEAN)) {
		range.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
		return range;
	}

	if (this.token === "..") {
		this.next();
		range.setSecond(this.pEXPRESSION());
	}
	return range;
}

Eden.AST.prototype.pASSIGNMENT = function() {
	this.next();

	var attribs;
	if (this.version >= Eden.AST.VERSION_CS3 && this.token == ":") {
		this.next();
		attribs = this.pATTRIBUTES();
	}

	var s = new Eden.AST.Assignment(this.pEXPRESSION());

	if (!s.setAttributes(attribs)) {
		s.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		this.parent = parent;
		return s;
	}

	// TODO: Check type for promise?
	if (s.expression && s.expression.type == "query") {
		s.warning = new Eden.SyntaxWarning(this, s, Eden.SyntaxWarning.MISSINGSYNC, "This is an asynchronous statement");
	}
	return s;
}

Eden.AST.prototype.pMODIFY_PLUS = function() {
	this.next();
	return new Eden.AST.Modify("+=", this.pEXPRESSION());
}

Eden.AST.prototype.pMODIFY_ARITH = function() {
	let op = this.token;
	this.next();
	let mod = new Eden.AST.Modify(op, this.pEXPRESSION());
	if (mod.expression && mod.expression.typevalue !== Eden.AST.TYPE_NUMBER && mod.expression.typevalue !== 0) {
		mod.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
	}
	return mod;
}

Eden.AST.prototype.pMODIFY_CONCAT = function() {
	this.next();
	let mod = new Eden.AST.Modify("//=", this.pEXPRESSION());
	if (mod.expression && (mod.expression.typevalue === Eden.AST.TYPE_NUMBER || mod.expression.typevalue === Eden.AST.TYPE_BOOLEAN || mod.expression.typevalue === Eden.AST.TYPE_OBJECT)) {
		mod.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
	}
	return mod;
}

Eden.AST.prototype.pMODIFY_INCDEC = function() {
	let op = this.token;
	this.next();
	return new Eden.AST.Modify(op, undefined);
}

Eden.AST.prototype.pSUBSCRIBERS = function() {
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
}

Eden.AST.prototype.pFUNCCALL_STAT = function() {
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

	this.scopedependencies = null;

	switch (this.token) {
	case "is"		: return this.pDEFINITION();
	case "in"		: return this.pRANGE_STATEMENT();
	case "="		: return this.pASSIGNMENT();
	case "+="		: return this.pMODIFY_PLUS();
	case "-="		:
	case "/="		:
	case "*="		: return this.pMODIFY_ARITH();
	case "//="		: return this.pMODIFY_CONCAT();
	case "++"		:
	case "--"		: return this.pMODIFY_INCDEC();
	case "~>"		: return this.pSUBSCRIBERS();
	case "("		: return this.pFUNCCALL_STAT();
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
	var start = this.stream.prevposition;
	var lvalue = this.pLVALUE();
	if (lvalue.errors.length > 0) return lvalue;
	var formula = this.pSTATEMENT_PP(allowrange);
	formula.left(lvalue);
	if (formula.errors.length > 0) return formula;

	var end = this.lastposition;
	var srcstr = this.stream.code.substring(start,end);
	if (srcstr[srcstr.length-1] !== ";") srcstr += ";";
	formula.setSource(start, end, srcstr);
	formula.parent = this.parent;

	return formula;
};

Eden.AST.prototype.pSUB_STATEMENT = function() {
	var stat = new Eden.AST.SubStatement;

	if (this.token == "parse") {
		this.next();
		if (this.token != "(") {
			stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
			return stat;
		}
		this.next();

		var exp = this.pEXPRESSION();
		stat.setOperation("parse", exp);

		if (exp.isconstant && exp.typevalue != 0 && exp.typevalue != Eden.AST.TYPE_STRING) {
			this.typeWarning(stat, Eden.AST.TYPE_STRING, exp.typevalue);
			//return stat;
		}

		if (this.token != ")") {
			stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
			return stat;
		}
		this.next();

		return stat;
	}

	stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
	return stat;
}

Eden.AST.prototype.pSTAT_DEFAULT = function() {
	this.next();
	var def = new Eden.AST.Default();
	if (this.token != ":") {
		def.error(new Eden.SyntaxError(this,
					Eden.SyntaxError.DEFAULTCOLON));
	} else {
		this.next();
	}
	return def;
}

Eden.AST.prototype.pSTAT_COMMENT = function() {
	var start2 = this.stream.position+1;
	var startline2 = this.stream.line;
	var isdoxy = this.stream.peek() == 33;
	//console.log("HASH COM",this.stream.peek());
	var bcount = 0;

	do {
		//this.stream.skip();
		//this.stream.skipLine();

		let s = this.stream;
	
		while (s.valid()) {
			let ch = s.code.charCodeAt(s.position);
			if (ch === 123) ++bcount;
			else if (ch === 125) --bcount;
			if (ch === 10 || (bcount < 0)) break;
			++s.position;
		}

		if (bcount < 0) break;
		
		if (!this.stream.valid()) {
			this.errors.push(new Eden.SyntaxError(this,Eden.SyntaxError.NEWLINE));
		}
		this.stream.skip();
		this.stream.line++;
	} while (this.stream.peek() == 35 && this.stream.peek2() != 35);

	if (isdoxy) {					
		var doxy2 = new Eden.AST.DoxyComment(this.stream.code.substring(start2, this.stream.position-1).trim(), startline2, this.stream.line);
		doxy2.parent = this.parentDoxy;
		if (doxy2.content.endsWith("@{")) {
			this.parentDoxy = doxy2;
		} else if (doxy2.content.startsWith("@}")) {
			if (this.parentDoxy) this.parentDoxy = this.parentDoxy.parent;
		}

		if (this.lastStatement && this.lastStatement.doxyComment === undefined && (this.lastStatEndline == startline2-1 || this.lastStatEndline == startline2)) {
			this.lastStatement.setDoxyComment(doxy2);
		} else {
			this.lastDoxyComment.push(doxy2);
		}
	}
	this.next(); //this.stream.readToken();
	//return this.pSTATEMENT();
	//console.log("DOXY HASH",this.token, this.stream.line, this.origin);
	return new Eden.AST.DummyStatement();

}

Eden.AST.prototype.pSTAT_RETURN = function() {
	this.next();
	var ret = new Eden.AST.Return();

	if (this.token != ";") {
		ret.setResult(this.pEXPRESSION());
		if (ret.errors.length > 0) {
			return ret;
		}
	} else {
		//this.next();
		return ret;
	}

	/*if (this.token != ";") {
		ret.error(new Eden.SyntaxError(this,
					Eden.SyntaxError.SEMICOLON));
	} else {
		this.next();
	}*/

	return ret;
}

Eden.AST.prototype.pSTAT_OBSERVABLE = function(start) {
	var stat;
	var lvalue = this.pLVALUE();

	if (lvalue.errors.length > 0) {
		stat = new Eden.AST.DummyStatement();
		stat.lvalue = lvalue;
		stat.errors = lvalue.errors;
		return stat;
	}
	lvalue.source = this.stream.code.substring(start,this.lastposition).trim();
	var formula = this.pSTATEMENT_PP();
	formula.left(lvalue);

	if (formula.errors.length > 0) {
		stat = formula;
		return stat;
	}

	/*if (this.token !== ";") {
		formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
	} else {
		this.next();
	}*/

	//if (this.definitions[lvalue.name] === undefined) this.definitions[lvalue.name] = [];
	//this.definitions[lvalue.name].push(formula);

	stat = formula;
	return stat;
}

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
	var doxy = (this.lastDoxyComment && this.lastDoxyComment.length > 0) ? this.lastDoxyComment.pop() : undefined;
	if (this.lastDoxyComment.length == 0 && this.parentDoxy) this.lastDoxyComment.push(this.parentDoxy);
	var expectssemi = false;

	switch (this.token) {
	case "proc"		:
	case "func"		:	stat = this.pFUNCTION(); break;
	case "when"		:	this.next(); stat = this.pWHEN(); break;
	case "action"	:	this.next(); stat = this.pNAMEDSCRIPT(); break;
	case "for"		:	this.next(); stat = this.pFOR(); break;
	case "while"	:	this.next(); stat = this.pWHILE(); break;
	case "do"		:	this.next(); stat = this.pDO(); break;
	case "exec"		:	this.next(); stat = this.pEXEC(); break;
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
	case "para"		:	stat = this.pPARAMS(); break;
	case "const"	:
	case "local"	:
	case "auto"		:	stat = this.pLOCALS(); break;
	case "default"	:	stat = this.pSTAT_DEFAULT(); break;
	case "if"		:	this.next(); stat = this.pIF(); break;
	case "#"		:	stat = this.pSTAT_COMMENT(); break;
	case "##"		:	stat = this.pSECTION();
						if (this.lastDoxyComment.length > 0 && this.lastline == this.lastDoxyComment[0].startline-1) {
							//console.log("DOXY", this.lastline, this.lastDoxyComment[0].startline);
							stat.setDoxyComment(this.lastDoxyComment.shift());
							//this.lastDoxyComment = this.parentDoxy;
						}
						break;

	case "%"		:	stat = this.pCUSTOM_SECTION(); break;
						
	case "return"	:	expectssemi = true; stat = this.pSTAT_RETURN(); break;
	case "continue"	:	this.next();
						expectssemi = true;
						var cont = new Eden.AST.Continue();
						if (cont.errors.length > 0) {
							stat = cont;
							break;
						}

						/*if (this.token != ";") {
							cont.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/

						stat = cont; break;
	case "break"	:	this.next();
						expectssemi = true;
						var breakk = new Eden.AST.Break();
						if (breakk.errors.length > 0) {
							stat = breakk;
							break;
						}

						/*if (this.token != ";") {
							breakk.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/

						stat = breakk; break;
	case "{"		:	this.next();
						var script = this.pSCRIPT();
						if (this.token !== "}") {
							script.error(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCLOSE));
							stat = script;
							break;
						}
						this.next();
						stat = script; break;
	case "${"		:	this.next();
						stat = this.pSUB_STATEMENT();
						if (this.token !== "}") {
							stat.error(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
							break;
						}
						this.next();
						break;
	case "JAVASCRIPT" : curline = this.data.line-1;
						var js = this.data.value;
						this.next();
						stat = new Eden.AST.Literal("JAVASCRIPT", js);
						//endline = this.stream.line;
						break;
	case "?"		  : this.next();
						expectssemi = true;
						stat = this.pQUERY();
						/*if (this.token !== ";") {
							stat.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/
						break;
	case "("		  :
	case "`"		  :
	case "*"		  :
	case "OBSERVABLE" :	expectssemi = true; stat = this.pSTAT_OBSERVABLE(start); break;
	default : 			stat = undefined; break;
	}

	// In tolerant mode, allow for some additional corrupt cases.
	if (!stat && this.options && this.options.tolerant) {
		switch (this.token) {
		case "is"		:
		case "="		:	var lvalue = new Eden.AST.LValue();
							lvalue.setObservable("__error__");
							var formula = this.pSTATEMENT_PP();
							formula.left(lvalue);
							/*if (this.token !== ";") {
								formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
							} else {
								this.next();
							}*/
							stat = formula;
							console.error("Recovery", stat);
							break;
		}
	}

	if (!stat) return stat;

	if (stat.errors.length > 0 && stat.errors[stat.errors.length-1] !== this.last_error) {
		this.last_error = stat.errors[stat.errors.length-1];
		
		/*if (expectssemi && this.token != ";") {
			if (this.options && this.options.autorecover) {
				while (this.token != ";" && this.token != "EOF") {
					//if (this.token == "EOF") break;
					this.next();
				}
				this.next();
			} else {
				stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.STATEMENT));
			}
		}*/
	}

	if (this.token === ";") {
		this.next();
	}

	//if (!this.warning && stat.warning) this.warning = stat.warning;

	// Add statement properties
	end = this.lastposition;
	endline = this.lastline;
	stat.parent = this.parent;
	stat.local = this.localStatus;
	stat.line = this.stream.line - curline;
	if (stat.doxyComment === undefined) {
		if (!stat.setDoxyComment) console.error("Bad stat", stat);
		stat.setDoxyComment(doxy);// (doxy && doxy.endline == curline-1) ? doxy : undefined;
	}
	stat.stamp = this.stamp;
	//stat.numlines = endline - curline - 1;

	var srcstr = this.stream.code.substring(start,end);
	// const lines = (srcstr.match(/\n/g) || '').length;
	const doxylines = (doxy) ? (doxy.content.match(/\n/g) || '').length : 0;
	stat.numlines = endline-curline-1+doxylines;

	//if (stat.numlines-doxylines != endline-curline-1) console.log("line dif", stat, stat.numlines, endline-curline-1);

	stat.setSource(start, end, srcstr);
	if (stat.type !== "dummy") {
		this.lastStatement = stat;
		this.lastStatEndline = endline;
	}

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
	if (this.parentDoxy) this.lastDoxyComment = this.parentDoxy;

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
							//this.next();
							stat = ret;
							break;
						}

						/*if (this.token != ";") {
							ret.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/

						stat = ret; break;
	case "continue"	:	this.next();
						var cont = new Eden.AST.Continue();
						if (cont.errors.length > 0) {
							stat = cont;
							break;
						}

						/*if (this.token != ";") {
							cont.error(new Eden.SyntaxError(this,
										Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/

						stat = cont; break;
	case "break"	:	this.next();
						var breakk = new Eden.AST.Break();
						if (breakk.errors.length > 0) {
							stat = breakk;
							break;
						}

						/*if (this.token != ";") {
							breakk.error(new Eden.SyntaxError(this,
											Eden.SyntaxError.SEMICOLON));
						} else {
							this.next();
						}*/

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
		
						/*if (this.token != ";") {
							formula.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
						} else {*/
							// End source here to avoid bringing comments in
							end = this.stream.position;
							endline = this.stream.line;
							//this.next();
						//}

						if (this.definitions[lvalue.name] === undefined) this.definitions[lvalue.name] = [];
						this.definitions[lvalue.name].push(formula);

						stat = formula; break;
	default : return undefined;
	}

	if (this.token === ";") {
		this.next();
	}
	
	stat.parent = this.parent;
	stat.doxyComment = doxy;
	stat.version = this.version;

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

