Eden.AST.prototype.pTEMPLATE_STRING = function(ws) {
	var starttoken = this.token;
	var expr;
	var laststart = this.stream.position;

	while (!this.stream.eof()) {
		var ch = this.stream.get();
		var c = String.fromCharCode(ch);

		if (c === starttoken) {
			var str = this.stream.code.substring(laststart,this.stream.position-1);
			str = str.replace(/\\([\\\{\}'])/g,"$1");

			this.next();

			if (str.length == 0 && expr) return expr;
			if (!expr) return new Eden.AST.Literal("STRING", str);

			var op = new Eden.AST.BinaryOp("//");
			op.left(expr);
			op.setRight(new Eden.AST.Literal("STRING", str));
			return op;
		} else if (c === "\\") {
			this.stream.skip();
		} else if (c === "}") {
			expr = new Eden.AST.Literal("UNDEFINED");
			this.syntaxError(expr, Eden.SyntaxError.UNKNOWN);  // TODO: Error type
			return expr;
		} else if (c === "{") {
			var str = this.stream.code.substring(laststart,this.stream.position-1);
			str = str.replace(/\\([\\\{\}'])/g,"$1");

			this.next();
			var subexp = this.pEXPRESSION();

			if (subexp.typevalue == Eden.AST.TYPE_LIST || subexp.typevalue == Eden.AST.TYPE_OBJECT) {
				this.typeWarning(subexp, Eden.AST.TYPE_STRING, subexp.typevalue);
			}

			if (this.token !== "}") {
				// TODO: Error type
				subexp.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN, "Missing template expression close"));
				return subexp;
			}
			laststart = this.stream.position;

			if (str.length > 0 && expr) {
				var op = new Eden.AST.BinaryOp("//");
				op.left(expr);
				op.setRight(new Eden.AST.Literal("STRING", str));
				expr = op;

				op = new Eden.AST.BinaryOp("//");
				op.left(expr);
				op.setRight(subexp);
				expr = op;
			} else if (str.length > 0) {
				var op = new Eden.AST.BinaryOp("//");
				op.left(new Eden.AST.Literal("STRING", str));
				op.setRight(subexp);
				expr = op;
			} else {
				expr = subexp;
			}
		} else if (c === "${") {
			// TODO: Implement this

			var subexp = this.pEXPRESSION();

			if (this.token !== "}") {

			}

		} else if (!ws && this.stream.isWhiteSpace(ch)) {
			var str = this.stream.code.substring(laststart,this.stream.position-1);
			str = str.replace(/\\([\\\{\}'])/g,"$1");

			var lit = new Eden.AST.Literal("STRING", str);
			// TODO: Error type
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN, "White space not allowed"));
			return lit;
		}
	}

	var str = this.stream.code.substring(laststart,this.stream.position-1);
	str = str.replace(/\\([\\\{\}'])/g,"$1");

	var lit = new Eden.AST.Literal("STRING", str);
	// TODO: Error type
	lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN, "End of input"));
	return lit;
}