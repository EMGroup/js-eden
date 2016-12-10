function sortByCount(arr) {
	// Sort results by count.
	var map = arr.reduce(function (p, c) {
		p[c] = (p[c] || 0) + 1;
		return p;
	}, {});
	return Object.keys(map).sort(function (a, b) {
		return map[a] < map[b];
	});
}

function reduceByCount(arr, num) {
	var map = arr.reduce(function (p, c) {
		p[c] = (p[c] || 0) + 1;
		return p;
	}, {});

	var res = [];
	for (var x in map) {
		if (map[x] >= num) res.push(x);
	}
	return res;
}

function negativeFilter(arr, neg) {
	var map = neg.reduce(function (p, c) {
		p[c] = (p[c] || 0) + 1;
		return p;
	}, {});

	var res = [];
	for (var i=0; i<arr.length; i++) {
		if (!map[arr[i]]) res.push(arr[i]);
	}
	return res;
}

function sortByLoaded(arr) {
	var l = [];
	var n = [];
	for (var i=0; i<arr.length; i++) {
		if (Eden.Agent.agents[arr[i]]) l.push(arr[i]);
		else n.push(arr[i]);
	}
	l.push.apply(l,n);
	return l;
}

Eden.Query = {};
Eden.Query.sortByCount = sortByCount;
Eden.Query.reduceByCount = reduceByCount;
Eden.Query.negativeFilter = negativeFilter;

Eden.Query.search = function(q, cb) {
	var words = q.split(/[ ]+/);
	var inittoken = false;
	var i = 0;
	var rcount = words.length;
	var dosymbols = true;
	var doagents = true;
	var doprojects = false;
	var dolocalscripts = true;
	var doremotescripts = true;
	var dohash = true;
	var dofuncs = true;

	var res = {
		views: [],
		symbols: [],
		whens: [],
		projects: [],
		scripts: [],
		statements: []
	};

	if (words.length > 0) {
		if (words[0].charAt(words[0].length-1) == ":") {
			i = 1;
			inittoken = true;

			if (words[0] == "select:") {
				// Do a code selector query...
				var selector = q.substring(words[0].length).trim();
				res.all = Eden.Query.querySelector(selector);
				if (res.all === undefined) res.all = [];
				if (cb) cb(res);

				if (cb) {
					if (Eden.Query.dbseltimeout) clearTimeout(Eden.Query.dbseltimeout);

					Eden.Query.dbseltimeout = setTimeout( function() {
						Eden.Query.dbseltimeout = undefined;
						Eden.DB.searchSelector(selector, "source", function(results) {
							//res.scripts.push.apply(res.scripts, results);
							//res.scripts = reduceByCount(res.scripts, rcount);
							//res.scripts = sortByLoaded(res.scripts);
							//Eden.Query.mergeResults(res);
							//if (cb) cb(res);
							res.all.push.apply(res.all, results);
							cb(res);
							//console.log(results);
						});
					}, 500);
				}
				return res;
			}

			// Process the init token to control results
			switch (words[0]) {
			case "procs:"		:
			case "whens:"		:
			case "agents:"		:	doagents = true;
									dosymbols = false;
									doprojects = false;
									dolocalscripts = false;
									doremovescripts = false;
									dohash = true;
									dofuncs = false;
									break;
			case "scripts:"		:	doagents = false;
									dosymbols = false;
									dolocalscripts = true;
									doremotescripts = true;
									doprojects = false;
									dohash = false;
									dofuncs = false;
									break;
			}
		}
	}

	rcount -= i;

	for (; i<words.length; i++) {
		if (words[i] == "") {
			rcount--;
			continue;
		}

		if (words[i].startsWith("depends:")) {
			var dep = words[i].split(":");
			if (dep[1] == "") {
				rcount--;
				continue;
			}

			var regex = edenUI.regExpFromStr(dep[1], undefined, undefined, "regexp");

			if (dosymbols) {
				res.symbols.push.apply(res.symbols, Eden.Query.searchDepends(regex));
			}
			// TODO applies to agents also
		} else {
			var regex = edenUI.regExpFromStr(words[i], undefined, undefined, "regexp");
			var regex2 = edenUI.regExpFromStr("^"+words[i], undefined, undefined, "regexp");
			if (dosymbols) res.symbols.push.apply(res.symbols, Eden.Query.searchSymbols(regex,regex2));
			if (doagents) res.whens.push.apply(res.whens, Eden.Query.searchWhens(regex));
			if (doremotescripts && words[i].length > 2) {
				(function (word) {
				if (Eden.Query.dbtimeout) clearTimeout(Eden.Query.dbtimeout);

				Eden.Query.dbtimeout = setTimeout( function() {
					Eden.Query.dbtimeout = undefined;
					Eden.DB.search(word, function(results) {
						res.scripts.push.apply(res.scripts, results);
						res.scripts = reduceByCount(res.scripts, rcount);
						res.scripts = sortByLoaded(res.scripts);
						Eden.Query.mergeResults(res);
						if (cb) cb(res);
					});
				}, 500);
				})(words[i]);
			} else if (dolocalscripts) {
				res.scripts.push.apply(res.scripts, Eden.Query.searchScripts(regex));
			}
		}
	}

	res.symbols = reduceByCount(res.symbols, rcount);
	//res.whens = reduceByCount(res.whens, rcount);

	// Process all results into a single result...
	Eden.Query.mergeResults(res);

	if (cb) cb(res);
	return res;
}

