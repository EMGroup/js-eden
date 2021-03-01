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
		if (this.token === "[") {
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

			if (this.token !== "]") {
				comp.error(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return components;
			}
			this.next();
		} else if (this.token === ".") {
			this.next();

			// Make an index tree element.
			var comp = new Eden.AST.LValueComponent("index");

			if (this.token != "OBSERVABLE") {
				comp.errors.unshift(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXEXP));
				components.push(comp);
				return components;
			}

			var expression = new Eden.AST.Literal("STRING", this.data.value);
			this.next();
			comp.index(expression);
			components.push(comp);
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

	/*if (this.token === "(") {
		this.next();
		if (this.token === "*") {
			this.next();
			lvalue.setPrimary(this.pPRIMARY());
		} else {
			lvalue.setPrimary(this.pPRIMARY());
		}
		if (this.token !== ")") {
			lvalue.error(new Eden.SyntaxError(this, Eden.SyntaxError.EXPCLOSEBRACKET));
			return lvalue;
		}
		this.next();*/
	if (this.token === "*") {
		//this.next();
		let prim = this.pFACTOR_DEREFERENCE_NOIX();
		lvalue.setPrimary(prim);
	} else if (this.token === "`") {
		var btick;

		if (this.version === Eden.AST.VERSION_CS2) {
			//console.warn("Old syntax for backticks");
			this.next();
			btick = this.pEXPRESSION();
			this.deprecated(btick, "Backticks are now identifier templates");

			// Closing backtick missing?
			if (this.token !== "`") {
				var primary = new Eden.AST.Primary();
				primary.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BACKTICK));
				return primary;
			} else {
				this.next();
			}
		} else {
			btick = this.pTEMPLATE_STRING(false);
		}

		if (btick.typevalue != 0 && btick.typevalue != Eden.AST.TYPE_STRING) {
			var primary = new Eden.AST.Primary();
			this.typeWarning(primary, Eden.AST.TYPE_STRING, btick.typevalue);
			//return primary;
		}

		lvalue.setExpression(btick);
		if (lvalue.errors.length > 0) return lvalue;

	} else if (this.token === "OBSERVABLE") {
		var observable = this.data.value;
		this.next();

		if (this.token === "{" && this.version === Eden.AST.VERSION_CS2) {
			//console.warn("Old syntax for backticks");
			var p = this.pDEPRECATED_BTICK(observable);
			this.deprecated(p, "Backticks are now identifier templates");
			lvalue.setExpression(p);
		} else {
			lvalue.setObservable(observable);
		}

		if (this.version >= Eden.AST.VERSION_CS3 && this.token === ":") {
			this.next();
			var attribs = this.pATTRIBUTES();
			if (!lvalue.setAttributes(attribs)) {
				this.syntaxError(lvalue, Eden.SyntaxError.DOBADATTRIB);
				return lvalue;
			}
		}

		//lvalue.setObservable(observable);
	} else {
		lvalue.error(new Eden.SyntaxError(this, Eden.SyntaxError.LVALUE));
		return lvalue;
	}

	lvalue.setExtras(this.pLVALUE_P());
	return lvalue;
};

