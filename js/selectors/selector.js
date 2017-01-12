Eden.Selectors = {
	cache: {}
	//imported: new Eden.AST.Virtual("imported")
};

Eden.Selectors.findLocalBase = function(path, ctx, filters) {
	var scripts = [];
	var paths = path.split(","); // This shouldn't be allowed???

	for (var i=0; i<paths.length; i++) {
		var path = paths[i].trim();

		if (path == "" || path == "*") {
			scripts.push(eden.project.ast.script);
			//scripts.push(Eden.Selectors.imported);
			for (var x in Eden.Selectors.cache) {
				scripts.push(Eden.Selectors.cache[x]);
			}
			scripts.push.apply(scripts,ctx.statements);
		} else {
			var script;
			if (eden.project && path == eden.project.name) script = eden.project.ast.script;
			else if (ctx) script = ctx.getActionByName(path);
			if (script) {
				scripts.push(script);
				continue;
			}

			// Check cached scripts
			if (Eden.Selectors.cache[path]) {
				scripts.push(Eden.Selectors.cache[path]);
				//console.log("FOUND CACHE",path);
				continue;
			}

			// If path contains a /, try looking for url...
		}
	}

	return scripts;
}

Eden.Selectors.makeRoot = function(ctx) {
	var scripts = [];

	if (ctx && ctx.statements) {
		for (var i=0; i<ctx.statements.length; i++) {
			if (ctx.statements[i].type != "dummy") scripts.push(ctx.statements[i]);
		}
	}

	if (eden.project) {
		scripts.push(eden.project.ast.script);
		for (var i=0; i<eden.project.ast.script.statements.length; i++) {
			if (eden.project.ast.script.statements[i].type != "dummy") scripts.push(eden.project.ast.script.statements[i]);
		}
	}

	for (var x in Eden.Selectors.cache) {
		scripts.push(Eden.Selectors.cache[x]);
	}
	return scripts;
}

Eden.Selectors.getScriptBase = function(stat) {
	var p = stat;
	while(p.parent) { p = p.parent; }
	return p.base.origin.name;
}

Eden.Selectors.buildScriptTree = function(scripts) {
	var base = {};
	//console.log(scripts);

	for (var i=0; i<scripts.length; i++) {
		var parts = scripts[i].split(/[\.\:]+/);
		var cur = base;
		for (var j=0; j<parts.length; j++) {
			if (cur[parts[j]] === undefined) cur[parts[j]] = {};
			cur = cur[parts[j]];
		}
	}

	return base;
}

Eden.Selectors.getID = function(stat) {
	return ".id("+stat.id+")";
	/*if (eden.project && eden.project.ast.script === stat) {
		return stat.name;
	} else {
		return this._getID(stat);
	}*/
}

Eden.Selectors._getID = function(stat) {
	var res;
	if (stat.type == "script" && stat.name) {
		if (stat.parent && stat.parent.base && stat.parent.base.origin === eden.project) {
			return stat.name;
		} else if (stat.parent) {// || stat.base.origin !== eden.project) {
			res = ">"+stat.name;
		} else {
			res = stat.name;
		}
	} else if (stat.parent) {
		var children = Eden.Selectors.getChildren([stat.parent], false);
		for (var i=0; i<children.length; i++) {
			if (children[i] === stat) {
				res = ">:"+(i+1);
				break;
			}
		}
		if (!res) {
			return "ACTIVE>"+ ((stat.lvalue) ? stat.lvalue.name : stat.name);
		}
	} else if (stat.base) {
		res = stat.base.origin.name;
	} else if (stat instanceof Symbol) {
		res = "ACTIVE>"+stat.name;
	} else {
		res = "";
	}

	if (stat.parent) {
		res = Eden.Selectors._getID(stat.parent)+res;
	} else {
		//if (res.charAt(0) == ".") res = res.substring(1);
	}

	return res;
}

Eden.Selectors.testType = function(expr) {
	if (expr.type == "binaryop") {
		switch(expr.op) {
		case "+":
		case "-":
		case "/":
		case "*":
		case "^":
		case "%": return "number";
		case "//": return "list";
		case "==":
		case "<":
		case ">":
		case "<=":
		case ">=":
		case "||":
		case "&&":
		case "!=": return "boolean";
		default: return "unknown";
		}
	} else if (expr.type == "literal") {
		switch(expr.datatype) {
		case "NUMBER": return "number";
		case "BOOLEAN": return "boolean";
		case "STRING": return "string";
		case "LIST": return "list";
		default: return "unknown";
		}
	}
	return "unknown";
}

