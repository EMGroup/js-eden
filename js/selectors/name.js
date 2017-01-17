Eden.Selectors.NameNode = function(name) {
	this.type = "name";
	this.name = name;
	this.isreg = name.indexOf("*") != -1;
	this.local = false;
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
	if (this.isreg) {
		var reg = Eden.Selectors.makeRegex(this.name);
		stats = Eden.Index.getByNameRegex(reg);
	} else {
		stats = Eden.Index.getByName(this.name);
	}

	if (!this.options || !this.options.history) {
		return stats.filter(function(e) {
			return e.executed >= 0;
		});
	}
	return stats;
}

Eden.Selectors.NameNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.NameNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;
