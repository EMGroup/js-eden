
Eden.AST.prototype.pATTRIBUTES = function() {
	if (this.token != "[") {
		//return {error: new Eden.SyntaxError(this, Eden.SyntaxError.DOATTRIBCLOSE)};

		if (this.token != "OBSERVABLE") {
			return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
		}

		const name = this.data.value;
		const attribs = {};
		this.next();

		let value = name;
		if (this.token === '(') {
			this.next();
			// Here, support literal or observable
			switch (this.token) {
			case 'STRING':
			case 'NUMBER':
			case 'OBSERVABLE':
				value += '(' + this.data.value + ')';
				break;
			default:
				return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
			}

			this.next();
			if (this.token !== ')') {
				return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
			}
			this.next();
		}
		attribs[value] = true;

		return attribs;
	}

	this.next();

	const attribs = {};

	while (true) {
		if (this.token != "OBSERVABLE") {
			return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
		}

		const name = this.data.value;
		this.next();

		let value = name;
		if (this.token === '(') {
			this.next();
			// Here, support literal or observable
			switch (this.token) {
			case 'STRING':
			case 'NUMBER':
			case 'OBSERVABLE':
				value += '(' + this.data.value + ')';
				break;
			default:
				return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
			}

			this.next();
			if (this.token !== ')') {
				return {errors: new Eden.SyntaxError(this, Eden.SyntaxError.DOBADATTRIB)};
			}
			this.next();
		}
		attribs[value] = true;

		if (this.token != ",") break;
		this.next();
	}

	if (this.token != "]") {
		return {error: new Eden.SyntaxError(this, Eden.SyntaxError.DOATTRIBCLOSE)};
	}
	this.next();

	return attribs;
}