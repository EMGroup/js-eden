Eden.AST.For = function() {
	this.type = "for";
	Eden.AST.BaseStatement.apply(this);

	this.sstart = undefined;
	this.condition = undefined;
	this.inc = undefined;
	this.statement = undefined;
	this.compiled = undefined;
	this.started = false;
	this.list = undefined;
	this.index = 0;
	this.dirty = false;
};

Eden.AST.For.prototype.setStart = function(start) {
	this.sstart = start;
	if (start) {
		this.errors.push.apply(this.errors, start.errors);
	}
}

Eden.AST.For.prototype.setCondition = function(condition) {
	this.condition = condition;
	if (condition) {
		this.errors.push.apply(this.errors, condition.errors);
	}
}

Eden.AST.For.prototype.setIncrement = function(inc) {
	this.inc = inc;
	if (inc) {
		this.errors.push.apply(this.errors, inc.errors);
	}
}

Eden.AST.For.prototype.setStatement = function(statement) {
	this.statement = statement;
	if (statement) {
		this.errors.push.apply(this.errors, statement.errors);
	}
}

Eden.AST.For.prototype.generate = function(ctx,scope, options) {
	var res = "for (";
	if (this.sstart) {
		res += this.sstart.generate(ctx,scope, options) + " ";
	} else res += "; ";
	if (this.condition) {
		res += this.condition.generate(ctx, "scope", options) + "; ";
	} else res += "; ";
	var incer = this.inc.generate(ctx,scope,options);
	if (incer.charAt(incer.length-2) == ";") incer = incer.slice(0,-2);
	res += incer + ")\n";
	res += this.statement.generate(ctx,scope,options);
	return res;
}

Eden.AST.For.prototype.getCondition = function(ctx, scope) {
	if (this.compiled && this.dirty == false) {
		return this.compiled;
	} else {
		var express = this.condition.generate(ctx, "scope",{bound: false, usevar: ctx.type == "scriptexpr", scope: scope});
		if (ctx.dirty) {
			this.dirty = true;
			ctx.dirty = false;
		}

		var expfunc = new Function(["context","scope"], "return " + express + ";");
		this.compiled = expfunc;
		return expfunc;
	}
}

Eden.AST.For.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;

	if (this.sstart && this.sstart.type === "range") {
		if (this.list === undefined) {
			if (this.sstart.second) {
				this.index = this.sstart.expression.execute(ctx,base,scope,agent);
				this.list = this.sstart.second.execute(ctx,base,scope,agent);
			} else {
				this.list = this.sstart.expression.execute(ctx,base,scope,agent);
				this.index = 0;
			}
		}
		var sym = this.sstart.lvalue.getSymbol(ctx,base,scope); //root.lookup(this.sstart.lvalue.getSymbol);

		if (this.sstart.second) {
			if (this.index <= this.list) {
				sym.assign(this.index, scope, this);
				this.index++;
				return [this.statement, this];
			} else {
				this.index = 0;
				this.list = undefined;
				return;
			}
		} else if (Array.isArray(this.list)) {
			//for (var i=0; i<this.list.length; i++) {
			if (this.index < this.list.length) {
				sym.assign(this.list[this.index],scope,this);
				this.index++;
				return [this.statement, this];
			} else {
				this.index = 0;
				this.list = undefined;
				return;
			}
		}
	} else if (this.sstart && !this.started) {
		this.started = true;
		return [this.sstart,this];
	}

	if (!this.condition || this.getCondition(ctx, scope)(scope.context,scope)) {
		if (this.inc) {
			return [this.statement, this.inc, this];
		} else {
			return [this.statement, this];
		}
	} else {
		this.started = false;
	}
}

Eden.AST.registerStatement(Eden.AST.For);

