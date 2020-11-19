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

Eden.AST.Literal.prototype.generate = function(ctx,scope, options) {
	var res;

	switch (this.datatype) {
	case "NUMBER"	:	res = this.value; if (ctx && ctx.isdynamic) ctx.dynamic_source += Eden.edenCodeForValue(this.value); break;
	case "LIST"		:	res = "["; if (ctx && ctx.isdynamic) ctx.dynamic_source += "[";
						// Loop over each element and generate that also.
						for (var i=0; i<this.value.length; i++) {
							res += this.value[i].generate(ctx,scope, {bound: false});
							if (i != this.value.length-1) {
								res += ",";
								if (ctx && ctx.isdynamic) ctx.dynamic_source += ", ";
							}
						}
						res += "]"; if (ctx && ctx.isdynamic) ctx.dynamic_source += "]";
						break;
	case "CHARACTER":
	case "STRING"	:	var str = this.value.replace(/\n/g,"\\n");
						res = "\""+str+"\""; if (ctx && ctx.isdynamic) ctx.dynamic_source += Eden.edenCodeForValue(this.value); break;
	case "BOOLEAN"	:	res = this.value; if (ctx && ctx.isdynamic) ctx.dynamic_source += (this.value) ? "true" : "false"; break;
	case "JAVASCRIPT"	: res = this.value; if (ctx && ctx.isdynamic) ctx.dynamic_source += "${{ " + this.value + " }}$"; break;
	case "UNDEFINED"	: if (ctx && ctx.isdynamic) ctx.dynamic_source += "@"; break;
	}

	if (options.bound) {
		return "new BoundValue("+res+","+scope+")";
	} else {
		return res;
	}
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
						rhs += this.generate(ctx, "scope", {bound: false});
						rhs += ";})";
						return eval(rhs)(eden.root,scope);
	case "JAVASCRIPT"	: return eval(this.value);
	}
}

Eden.AST.registerStatement(Eden.AST.Literal);

