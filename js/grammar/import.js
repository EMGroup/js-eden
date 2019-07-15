/**
 * REQUIRE Production
 * REQUIRE -> EXPRESSION ;
 */
Eden.AST.prototype.pREQUIRE = function() {
	var req = new Eden.AST.Require();
	var express = this.pEXPRESSION();
	req.setExpression(express);
	req.warning = new Eden.SyntaxWarning(this, req, Eden.SyntaxWarning.DEPRECATED, "require.");
	if (this.token != ";") {
		req.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return req;
	}
	this.next();
	return req;
}





/**
 * IMPORT Production
 * IMPORT -> name IMPORT'
 * IMPORT' -> / IMPORT | IMPORT''
 * IMPORT'' -> enabled IMPORT'' | disabled IMPORT'' | local IMPORT'' |
 *					remote IMPORT'' | rebase IMPORT'' | readonly IMPORT'' |
 * 					;
 */
Eden.AST.prototype.pIMPORT = function() {
	var imp = new Eden.AST.Import();

	imp.warning = new Eden.SyntaxWarning(this, imp, Eden.SyntaxWarning.DEPRECATED, "use of import, use action alias instead");

	var path = this.pCODESELECTOR();
	if (path === undefined || path.errors.length > 0) {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTPATH));
		return imp;
	}
	imp.setPath(path);

	if (this.token != ";") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return imp;
	}
	this.next();

	return imp;
}

