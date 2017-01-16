Eden.Selectors.PropertyNode = function(name, param) {
	this.type = "property";
	this.name = name;
	this.param = param;
	this.compare = undefined;
	this.value = param;
	this.range = false;
	this.isreg = (param) ? param.indexOf("*") != -1 : false;
	this.meta = (name.charAt(0) == ".") ? Eden.Selectors.PropertyNode.attributes[name.substring(1)] : Eden.Selectors.PropertyNode.pseudo[name.substring(1)];
	this.local = (this.meta) ? this.meta.local : false;

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

Eden.Selectors.PropertyNode.attributes = {
	"name":		{local: false,	indexed: true,	rank: 1},
	"type":		{local: false,	indexed: false,	rank: 3},
	"datatype":	{local: false,	indexed: false, rank: 30},
	"id":		{local: false,	indexed: true,	rank: 2},
	"lines":	{local: false,	indexed: false,	rank: 3},
	"op":		{local: false,	indexed: false,	rank: 30}, 
	"operator":	{local: false,	indexed: false,	rank: 30},
	"depends":	{local: false,	indexed: false, rank: 4},
	"time":		{local: true,	indexed: false, rank: 3},
	"date":		{local: false,	indexed: false,	rank: 3},
	"title":	{local: false,	indexed: false, rank: 10},
	"author":	{local: false,	indexed: false, rank: 10},
	"version":	{local: false,	indexed: false, rank: 20}
};

Eden.Selectors.PropertyNode.pseudo = {
	"line":			{local: false,	indexed: false,	rank: 50},
	"determines":	{local:true,	indexed: true,	rank: 10},
	"first":		{local: false,	indexed: true,	rank: 5},
	"last":			{local: false,	indexed: true,	rank: 5},
	"unexecuted":	{local: true,	indexed: false, rank: 3},
	"executed":		{local: true,	indexed: false, rank: 3},
	"root":			{local: false,	indexed: true,	rank: 3},
	"project":		{local: true,	indexed: true,	rank: 3},
	"nth":			{local: false,	indexed: true,	rank: 5},
	"value":		{local: true,	indexed: false,	rank: 50},
	"matches":		{local: false,	indexed: false,	rank: 100},
	"age":			{local: false,	indexed: false,	rank: 6},
	"remote":		{local: true,	indexed: true,	rank: 20},
	"not":			{local: false,	indexed: false,	rank: 100},
	"active":		{local: true,	indexed: false, rank: 10}
};

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
	var param = this.value;
	var command = this.name;

	//console.log("Property",command,param,statements);

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

		case ".id"		:	return statements.filter(function(stat) {
								return stat.id == param;
							});

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

									return sym && (sym.origin === stat || (sym.origin && sym.origin.id == stat.id));
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
		case ":matches"	:	return Eden.Selectors.parse(this.param).filter(statements);

		case ".title"	:	if (this.isreg) {
								return statements.filter(function(stat) {
									if (!stat.doxyComment) return false;
									var title = stat.doxyComment.getProperty("title");
									return title && me.value.test(title);
								});
							} else {
								return statements.filter(function(stat) {
									if (!stat.doxyComment) return false;
									var title = stat.doxyComment.getProperty("title");
									return title && title == this.value;
								});
							}

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

		case ":not"		:	var positive = Eden.Selectors.parse(this.param).filter(statements);
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
	var stats;

	switch (this.name) {
	case ".type"		:	stats = Eden.Index.getByType(this.value); break;
	case ".id"			:	stats = Eden.Index.getByID(this.value); break;
	case ".name"		:	if (this.param === undefined) {
								stats = Eden.Index.getAllWithName();
							} else if (this.isreg) {
								stats = Eden.Index.getByNameRegex(this.value);
							} else {
								stats = Eden.Index.getByName(this.value);
							} break;
	// TODO this doesn't capture executes.
	case ":root"		:	stats = [eden.project.ast.script].concat(Object.keys(Eden.Selectors.cache).map(function(e) { return Eden.Selectors.cache[e]; })); break;
	case ":remote"		:	stats = Object.keys(Eden.Selectors.cache).map(function(e) { return Eden.Selectors.cache[e]; }); break;
	case ":project"		:	stats = [eden.project.ast.script]; break;
	default				:	stats = Eden.Index.getAll();
	}

	if (!this.options || !this.options.history) {
		return stats.filter(function(e) {
			return e.executed >= 0;
		});
	}

	return stats;
}