Eden.Query.mergeResults = function(res) {
	res.all = [];
	var MAXSYMS = 3;
	var MAXAGENTS = 2;
	var MAXSCRIPTS = 2;
	var count = 0;

	function interleave(MAX, start) {
		count = 0;
		for (var i=start; i<res.symbols.length; i++) {
			if (count >= MAX) break;
			count++;
			res.all.push("/" + res.symbols[i]);
		}

		count = 0;
		for (var i=start; i<res.whens.length; i++) {
			if (count >= MAX) break;
			count++;
			res.all.push(res.whens[i]);
		}

		count = 0;
		for (var i=start; i<res.scripts.length; i++) {
			if (count >= MAX-1) break;
			count++;
			res.all.push("*script"+res.scripts[i]);
		}

		count = 0;
		for (var i=start; i<res.statements.length; i++) {
			if (count >= MAX) break;
			count++;
			res.all.push(res.statements[i]);
		}

		// Recursively process the results...
		if (res.symbols.length > start+MAX || res.whens.length > start+MAX || res.scripts.length > start+MAX) {
			interleave(2, start+MAX);
		}
	}

	interleave(3,0);
}

Eden.Query.searchViews = function(q) {

}

Eden.Query.searchSymbols = function(q,q2) {
	var res = [];
	var ressys = [];
	for (var x in eden.root.symbols) {
		var sym = eden.root.symbols[x];
		if (q.test(x)) {
			if (sym.last_modified_by.internal || x.charAt(0) == "_") {
				//console.log("INTERNAL", x);
				//ressys.push(x);
			} else {
				res.push(x);
			}
			continue;
		}
		if (q2 && eden.dictionary[x]) {
			var tags = eden.dictionary[x].getHashTags();
			if (tags) {
				for (var i=0; i<tags.length; i++) {
					if (q2.test(tags[i])) {
						if (sym.last_modified_by.internal || x.charAt(0) == "_") {
							//ressys.push(x);
						} else {
							res.push(x);
						}
						break;
					}
				}
			}
		}
	}
	//res.push.apply(res, ressys);
	return res;
}

Eden.Query.searchDepends = function(q) {
	var res = [];
	for (var x in eden.root.symbols) {
		for (var y in eden.root.symbols[x].dependencies) {
			if (q.test(y.slice(1))) res.push(x);
		}
	}
	return res;
}

Eden.Query.searchWhens = function(q) {
	var res = [];
	for (var x in Eden.Agent.agents) {
		var ag = Eden.Agent.agents[x];
		if (!ag.ast) continue;
		for (var y in ag.ast.triggers) {
			if (q.test(y)) {
				var whens = ag.ast.triggers[y];
				for (var i=0; i<whens.length; i++) {
					if (res.indexOf(whens[i].statement) == -1) res.push(whens[i].statement);
				}
			}
		}
	}
	return res;
}

Eden.Query.searchProjects = function(q) {

}

Eden.Query.searchScripts = function(q) {
	var res = [];
	for (var x in Eden.DB.meta) {
		if (q.test(x)) {
			res.push(x);
		}
	}
	return res;
}

