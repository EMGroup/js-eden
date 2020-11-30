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
	this.attribs = {};
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

Eden.AST.Do.prototype.setAttributes = function(attr) {
	this.attribs = attr;
	for (var a in attr) {
		if (!Eden.AST.Do.attributes.hasOwnProperty(a)) {
			return false;
		}
	}
	return true;
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

Eden.AST.Do.prototype.getScope = function(ctx, scope) {
	// FIXME: Can't pre-compile because context changes. (fixed?)
	if (this.compScope === undefined) {
		if (this.scope) {
			try {
				this.compScope = new Function(["context","scope"], "var s = " + this.scope.generateConstructor(ctx, "scope", {bound: false, scope: scope}) + "; s.rebuild(); return s;");
			} catch (e) {
				console.error("Scope generate failed", e);
			}
		} else {
			// Just create an empty scope
			this.compScope = function(context, scope) {
				return new Scope(context, scope, [], false, null, false);
			};
		}
	}
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

