/**
 * REQUIRE Production
 * REQUIRE -> EXPRESSION ;
 */
Eden.AST.prototype.pREQUIRE = function() {
	var req = new Eden.AST.Require();
	var express = this.pEXPRESSION();
	req.setExpression(express);
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

	var path = this.pAGENTPATH();
	if (path == "_ERROR_") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTPATH));
		return imp;
	}

	// Check for a version tag
	if (this.token == "@") {
		this.next();
		if (this.token == "OBSERVABLE" || this.token == "NUMBER") {
			imp.setTag(this.data.value);
		} else {
			imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTTAG));
			return imp;
		}
		this.next();
	}

	if (this.token != ";" && this.token != "OBSERVABLE" && this.token != "local") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return imp;
	}

	while (this.token == "OBSERVABLE" || this.token == "local") {
		if (Language.importoptions[this.data.value]) {
			if (imp.addOption(this.data.value) == false) {
				imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTCOMB));
				return imp;
			}
		} else {
			imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IMPORTOPTION));
			return imp;
		}
		this.next();
	}

	if (this.token != ";") {
		imp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
		return imp;
	}
	this.next();

	imp.setPath(path);
	return imp;
}