Eden.Query.treeBottomUp = function() {
	var base = {};
	for (var x in eden.root.symbols) {
		var sym = eden.root.symbols[x];
		if (sym.definition === undefined || Object.keys(sym.dependencies).length == 0) {
			base[x] = {};
		}
	}

	function processSymbol(base) {
		for (var x in base) {
			var sym = eden.root.symbols[x];
			if (!sym) continue;
			var dest = base[x];
			for (var y in sym.subscribers) {
				dest[y.slice(1)] = {};
			}
			processSymbol(dest);
		}
	}

	processSymbol(base);

	return base;
}

Eden.Query.treeTopDown = function(base) {

	if (base === undefined) {
		base = {};
		for (var x in eden.root.symbols) {
			var sym = eden.root.symbols[x];
			if (!sym) continue;
			if (Object.keys(sym.subscribers).length == 0) {
				base[x] = {};
			}
		}
	} else if (Array.isArray(base)) {
		var nbase = {};
		for (var i=0; i<base.length; i++) {
			nbase[base[i]] = {};
		}
		base = nbase;
	}

	function processSymbol(base) {
		for (var x in base) {
			var sym = eden.root.symbols[x];
			if (!sym) continue;
			var dest = base[x];
			for (var y in sym.dependencies) {
				dest[y.slice(1)] = {};
			}
			processSymbol(dest);
		}
	}

	processSymbol(base);

	return base;
}

Eden.Query.objectHierarchy = function() {
	function testSymbol(sym) {
		if (sym.statid !== undefined) {
			var stat = Eden.Statement.statements[sym.statid];
			if (stat.statement && stat.statement.doxyComment && stat.statement.doxyComment.hasTag("#library")) {
				return false;
			}
		}
		return true;
	}

	var base = {};
	for (var x in eden.root.symbols) {
		var sym = eden.root.symbols[x];
		if (!sym || !testSymbol(sym)) continue;
		if (Object.keys(sym.subscribers).length == 0 && Object.keys(sym.dependencies).length != 0) {
			base[x] = {};
		}
	}

	function processSymbol(base) {
		for (var x in base) {
			var sym = eden.root.symbols[x];
			if (!sym || !testSymbol(sym)) continue;
			var dest = base[x];
			for (var y in sym.dependencies) {
				dest[y.slice(1)] = {};
			}
			processSymbol(dest);
		}
	}

	processSymbol(base);

	return base;
}

Eden.Query.dependencyTree = function(base) {
	var nbase = {};

	function merge(a,b) {
		for (var x in b) {
			if (a[x] === undefined) a[x] = b[x];
			else {
				merge(a[x],b[x]);
			}
		}
	}

	function processBase(sym) {
		//console.log(sym.name);
		var name = sym.name.slice(1);
		if (Object.keys(sym.subscribers).length == 0) {
			if (nbase[name] === undefined) nbase[name] = {};
			return nbase[name];
		} else {
			var mine = {};
			for (var s in sym.subscribers) {
				var p = processBase(sym.subscribers[s]);
				if (p[name] !== undefined) {
					// Must merge p[name] with mine...
					merge(mine,p[name]);
				}
				p[name] = mine;
			}
			return mine;
		}
	}

	for (var s in base) {
		var sym = eden.root.lookup(s);
		var p = processBase(sym);
		//if (p[s] === undefined) p[s] = {};
	}

	//console.log(nbase);

	/*function processSymbol(base) {
		for (var x in base) {
			var sym = eden.root.symbols[x];
			if (!sym) continue;
			var dest = base[x];
			for (var y in sym.dependencies) {
				dest[y.slice(1)] = {};
			}
			processSymbol(dest);
		}
	}

	processSymbol(nbase);*/

	return nbase;
}

