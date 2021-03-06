Eden.AST.prototype.pDEPRECATED_BTICK = function(observable) {
	// Allow backtick without operator
		
	var expr = new Eden.AST.Literal("STRING", (observable) ? observable : "");
	expr.typevalue = Eden.AST.TYPE_STRING;

	while (this.token == "{") {
		this.next();
		// Parse the backticks expression
		var btick = this.pEXPRESSION();
		if (btick.errors.length > 0) {
			var primary = new Eden.AST.Primary();
			primary.setBackticks(btick);
			return primary;
		}	

		// Closing backtick missing?
		if (this.token != "}") {
			var primary = new Eden.AST.Primary();
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
			return primary;
		} else {
			this.next();
		}

		var nexpr = new Eden.AST.BinaryOp('//');
		nexpr.left(expr);
		nexpr.setRight(btick);
		nexpr.typevalue = Eden.AST.TYPE_STRING;
		expr = nexpr;

		if (this.token == "OBSERVABLE") {
			var nexpr = new Eden.AST.BinaryOp('//');
			nexpr.left(expr);
			var lit = new Eden.AST.Literal("STRING", this.data.value);
			lit.typevalue = Eden.AST.TYPE_STRING;
			nexpr.setRight(lit);
			nexpr.typevalue = Eden.AST.TYPE_STRING;
			expr = nexpr;
			this.next();
		}
	}
	return expr;
}

Eden.AST.prototype.pPRIMARY_DEPRECATED_BTICK = function(primary, observable) {
	var expr = this.pDEPRECATED_BTICK(observable);

	// Check for '.', '[' and '('... plus 'with'
	primary = this.pPRIMARY_P(primary);
	primary.setBackticks(expr);
	primary.setObservable("__BACKTICKS__");
	this.isdynamic = true;
	return primary;
}

Eden.AST.prototype.pIDENTIFIER = function(primary) {
	if (this.token === "`") {
		var btick;

		if (this.version === Eden.AST.VERSION_CS2) {
			//console.warn("Old syntax for backticks");
			this.next();
			btick = this.pEXPRESSION();
			this.deprecated(btick, "Backticks are now identifier templates");

			// Closing backtick missing?
			if (this.token !== "`") {
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
				return primary;
			} else {
				this.next();
			}
		} else {
			btick = this.pTEMPLATE_STRING(false);
		}

		primary = this.pPRIMARY_P(primary);

		if (btick.typevalue != 0 && btick.typevalue != Eden.AST.TYPE_STRING) {
			this.typeWarning(primary, Eden.AST.TYPE_STRING, btick.typevalue);
		}

		if (primary.errors.length > 0) return primary;

		primary.setBackticks(btick);
		primary.setObservable("__BACKTICKS__");
		return primary;
	} else if (this.token === "OBSERVABLE") {
		var obs = this.data.value;
		this.next();

		if (this.token === "{" && this.version === Eden.AST.VERSION_CS2) {
			//console.warn("Old syntax for backticks");
			var p = this.pPRIMARY_DEPRECATED_BTICK(primary, obs);
			this.deprecated(p, "Backticks are now identifier templates");
			return p;
		}

		//this.dependencies[obs] = true;

		primary = this.pPRIMARY_P(primary);
		if (primary.errors.length > 0) return primary;
		primary.setObservable(obs);
		return primary;
	} else {
		primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADFACTOR));
		return primary;
	}
}

/**
 * PRIMARY Production
 * PRIMARY -> observable {\{ EXPRESSION \}} PRIMARY' | ` EXPRESSION ` PRIMARY'
 */
Eden.AST.prototype.pPRIMARY = function() {

	let primary = new Eden.AST.Primary();
	return this.pIDENTIFIER(primary);
}



/**
 * PRIMARY Prime Production
 * PRIMARY' ->
 *	( ELIST ) PRIMARY''
 *	| . PRIMARY
 *	| [ EXPRESSION ] PRIMARY'''
 *	| PRIMARY''''
 */
Eden.AST.prototype.pPRIMARY_P = function(primary) {

	var attribs;

	// Allow primary attributes
	if (this.version >= Eden.AST.VERSION_CS3 && this.token == ":") {
		this.next();
		attribs = this.pATTRIBUTES();

		if (!primary.setAttributes(attribs)) {
			primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB));
		}
	}

	return primary;
}
