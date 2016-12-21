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



Eden.AST.prototype.pCODESELECTOR_P = function() {
	var expr = undefined;

	if (this.token == "OBSERVABLE" || this.token == "when" || this.token == "action") {
		// TODO check value is valid node type...
		expr = new Eden.AST.Literal("STRING", this.data.value);
		this.next();
	} else if (this.token == ":") {
		this.next();
		if (this.token == "OBSERVABLE") {
			// TODO Check its a valid option...
			expr = new Eden.AST.Literal("STRING", ":" + this.data.value);
			this.next();
		} else if (this.token == "NUMBER") {
			expr = new Eden.AST.Literal("STRING", ":"+this.data.value);
			this.next();
		} else if (this.token == "{") {
			expr = new Eden.AST.Literal("STRING", ":");
		} else {
			expr = new Eden.AST.Literal("STRING","");
			expr.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SELECTORATTRIB));
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
	} else if (this.token == "(") {
		expr = new Eden.AST.Literal("STRING", "(");
		this.next();
	} else if (this.token == ")") {
		expr = new Eden.AST.Literal("STRING", ")");
		this.next();
	} else if (this.token == ".") {
		expr = new Eden.AST.Literal("STRING", ".");
		this.next();
	}

	if (expr) {
		var nexpr = this.pCODESELECTOR_P();
		if (nexpr === undefined) {
			return expr;
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



Eden.AST.prototype.pCODESELECTOR = function() {
	var path = this.pAGENTPATH();
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
}

