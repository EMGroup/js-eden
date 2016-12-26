Eden.AST.Virtual = function(name) {
	this.type = "script";
	Eden.AST.BaseScript.apply(this);
	this.name = name;
}

Eden.AST.Virtual.prototype.getSource = function() {
	return "";
}

Eden.AST.Virtual.prototype.getInnerSource = function() {
	return "";
}
