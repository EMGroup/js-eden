Eden.Selectors.PropertyNode = function(name, param) {
	this.type = "property";
	this.name = name;
	this.param = param;
	this.compare = undefined;
	this.value = param;
	this.range = false;
	this.isreg = (param) ? param.indexOf("*") != -1 : false;
	if (typeof name == "string") {
		this.meta = (name.charAt(0) == ".") ? Eden.Selectors.PropertyNode.attributes[name.substring(1)] : Eden.Selectors.PropertyNode.pseudo[name.substring(1)];
	} else {
		this.meta = undefined;
	}
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

		// Preprocess types
		if (this.name == ".type") {
			switch(this.param) {
			case "is": this.param = "definition"; break;
			case "assign":
			case "=": this.param = "assignment"; break;
			case "call": this.param = "functioncall"; break;
			case "proc": this.param = "action"; break;
			case "action": this.param = "script"; break;
			case "+=":
			case "-=":
			case "*=":
			case "/=":
			case "++":
			case "--": this.param = "modify"; break;
			}
			this.value = this.param;
		}
	}
}

Eden.Selectors.PropertyNode.attributes = {
	"name":		{local: false,	indexed: true,	rank: 1},
	"type":		{local: false,	indexed: false,	rank: 3},
	"datatype":	{local: false,	indexed: false, rank: 30},
	"id":		{local: false,	indexed: true,	rank: 2},
	"lines":	{local: false,	indexed: false,	rank: 3},
//	"op":		{local: false,	indexed: false,	rank: 30}, 
//	"operator":	{local: false,	indexed: false,	rank: 30},
	"depends":	{local: false,	indexed: false, rank: 4},		// Only immediate dependencies
	"determines": {local: false,	indexed: false, rank: 4},	// Only immediate subscribers
	"time":		{local: true,	indexed: false, rank: 3},
	"date":		{local: false,	indexed: false,	rank: 3},
	"locked":	{local: true,	indexed: false,	rank: 3},
	"title":	{local: false,	indexed: false, rank: 10},
	"warning":	{local: false,	indexed: false, rank: 10},
	"author":	{local: false,	indexed: false, rank: 10},
	"v":		{local: false,	indexed: false, rank: 20},
	"vid":		{local: false,	indexed: false, rank: 20},
	"version":	{local: false,	indexed: false, rank: 20},
	"source":	{local: true,	indexed: false, rank: 50},	// Local only because of performance
	"comment":	{local: true,	indexed: false, rank: 50}
};

Eden.Selectors.PropertyNode.pseudo = {
	"line":			{local: false,	indexed: false,	rank: 50},
	"determines":	{local:true,	indexed: true,	rank: 10},  // Full subscriber tree check
	"depends":		{local:true,	indexed: true,	rank: 10},  // Full dependency tree check
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
	"active":		{local: true,	indexed: false, rank: 10},
	"me":			{local: false,	indexed: false, rank: 20},
	"listed":		{local: false,	indexed: false, rank: 20},
	"prev":			{local: true, indexed: false, rank: 20},
	"next":			{local: true, indexed: false, rank: 20},
	"this":			{local: true, indexed: false, rank: 20}
};

Eden.Selectors.PropertyNode.prototype.append = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "property"		:
	case "tag"			:
	case "name"			:	var int = new Eden.Selectors.IntersectionNode(this,node); int.options = this.options; return int;
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
	case "name"			:	var int = new Eden.Selectors.IntersectionNode(node,this); int.options = this.options; return int;
	case "union"		:
	case "intersection"	:	node.append(this); return node;
	case "navigate"		:	node.append(this); return node;
	}

	return this;
}

Eden.Selectors.PropertyNode.prototype.depend = Eden.Selectors._depend;

Eden.Selectors.PropertyNode.prototype.filter = function(statements) {
	if (!statements) return this.depend(this.construct());
	else return this.depend(new Promise((resolve, reject) => {
		resolve(this._filter(statements));
	}));
}

Eden.Selectors.PropertyNode.prototype._indirectSubFilter = function(statements, param) {
	var isubs = eden.root.lookup(param).indirectSubscribers();
	return statements.filter(function(stat) {
		var name = (stat.lvalue && stat.lvalue.name) ? stat.lvalue.name : (stat.name) ? stat.name : undefined;
		return (name && isubs.hasOwnProperty(name));
	});
}

