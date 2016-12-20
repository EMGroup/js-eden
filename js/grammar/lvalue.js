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
 * LVALUE'' ->
 *  \{ EXPRESSION \} LVALUE''
 *  | observable LVALUE''
 *  | LVALUE'
 */


/**
 * LVALUE Production
 * LVALUE ->
 *   observable LVALUE'' |
 *   * PRIMARY LVALUE' |
 *   ` EXPRESSION ` LVALUE'
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
		var observable = this.data.value;
		this.next();

		// Allow for {} style backticks on LHS.
		// Allow backtick without operator
		if (this.token == "{") {
			var expr = new Eden.AST.Literal("STRING", observable);

			while (this.token == "{") {
				this.next();
				// Parse the backticks expression
				var btick = this.pEXPRESSION();
				if (btick.errors.length > 0) {
					//var lvalue = new Eden.AST.Primary();
					lvalue.setExpression(btick);
					return lvalue;
				}	

				// Closing backtick missing?
				if (this.token != "}") {
					//var primary = new Eden.AST.Primary();
					lvalue.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
					return lvalue;
				} else {
					this.next();
				}

				var nexpr = new Eden.AST.BinaryOp('//');
				nexpr.left(expr);
				nexpr.setRight(btick);
				expr = nexpr;

				if (this.token == "OBSERVABLE") {
					var nexpr = new Eden.AST.BinaryOp('//');
					nexpr.left(expr);
					nexpr.setRight(new Eden.AST.Literal("STRING", this.data.value));
					expr = nexpr;
					this.next();
				}
			}

			// Check for '.', '[' and '('... plus 'with'
			//primary = this.pPRIMARY_P();
			lvalue.setExpression(expr);
			//primary.setObservable("__BACKTICKS__");
		} else {
			// Check for '.', '[' and '('... plus 'with'
			//primary = this.pPRIMARY_P();
			lvalue.setObservable(observable);
		}

		//lvalue.setObservable(observable);
	} else {
		lvalue.error(new Eden.SyntaxError(this, Eden.SyntaxError.LVALUE));
		return lvalue;
	}

	lvalue.setExtras(this.pLVALUE_P());
	return lvalue;
};