Eden.Selectors.getChildren = function(statements, recurse) {
	var nstats = [];
	if (statements === undefined) return nstats;
	for (var i=0; i<statements.length; i++) {
		if (statements[i].type == "script") {
			nstats.push.apply(nstats,statements[i].statements);
			if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].statements, recurse));
		} else if (statements[i].type == "for") {
			if (statements[i].statement && statements[i].statement.type == "script") {
				nstats.push.apply(nstats,statements[i].statement.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].statement.statements, recurse));
			}
		} else if (statements[i].type == "if") {
			if (statements[i].statement && statements[i].statement.type == "script") {
				nstats.push.apply(nstats,statements[i].statement.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].statement.statements, recurse));
			}
			if (statements[i].elsestatement && statements[i].elsestatement.type == "script") {
				nstats.push.apply(nstats,statements[i].elsestatement.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].elsestatement.statements, recurse));
			}
		} else if (statements[i].type == "when") {
			if (statements[i].statement && statements[i].statement.type == "script") {
				nstats.push.apply(nstats,statements[i].statement.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].statement.statements, recurse));
			}
		} else if (statements[i].type == "while") {
			if (statements[i].statement && statements[i].statement.type == "script") {
				nstats.push.apply(nstats,statements[i].statement.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].statement.statements, recurse));
			}
		} else if (statements[i].type == "do") {
			if (statements[i].script && statements[i].script.type == "script") {
				nstats.push.apply(nstats,statements[i].script.statements);
				if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(statements[i].script.statements, recurse));
			}
		}
	}
	nstats = nstats.filter(function(stat) {
		return stat.type != "dummy";
	});
	return nstats;
}

Eden.Selectors.processResults = function(statements, o) {
	// Check what kind of result we are to return
	if (o !== undefined) {
		var kinds = (Array.isArray(o)) ? o : o.split(",");

		var res = [];

		for (var i=0; i<statements.length; i++) {
			var stat = statements[i];
			var ires = [];

			for (var j=0; j<kinds.length; j++) {
				var val = undefined;

				switch(kinds[j]) {
				case "brief"	:	if (stat.doxyComment) {
										val = stat.doxyComment.brief();
									} break;
				case "comment"	:	if (stat.doxyComment) {
										val = stat.doxyComment.stripped();
									} break;
				case "source"	:	val = stat.getSource();
									break;
				case "innersource"	:	if (stat.type == "script") {
											val = stat.getInnerSource();
										} else {
											val = stat.getSource();
										} break;
				case "title"	:	if (stat.base && stat.base.mainDoxyComment) {
										stat.base.mainDoxyComment.stripped();
										var controls = stat.base.mainDoxyComment.getControls();
										if (controls && controls["@title"]) val = controls["@title"][0];
									}
									break;
				case "path"		:
				case "name"		:	
				case "symbol"	:	if (stat.lvalue && stat.lvalue.name) {
										val = stat.lvalue.name;
									} else if (stat.name && stat.type != "do") {
										val = stat.name;
									} else if (stat.parent === undefined && stat.base && stat.base.origin) {
										val = stat.base.origin.name;
									} else if (stat.path !== undefined) {
										val = stat.path;
									} break;
				case "line"		:	if (stat.line !== undefined) {
										val = stat.line;
									} break; 
				case "depends"	:
				case "value"	:
				case "tags"		: break;
				case "rawcomment"	: if (stat.doxyComment) {
										val = stat.doxyComment.content;
									} break;
				case "controls" :
				case "id"		:
				case "unique"	: val = Eden.Selectors.getID(stat); break;
				case "script"	: val = Eden.Selectors.getScriptBase(stat); break;
				case "remote"	:	var p = stat;
									while(p.parent) p = p.parent;
									if (!p.base || !p.base.origin) {
										val = false;
										break;
									}
									val = p.base.origin.remote;
									break;
				}

				ires.push(val);

			}
			if (kinds.length > 1 && ires.length > 0) {
				res.push(ires);
			} else if (kinds.length == 1 && ires.length > 0 && ires[0] !== undefined) {
				res.push(ires[0]);
			}
		}
		return res;
	}
	return statements;
}

