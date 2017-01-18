Eden.AST.prototype.pAGENTPATH = function() {
	if (this.token != "OBSERVABLE" && Language.keywords[this.token] === undefined) {
		return "_ERROR_";
	}

	var res = this.data.value;
	this.next();

	while (this.token == "/") {
		this.next();
		if (this.token != "OBSERVABLE" && Language.keywords[this.token] === undefined) {
			return "_ERROR_";
		}
		res += "/" + this.data.value;
		this.next();
	}

	// Allow for additional components
	/*while (this.token == ":") {
		this.next();
		if (this.token != "OBSERVABLE" && this.token != "NUMBER") {
			return "_ERROR_";
		}
		res += ":" + this.data.value;
		this.next();
	}*/

	return res;
}



Eden.AST.prototype.pCODESELECTOR = function() {
	var expr = undefined;

	if (this.token == "OBSERVABLE" || Language.keywords[this.token]) {
		expr = new Eden.AST.Literal("STRING", this.data.value);
		this.next();
	} else if (this.token == ":" || this.token == ".") {
		var ispseudo = this.token == ":";
		this.next();
		if (this.token == "OBSERVABLE") {
			if ((!ispseudo && Eden.Selectors.PropertyNode.attributes[this.data.value]) || (ispseudo && Eden.Selectors.PropertyNode.pseudo[this.data.value])) {
				expr = new Eden.AST.Literal("STRING", ((ispseudo) ? ":" : ".") + this.data.value);
				this.next();
			} else {
				expr = new Eden.AST.Literal("STRING","");
				expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORATTRIB));
				return expr;
			}
		} else if (this.token == "NUMBER") {
			expr = new Eden.AST.Literal("STRING", ((ispseudo) ? ":" : ".")+this.data.value);
			this.next();
		} else if (this.token == "{") {
			expr = new Eden.AST.Literal("STRING", (ispseudo) ? ":" : ".");
		} else if (this.token == "(") {
			var start = this.stream.position;
			this.next();
			while (this.stream.valid() && this.token != ")") this.next();
			var end = this.stream.prevposition;
			var str = ":(" + this.stream.code.substring(start,end).replace(/[\r\n]*/g,"") + ")";
			expr = new Eden.AST.Literal("STRING", str);
			this.next();
		} else {
			expr = new Eden.AST.Literal("STRING","");
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORATTRIB));
			return expr;
		}
	} else if (this.token == "@") {
		this.next();
		if (this.token == "OBSERVABLE") {
			if (Eden.Selectors.allowedOptions[this.data.value]) {
				expr = new Eden.AST.Literal("STRING", "@" + this.data.value);
				this.next();
			} else {
				expr = new Eden.AST.Literal("STRING","");
				expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTOROPTION));
				return expr;
			}
		} else {
			expr = new Eden.AST.Literal("STRING","");
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTOROPTION));
			return expr;
		}
	} else if (this.token == "#") {
		this.next();
		if (this.token == "OBSERVABLE") {
			// TODO Allow keyword tags...
			expr = new Eden.AST.Literal("STRING", "#" + this.data.value);
			this.next();
		} else if (this.token == "{") {
			expr = new Eden.AST.Literal("STRING", "#");
		} else {
			expr = new Eden.AST.Literal("STRING","");
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORTAG));
			return expr;
		}
	} else if (this.token == "{") {
		this.next();
		expr = this.pEXPRESSION();
		if (this.token != "}") {
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORBTICK));
			return expr;
		}
		this.next();
	} else if (this.token == ">") {
		expr = new Eden.AST.Literal("STRING", " > ");
		this.next();
	} else if (this.token == ">>") {
		expr = new Eden.AST.Literal("STRING", " >> ");
		this.next();
	} else if (this.token == "<") {
		expr = new Eden.AST.Literal("STRING", " < ");
		this.next();
	} else if (this.token == ",") {
		expr = new Eden.AST.Literal("STRING", ",");
		this.next();
	} else if (this.token == "<<") {
		expr = new Eden.AST.Literal("STRING", " << ");
		this.next();
	} else if (this.token == "(") {
		var start = this.stream.position;
		this.next();
		while (this.stream.valid() && this.token != ")") this.next();
		var end = this.stream.prevposition;
		var str = "(" + this.stream.code.substring(start,end).replace(/[\r\n]*/g,"") + ")";
		expr = new Eden.AST.Literal("STRING", str);
		this.next();
	} else if (this.token == ")") {
		return;
	} else if (this.token == "*") {
		expr = new Eden.AST.Literal("STRING", "*");
		this.next();
	}

	if (expr) {
		var nexpr = this.pCODESELECTOR();
		if (nexpr === undefined) {
			return expr;
		} else if (nexpr.errors.length > 0) {
			return nexpr;
		} else if (expr.type == "literal" && nexpr.type == "literal") {
			expr.value += nexpr.value;
		} else {
			var nexpr2 = new Eden.AST.BinaryOp('//');
			nexpr2.left(expr);
			nexpr2.setRight(nexpr);
			expr = nexpr2;
		}
	}

	return expr;
}



/*Eden.AST.prototype.pCODESELECTOR = function() {
	var path = this.pAGENTPATH();
	if (path == "_ERROR_") path = "";
	var expr = new Eden.AST.Literal("STRING", path);

	while (this.token == ".") {
		this.next();
		if (this.token == "OBSERVABLE") {
			if (expr.type == "literal") {
				expr.value += "." + this.data.value;
			} else {
				var nexpr = new Eden.AST.BinaryOp('//');
				nexpr.left(expr);
				nexpr.setRight(new Eden.AST.Literal("STRING", this.data.value));
				expr = nexpr;
			}
			this.next();
		} else if (this.token == "{") {
			
		} else {
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORACTION));
			return expr;
		}
	}

	// DEPRECATED, but this allows for action parameters.
	if (this.token != ">>" && this.token != ">" && this.token != ":" && this.token != "#" && this.token != "when") {
		return expr;
	}

	var nexpr = this.pCODESELECTOR_P();
	if (nexpr && nexpr.type == "literal" && expr.type == "literal") {
		expr.value += nexpr.value;
	} else if (nexpr) {
		var nexpr2 = new Eden.AST.BinaryOp("//");
		nexpr2.left(expr);
		nexpr2.setRight(nexpr);
		expr = nexpr2;
	}

	return expr;
}*/

