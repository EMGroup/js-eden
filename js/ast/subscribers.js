Eden.AST.Subscribers = function() {
	this.type = "subscribers";
	this.errors = [];
	this.list = [];
	this.lvalue = undefined;
	this.start = undefined;
	this.end = undefined;
};

Eden.AST.Subscribers.prototype.left = function(lvalue) {
	this.lvalue = lvalue;
	if (lvalue.errors.length > 0) {
		this.errors.push.apply(this.errors, lvalue.errors);
	}
};

Eden.AST.Subscribers.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Subscribers.prototype.execute = function(ctx, base, scope) {
	
}

Eden.AST.Subscribers.prototype.setList = function(list) {
	this.list = list;
}

Eden.AST.Subscribers.prototype.error = fnEdenASTerror;

