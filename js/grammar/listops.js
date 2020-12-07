/**
 * INSERT Production
 * INSERT -> LVALUE , EXPRESSION , EXPRESSION ;
 */
Eden.AST.prototype.pINSERT = function() {
	var insert = new Eden.AST.Insert();

	if (this.token != "(") {
		this.deprecated(insert, "'insert' should use brackets: 'insert(a,b,c)'");
	} else {
		this.next();
	}
	
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

	if (this.token == ")") this.next();

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

	if (this.token != "(") {
		this.deprecated(del, "'delete' should use brackets: 'delete(a,b)'");
	} else {
		this.next();
	}
	
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

	if (this.token == ")") this.next();

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

	if (this.token != "(") {
		this.deprecated(append, "'append' should use brackets: 'append(a,b)'");
	} else {
		this.next();
	}
	
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

	if (this.token == ")") this.next();

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

	if (this.token != "(") {
		this.deprecated(shif, "'shift' should use brackets: 'shift(a)'");
	} else {
		this.next();
	}

	shif.setDest(this.pLVALUE());
	if (shif.errors.length > 0) return shif;

	if (this.token == ")") this.next();

	if (this.token != ";") {
		shif.error(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return shif;
	} else {
		this.next();
	}

	return shif;
}

