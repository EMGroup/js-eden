Eden.Selectors.NameNode = function(name) {
	this.type = "name";
	this.name = name;
	this.isreg = name.indexOf("*") != -1;
}

Eden.Selectors.NameNode.prototype.filter = function(statements, context) {
	if (!statements) return this.construct(context);
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

Eden.Selectors.NameNode.prototype.construct = function(context) {
	var stats = [];

	if (this.isreg) {
		var reg = Eden.Selectors.makeRegex(this.name);
		if (context && context.statements) {
			for (var i=0; i<context.statements.length; i++) {
				var stat = context.statements[i];
				if ((stat.lvalue && reg.test(stat.lvalue.name)) || (stat.name && reg.test(stat.name))) stats.push(stat);
			}
		}
		if (eden.project) {
			if (reg.test(eden.project.name)) stats.push(eden.project.ast.script);
			for (var i=0; i<eden.project.ast.script.statements.length; i++) {
				var stat = eden.project.ast.script.statements[i];
				if ((stat.lvalue && reg.test(stat.lvalue.name)) || (stat.name && reg.test(stat.name))) stats.push(stat);
			}
		}

		for (var x in Eden.Selectors.cache) {
			if (reg.test(Eden.Selectors.cache[x].name)) stats.push(Eden.Selectors.cache[x]);
		}

		for (var x in eden.root.symbols) {
			if (reg.test(x)) stats.push(eden.root.symbols[x]);
		}
	} else {
		if (context && context.statements) {
			for (var i=0; i<context.statements.length; i++) {
				var stat = context.statements[i];
				if ((stat.lvalue && stat.lvalue.name == this.name) || (stat.name && stat.name == this.name)) stats.push(stat);
			}
		}
		if (eden.project) {
			if (eden.project.name == this.name) stats.push(eden.project.ast.script);
			for (var i=0; i<eden.project.ast.script.statements.length; i++) {
				var stat = eden.project.ast.script.statements[i];
				if ((stat.lvalue && stat.lvalue.name == this.name) || (stat.name && stat.name == this.name)) stats.push(stat);
			}
		}

		for (var x in Eden.Selectors.cache) {
			if (Eden.Selectors.cache[x].name == this.name) stats.push(Eden.Selectors.cache[x]);
		}

		if (eden.root.symbols[this.name]) stats.push(eden.root.symbols[this.name]);
	}

	console.log("Construct name",stats);

	return stats;
}

Eden.Selectors.NameNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.NameNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

