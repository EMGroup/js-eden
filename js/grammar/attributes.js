
Eden.AST.prototype.pATTRIBUTES = function() {
	if (this.token != "[") {
		return {error: new Eden.SyntaxError(this, Eden.SyntaxError.DOATTRIBCLOSE)};
	}
	this.next();

	var attribs = {};

	while (true) {
		if (this.token != "OBSERVABLE") {
			return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
		}

		attribs[this.data.value] = true;

		/*switch (this.data.value) {
		case "atomic": stat.setAttribute(this.data.value, true); break;
		case "nonatomic":	stat.setAttribute(this.data.value, true); stat.setAttribute("atomic", false); break;
		default: stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)); return;
		}*/

		this.next();
		if (this.token != ",") break;
		this.next();
	}

	if (this.token != "]") {
		return {error: new Eden.SyntaxError(this, Eden.SyntaxError.DOATTRIBCLOSE)};
	}
	this.next();

	return attribs;
}