Eden.Selectors.PropertyNode.prototype._indirectDepFilter = function(statements, param) {
	var isubs = eden.root.lookup(param).indirectDependencies();
	return statements.filter(function(stat) {
		var name = (stat.lvalue && stat.lvalue.name) ? stat.lvalue.name : (stat.name) ? stat.name : undefined;
		return (name && isubs.hasOwnProperty(name));
	});
}

Eden.Selectors.PropertyNode.prototype._filter = function(statements) {
	var me = this;
	var param = this.value;
	var command = this.name;

	if (!statements) return this._construct();

	//console.log("Property",command,param,statements);

	if (typeof this.name == "number") {
		if (statements && statements.length >= this.name) resolve([statements[this.name-1]]);
		else resolve([]);
		return;
	} else {
		switch(command) {
		case ".name"	:	if (!param) {
								return (statements.filter(function(stat) {
									return (stat.lvalue !== undefined || stat.name !== undefined);
								})); return;
							}
							var regex = edenUI.regExpFromStr(param);
							return (statements.filter(function(stat) {
								return (stat.lvalue && regex.test(stat.lvalue.name)) || (stat.name && regex.test(stat.name));
							})); return;

		case ".id"		:	return (statements.filter(function(stat) {
								if (stat.id == 0) stat.buildID();
								return (stat.parent === undefined && stat.base && stat.base.origin && stat.base.origin.id) ?
									stat.base.origin.id == param : stat.id == param;
							})); return;

		case ".type"	:	if (!param) break;
							return (statements.filter(function(stat) {
								return stat.type == param;
							})); return;

		case ".warning"	:	return (statements.filter(function(stat) {
								return stat.warning
							})); return;

		case ".locked"	:	return (statements.filter(function(stat) {
								return stat.lock > 0;
							})); return;

		case ".datatype":	return (statements.filter(function(stat) {
								return (stat.expression && Eden.Selectors.testType(stat.expression) == param) ||
										(stat.expression && stat.expression.type == "scope" && stat.expression.range && param == "list");
							})); return;

		case ".lines"	:	return (statements); return;

		case ":line"	:	return (statements); return;

		case ".op"			:
		case ".operator"	: return (statements); return;

		// Match an expression pattern
		case ":pattern"		: return (statements); return;

		case ".depends"	:	//var regex = edenUI.regExpFromStr(param);
							return (statements.filter(function(stat) {
								return (stat.type == "definition" || stat.type == "when") && (stat.dependencies[param] || (stat.dynamicDependencies && stat.dynamicDependencies[param]));
							})); return;

		case ".determines"	:
							return (statements.filter(function(stat) {
								return (stat instanceof EdenSymbol) && stat.subscribers[param];
							})); return;

		case ":depends"		: return (this._indirectSubFilter(statements, param)); return;

		case ":determines"	: return (this._indirectDepFilter(statements, param)); return;

		case ":active"	:	return (statements.filter(function(stat) {
								if (stat.type == "definition" || stat.type == "assignment") {
									var sym = eden.root.symbols[stat.lvalue.name];

									return sym && (sym.origin === stat || (sym.origin && sym.origin.id == stat.id));
								} else if (stat.type == "when") return stat.enabled;
								return false;
							})); return;

		case ":first"	:	return ((statements.length > 0) ? [statements[0]] : []); return;
		case ":last"	:	return ((statements.length > 0) ? [statements[statements.length-1]] : []);

		case ":unexecuted"	:	return (statements.filter(function(stat) {
									return stat.executed == 0;
								})); return;
		case ":executed":	return (statements.filter(function(stat) {
								return stat.executed == 1;
							})); return

		/*case "has-name"	:	return statements.filter(function(stat) {
								return stat.name !== undefined;
							});*/

		//case ":no-parent":
		case ":root"	:	return (statements.filter(function(stat) {
								return stat.parent === undefined;
							})); return;

		case ":project"	:	return ([eden.project.ast.script]); return;

		case ":nth"		:	return (statements.filter(function(stat) {
								return stat.parent && Eden.Selectors.getChildren([stat.parent], false)[me.value-1] === stat;
							})); return;

		case ":prev"	:	return (statements.map(function(stat) {
								let s = stat.previousSibling;
								while (s && s.type == "dummy") s = s.previousSibling;
								return s;
							})); return;

		case ":next"	:	return (statements.map(function(stat) {
								let s = stat.nextSibling;
								while (s && s.type == "dummy") s = s.nextSibling;
								return s;
							})); return;

		case ":value"	:	return (statements); return;

		// Additional selector unions to check
		case ":"		:
		case ":matches"	:	var sast = Eden.Selectors.parse(this.param);
							if (sast) return sast._filter(statements);
							else return ([]);
							return;

		case ".title"	:	if (this.isreg) {
								return(statements.filter(function(stat) {
									if (!stat.doxyComment) return false;
									var title = stat.doxyComment.getProperty("title");
									return title && me.value.test(title);
								})); return;
							} else {
								return(statements.filter(function(stat) {
									if (!stat.doxyComment) return false;
									var title = stat.doxyComment.getProperty("title");
									return title && title == me.value;
								})); return;
							}

		case ".author"	:	return(statements); return;

		case ".v"		:
		case ".vid"		:
		case ".version"	:	return(statements); return;

		case ".source"	:	if (this.isreg) {
								return(statements.filter(function(stat) {
									return me.value.test(stat.getSource());
								})); return;
							} else {
								return(statements.filter(function(stat) {
									return stat.getSource() == me.value;
								})); return;
							}

		case ".comment"	:	if (this.isreg) {
								return(statements.filter(function(stat) {
									return stat.doxyComment && me.value.test(stat.doxyComment.stripped());
								})); return;
							} else {
								return(statements.filter(function(stat) {
									return stat.doxyComment && stat.doxyComment.stripped() == me.value;
								})); return;
							}

		// How long ago from now
		case ":age"		:	var ts = generateTimeStamp(this.value);
							var now = Date.now();
							var diff = now - ts;
							console.log("AGE",ts,now,diff);
							if (this.compare === undefined || this.compare == "<") {
								return(statements.filter(function(stat) {
									return stat.stamp > diff;
								})); return;
							} else {
								return(statements.filter(function(stat) {
									return stat.stamp < diff;
								})); return;
							}

		// Absolute time
		case ".time"		:
		case ".date"		:	return(statements); return;

		case ":remote"	:	return(statements.filter(function(stat) {
								var p = stat;
								while(p.parent) p = p.parent;
								if (!p.base || !p.base.origin) return false;
								return p.base.origin.remote == true;
							})); return;

		case ":not"		:	if (this.param) {
								var positive = Eden.Selectors.parse(this.param)._filter(statements);
								
								return statements.filter(function(stat) {
									for (var i=0; i<positive.length; i++) {
										if (stat === positive[i]) return false;
									}
									return true;
								});
							
							}

		default: return([]);
		}
	}
}

