Eden.Selectors.NameNode = function(name) {
	this.type = "name";
	this.name = name;
	this.isreg = name.indexOf("*") != -1;
}

Eden.Selectors.NameNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();
	var name = this.name;

	if (this.isreg) {
		var reg = Eden.Selectors.makeRegex(this.name);
		return statements.filter(function(stat) {
			return (stat.lvalue && reg.test(stat.lvalue.name)) || (stat.name && reg.test(stat.name));
		});
	} else {
		return statements.filter(function(stat) {
			return (stat.lvalue && stat.lvalue.name == name) || (stat.name && stat.name == name);
		});
	}
}

Eden.Selectors.NameNode.prototype.construct = function() {

}

Eden.Selectors.NameNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.NameNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

