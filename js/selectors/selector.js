Eden.Selectors = {
	cache: {}
	//imported: new Eden.AST.Virtual("imported")
};

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
	var p = stat;
	var path = [];
	while (p) {
		if (eden.project && p === eden.project.ast.script) path.splice(0,0,":project");
		else if (p.type == "script" && p.name) {
			if (p.parent === undefined) {
				path.splice(0,0,p.name+".id("+p.id+")");
			} else {
				path.splice(0,0,p.name);
			}
		} else path.splice(0,0,".id("+p.id+")");
		p = p.parent;
		if (p) {
			if (p.type == "script" && p.parent && p.parent.type != "script") {
				if (p.parent.type == "codeblock") p = p.parent.parent;
				else p = p.parent;
			} else if (p.type == "codeblock") {
				p = p.parent;
			}
		}
	}
	return path.join(" > ");
}

Eden.Selectors.getPath = function(stat) {
	
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
		} else if (statements[i].type == "section") {
			var node = statements[i].nextSibling;
			while (node && (node.type != "section" || node.depth > statements[i].depth)) {
				if (node.type != "dummy") nstats.push(node);
				node = node.nextSibling;
			}
			if (recurse) nstats.push.apply(nstats, Eden.Selectors.getChildren(nstats, recurse));
		}
	}
	nstats = nstats.filter(function(stat) {
		return stat.type != "dummy";
	});
	return nstats;
}

Eden.Selectors.allowedOptions = {
	"external": true,	// If no results, allow an external server search
	"history": true,	// Include historic results
	"all": true,		// Don't apply a "unique" to the results
	"indexed": true,	// Ignore any context and use an indexed search
	"index": true,		// Automatically index any external results (import)
	"nosort": true,		// Don't sort the results by time stamp.
	"remote": true		// Force server search only (if external is also set).
};

Eden.Selectors.resultTypes = {
	"brief": true,
	"comment": true,
	"source": true,
	"innersource": true,
	"title": true,
	"path": true,
	"name": true,
	"symbol": true,
	"line": true,
	"depends": true,
	"value": true,
	"tags": true,
	"rawcomment": true,
	"id": true,
	"remote": true,
	"root": true,
	"enabled": true,
	"executed": true,
	"exprtree": true
};

Eden.Selectors.expressionToLists = function(expr) {
	switch(expr.type) {
	case "binaryop":	return [Eden.Selectors.expressionToLists(expr.l),expr.op,Eden.Selectors.expressionToLists(expr.r)];
	case "ternaryop":	return [Eden.Selectors.expressionToLists(expr.first),"if",Eden.Selectors.expressionToLists(expr.condition),"else",Eden.Selectors.expressionToLists(expr.second)];
	case "unaryop":		return [expr.op,Eden.Selectors.expressionToLists(expr.r)];
	case "length":		return [Eden.Selectors.expressionToLists(expr.l),"#"];
	case "index":		return Eden.Selectors.expressionToLists(expr.expression);
	}

	if (expr.type == "literal") {
		switch(expr.datatype) {
		case "NUMBER":
		case "STRING":
		case "BOOLEAN":	return expr.value;
		case "LIST":	var list = [];
						for (var i=0; i<expr.value.length; i++) {
							list.push(Eden.Selectors.expressionToLists(expr.value[i]));
						}
						return list;
		}
	} else if (expr.type == "primary") {
		if (expr.extras.length == 0) return expr.observable;
		var res = [expr.observable];
		for (var i=0; i<expr.extras.length; i++) {
			res.push(Eden.Selectors.expressionToLists(expr.extras[i]));
		}
		return res;
	}
}

