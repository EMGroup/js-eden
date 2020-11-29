Eden.AST.Local = function(name) {
	this.name = name;
	this.cvalue = undefined;
	this.definition = undefined;
}

Eden.AST.Local.prototype.assign = function(value, scope) {
	var cache = scope.lookup2(this.name);
	console.log("LOCAL ASSIGN",this.name,value,scope);
	cache.value = value;
	cache.up_to_date = true;
}

Eden.AST.Local.prototype.define = function(def, agent, deps) {
	//console.log("LOCAL DEFINE", def);
	this.definition = def;
}

Eden.AST.Local.prototype.value = function(scope) {
	//console.log("LOCAL SCOPE", this.name, scope, this.cvalue);
	if (this.definition) {
		return this.definition.call(this, scope.context, scope);
	} else {
		var cache = scope.lookup2(this.name);
		return cache.value;
	}
}

