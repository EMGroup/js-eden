Eden.AST.prototype.pFACTOR_SUBEXP = function() {
	this.next();

	// Parse the sub-expression
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) return expression;

	// Remove closing bracket (or error).
	if (this.token !== ")") {
		expression.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
	} else {
		this.next();
	}

	if (this.token === "[" || this.token === "." || this.token === "(") {
		var indexed = this.pINDEXED();
		indexed.setExpression(expression);
		return indexed;
	}
	return expression;
}

Eden.AST.prototype.pFACTOR_OBJECTLITERAL = function() {
	this.next();  // remove {

	var elist = {};
	// Check for basic empty case, if not then parse elements
	if (this.token !== "}") {
		elist = this.pLLIST();
	}

	var literal = new Eden.AST.Literal("OBJECT", elist);

	// Merge any errors found in the expressions
	for (var ename in elist) {
		var expr = elist[ename];
		literal.mergeExpr(expr);
	}

	literal.typevalue = Eden.AST.TYPE_OBJECT;
	if (literal.errors.length > 0) return literal;

	// Must have a closing bracket...
	if (this.token !== "}") {
		literal.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTLITCLOSE));
	} else {
		this.next();
	}
	return literal;
}

Eden.AST.prototype.pFACTOR_LISTLITERAL = function() {
	this.next();

	var elist = [];
	var labels = false;
	// Check for basic empty case, if not then parse elements
	if (this.token !== "]") {
		elist = this.pELIST();
	}

	var literal = new Eden.AST.Literal("LIST", elist);

	// Merge any errors found in the expressions
	for (var i = 0; i < elist.length; i++) {
		literal.mergeExpr(elist[i]);
	}
	
	literal.typevalue = Eden.AST.TYPE_LIST;
	if (literal.errors.length > 0) return literal;

	// Must have a closing bracket...
	if (this.token !== "]") {
		literal.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTLITCLOSE));
	} else {
		this.next();
	}
	return literal;
}

Eden.AST.prototype.pFACTOR_UNDEFINED = function() {
	this.next();
	return new Eden.AST.Literal("UNDEFINED", "@");
}

Eden.AST.prototype.pFACTOR_JAVASCRIPT = function() {
	var lit = new Eden.AST.Literal("JAVASCRIPT", this.data.value);
	this.next();
	return lit;
}

Eden.AST.prototype.pFACTOR_NUMBER = function() {
	var lit = new Eden.AST.Literal("NUMBER", this.data.value);
	this.next();
	return lit;
}

Eden.AST.prototype.pFACTOR_STRING = function() {
	var lit = new Eden.AST.Literal("STRING", this.data.value);
	if (!this.data.error) this.next();
	// Allow multiple strings to be combined as lines
	while (this.data.error == false && this.token == "STRING") {
		lit.value += "\n"+this.data.value;
		this.next();
	}

	if (this.data.error) {
		if (this.data.value === "LINEBREAK") {
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRLINE));
		} else {
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LITSTRCLOSE));
		}
	}

	return lit;
}

Eden.AST.prototype.pFACTOR_HEREDOC = function() {
	this.next();  // Remove <<

	if (this.token !== "OBSERVABLE") {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
		return lit;
	}

	var endtoken = this.data.value;

	// Must be at end of a line
	if (this.stream.get() != 10) {
		var lit = new Eden.AST.Literal("STRING", this.data.value);
		lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.HEREDOCTOKEN));
		return lit;
	}
	//this.stream.line++;

	// Scan looking for endtoken
	var res = "";
	while (this.stream.valid()) {
		var cachepos = this.stream.position;
		var line = this.stream.readLine();
		if (line.startsWith(endtoken)) {
			this.stream.position = cachepos;
			break;
		}
		res += line;
	}

	var lit = new Eden.AST.Literal("STRING", res.slice(0,-1));

	if (!this.stream.valid()) {
		lit.errors.push(new Eden.SyntaxError(this,Eden.SyntaxError.NEWLINE));
		return lit;
	}

	// Remove end token
	this.next();
	this.next();

	return lit;
}

Eden.AST.prototype.pFACTOR_BOOLEAN = function() {
	var lit = new Eden.AST.Literal("BOOLEAN", this.data.value);
	this.next();
	return lit;
}

Eden.AST.prototype.pFACTOR_NEGATION = function() {
	this.next();
	if (this.token === "NUMBER") {
		var lit = new Eden.AST.Literal("NUMBER", -this.data.value);
		this.next();
		return lit;
	} else {
		var fact = this.pFACTOR();
		var op = new Eden.AST.UnaryOp("-", fact);

		if (fact.typevalue !== 0 && fact.typevalue !== Eden.AST.TYPE_NUMBER) {
			this.typeWarning(op, Eden.AST.TYPE_NUMBER, fact.typevalue);
		}

		return op;
	}
}

