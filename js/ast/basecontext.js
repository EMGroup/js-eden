Eden.AST.BaseContext = function() {
	Eden.AST.BaseScript.apply(this);
	this.scopes = [];
	this.backtickCount = 0;
	this.locals = undefined;
	this.params = undefined;
	this.dependencies = {};
}