Eden.Query.queryScripts = function(path, ctx) {
	//console.log("PATH",path);
	var scripts = [];

	var paths = path.split(",");

	for (var i=0; i<paths.length; i++) {
		var path = paths[i].trim();
		if (path == "/" || path == "*") {
			var src = Eden.Generator.symbolScript();
			var ast = new Eden.AST(src, undefined, Symbol.jsAgent);
			scripts.push(ast.script);
		}

		if (path != "/") {
			if (path.includes("*")) {
				var regexp = edenUI.regExpFromStr(path, undefined, true, "simple");
				for (var x in Eden.Agent.agents) {
					if (regexp.test(x)) {
						var ag = Eden.Agent.agents[x];
						if (ag.ast) scripts.push(ag.ast.script);
					}
				}
			} else {
				// Find local action first
				var script;
				if (ctx) {
					script = ctx.getActionByName(path);
				}

				// Now attempt to find exact agent...
				if (script === undefined) {
					var ag = Eden.Agent.agents[path];
					if (!ag) return []
					script = ag.ast.script;
				}
				if (!script) return [];
				scripts.push(script);
			}
		}
	}
	//console.log(scripts);
	return scripts;
}

Eden.Query.querySelector = function(s, o, ctx, cb) {
	console.log("SELECTOR",s);

	var pathix = s.search(/[\.\:\#\>]/);
	if (pathix == -1) pathix = s.length;
	var path = s.substring(0,pathix).trim();
	var script;
	var statements = Eden.Query.queryScripts(path, ctx);

	function testType(expr) {
		if (expr.type == "binaryop") {
			switch(expr.op) {
			case "+":
			case "-":
			case "/":
			case "*":
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

	function getChildren(statements, recurse) {
		var nstats = [];
		for (var i=0; i<statements.length; i++) {
			if (statements[i].type == "script") {
				nstats.push.apply(nstats,statements[i].statements);
				if (recurse) nstats.push.apply(nstats, getChildren(statements[i].statements, recurse));
			} else if (statements[i].type == "for") {
				if (statements[i].statement && statements[i].statement.type == "script") {
					nstats.push.apply(nstats,statements[i].statement.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].statement.statements, recurse));
				}
			} else if (statements[i].type == "if") {
				if (statements[i].statement && statements[i].statement.type == "script") {
					nstats.push.apply(nstats,statements[i].statement.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].statement.statements, recurse));
				}
				if (statements[i].elsestatement && statements[i].elsestatement.type == "script") {
					nstats.push.apply(nstats,statements[i].elsestatement.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].elsestatement.statements, recurse));
				}
			} else if (statements[i].type == "when") {
				if (statements[i].statement && statements[i].statement.type == "script") {
					nstats.push.apply(nstats,statements[i].statement.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].statement.statements, recurse));
				}
			} else if (statements[i].type == "while") {
				if (statements[i].statement && statements[i].statement.type == "script") {
					nstats.push.apply(nstats,statements[i].statement.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].statement.statements, recurse));
				}
			} else if (statements[i].type == "do") {
				if (statements[i].script && statements[i].script.type == "script") {
					nstats.push.apply(nstats,statements[i].script.statements);
					if (recurse) nstats.push.apply(nstats, getChildren(statements[i].script.statements, recurse));
				}
			}
		}
		return nstats;
	}

	function processNode(s) {
		//console.log("NODE",s);
		if (!s || s == "") return;

		// Go into childrne
		if (s.charAt(0) == ">") {
			// Go to all children recursively
			if (s.charAt(1) == ">") {
				statements = getChildren(statements, true);
				processNode(s.substring(2).trim());
			// Only go to direct children
			} else {
				statements = getChildren(statements, false);
				processNode(s.substring(1).trim());
			}
		} else if (s.charAt(0) == ":") {
			if (s.charAt(1).match(/[0-9]+/)) {
				var s2 = s.substring(1);
				var snum = parseInt(s2);
				var endix = s2.search(/[^0-9]+/);
				if (endix == -1) endix = s2.length;
			
				var nstats = [];
				for (var i=0; i<statements.length; i++) {
					var parent = statements[i].parent;
					if (parent) {
						if (getChildren([parent], false)[snum-1] === statements[i]) {
							nstats.push(statements[i]);
						}
					}
				}
				statements = nstats;
				processNode(s2.substring(endix).trim());
			} else if (s.startsWith(":name(")) {
				var endix = s.indexOf(")");
				if (endix == -1) { statements = []; return; }
				var name = s.substring(6,endix);
				//console.log("GET NAME", name);
				var regex = edenUI.regExpFromStr(name);
				var nstats = [];
				for (var i=0; i<statements.length; i++) {
					if (statements[i].lvalue && regex.test(statements[i].lvalue.name)) {
						nstats.push(statements[i]);
					}
				}
				statements = nstats;
				processNode(s.substring(endix+1).trim());
			} else if (s.startsWith(":type(")) {
				var endix = s.indexOf(")");
				if (endix == -1) { statements = []; return; }
				var type = s.substring(6,endix);
				var nstats = [];
				for (var i=0; i<statements.length; i++) {
					if (statements[i].expression && testType(statements[i].expression) == type) {
						nstats.push(statements[i]);
					} else if (statements[i].expression && statements[i].expression.type == "scope" && statements[i].expression.range && type == "list") {
						nstats.push(statements[i]);
					}
				}
				statements = nstats;
				processNode(s.substring(endix+1).trim());
			} else if (s.startsWith(":depends(")) {
				var endix = s.indexOf(")");
				if (endix == -1) { statements = []; return; }
				var name = s.substring(9,endix);
				//console.log("GET NAME", name);
				var regex = edenUI.regExpFromStr(name);
				var nstats = [];
				for (var i=0; i<statements.length; i++) {
					if (statements[i].type == "definition" && statements[i].dependencies[name]) {
						nstats.push(statements[i]);
					}
				}
				statements = nstats;
				processNode(s.substring(endix+1).trim());
			} else if (s.startsWith(":active") && (s.length == 7 ||s.charAt(7).match(/[^a-zA-Z]/))) {
				var nstats = [];
				for (var i=0; i<statements.length; i++) {
					if (statements[i].type == "definition") {
						var sym = eden.root.symbols[statements[i].lvalue.name];

						if (sym && sym.eden_definition) {
							var p = statements[i];
							while (p.parent) p = p.parent;
							var base = p.base;
							var src = base.getSource(statements[i]);

							if (sym.eden_definition == src) {
								nstats.push(statements[i]);
							}
						}
					}
				}
				statements = nstats;
				processNode(s.substring(7).trim());
			} else {
				statements = [];
			}
			//console.log(statements);
		} else if (s.charAt(0) == "#") {
			var nstats = [];
			var tag = s.match(/#[a-zA-Z0-9_]+/);
			if (!tag) return [];
			tag = tag[0];
			console.log("hashtag",tag);
			for (var i=0; i<statements.length; i++) {
				if (statements[i].doxyComment && statements[i].doxyComment.hasTag(tag)) {
					nstats.push(statements[i]);
				}
			}
			statements = nstats;
			processNode(s.substring(tag.length).trim());
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
			processNode(s.substring(endix).trim());
		}
	}
	processNode(s.substring(pathix).trim());

	if (statements === undefined) statements = [];

	// Check what kind of result we are to return
	if (o !== undefined) {
		var kinds = (Array.isArray(o)) ? o : o.split(",");

		var res = [];

		for (var i=0; i<statements.length; i++) {
			var stat = statements[i];
			var ires = [];

			for (var j=0; j<kinds.length; j++) {

				switch(kinds[j]) {
				case "brief"	:	if (stat.doxyComment) {
										ires.push(stat.doxyComment.brief());
									} break;
				case "comment"	:	if (stat.doxyComment) {
										ires.push(stat.doxyComment.stripped());
									} break;
				case "source"	:	var p = stat;
									while (p.parent) p = p.parent;
									var base = p.base;
									ires.push(base.getSource(stat));
									break;
				case "path"		:
				case "name"		:	
				case "symbol"	:	if (stat.lvalue && stat.lvalue.name) {
										ires.push(stat.lvalue.name);
									} else if (stat.name) {
										ires.push(stat.name);
									} else if (stat.parent === undefined && stat.base && stat.base.origin) {
										ires.push(stat.base.origin.name);
									} else if (stat.path !== undefined) {
										ires.push(stat.path);
									} break;
				case "depends"	:
				case "value"	:
				case "tags"		:
				case "rawcomment"	:
				case "controls" :
				case "id"		:
				case "unique"	: break;
				}

			}
			if (kinds.length > 1 && ires.length > 0) {
				res.push(ires);
			} else if (kinds.length == 1 && ires.length > 0) {
				res.push(ires[0]);
			}
		}
		return res;
	}

	return statements;
}

