Eden.AST.Handle = function(name) {
	console.log("MAKE HANDLE",name);
	this.name = name;
	this.cvalue = undefined;
	this.definition = undefined;
}

Eden.AST.Handle.prototype.assign = function(value, scope) {
	console.log("HANDLE ASSIGN",this.name,value,scope);
	if (scope) scope.lookup(this.name).value = value;
	else this.cvalue = value;
}

Eden.AST.Handle.prototype.define = function(def, agent, deps) {
	console.log("HANDLE DEFINE", def);
	this.definition = def;
}

Eden.AST.Handle.prototype.value = function(scope) {
	console.log("HANDLE SCOPE", this.name, scope, this.cvalue);
	if (this.definition) {
		return this.definition.call(this, scope.context, scope);
	} else {
		if (scope) return scope.lookup(this.name).value;
		return this.cvalue;
	}
}

