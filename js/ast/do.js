Eden.AST.Do = function() {
	this.type = "do";
	Eden.AST.BaseStatement.apply(this);

	this.name = undefined;
	this.script = undefined;			// Direct script
	this.scope = undefined;
	this.compScope = undefined;
	this.nscope = undefined;
	this.selector = undefined;			// Query execution
	this.literal = undefined;			// Literal expression execution (eden string etc)
	this.statements = undefined;
	this.attribs = {atomic: false};
};

Eden.AST.Do.attributes = {
	"atomic": true,
	"nonatomic": true
};

Eden.AST.Do.prototype.setScript = function(script) {
	this.script = script;
	if (this.script && this.script.errors.length > 0) {
		this.errors.push.apply(this.errors, script.errors);
	}
}

Eden.AST.Do.prototype.setAttribute = function(name, value) {
	if (!this.attribs) this.attribs = {};
	this.attribs[name] = value;
}

Eden.AST.Do.prototype.setLiteral = function(literal) {
	this.literal = literal;
	if (literal && literal.errors.length > 0) {
		this.errors.push.apply(this.errors, literal.errors);
	}
}

Eden.AST.Do.prototype.setName = function(name) {
	if (name && name.errors) {
		this.errors.push.apply(this.errors, name.errors);
	}
	this.name = name;
}

Eden.AST.Do.prototype.setScope = function(scope) {
	this.scope = scope;
	if (scope && scope.errors.length > 0) {
		this.errors.push.apply(this.errors, scope.errors);
	}
}

Eden.AST.Do.prototype.getScope = function(ctx) {
	// FIXME: Can't pre-compile because context changes.
	//if (this.scope && this.compScope === undefined) {
		try {
			this.compScope = new Function(["context","scope"], "var s = " + this.scope.generateConstructor(ctx, "scope", {bound: false}) + "; s.rebuild(); return s;");
		} catch (e) {

		}
	//}
	return this.compScope;
}

/*Eden.AST.Do.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
}

Eden.AST.Do.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}*/



Eden.AST.Do.prototype.generate = function(ctx) {
	if (this.literal) {
		return "eden.execute("+this.literal.generate(ctx, "eden.root.scope", {})+");";
	} else {
		var err = new Eden.RuntimeError(ctx, Eden.RuntimeError.NOTSUPPORTED, this, "Cannot use 'do' here");
		this.errors.push(err);
		eden.emit("error", [EdenSymbol.defaultAgent,err]);
		return "";
	}
}

Eden.AST.Do.prototype.execute = function(ctx,base,scope, agent) {
	// Never called?
}

Eden.AST.registerStatement(Eden.AST.Do);

