Eden.AST.prototype.pQUERY = function() {
	var stat = new Eden.AST.Query();

	var restype = [];

	if (this.token == "OBSERVABLE") {
		stat.observable = this.data.value;
		this.next();
		return stat;
	}

	if (this.token != "(") {
		stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYOPEN));
		return stat;
	}
	this.next();

	stat.setSelector(this.pCODESELECTOR());

	if (this.token != ")") {
		stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYCLOSE));
		return stat;
	}
	this.next();

	/*if (this.token == "[") {
		this.next();
		while (this.stream.valid() && this.token != "]") {
			restype.push(this.data.value);
			this.next();
			if (this.token == "]") break;
			if (this.token != ",") {
				stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYSELECTCOMMA));
				return stat;
			}
			this.next();
		}

		if (this.token != "]") {
			stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYSELECTCLOSE));
			return stat;
		}
		this.next();
	} else {
		//stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.QUERYSELECTOPEN));
		//return stat;
	}*/

	if (this.version >= Eden.AST.VERSION_CS3 && this.token == ":") {
		this.next();
		let attribs = this.pATTRIBUTES();
		restype = Object.keys(attribs);

	// DEPRECATED
	} else if (this.token == "[") {
		let attribs = this.pATTRIBUTES();
		restype = Object.keys(attribs);
	}

	if (this.token == "=" || this.token == "+=" || this.token == "//=") {
		var kind = this.token;
		this.next();
		var expr = this.pEXPRESSION();
		stat.setModify(expr, kind);
	}

	if (restype.length == 0) {
		//restype.push("id");
	}

	stat.setResultTypes(restype);

	return stat;
}

Eden.AST.prototype.pINDEXED = function() {
	var indexed = new Eden.AST.Indexed();

	// Do we have a list index to add
	while (this.stream.valid() && (this.token == "[" || this.token == "." || this.token == "(")) {
		if (this.token == "[") {
			this.next();
			var index = new Eden.AST.Index();

			// Can't be empty, needs an index
			if (this.token == "]") {
				indexed.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
				return indexed;
			}

			var express = this.pEXPRESSION();
			if (express.errors.length > 0) {
				index.setExpression(express);
				indexed.addIndex(index);
				return indexed;
			}

			// Check for index literal less than 1.
			if (express.type == "literal" && express.datatype == "NUMBER") {
				if (express.value < 1) {
					indexed.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.OUTOFBOUNDS));
					return indexed;
				}
			}

			// Must close ]
			if (this.token != "]") {
				indexed.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return indexed;
			} else {
				this.next();
			}

			// And try to find more components...
			//var primary = this.pPRIMARY_PPP();
			//if (primary.errors.length > 0) return primary;
			index.setExpression(express);
			indexed.addIndex(index);
		} else if (this.token == "(") {
			this.next();
			var func = new Eden.AST.FunctionCall();	

			// Check for base case of no parameters
			if (this.token == ")") {
				this.next();
				indexed.addIndex(func);
			// Otherwise we have parameters so parse them
			} else {
				// Expression list.
				var elist = this.pELIST();
				func.setParams(elist);
				if (func.errors.length > 0) {
					indexed.addIndex(func);
					return indexed;
				}

				// Check for closing bracket
				if (this.token != ")") {
					indexed.addIndex(func);
					if (func.errors.length > 0) return indexed;
					indexed.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.FUNCCALLEND));
					return indexed;
				} else {
					this.next();
				}

				indexed.addIndex(func);
			}
		} else {
			this.next();
			var index = new Eden.AST.Index();

			// Can't be empty, needs an index
			if (this.token != "OBSERVABLE") {
				indexed.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
				return indexed;
			}

			var express = new Eden.AST.Literal("STRING", this.data.value);
			this.next();

			// And try to find more components...
			//var primary = this.pPRIMARY_PPP();
			//if (primary.errors.length > 0) return primary;
			index.setExpression(express);
			indexed.addIndex(index);	
		}
	}

	return indexed;
}

