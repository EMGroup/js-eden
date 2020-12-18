Eden.AST.SubStatement = function() {
	this.type = "substat";
	Eden.AST.BaseStatement.apply(this);
	this.kind = "parse";
	this.expression = undefined;
	this.last = null;
};

Eden.AST.SubStatement.prototype.setOperation = function(kind, expr) {
	this.expression = expr;
	if (expr && expr.errors.length > 0) this.errors.push.apply(this.errors, expr.errors);
}

Eden.AST.SubStatement.prototype.toEdenString = function(scope, state) {
	var val = Eden.AST.executeExpressionNode(this.expression, scope, state);
	return val;
}

Eden.AST.SubStatement.prototype.generate = function(ctx,scope,options) {
	var state = {
		isconstant: true,
		locals: ctx.locals,
		scope: options.scope,
		symbol: options.symbol
	};
	var val = Eden.AST.executeExpressionNode(this.expression, options.scope, state);

	var stat = Eden.AST.parseStatement(val);
	console.log("PARSE STRING = " + val, stat);
	return stat.generate(ctx, scope, options);
}

Eden.AST.SubStatement.prototype.execute = function(ctx,base,scope,agent) {
	this.executed = 1;

	var state = {
		isconstant: true,
		locals: ctx.locals,
		scope: scope
	};
	var val = Eden.AST.executeExpressionNode(this.expression, scope, state);

	var stat = Eden.AST.parseStatement(val);

	if (stat.errors.length == 0) {
		stat.parent = this.parent;
		stat.nextSibling = this.nextSibling;
		stat.previousSibling = this.previousSibling;
		stat.generated = this;
		//stat.source = val;
		stat.buildID();
		if (this.last && this.last.id !== stat.id) {
			if (this.last.type === "when" && this.last.enabled) {
				console.warn("When disable is needed");
				eden.project.removeAgent(this.last)
			}

			this.last.destroy();

			if (this.last.type === "script" && this.last.name && this.parent && this.parent.type === "script") {
				delete this.parent.subscripts[this.last.name];
			}

			this.last = stat;
			stat.addIndex();
		} else if (!this.last) {
			this.last = stat;
			stat.addIndex();
			if (stat.type === "script" && stat.name && this.parent && this.parent.type === "script") {
				stat.lock = 1;
				this.parent.subscripts[stat.name] = stat;
			}
		}
	}

	return (stat.errors.length == 0) ? [stat] : [];
}

Eden.AST.registerStatement(Eden.AST.SubStatement);

Eden.AST.SubStatement.prototype.destroy = function() {
	if (this.last) {
		if (this.last.type === "when" && this.last.enabled) {
			console.warn("When disable is needed");
			eden.project.removeAgent(this.last)
		}
		this.last.destroy();
	}
	Eden.AST.BaseStatement.destroy.call(this);
}

/*Eden.AST.SubStatement.prototype.getSource = function() {
	if (this.last && this.last.type === "script") {
		return "${parse(\""+this.last.getSource()+"\")}";
	} else {
		return this.source;
	}
}*/