Eden.AST.prototype.pFACTOR_QUERY = function() {
	// TODO: Disable following
	//if (!this.strict) {
		this.next();
		var q = this.pQUERY();
		if (this.token === "[") {
			var indexed = this.pINDEXED();
			indexed.setExpression(q);
			return indexed;
		}
		return q;
	//}

	/*this.next();

	var lit = new Eden.AST.Literal("UNDEFINED", "@");
	lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYNOTALLOWED));
	return lit;*/
}

Eden.AST.prototype.pFACTOR_HTML = function() {
	return this.pHTML();
}

Eden.AST.prototype.pFACTOR_NOT = function() {
	this.next();
	var f = this.pFACTOR();
	return new Eden.AST.UnaryOp("!", f);
}

Eden.AST.prototype.pFACTOR_DEREFERENCE = function() {
	this.next();

	if (this.token === "(") {
		this.next();
		let p = this.pFACTOR_PRIMARY();

		if (this.token !== ")") {
			p.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
			return p;
		}
		this.next();
		return new Eden.AST.UnaryOp("*", p);
	} else {
		let p = this.pPRIMARY();
		let u = new Eden.AST.UnaryOp("*", p);

		if (this.token === "[" || this.token === "." || this.token === "(") {
			var indexed = this.pINDEXED();
			indexed.setExpression(u);
			return indexed;
		} else {
			return u;
		}
	}
	
}

Eden.AST.prototype.pFACTOR_ADDRESSOF = function() {
	this.next();
	var lvalue = this.pLVALUE();
	if (lvalue.lvaluep && lvalue.lvaluep.length > 0) {
		lvalue.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
	}
	return new Eden.AST.UnaryOp("&", lvalue);
}

Eden.AST.prototype.pFACTOR_BUILTIN = function() {
	var op = this.token;
	this.next();
	if (this.token !== "(") {
		var una = new Eden.AST.UnaryOp(op, null);
		una.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
		return una;
	}
	this.next();

	var exp = this.pEXPRESSION();
	var una = new Eden.AST.UnaryOp(op, exp);

	if (una.isconstant && una.typevalue != 0 && una.typevalue != Eden.AST.TYPE_STRING) {
		this.typeWarning(una, Eden.AST.TYPE_STRING);
		//return una;
	}

	if (this.token !== ")") {
		una.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
		return una;
	}
	this.next();

	return una;
}

Eden.AST.prototype.pFACTOR_SUBSTITUTION = function() {
	this.next();
	var exp = this.pEXPRESSION();

	var una = new Eden.AST.UnaryOp("sub", exp);

	if (this.token !== "}") {
		una.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.EVALCLOSE));
		return una;
	}
	this.next();

	if (this.token === "[" || this.token === "." || this.token === "(") {
		var indexed = this.pINDEXED();
		indexed.setExpression(una);
		return indexed;
	}

	return una;
}

Eden.AST.prototype.pFACTOR_PRIMARY = function() {

	let primary = this.pPRIMARY();

	if (primary.errors.length > 0) {
		return primary;
	}

	if (this.token === "[" || this.token === "." || this.token === "(") {
		var indexed = this.pINDEXED();
		indexed.setExpression(primary);
		return indexed;
	} else {
		return primary;
	}
}

/*
 * F ->
 *	( EXPRESSION ) |
 *	- FACTOR |
 *	number |
 *	string |
 *  << observable string observable |
 *  boolean |
 *  character
 *  JAVASCRIPT |
 *  { LLIST } |
 *	[ ELIST ] |
 *	& LVALUE |
 *  @ |
 *  * FACTOR |
 *	! FACTOR |
 *  eval ( EXPRESSION ) |
 *  parse ( EXPRESSION ) |
 *  compile ( EXPRESSION ) |
 *	PRIMARY	
 */
Eden.AST.prototype.pFACTOR = function() {

	switch (this.token) {
	case "("			: return this.pFACTOR_SUBEXP();
	case "{"			: return this.pFACTOR_OBJECTLITERAL();
	case "["			: return this.pFACTOR_LISTLITERAL();
	case "@"			: return this.pFACTOR_UNDEFINED();
	case "JAVASCRIPT"	: return this.pFACTOR_JAVASCRIPT();
	case "NUMBER"		: return this.pFACTOR_NUMBER();
	case "?"			: return this.pFACTOR_QUERY();
	case "-"			: return this.pFACTOR_NEGATION();
	case "<"			: return this.pFACTOR_HTML();
	case "<<"			: return this.pFACTOR_HEREDOC();
	case "'"			: return this.pTEMPLATE_STRING(true);
	case "STRING"		: return this.pFACTOR_STRING();
	case "BOOLEAN"		: return this.pFACTOR_BOOLEAN();
	case "!"			:
	case "not"			: return this.pFACTOR_NOT();
	case "&"			: return this.pFACTOR_ADDRESSOF();
	case "*"			: return this.pFACTOR_DEREFERENCE();
	case "eval"			:
	case "parse"		:
	case "compile"		: return this.pFACTOR_BUILTIN();
	case "${"			: return this.pFACTOR_SUBSTITUTION();

	default				: return this.pFACTOR_PRIMARY();
	}
}

