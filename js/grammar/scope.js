/**
 * SCOPE Production
 * SCOPE -> ( SCOPE' ) | SCOPE'
 */
Eden.AST.prototype.pSCOPE = function() {
	let scope;
	//let deps = this.dependencies;
	//if (!this.scopedependencies) this.scopedependencies = Object.create(null);
	//this.dependencies = this.scopedependencies;

	if (this.token === "(") {
		this.next();
		scope = this.pSCOPE_P();
		if (this.token !== ")") {
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPECLOSE));
			//Object.assign(deps, this.dependencies);
			//this.dependencies = deps;
			return scope;
		} else {
			this.next();
		}
	} else {
		scope = this.pSCOPE_P();
	}

	//Object.assign(deps, this.dependencies);
	//this.dependencies = deps;
	return scope;
}



/**
 * SCOPEPATTERN -> observable {[ EXPRESSION ]}
 */
Eden.AST.prototype.pSCOPEPATTERN = function() {
	var sname = new Eden.AST.ScopePattern();
	if (this.token !== "OBSERVABLE") {
		sname.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPENAME));
		return sname;
	}
	sname.setObservable(this.data.value);
	this.next();

	while (true) {
		if (this.token === "[") {
			this.next();
			var express = this.pEXPRESSION();
			sname.addListIndex(express);
			if (express.errors.length > 0) return sname;
			if (this.token !== "]") {
				sname.error(new Eden.SyntaxError(this, Eden.SyntaxError.LISTINDEXCLOSE));
				return sname;
			}
			this.next();
		} else if (this.token === ".") {

		} else {
			break;
		}
	}

	return sname;
}

/**
 * SCOPE''' ->
 *   .. EXPRESSION SCOPE'' |
 *   SCOPE''
 */



/**
 * SCOPE Prime Production
 * SCOPE' ->
 *   observable is EXPRESSION SCOPE'''
 *   observable in EXPRESSION SCOPE'''
 *   observable = EXPRESSION SCOPE'''
 */
Eden.AST.prototype.pSCOPE_P = function(count) {
	var isin = false;
	var peek = this.peekNext(1);
	var obs;
	if (count === undefined) count = 1;

	if (peek !== "is" && peek !== "=" && peek !== "in") {
		obs = new Eden.AST.ScopePattern();
		obs.setObservable("$"+count);
		count++;
		//console.log("AUTO NAME", count, peek);
	} else {
		obs = this.pSCOPEPATTERN();

		if (obs.errors.length > 0) {
			var scope = new Eden.AST.Scope();
			scope.addOverride(obs, undefined, undefined, undefined, false);
			return scope;
		}

		if (this.token !== "is" && this.token !== "=" && this.token !== "in") {
			var scope = new Eden.AST.Scope();
			scope.error(new Eden.SyntaxError(this, Eden.SyntaxError.SCOPEEQUALS));
			return scope;
		}
		if (this.token === "in") isin = true;
		this.next();
	}

	
	var expression = this.pEXPRESSION();
	if (expression.errors.length > 0) {
		var scope = new Eden.AST.Scope();
		//scope.addOverride(obs, expression, undefined, undefined, false);
		scope.errors.push.apply(scope.errors, expression.errors);
		return scope;
	}
	if (isin && this.token !== ".." && expression.typevalue !== 0 && expression.typevalue !== Eden.AST.TYPE_LIST) {
		var scope = new Eden.AST.Scope();
		scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
		return scope
	}

	var exp2 = undefined;
	if (this.token === "..") {
		// Check type of first expression
		if (expression.typevalue !== 0 && expression.typevalue !== Eden.AST.TYPE_NUMBER) {
			var scope = new Eden.AST.Scope();
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
			return scope
		}

		this.next();
		exp2 = this.pEXPRESSION();
		if (exp2.errors.length > 0) {
			var scope = new Eden.AST.Scope();
			scope.addOverride(obs, expression, exp2, undefined, false);
			return scope;
		}
		if (exp2.typevalue !== 0 && exp2.typevalue !== Eden.AST.TYPE_NUMBER) {
			var scope = new Eden.AST.Scope();
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
			return scope
		}
	}

	var exp3 = undefined;
	if (this.token === "..") {
		this.next();
		exp3 = this.pEXPRESSION();
		if (exp3.errors.length > 0) {
			var scope = new Eden.AST.Scope();
			scope.addOverride(obs, expression, exp2, exp3, false);
			return scope;
		}

		if (exp3.typevalue !== 0 && exp3.typevalue !== Eden.AST.TYPE_NUMBER) {
			var scope = new Eden.AST.Scope();
			scope.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.BADEXPRTYPE));
			return scope
		}
	}

	var scope = this.pSCOPE_PP(count);
	scope.addOverride(obs, expression, exp2, exp3, isin);
	return scope;
}



/**
 * Scope Prime Prime Production
 * SCOPE'' -> , SCOPE' | epsilon
 */
Eden.AST.prototype.pSCOPE_PP = function(count) {
	if (this.token === ",") {
		this.next();
		return this.pSCOPE_P(count);
	} else {
		return new Eden.AST.Scope();
	}
}