Eden.Selectors.PropertyNode.prototype._construct = function() {
	var stats;

	switch (this.name) {
	case ".type"		:	stats = Eden.Index.getByType(this.value); break;
	case ".id"			:	stats = Eden.Index.getByID(this.value); break;
	case ".v"			:
	case ".vid"			:
	case ".version"		:	stats = []; break;  // Local version always is empty
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
	case ":this"		:	stats = (this.options && this.options.self) ? [this.options.self] : [];
							console.log("THIS", this.options);
							break;
	case ":prev"		:	stats = (this.options && this.options.self) ? [this.options.self] : [];
							stats = stats.map(stat => {
								let s = stat.previousSibling;
								while (s && s.type == "dummy") s = s.previousSibling;
								return s;
							}); break;
	case ":next"		:	stats = (this.options && this.options.self) ? [this.options.self] : [];
							stats = stats.map(stat => {
								let s = stat.nextSibling;
								while (s && s.type == "dummy") s = s.nextSibling;
								return s;
							}); break;
	case ":active"		:	stats = [eden.root]; break;
	case ":depends"		:	stats = Object.values(eden.root.lookup(this.value).indirectSubscribers()); break;
	case ":determines"	:	stats = Object.values(eden.root.lookup(this.value).indirectDependencies()); break;
	case ".determines"	:	stats = Object.values(eden.root.lookup(this.value).dependencies).concat(Object.values(eden.root.lookup(this.value).dynamicDependencies)); break;
	case ".depends"		:	stats = Object.values(eden.root.lookup(this.value).subscribers); break;
	default				:	stats = this._filter(Eden.Index.getAll());
	}

	return stats;
}

Eden.Selectors.PropertyNode.prototype.construct = function() {
	//return new Promise((resolve, reject) => {
	var stats = this._construct();

		if (!this.options || !this.options.history) {
			return Promise.resolve(stats.filter(function(e) {
				return e.executed >= 0;
			}));
		}

		return Promise.resolve(stats);
	//});
}

