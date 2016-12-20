Eden.AST.LList = function() {
	this.type = "lvaluelist";
	this.errors = [];
	this.llist = [];
};

Eden.AST.LList.prototype.append = function(lvalue) {
	this.llist.push(lvalue);
	this.errors.push.apply(this.errors, lvalue.errors);
};

Eden.AST.LList.prototype.error = fnEdenASTerror;


