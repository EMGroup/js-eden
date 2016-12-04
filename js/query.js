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
	var doremotescripts = false;
	var dohash = true;
	var dofuncs = true;

	var res = {
		views: [],
		symbols: [],
		whens: [],
		projects: [],
		scripts: []
	};

	if (words.length > 0) {
		if (words[0].charAt(words[0].length-1) == ":") {
			i = 1;
			inittoken = true;

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
			if (dosymbols) res.symbols.push.apply(res.symbols, Eden.Query.searchSymbols(regex));
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
			if (count >= MAX) break;
			count++;
			res.all.push(res.scripts[i]);
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

Eden.Query.searchSymbols = function(q) {
	var res = [];
	for (var x in eden.root.symbols) {
		if (q.test(x)) res.push(x);
	}
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

