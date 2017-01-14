Eden.AST.prototype.pQUERY = function() {
	var stat = new Eden.AST.Query();

	var restype = [];

	if (this.token == "[") {
		this.next();
		while (this.stream.valid() && this.token != "]") {
			restype.push(this.data.value);
			this.next();
			if (this.token == "]") break;
			if (this.token != ",") {
				stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
				return stat;
			}
			this.next();
		}

		if (this.token != "]") {
			stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
			return stat;
		}
		this.next();
	}

	if (restype.length == 0) {
		restype.push("id");
	}

	stat.setResultTypes(restype);

	if (this.token != "(") {
		stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDOPEN));
		return stat;
	}
	this.next();

	stat.setSelector(this.pCODESELECTOR());

	if (this.token != ")") {
		stat.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.IFCONDCLOSE));
		return stat;
	}
	this.next();
	return stat;
}
