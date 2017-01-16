Eden.AST.Subscribers = function() {
	this.type = "subscribers";
	Eden.AST.BaseStatement.apply(this);

	this.list = [];
	this.lvalue = undefined;
};

Eden.AST.Subscribers.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Subscribers.prototype.execute = function(ctx, base, scope) {
	
}

Eden.AST.Subscribers.prototype.setList = function(list) {
	this.list = list;
}

Eden.AST.registerStatement(Eden.AST.Subscribers);

