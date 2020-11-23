/**
 * ELIST Production
 * ELIST -> EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pELIST = function() {
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		return [expression];
	}
	var list = this.pELIST_P();
	list.unshift(expression);
	return list;
}



/**
 * ELIST Prime Production
 * ELIST' -> , EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pELIST_P = function() {
	var result = [];
	while (this.token == ",") {
		this.next();
		var expression = this.pEXPRESSION();
		result.push(expression);
		if (expression.errors.length > 0) {
			return result;
		}
	}
	return result;
}

/**
 * LLIST Production
 * LLIST -> OBSERVABLE : EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pLLIST = function() {
	var label = this.data.value;
	this.next();
	this.next();  // The :

	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		var obj = {};
		obj[label] = expression;
		return obj;
	}
	var obj = this.pLLIST_P();
	obj[label] = expression;
	return obj;
}



/**
 * LLIST Prime Production
 * LLIST' -> , OBSERVABLE : EXPRESSION ELIST' | epsilon
 */
Eden.AST.prototype.pLLIST_P = function() {
	var result = {};
	while (this.token == ",") {
		this.next();
		var label = this.data.value;
		this.next();
		this.next();  // The :

		var expression = this.pEXPRESSION();
		result[label] = expression;
		if (expression.errors.length > 0) {
			return result;
		}
	}
	return result;
}

/**
 * OLIST Production.
 * OLIST -> observable OLIST'
 */
Eden.AST.prototype.pOLIST = function() {
	if (this.token != "OBSERVABLE") {
		return [];
	}

	var observable = this.data.value;
	this.next();

	var prime = this.pOLIST_P();
	prime.unshift(observable);
	return prime;
}


/**
 * OLIST Prime Production
 * OLIST' -> , observable OLIST' | epsilon
 */
Eden.AST.prototype.pOLIST_P = function() {
	var olist = [];
	while (this.token == ",") {
		this.next();
		if (this.token == "OBSERVABLE") {
			olist.push(this.data.value);
			this.next();
		} else {
			olist.push("NONAME");
			return olist;
		}
	}

	return olist;
}