Eden.Selectors.outerBracket = function(str) {
	var open = 0;
	for (var i=0; i<str.length; i++) {
		if (str.charAt(i) == "(") open++;
		else if (str.charAt(i) == ")") {
			open--;
			if (open == 0) return i;
		}
	}
	return str.length;
}

Eden.Selectors.makeRegex = function(str) {
	str = "^"+str.replace(/([\\+^$.|(){[])/g, "\\$1").replace(/([*?])/g, ".$1") + "$";
	return new RegExp(str);
}

Eden.Selectors.SortNode = function() {
	this.type = "sort";
	this.query = undefined;
}

Eden.Selectors.DotNode = function(label) {
	this.type = "dot";
	this.label = label;
}

Eden.Selectors.parse = function(s) {
	var node;

	console.log("PARSE \""+s+"\"");

	//console.log("NODE",s);
	if (!s || s == "") return;

	// Go into childrne
	if (s.charAt(0) == ">") {
		// Go to all children recursively
		if (s.charAt(1) == ">") {
			node = new Eden.Selectors.NavigateNode(">", true);
			s = s.substring(2).trim();
		// Only go to direct children
		} else {
			node = new Eden.Selectors.NavigateNode(">", false);
			s = s.substring(1).trim();
		}
	} else if (s.charAt(0) == "<") {
		// Go to all children recursively
		if (s.charAt(1) == "<") {
			node = new Eden.Selectors.NavigateNode("<", true);
			s = s.substring(2).trim();
		// Only go to direct children
		} else {
			node = new Eden.Selectors.NavigateNode("<", false);
			s = s.substring(1).trim();
		}
	} else if (s.charAt(0) == ",") {
		node = new Eden.Selectors.UnionNode();
		s = s.substring(1).trim();
	} else if (s.charAt(0) == ":" || s.charAt(0) == ".") {
		var ns = s.substring(1);
		var endix = ns.search(/[^a-zA-Z0-9\-]/);
		if (endix == -1) endix = s.length;
		else endix++;
		var command = s.substring(0,endix);
		var param = undefined;

		if (endix < s.length && s.charAt(endix) == "(") {
			var endix2 = Eden.Selectors.outerBracket(s); //ns.indexOf(")");
			param = s.substring(endix+1,endix2);
			s = s.substring(endix2+1).trim();
		} else {
			s = s.substring(endix).trim();
		}

		if (s.charAt(1).match(/[0-9]+/)) {
			var snum = parseInt(command);
			node = new Eden.Selectors.PropertyNode(snum);
		} else {
			node = new Eden.Selectors.PropertyNode(command, param);
		}
	// Sort operator
	} else if (s.charAt(0) == "^") {
		var ns = s.substring(1);
		var endix = ns.search(/[^a-zA-Z0-9\-]/);
		if (endix == -1) endix = ns.length;
		var command = ns.substring(0,endix);
		var param = undefined;

		if (endix < ns.length && ns.charAt(endix) == "(") {
			var endix2 = Eden.Selectors.outerBracket(ns); //ns.indexOf(")");
			param = ns.substring(endix+1,endix2);
			ns = ns.substring(endix2+1).trim();
		} else {
			ns = ns.substring(endix);
		}

		node = new Eden.Selectors.SortNode();
		node.addSort(command);
		s = ns.trim();
	} else if (s.charAt(0) == "#") {
		var nstats = [];
		var tag = s.match(/#[a-zA-Z0-9_]+/);
		if (tag === null) return;
		tag = tag[0];
		node = new Eden.Selectors.TagNode(tag);
		s = s.substring(tag.length).trim();
	} else if (s.charAt(0).match(/[a-zA-Z*?]+/)) {
		var endix = s.search(/[^a-zA-Z0-9_*?]+/);
		if (endix == -1) endix = s.length;
		var name = s.substring(0,endix);
		node = new Eden.Selectors.NameNode(name);
		s = s.substring(endix).trim();
	} else s = "";


	var nextnode = Eden.Selectors.parse(s);
	if (!node) return;
	return node.append(nextnode);
}

Eden.Selectors.processNode = function(statements, s) {
	//console.log("NODE",s);
	if (!s || s == "") return statements;

	// Go into childrne
	if (s.charAt(0) == ">") {
		// Go to all children recursively
		if (s.charAt(1) == ">") {
			statements = Eden.Selectors.getChildren(statements, true);
			return Eden.Selectors.processNode(statements, s.substring(2).trim());
		// Only go to direct children
		} else {
			statements = Eden.Selectors.getChildren(statements, false);
			return Eden.Selectors.processNode(statements, s.substring(1).trim());
		}
	} else if (s.charAt(0) == ":") {
		var ns = s.substring(1);
		var endix = ns.search(/[^a-zA-Z0-9\-]/);
		if (endix == -1) endix = ns.length;
		var command = ns.substring(0,endix);
		var param = undefined;

		if (endix < ns.length && ns.charAt(endix) == "(") {
			var endix2 = Eden.Selectors.outerBracket(ns); //ns.indexOf(")");
			param = ns.substring(endix+1,endix2);
			ns = ns.substring(endix2+1).trim();
		} else {
			ns = ns.substring(endix);
		}

		if (s.charAt(1).match(/[0-9]+/)) {
			var snum = parseInt(command);

			statements = statements.filter(function(stat) {
				return Eden.Selectors.getChildren([stat.parent], false)[snum-1] === stat;
			});
		} else {
			switch(command) {
			case "name"		:	if (!param) break;
								var regex = edenUI.regExpFromStr(param);
								statements = statements.filter(function(stat) {
									return (stat.lvalue && regex.test(stat.lvalue.name)) || (stat.name && regex.test(stat.name));
								}); break;

			case "kind"		:	if (!param) break;
								statements = statements.filter(function(stat) {
									return stat.type == param;
								}); break;

			case "type"		:	statements = statements.filter(function(stat) {
									return (stat.expression && Eden.Selectors.testType(stat.expression) == param) ||
											(stat.expression && stat.expression.type == "scope" && stat.expression.range && param == "list");
								}); break;

			case "depends"	:	//var regex = edenUI.regExpFromStr(param);
								statements = statements.filter(function(stat) {
									return (stat.type == "definition" || stat.type == "when") && stat.dependencies[param];
								}); break

			case "active"	:	statements = statements.filter(function(stat) {
									if (stat.type == "definition" || stat.type == "assignment") {
										var sym = eden.root.symbols[stat.lvalue.name];

										return sym && sym.origin === stat;
									}
									return false;
								}); break;

			case "last"		:	break;

			case "unexecuted"	:	statements = statements.filter(function(stat) {
										return stat.executed == 0;
									}); break;
			case "executed"	:	statements = statements.filter(function(stat) {
									return stat.executed == 1;
								}); break;

			case "has-name"	:	statements = statements.filter(function(stat) {
									return stat.name !== undefined;
								}); break;

			case "nth"		:	statements = [statements[parseInt(param)]];
								break;

			case "value"	:	break;

			case "title"	:	break;

			case "author"	:	break;

			case "version"	:	break;

			case "date"		:	break;

			case "remote"	:	statements = statements.filter(function(stat) {
									var p = stat;
									while(p.parent) p = p.parent;
									if (!p.base) console.log("MISSING BASE",p);
									return p.base.origin.remote == true;
								}); break;

			case "not"		:	var positive = Eden.Selectors.processNode(statements, param);
								statements = statements.filter(function(stat) {
									for (var i=0; i<positive.length; i++) {
										if (stat === positive[i]) return false;
									}
									return true;
								}); break;

			default: statements = [];
			}
		}

		return Eden.Selectors.processNode(statements, ns);
	// Sort operator
	} else if (s.charAt(0) == "^") {
		var ns = s.substring(1);
		var endix = ns.search(/[^a-zA-Z0-9\-]/);
		if (endix == -1) endix = ns.length;
		var command = ns.substring(0,endix);
		var param = undefined;

		if (endix < ns.length && ns.charAt(endix) == "(") {
			var endix2 = Eden.Selectors.outerBracket(ns); //ns.indexOf(")");
			param = ns.substring(endix+1,endix2);
			ns = ns.substring(endix2+1).trim();
		} else {
			ns = ns.substring(endix);
		}

		switch(command) {
		case "date"		:	

		case "executed"	:

		case "active"	:

		case "touched"	:
		}

		return Eden.Selectors.processNode(statements, ns);
	} else if (s.charAt(0) == "#") {
		var nstats = [];
		var tag = s.match(/#[a-zA-Z0-9_]+/);
		//var endix = s.search(/[^a-z]+/);
		//if (endix == -1) endix = s.length;
		//var tag = s.substring(0,endix);
		if (tag === null) return [];
		tag = tag[0];
		console.log("hashtag",tag);
		for (var i=0; i<statements.length; i++) {
			if (statements[i].doxyComment && statements[i].doxyComment.hasTag(tag)) {
				nstats.push(statements[i]);
			}
		}
		statements = nstats;
		return Eden.Selectors.processNode(statements, s.substring(tag.length).trim());
	} else if (s.charAt(0) == ".") {
		var tag = s.match(/.[a-zA-Z0-9_]+/);
		if (tag === null) return [];
		tag = tag[0].substring(1);
		var nstats = [];
		for (var i=0; i<statements.length; i++) {
			var stat = statements[i];
			if (stat.type == "script") {
				for (j=0; j<stat.statements.length; j++) {
					if (stat.statements[j].type == "script" && stat.statements[j].name == tag)
						nstats.push(stat.statements[j]);
				}
			}
		};
		statements = nstats;
		return Eden.Selectors.processNode(statements, s.substring(tag.length+1).trim());
	} else if (s.charAt(0).match(/[a-zA-Z*?]+/)) {
		var endix = s.search(/[^a-zA-Z0-9_*?]+/);
		if (endix == -1) endix = s.length;
		var name = s.substring(0,endix);
		console.log("MATCH NAME [" + name + "]");
		var isreg = name.indexOf("*") != -1;
		var nstats = [];

		if (isreg) {
			var reg = Eden.Selectors.makeRegex(name);
			for (var i=0; i<statements.length; i++) {
				if ((statements[i].lvalue && reg.test(statements[i].lvalue.name)) || (statements[i].name && reg.test(statements[i].name))) {
					nstats.push(statements[i]);
				}
			}
		} else {
			for (var i=0; i<statements.length; i++) {
				if ((statements[i].lvalue && statements[i].lvalue.name == name) || (statements[i].name && statements[i].name == name)) {
					nstats.push(statements[i]);
				}
			}
		}
		statements = nstats;
		return Eden.Selectors.processNode(statements, s.substring(endix).trim());
	}
	return [];
}

Eden.Selectors.unique = function(stats) {
	var map = {};
	for (var i=0; i<stats.length; i++) {
		map[stats[i].id] = stats[i];
	}
	var res = [];
	for (var x in map) {
		res.push(map[x]);
	}
	return res;
}

Eden.Selectors.queryWithin = function(within, s, o) {
	var statements = Eden.Selectors.processNode(within, s);
	var res = (o) ? Eden.Selectors.processResults(statements, o) : statements;
	return res;
}

Eden.Selectors.query = function(s, o, ctx, num, cb) {
	if (typeof num == "boolean") console.trace("Bool");
	if (s == "") {
		var res = [];
		if (cb) cb(res);
		return res;
	}
	//if (ctx === undefined && eden.project) ctx = eden.project.ast.script;

	var script;
	//var pathixf = s.search(/[\>]/);
	//if (pathixf == -1) pathixf = s.length;

	// TODO Optimise first step.

	//var statements = Eden.Selectors.findLocalBase(path, ctx, s.substring(pathix,pathixf).trim());
	//var statements = Eden.Selectors.makeRoot(ctx);
	//if (statements === undefined) statements = [];

	var statements;
	var sast = Eden.Selectors.parse(s.trim());
	statements = Eden.Selectors.unique(sast.filter(statements,ctx));

	//statements = Eden.Selectors.queryWithin(statements, s, undefined); //.substring(pathix).trim()
	if (statements === undefined) statements = [];

	statements = Eden.Selectors.processResults(statements, o, num);

	if (cb && ((statements.length == 0 && num > 0) || !num)) {

		var pathix = s.search(/[\s\.\:\#\@\>]/);
		if (pathix == -1) pathix = s.length;
		var path = s.substring(0,pathix).trim();

		// Look for local projects
		if (Eden.Project.local && Eden.Project.local[path]) {
			$.get(Eden.Project.local[path].file, function(data) {
				var res = [(new Eden.AST(data, undefined, {name: path, remote: true})).script];
				Eden.Selectors.cache[path] = res[0];
				Eden.Index.update(res[0]);
				statements = res;
				statements = Eden.Selectors.processNode(statements, s);
				res = Eden.Selectors.processResults(statements, o);
				cb(res);
			}, "text");
		// Or check for URL
		} else if (path.indexOf("/") != -1) {
			$.ajax({
				url: path+".js-e",
				dataType: "text",
				success: function(data) {
					var res = [(new Eden.AST(data, undefined, {name: path, remote: true})).script];
					Eden.Selectors.cache[path] = res[0];
					statements = res;
					statements = Eden.Selectors.processNode(statements, s.substring(pathix).trim());
					res = Eden.Selectors.processResults(statements, o);
					cb(res);
				},
				error: function() {
					cb([]);
				}
			});
		} else {
			//Then need to do a remote search
			Eden.DB.searchSelector(s, (o === undefined) ? "source" : o, function(stats) {
				if (o === undefined && stats.length > 0) {
					// Need to generate an AST for each result, or first only if single
					if (num == 1) {
						statements.push((new Eden.AST(stats[0], undefined, {name: path, remote: true})).script);
						Eden.Selectors.cache[path] = statements[0];
						Eden.Index.update(statements[0]);
						//cb(res);
						//return;
					} else {
						// Loop and do all...
					}
				} else {
					statements.push.apply(statements,stats);
				}
				//statements = Eden.Selectors.processNode(statements, s.substring(pathix).trim());
				//var res = Eden.Selectors.processResults(statements, o);
				cb(statements);
			});
		}

		return;
	}

	//var res = Eden.Selectors.processResults(statements, o);
	if (cb) cb(statements);
	return statements;
}


Eden.Selectors.execute = function(selector, cb) {
	Eden.Selectors.query(selector, undefined, undefined, 1000, function(stats) {
		function doStat(i) {
			var p = stats[i];
			while (p.parent) p = p.parent;
			p.base.executeStatement(stats[i], -1, Symbol.localJSAgent, function() {
				i++;
				if (i < stats.length) doStat(i);
				else if (cb) cb();
			});
		}
		if (stats && stats.length > 0) {
			doStat(0);
		} else {
			if (cb) cb();
		}
	});
}


/**
 * Find an existing script view that contains the AST code for that
 * matches a specified selector. Move to that tab and highlight. Otherwise
 * create a new script view with the relevant script in it. A selector that
 * has multiple results has undefined behaviour, but the first result
 * should be the one used.
 */
Eden.Selectors.goto = function(selector) {
	var res = Eden.Selectors.query(selector, undefined, undefined, 1);

	if (res.length == 0) return false;

	// Generate a list of all parent nodes.
	var nodes = [res[0]];
	var p = res[0];
	while (p.parent) {
		nodes.push(p.parent);
		p = p.parent;
	}

	var success = false;
	// For each node generate an emit request to find it
	for (var i=0; i<nodes.length; i++) {
		if (Eden.Fragment.emit("goto", [nodes[i], res[0]])) {
			success = true;
			break;
		}
	}

	if (!success) {
		console.log("No Goto Match, create view",selector,res[0]);
		// Find existing script view...
		for (var x in edenUI.activeDialogs) {
			if (edenUI.activeDialogs[x] == "ScriptInput") {
				var tabs = eden.root.lookup("view_"+x+"_tabs").value();
				var id = (res[0].type == "script") ? selector : Eden.Selectors.getID(res[0].parent);
				tabs.push(id);
				eden.root.lookup("view_"+x+"_tabs").assign(tabs, eden.root.scope, Symbol.localJSAgent);
				success = Eden.Fragment.emit("goto", [nodes[i], res[0]]);
				break;
			}
		}

		if (!success) {
			// Need to create a script view...
		}
	}
	return success;
}


