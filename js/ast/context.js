Eden.AST.Context = function(parent) {
	this.symbols = {};
	this.parent = parent;
}

Eden.AST.Context.prototype.lookup = function(name) {
	console.log("LOOKUP CONTEXT",name);
	if (this.symbols[name]) return this.symbols[name];
	this.symbols[name] = new Eden.AST.Handle(name);
	return this.symbols[name];
}

