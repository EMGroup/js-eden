Eden.Selectors.NameNode = function(name) {
	this.type = "name";
	this.name = name;
	this.options = undefined;
	this.isreg = name.charAt(0) == "/" || name.indexOf("*") != -1;
	this.local = false;
}

Eden.Selectors.NameNode.prototype.depend = Eden.Selectors._depend;

Eden.Selectors.NameNode.prototype.filter = function(statements) {
	if (!statements) return this.depend(this.construct());
	else return this.depend(Promise.resolve(this._filter(statements)));
}

Eden.Selectors.NameNode.prototype._filter = function(statements) {
	var name = this.name;

	if (!statements) return this._construct();

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

Eden.Selectors.NameNode.prototype._construct = function() {
	var stats = [];

	if (this.isreg) {
		var reg = Eden.Selectors.makeRegex(this.name);
		stats = Eden.Index.getByNameRegex(reg);
	} else {
		stats = Eden.Index.getByName(this.name);
		var tags = this.name.toLowerCase().split(" ");
		var tagres = Eden.Index.getByTag("#"+tags[0]);
		for (var i=1; i<tags.length; i++) {
			tagres = tagres.filter(function(stat) {
				return (!eden.project || stat !== eden.project.ast.script) && stat.doxyComment && stat.doxyComment.hasTag("#"+tags[i]);
			});
		}
		stats.push.apply(stats, tagres);
	}
	return stats;
}

Eden.Selectors.NameNode.prototype.construct = function() {
	//return new Promise((resolve,reject) => {
	let stats = this._construct();

	if (!this.options || !this.options.history) {
		return Promise.resolve(stats.filter(function(e) {
			return e.executed >= 0;
		}));
	}
	return Promise.resolve(stats);
	//});
}

Eden.Selectors.NameNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.NameNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

