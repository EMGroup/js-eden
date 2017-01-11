Eden.Selectors.PropertyNode = function(name, param) {
	this.type = "property";
	this.name = name;
	this.param = param;
}

Eden.Selectors.PropertyNode.prototype.append = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "property"		:
	case "tag"			:
	case "name"			:	return new Eden.Selectors.IntersectionNode(this,node);
	case "union"		:
	case "intersection"	:	node.prepend(this); return node;
	case "direct"		:
	case "indirect"		:	node.prepend(this); return node;
	}

	return this;
}

Eden.Selectors.PropertyNode.prototype.prepend = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "property"		:
	case "tag"			:
	case "name"			:	return new Eden.Selectors.IntersectionNode(node,this);
	case "union"		:
	case "intersection"	:	node.append(this); return node;
	case "direct"		:
	case "indirect"		:	node.append(this); return node;
	}

	return this;
}

Eden.Selectors.PropertyNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();
	var me = this;
	var param = this.param;
	var command = this.command;

	if (typeof this.name == "number") {
		return statements.filter(function(stat) {
			return Eden.Selectors.getChildren([stat.parent], false)[me.name-1] === stat;
		});
	} else {
		switch(command) {
		case "name"		:	if (!param) break;
							var regex = edenUI.regExpFromStr(param);
							return statements.filter(function(stat) {
								return (stat.lvalue && regex.test(stat.lvalue.name)) || (stat.name && regex.test(stat.name));
							});

		case "kind"		:	if (!param) break;
							return statements.filter(function(stat) {
								return stat.type == param;
							});

		case "type"		:	return statements.filter(function(stat) {
								return (stat.expression && Eden.Selectors.testType(stat.expression) == param) ||
										(stat.expression && stat.expression.type == "scope" && stat.expression.range && param == "list");
							});

		case "depends"	:	//var regex = edenUI.regExpFromStr(param);
							return statements.filter(function(stat) {
								return (stat.type == "definition" || stat.type == "when") && stat.dependencies[param];
							});

		case "active"	:	return statements.filter(function(stat) {
								if (stat.type == "definition" || stat.type == "assignment") {
									var sym = eden.root.symbols[stat.lvalue.name];

									return sym && sym.origin === stat;
								}
								return false;
							});

		case "last"		:	return statements;

		case "unexecuted"	:	return statements.filter(function(stat) {
									return stat.executed == 0;
								});
		case "executed"	:	return statements.filter(function(stat) {
								return stat.executed == 1;
							});

		case "has-name"	:	return statements.filter(function(stat) {
								return stat.name !== undefined;
							});

		case "nth"		:	return [statements[parseInt(param)]];

		case "value"	:	return statements;

		case "title"	:	return statements;

		case "author"	:	return statements;

		case "version"	:	return statements;

		case "date"		:	return statements;

		case "remote"	:	return statements.filter(function(stat) {
								var p = stat;
								while(p.parent) p = p.parent;
								if (!p.base) console.log("MISSING BASE",p);
								return p.base.origin.remote == true;
							});

		case "not"		:	var positive = Eden.Selectors.processNode(statements, param);
							return statements.filter(function(stat) {
								for (var i=0; i<positive.length; i++) {
									if (stat === positive[i]) return false;
								}
								return true;
							});

		default: return [];
		}
	}
}

Eden.Selectors.PropertyNode.prototype.construct = function() {

}

