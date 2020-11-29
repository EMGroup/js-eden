Eden.AST.BaseContext = function() {
	Eden.AST.BaseScript.apply(this);
	this.scopes = [];
	this.locals = undefined;
	this.params = undefined;
	this.dependencies = {};
	this.vars = Object.create(null);
}
