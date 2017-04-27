/**
 * Literals such as numbers, strings, lists and also JavaScript expressions.
 * These literals may or may not require execution to obtain their value.
 */
Eden.AST.Literal = function(type, literal) {
	this.type = "literal";
	Eden.AST.BaseStatement.apply(this);

	this.datatype = type;
	this.value = literal;
}

Eden.AST.Literal.prototype.generate = function(ctx,scope, mode) {
	var res;

	switch (this.datatype) {
	case "NUMBER"	:	res = this.value; break;
	case "LIST"		:	res = "[";
						// Loop over each element and generate that also.
						for (var i=0; i<this.value.length; i++) {
							res += this.value[i].generate(ctx,scope, mode);
							if (i != this.value.length-1) res += ",";
						}
						res += "]";
						break;
	case "CHARACTER":
	case "STRING"	:	var str = this.value.replace(/\n/g,"\\n");
						res = "\""+str+"\""; break;
	case "BOOLEAN"	:	res = this.value; break;
	case "JAVASCRIPT"	: res = this.value; break;
	}

	return res;
}

/**
 * Execute this literal to obtain its actual javascript value, particularly
 * important for lists and JavaScript expression literals.
 */
Eden.AST.Literal.prototype.execute = function(ctx, base, scope) {
	switch(this.datatype) {
	case "NUMBER"	:
	case "CHARACTER":
	case "BOOLEAN"	:	return eval(this.value);
	case "STRING"	:	return eval("\""+this.value+"\"");
	case "LIST"		:	var rhs = "(function(context,scope) { return ";
						rhs += this.generate(ctx, "scope", Eden.AST.MODE_DYNAMIC);
						rhs += ";})";
						return eval(rhs)(eden.root,scope);
	case "JAVASCRIPT"	: return eval(this.value);
	}
}

Eden.AST.registerStatement(Eden.AST.Literal);

