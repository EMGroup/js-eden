Eden.Selectors = {
	cache: {}
	//imported: new Eden.AST.Virtual("imported")
};

Eden.Selectors.findLocalBase = function(path, ctx, filters) {
	var scripts = [];
	var paths = path.split(",");

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
			if (path == eden.project.name) script = eden.project.ast.script;
			else script = ctx.getActionByName(path);
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

			// Now check for : and # queries amongst existing cached projects
			// before giving up entirely.
		}
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
	var res;
	if (stat.type == "script" && stat.name) {
		res = "."+stat.name;
	} else if (stat.parent) {
		var children = Eden.Selectors.getChildren([stat.parent], false);
		for (var i=0; i<children.length; i++) {
			if (children[i] === stat) {
				res = ":"+i;
				break;
			}
		}
	} else {
		res = stat.base.origin.name;
	}

	if (stat.parent) {
		res = Eden.Selectors.getID(stat.parent)+res;
	} else {
		if (res.charAt(0) == ".") res = res.substring(1);
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
	return -1;
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

		// TODO, allow nested brackets.

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

			case "type"		:	statements = statements.filter(function(stat) {
									return (stat.expression && Eden.Selectors.testType(stat.expression) == param) ||
											(stat.expression && stat.expression.type == "scope" && stat.expression.range && param == "list");
								}); break;

			case "depends"	:	//var regex = edenUI.regExpFromStr(param);
								statements = statements.filter(function(stat) {
									return stat.type == "definition" && stat.dependencies[param];
								}); break

			case "active"	:	statements = statements.filter(function(stat) {
									if (stat.type == "definition") {
										var sym = eden.root.symbols[stat.lvalue.name];

										if (sym && sym.eden_definition) {
											var p = stat;
											while (p.parent) p = p.parent;
											var base = p.base;
											var src = base.getSource(stat);

											if (sym.eden_definition == src) {
												return true;
											}
										}
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

			case "remote"	:	statements = statements.filter(function(stat) {
									var p = stat;
									while(p.parent) p = p.parent;
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
	} else if (s.charAt(0).match(/[a-z]+/)) {
		var endix = s.search(/[^a-z]+/);
		if (endix == -1) endix = s.length;
		var name = s.substring(0,endix);
		var nstats = [];
		for (var i=0; i<statements.length; i++) {
			if (statements[i].type == name) {
				nstats.push(statements[i]);
			}
		}
		statements = nstats;
		return Eden.Selectors.processNode(statements, s.substring(endix));
	}
	return [];
}

Eden.Selectors.queryWithin = function(within, s, o) {
	var statements = Eden.Selectors.processNode(within, s);
	var res = (o) ? Eden.Selectors.processResults(statements, o) : statements;
	return res;
}

Eden.Selectors.query = function(s, o, ctx, single, cb) {
	if (s == "") {
		var res = [];
		if (cb) cb(res);
		return res;
	}
	if (ctx === undefined) ctx = eden.project.ast.script;

	var pathix = s.search(/[\s\.\:\#\@\>]/);
	if (pathix == -1) pathix = s.length;
	var path = s.substring(0,pathix).trim();
	var script;
	var pathixf = s.search(/[\>]/);
	if (pathixf == -1) pathixf = s.length;

	var statements = Eden.Selectors.findLocalBase(path, ctx, s.substring(pathix,pathixf).trim());
	if (statements === undefined) statements = [];
	statements = Eden.Selectors.queryWithin(statements, s.substring(pathix).trim(), undefined);
	if (statements === undefined) statements = [];

	statements = Eden.Selectors.processResults(statements, o);

	if (cb && ((statements.length == 0 && single) || !single)) {

		// Look for local projects
		if (Eden.Project.local[path]) {
			$.get(Eden.Project.local[path].file, function(data) {
				var res = [(new Eden.AST(data, undefined, {name: path, remote: true})).script];
				Eden.Selectors.cache[path] = res[0];
				statements = res;
				statements = Eden.Selectors.processNode(statements, s.substring(pathix).trim());
				res = Eden.Selectors.processResults(statements, o);
				cb(res);
			}, "text");
		} else {
			//Then need to do a remote search
			Eden.DB.searchSelector(s, (o === undefined) ? "source" : o, function(stats) {
				if (o === undefined && stats.length > 0) {
					// Need to generate an AST for each result, or first only if single
					if (single) {
						statements.push((new Eden.AST(stats[0], undefined, {name: path, remote: true})).script);
						Eden.Selectors.cache[path] = statements[0];
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

