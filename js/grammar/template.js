Eden.AST.prototype.pTEMPLATE_STRING = function(ws) {
	var starttoken = this.token;
	var expr;
	var laststart = this.stream.position;

	while (!this.stream.eof()) {
		var c = String.fromCharCode(this.stream.get());

		if (c == starttoken) {
			this.next();

			var str = this.stream.code.substring(laststart,this.stream.position-1);

			if (str.length == 0 && expr) return expr;
			if (!expr) return new Eden.AST.Literal("STRING", str);

			var op = new Eden.AST.BinaryOp("//");
			op.left(expr);
			op.setRight(new Eden.AST.Literal("STRING", str));
			return op;
		} else if (c == "{") {
			this.next();
			console.log("TOKEN",this.token);

			var str = this.stream.code.substring(laststart,this.stream.position-2);
			var subexp = this.pEXPRESSION();

			if (this.token != "}") {
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
		} else if (c == "${") {

			var subexp = this.pEXPRESSION();

			if (this.token != "}") {

			}

		} else if (!ws && this.stream.isWhiteSpace(c)) {
			var str = this.stream.code.substring(laststart,this.stream.position-1);
			var lit = new Eden.AST.Literal("STRING", str);
			// TODO: Error type
			lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN, "White space not allowed"));
			return lit;
		}
	}

	var str = this.stream.code.substring(laststart,this.stream.position-1);
	var lit = new Eden.AST.Literal("STRING", str);
	// TODO: Error type
	lit.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN, "End of input"));
	return lit;
}