/**
 * Literals such as numbers, strings, lists and also JavaScript expressions.
 * These literals may or may not require execution to obtain their value.
 */
Eden.AST.Literal = function(type, literal) {
	this.type = "literal";
	Eden.AST.BaseStatement.apply(this);
	this.typevalue = Eden.AST.TYPE_UNKNOWN;
	this.datatype = type;
	this.value = literal;
}

Eden.AST.Literal.prototype.toString = function(scope, state) {
	var res;

	switch (this.datatype) {
	case "NUMBER"		:	return Eden.edenCodeForValue(this.value);
	case "LIST"			:	res = "[";
							// Loop over each element and generate that also.
							for (var i=0; i<this.value.length; i++) {
								res += this.value[i].toString(scope, state);
								if (i != this.value.length-1) {
									res += ",";
								}
							}
							return res + "]";
	case "OBJECT"		:	res = "[";
							var keys = Object.keys(this.value);
							for (var i=0; i<keys.length; ++i) {
								res += keys[i] + ": ";
								res += this.value[keys[i]].toString(scope,state);
								if (i != keys.length-1) {
									res += ",";
								}
							}
							return res + "]";
	case "CHARACTER"	:
	case "STRING"		:	return Eden.edenCodeForValue(this.value);
	case "BOOLEAN"		:	return (this.value) ? "true" : "false";
	case "JAVASCRIPT"	:	return "${{"+this.value+"}}$";
	case "UNDEFINED"	:	return "@";	
	}

	return "@";
}

Eden.AST.Literal.prototype.generate = function(ctx,scope, options) {
	var res;

	switch (this.datatype) {
	case "NUMBER"	:	res = this.value; //if (ctx && ctx.isdynamic) ctx.dynamic_source += Eden.edenCodeForValue(this.value);
						break;
	case "LIST"		:	res = "["; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "[";
						// Loop over each element and generate that also.
						for (var i=0; i<this.value.length; i++) {
							res += this.value[i].generate(ctx,scope, options);
							if (i != this.value.length-1) {
								res += ",";
								//if (ctx && ctx.isdynamic) ctx.dynamic_source += ", ";
							}
						}
						res += "]"; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "]";
						break;
	case "OBJECT"	:	res = "{"; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "{";
						// Loop over each element and generate that also.
						var keys = Object.keys(this.value);
						for (var i=0; i<keys.length; ++i) {
							res += keys[i] + ": ";
							res += this.value[keys[i]].generate(ctx,scope, options);
							if (i != keys.length-1) {
								res += ",";
								//if (ctx && ctx.isdynamic) ctx.dynamic_source += ", ";
							}
						}
						res += "}"; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "}";
						break;
	case "CHARACTER":
	case "STRING"	:	var str = this.value.replace(/\n/g,"\\n");
						res = "\""+str+"\""; break; //if (ctx && ctx.isdynamic) ctx.dynamic_source += Eden.edenCodeForValue(this.value); break;
	case "BOOLEAN"	:	res = this.value; break; //if (ctx && ctx.isdynamic) ctx.dynamic_source += (this.value) ? "true" : "false"; break;
	case "JAVASCRIPT"	: res = this.value; break; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "${{ " + this.value + " }}$"; break;
	case "UNDEFINED"	: break; //if (ctx && ctx.isdynamic) ctx.dynamic_source += "@"; break;
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
	case "OBJECT"	:
	case "LIST"		:	var rhs = "return ";
						rhs += this.generate(ctx, "scope", {bound: false});
						rhs += ";";
						return (new Function(["context","scope"],rhs))(eden.root,scope);
	case "JAVASCRIPT"	: return eval(this.value);
	}
}

Eden.AST.registerStatement(Eden.AST.Literal);

