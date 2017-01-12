Eden.Selectors.PropertyNode = function(name, param) {
	this.type = "property";
	this.name = name;
	this.param = param;
	this.compare = undefined;
	this.value = param;
	this.range = false;
	this.isreg = (param) ? param.indexOf("*") != -1 : false;

	if (param) {
		var ch = param.charAt(0);
		switch(ch) {
		case "<"	:	this.compare = (param.charAt(1) == "=") ? "<=" : "<"; break;
		case ">"	:	this.compare = (param.charAt(1) == "=") ? ">=" : ">"; break;
		case "="	:	this.compare = "="; break;
		case "!"	:	this.compare = "!="; break;
		}

		if (this.compare) {
			switch(this.compare) {
			case "!"	:
			case "="	:
			case ">"	:
			case "<"	: this.value = param.substring(1); break;
			case ">="	:
			case "<="	: this.value = param.substring(2); break;
			}
		}

		if (this.isreg) {
			this.value = Eden.Selectors.makeRegex(this.value);
		} else {
			if (param.match(/^[0-9]+\-[0-9]+$/) !== null) {
				this.range = true;
			} else if (param.match(/^[0-9]+$/) !== null) {
				this.value = parseInt(param);
			}
		}
	}
}

Eden.Selectors.PropertyNode.prototype.append = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "property"		:
	case "tag"			:
	case "name"			:	return new Eden.Selectors.IntersectionNode(this,node);
	case "union"		:
	case "intersection"	:	node.prepend(this); return node;
	case "navigate"		:	node.prepend(this); return node;
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
	case "navigate"		:	node.append(this); return node;
	}

	return this;
}

Eden.Selectors.PropertyNode.prototype.filter = function(statements) {
	if (!statements) statements = this.construct();
	var me = this;
	var param = this.param;
	var command = this.name;

	console.log("Property",command,param,statements);

	if (typeof this.name == "number") {
		
	} else {
		switch(command) {
		case ".name"	:	if (!param) {
								return statements.filter(function(stat) {
									return (stat.lvalue !== undefined || stat.name !== undefined);
								});
							}
							var regex = edenUI.regExpFromStr(param);
							return statements.filter(function(stat) {
								return (stat.lvalue && regex.test(stat.lvalue.name)) || (stat.name && regex.test(stat.name));
							});

		case ".id"		:	return statements;

		case ".type"	:	if (!param) break;
							return statements.filter(function(stat) {
								return stat.type == param;
							});

		case ".datatype":	return statements.filter(function(stat) {
								return (stat.expression && Eden.Selectors.testType(stat.expression) == param) ||
										(stat.expression && stat.expression.type == "scope" && stat.expression.range && param == "list");
							});

		case ".lines"	:	return statements;

		case ":line"	:	return statements;

		case ".op"			:
		case ".operator"	: return statements;

		// Match an expression pattern
		case ":pattern"		: return statements;

		case ":determines"	: return statements;

		case ".depends"	:	//var regex = edenUI.regExpFromStr(param);
							return statements.filter(function(stat) {
								return (stat.type == "definition" || stat.type == "when") && stat.dependencies[param];
							});

		case ":active"	:	return statements.filter(function(stat) {
								if (stat.type == "definition" || stat.type == "assignment") {
									var sym = eden.root.symbols[stat.lvalue.name];

									return sym && sym.origin === stat;
								}
								return false;
							});

		case ":first"	:	return (statements.length > 0) ? [statements[0]] : [];
		case ":last"	:	return (statements.length > 0) ? [statements[statements.length-1]] : [];

		case ":unexecuted"	:	return statements.filter(function(stat) {
									return stat.executed == 0;
								});
		case ":executed":	return statements.filter(function(stat) {
								return stat.executed == 1;
							});

		/*case "has-name"	:	return statements.filter(function(stat) {
								return stat.name !== undefined;
							});*/

		//case ":no-parent":
		case ":root"	:	return statements.filter(function(stat) {
								return stat.parent === undefined;
							});

		case ":project"	:	return [eden.project.ast.script];

		case ":nth"		:	return statements.filter(function(stat) {
								return stat.parent && Eden.Selectors.getChildren([stat.parent], false)[me.value-1] === stat;
							});

		case ":value"	:	return statements;

		// Additional selector unions to check
		case ":matches"	:	return Eden.Selectors.parse(param).filter(statements);

		case ".title"	:	return statements;

		case ".author"	:	return statements;

		case ".version"	:	return statements;

		// How long ago from now
		case ":age"		:	var ts = generateTimeStamp(this.value);
							var now = Date.now();
							var diff = now - ts;
							console.log("AGE",ts,now,diff);
							if (this.compare === undefined || this.compare == "<") {
								return statements.filter(function(stat) {
									return stat.stamp > diff;
								});
							} else {
								return statements.filter(function(stat) {
									return stat.stamp < diff;
								});
							}

		// Absolute time
		case ".time"		:
		case ".date"		:	return statements;

		case ":remote"	:	return statements.filter(function(stat) {
								var p = stat;
								while(p.parent) p = p.parent;
								if (!p.base || !p.base.origin) return false;
								return p.base.origin.remote == true;
							});

		case ":not"		:	var positive = Eden.Selectors.parse(param).filter(statements);
							return statements.filter(function(stat) {
								for (var i=0; i<positive.length; i++) {
									if (stat === positive[i]) return false;
								}
								return true;
							});

		default: return [];
		}
	}
	return [];
}

Eden.Selectors.PropertyNode.prototype.construct = function() {
	console.log("Property construct");
	// TODO some properties can have an optimised construction
	var namenode = new Eden.Selectors.NameNode("*");
	return namenode.construct();
}

