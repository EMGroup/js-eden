Eden.AST.If = function() {
	this.type = "if";
	Eden.AST.BaseStatement.apply(this);

	this.condition = "";
	this.statement = undefined;
	this.elsestatement = undefined;
};

Eden.AST.If.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.If.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.If.prototype.setCondition = function(condition) {
	this.condition = condition;
	this.errors.push.apply(this.errors, condition.errors);
};

Eden.AST.If.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		statement.parent = this;
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.setElse = function(statement) {
	this.elsestatement = statement;
	if (statement) {
		statement.parent = this;
		this.errors.push.apply(this.errors, statement.errors);
	}
};

Eden.AST.If.prototype.generate = function(ctx, scope) {
	var res = "if (";
	res += this.condition.generate(ctx, scope,{bound: false});
	res += ") ";
	res += this.statement.generate(ctx, scope) + " ";
	if (this.elsestatement) {
		res += "\nelse " + this.elsestatement.generate(ctx, scope) + "\n";
	}
	return res;
}

Eden.AST.If.prototype.getCondition = function(ctx) {
	var cond = "(function(context,scope,ctx) { return ";
	cond += this.condition.generate(ctx, "scope",{bound: false});
	cond += ";})";
	return eval(cond);
}

Eden.AST.If.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	
	if (this.getCondition(ctx)(eden.root,scope,ctx)) {
		return [this.statement];
	} else {
		this.executed = 2;
		if (this.elsestatement) {
			return [this.elsestatement];
		}
	}
}

Eden.AST.If.prototype.error = fnEdenASTerror;

