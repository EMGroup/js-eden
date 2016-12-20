Eden.AST.Local = function(name) {
	console.log("MAKE LOCAL",name);
	this.name = name;
	this.cvalue = undefined;
	this.definition = undefined;
}

Eden.AST.Local.prototype.assign = function(value, scope) {
	console.log("LOCAL ASSIGN",this.name,value,scope);
	this.cvalue = value;
}

Eden.AST.Local.prototype.define = function(def, agent, deps) {
	console.log("LOCAL DEFINE", def);
	this.definition = def;
}

Eden.AST.Local.prototype.value = function(scope) {
	console.log("LOCAL SCOPE", this.name, scope, this.cvalue);
	if (this.definition) {
		return this.definition.call(this, scope.context, scope);
	} else {
		return this.cvalue;
	}
}

