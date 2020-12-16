/**
 * Wait Production
 * WAIT -> EXPRESSION ;
 */
Eden.AST.prototype.pWAIT = function() {
	var wait = new Eden.AST.Wait();

	if (this.token == ";") {
		this.next();
		return wait;
	} else {
		var express = this.pEXPRESSION();
		wait.setDelay(express);

		/*if (this.token != ";") {
			wait.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.SEMICOLON));
			return wait;
		}*/
		if (this.token === ";") this.next();
	}
	return wait;
}