Eden.Selectors.listsToExpression = function(lists) {
	if (!Array.isArray(lists)) return lists;
	var res = [];
	for (var i=0; i<lists.length; i++) {
		res.push(Eden.Selectors.listsToExpression(lists[i]));
	}
	return "("+res.join(" ")+")";
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
				case "outersource"	:	val = stat.getOuterSource();
										break;
				case "exprtree"	:	if (stat.expression) val = Eden.Selectors.expressionToLists(stat.expression);
									break;
				case "title"	:	if (stat.base && stat.base.mainDoxyComment) {
										stat.base.mainDoxyComment.stripped();
										var controls = stat.base.mainDoxyComment.getControls();
										if (controls && controls["@title"]) val = controls["@title"][0];
									}
									break;
				case "type"		:	val = stat.type; break;
				//case "path"		:
				case "name"		:	if (stat.lvalue && stat.lvalue.name) {
										val = stat.lvalue.name;
									} else if (stat.name && stat.type != "do") {
										val = stat.name;
									} else if (stat.parent === undefined && stat.base && stat.base.origin) {
										val = stat.base.origin.name;
									} else if (stat.path !== undefined) {
										val = stat.path;
									} break;
				case "symbol"	:	if (stat.lvalue && stat.lvalue.name) {
										val = stat.lvalue.name;
									} break;
				case "line"		:	if (stat.line !== undefined) {
										val = stat.line;
									} break; 
				case "depends"	: val = (stat.dependencies) ? Object.keys(stat.dependencies) : [];
								  break;
				case "value"	: val = (stat.expression) ? stat.expression.execute({scopes:[]}, eden.project.ast, eden.root.scope) : undefined;
								  break;
				case "active"	: 	val = (stat.lvalue && eden.root.symbols[stat.lvalue.name] && eden.root.symbols[stat.lvalue.name].origin && eden.root.symbols[stat.lvalue.name].origin.id == stat.id);
									break;
				case "executed"	:	val = stat.executed > 0; break;
				case "historic"	:	val = stat.executed == -1; break;
				case "tags"		:	if (stat.doxyComment) {
										val = stat.doxyComment.getHashTags();
									} break;
				case "rawcomment"	: if (stat.doxyComment) {
										val = stat.doxyComment.content;
									} break;
				case "controls" :
				case "id"		: val = stat.id; break;
				case "path"		: val = Eden.Selectors.getID(stat); break;
				//case "script"	: val = Eden.Selectors.getScriptBase(stat); break;
				case "remote"	:	var p = stat;
									while(p.parent) p = p.parent;
									if (!p.base || !p.base.origin) {
										val = false;
										break;
									}
									val = p.base.origin.remote;
									break;

				case "root"		:	val = stat.parent === undefined; break;
				}

				ires.push(val);

			}
			if (kinds.length > 1) {
				res.push(ires);
			} else if (kinds.length == 1 && ires.length > 0) {
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

Eden.Selectors.parse = function(s, opts) {
	var options = opts;

	if (!s || s == "") return;

	while (s.length > 0 && s.charAt(0) == "@") {
		if (!options) options = {};
		s = s.substring(1);
		var endix = s.search(/[^a-z]+/);
		if (endix == -1) endix = s.length;
		var opt = s.substring(0,endix);
		s = s.substring(endix).trim();
		options[opt] = true;
	}

	return Eden.Selectors._parse(s,options);
}

Eden.Selectors._parse = function(s, options) {
	var node;

	//console.log("PARSE \""+s+"\"");

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

		if (command.charAt(1).match(/[0-9]+/)) {
			var snum = parseInt(command.substring(1));
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
		var tag = s.match(/#[a-zA-Z0-9_*?]+/);
		if (tag === null) return;
		tag = tag[0];
		node = new Eden.Selectors.TagNode(tag);
		s = s.substring(tag.length).trim();
	} else if (s.charAt(0).match(/[a-zA-Z*?]+/)) {
		var endix = s.search(/[^a-zA-Z0-9_*?\s]+/);
		if (endix == -1) endix = s.length;
		var name = s.substring(0,endix).trim();
		node = new Eden.Selectors.NameNode(name);
		s = s.substring(endix).trim();
	} else s = "";


	var nextnode = Eden.Selectors._parse(s, options);
	if (!node) return;
	node.options = options;
	return node.append(nextnode);
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

Eden.Selectors.sort = function(stats) {
	return stats.sort(function(a,b) {
		return b.stamp - a.stamp;
	});
}

Eden.Selectors.queryWithin = function(within, s, o) {
	var sast = Eden.Selectors.parse(s);
	var statements = Eden.Selectors.unique(sast.filter(within));
	var res = (o) ? Eden.Selectors.processResults(statements, o) : statements;
	return res;
}

Eden.Selectors.query = function(s, o, options, cb) {
	var ctx;
	var num;

	if (options) {
		ctx = options.context;
		num = options.minimum;
	}


	if (typeof num == "boolean") console.trace("Bool");
	if (s === undefined || s == "") {
		var res = [];
		if (cb) cb(res);
		return res;
	}

	var script;
	var statements;

	// Generate a selector AST from the string.
	var sast = Eden.Selectors.parse(s.trim(), (options) ? options.options : undefined);
	if (sast === undefined) {
		if (cb) cb([]);
		return [];
	}

	if (!sast.options || !sast.options.remote) {
		// If a context is given, search in this first unless told otherwise
		if (ctx && ctx.type == "script" && (!sast.options || !sast.options.indexed)) {
			statements = sast.filter(ctx.statements);
		}

		// If there are still no results, do an indexed searched
		if (!statements || statements.length == 0) {
			statements = sast.filter();
		}
		if (statements === undefined) statements = [];

		// Make sure results are unique by id
		if (!sast.options || !sast.options.all) {
			statements = Eden.Selectors.unique(statements);
		}
	
		// Sort by timestamp unless told not to.
		if (!sast.options || !sast.options.nosort) {
			statements = Eden.Selectors.sort(statements);
		}

		// Convert AST node results into requested attributes...
		statements = Eden.Selectors.processResults(statements, o, num);
	} else {
		statements = [];
	}

	// If there are still no results and the query is not a local only
	// query, then look elsewhere. Only possible if a callback is given.
	if (sast.local == false && cb && (!num || (statements.length < num))) {

		var pathix = s.search(/[\s\.\:\#\@\>]/);
		if (pathix == -1) pathix = s.length;
		var path = s.substring(0,pathix).trim();

		// Look for local projects
		if (Eden.Project.local && Eden.Project.local[path]) {
			$.get(Eden.Project.local[path].file, function(data) {
				var res = [(new Eden.AST(data, undefined, {name: path, remote: true})).script];
				Eden.Selectors.cache[path] = res[0];
				//Eden.Index.update(res[0]);
				statements = res;
				statements = Eden.Selectors.unique(sast.filter(statements));
				res = Eden.Selectors.processResults(statements, o);
				cb(res);
			}, "text");
		// Or check for URL
		} else if (path.startsWith("plugins")) {
			var urlparts = s.split(">");
			var url = "";
			for (var i=0; i<urlparts.length; i++) {
				urlparts[i] = urlparts[i].trim();
				url += urlparts[i];
				if (i < urlparts.length-1) {
					//if (i > 0) {
					//	lastnode.statements.p
					//}
					url += "/";
				}
			}

			$.ajax({
				url: url+".js-e",
				dataType: "text",
				success: function(data) {
					var res = [(new Eden.AST(data, undefined, {name: urlparts[urlparts.length-1], remote: true})).script];
					Eden.Selectors.cache[s] = res[0];
					//Eden.Index.update(res[0]);
					statements = res;
					//statements = Eden.Selectors.processNode(statements, s.substring(pathix).trim());
					res = Eden.Selectors.processResults(statements, o);
					cb(res);
				},
				error: function() {
					cb([]);
				}
			});
		// Only search the server if an external query is requested
		} else if (sast.options && sast.options.external) {
			//Then need to do a remote search
			Eden.DB.searchSelector(s, (o === undefined) ? ["outersource","path"] : o, function(stats) {
				if (o === undefined && stats.length > 0) {
					// Need to generate an AST for each result
					// Loop and do all...
					for (var i=0; i<stats.length; i++) {
						//if (i > num) break;
						var script;
						//if (stats[i][0]) {
						//	script = Eden.AST.parseScript(stats[i][1], {remote: true}); //(new Eden.AST(stats[i][1], undefined, {name: path, remote: true}, {noparse: false, noindex: true})).script;
						//	script.name = stats[i][2];
						//	script.id = stats[i][3];
						//	
						//} else {
							//console.log("Get Outersource", stats[i][0]);
							script = Eden.AST.parseStatement(stats[i][0], {remote: true});
							var origin = Eden.AST.originFromDoxy(script.doxyComment);
							origin.remote = true;
							script.base.origin = origin;
							script.id = origin.id;
							//script.id = stats[i][3];

							// Find inner most statement...?
							//console.log("PATH:",stats[i][1],script);
							var innerscript = Eden.Selectors.queryWithin([script],stats[i][1])[0];
						//}
						if (innerscript) {
							statements.push(innerscript);
							// Automatically index the result
							if (sast.options && sast.options.index) script.addIndex();
						} else {

						}
					} 
				} else {
					statements.push.apply(statements,stats);
				}
				cb(statements);
			});
		} else {
			cb([]);
		}

		return;
	} else {
		//var res = Eden.Selectors.processResults(statements, o);
		if (cb) cb(statements);
		return statements;
	}
}


Eden.Selectors.execute = function(selector, cb) {
	Eden.Selectors.query(selector, undefined, {minimum: 1}, function(stats) {
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
	var res = Eden.Selectors.query(selector, undefined, {minimum: 1});

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

/**
 * Edit AST nodes that match a query.
 */
Eden.Selectors.modify = function(selector, attributes, values) {
	var res = Eden.Selectors.query(selector);

	var attribs = (typeof attributes == "string") ? attributes.split(",") : attributes;
	var vals = (Array.isArray(values)) ? values : [values];

	if (vals.length < attribs.length) {
		console.error("Not enough values");
		return;
	}

	for (var i=0; i<res.length; i++) {
		for (var j=0; j<attribs.length; j++) {
			switch (attribs[j]) {
			case "source"		:	if (res[i].parent) {
										var parent = res[i].parent;
										if (typeof vals[j] == "string") {
											var newnode = Eden.AST.parseStatement(vals[j]);
											res[i].parent.replaceChild(res[i], newnode);
										} else if (vals[j] === undefined) {
											res[i].parent.removeChild(res[i]);
										}
										// Notify all parent fragments of patch
										while (parent) {
											Eden.Fragment.emit("patch", [undefined, parent]);
											parent = parent.parent;
										}
									} else {
										console.error("Cannot replace outer source of root script");
									}
									break;
			case "innersource"	:	if (res[i].type == "script") {
										var newnode = Eden.AST.parseScript(vals[j]);
										res[i].patchInner(newnode);
										var parent = res[i];
										// Notify all parent fragments of patch
										while (parent) {
											Eden.Fragment.emit("patch", [undefined, parent]);
											parent = parent.parent;
										}
									} else {
										console.error("Cannot replace innersource of non-script node");
									}
									break;

			case "title":
			case "comment":
			case "rawcomment":		var doxy = new Eden.AST.DoxyComment(vals[j],0,0);
									res[i].doxyComment = doxy;
									break;
			case "tags":
			case "executed": break;
			case "enabled"		:	if (res[i].type == "when") {
										if (res[i].enabled && !vals[j]) {
											eden.project.removeAgent(res[i]);
											res[i].enabled = false;
											//res[i].executed = 0;
										} else if (!res[i].enabled && vals[j]) {
											eden.project.registerAgent(res[i]);
											res[i].enabled = true;
										}
									} break;
			case "name"			:	if (res[i].type == "script") {
										Eden.Index.remove(res[i]);
										res[i].prefix = "action "+vals[j]+" {";
										res[i].name = vals[j];
										Eden.Index.update(res[i]);
									} break;
			default: console.error("Cannot modify property '"+attribs[j]+"'");
			}
		}
	}
}


