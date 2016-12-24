EdenUI.ExplorerState = function(element) {
	var me = this;

	this.outer = element;
	this.controls = $('<div class="explore-controls">\
		<button class="explorer-control capture"><span class="explorer-control-icon">&#xf111;</span>Capture</button>\
		<button class="explorer-control clear"><span class="explorer-control-icon">&#xf05e;</span>Clear</button>\
		<span class="explorerfilter"><input type="text" class="explorerfilter" placeholder="Filter..."></input></span>\
	</div>');
	this.results = $('<div class="explore-symbols"></div>');
	this.outer.append(this.controls);
	this.outer.append(this.results);
	//this.results = this.element.find(".explore-symbols");
	this.searchbox = this.controls.find(".explorerfilter");
	this.watchobs = {};
	this.capture = false;
	this.delay = 100;
	this.delay2 = 20;
	this.timeout = undefined;
	this.timeout2 = undefined;
	this.mode = "tree";
	this.index = {};
	this.todo = {};
	this.filter = undefined;

	eden.root.addGlobal(function(sym, kind) {
		//if (!me.capture) return;
		//if (Object.keys(sym.dependencies).length > 0) return;
		var name = sym.name;

		if (me.capture && (kind != Symbol.EXPIRED || me.watchobs[name] === undefined) && (me.filter === undefined || me.filter[name])) {
			if (me.watchobs[name] === undefined) {
				me.watchobs[sym.name] = 1;
			} else {
				me.watchobs[name].lastupdate = 1;
			}

			me.triggerUpdate();
		} else {
			me.todo[name] = true;
			if (me.timeout2 === undefined) me.timeout2 = setTimeout(function() {
				me.timeout2 = undefined;
				var todo = me.todo;
				me.todo = {};

				// Just go through elements and update values.
				for (var x in me.index) {
					if (!todo[x]) continue;

					var sym = eden.root.symbols[x];
					if (sym === undefined) {
						for (var i=0; i<me.index[x].length; i++) {
							me.removeEntry(x, me.index[x][i]);
						}
						delete me.index[x];
					} else {
						for (var i=0; i<me.index[x].length; i++) {
							me.updateEntry(sym, me.index[x][i]);
						}
					}
				}
			}, me.delay2);
		}
	});

	this.controls.on("click", ".clear", function(e) {
		var clrsym = eden.root.lookup("jseden_explorer_clear");
		if (!clrsym.eden_definition) clrsym.assign(true, eden.root.scope, Symbol.localJSAgent);
	});

	this.controls.on("click", ".capture", function(e) {
		var capsym = eden.root.lookup("jseden_explorer_capture");
		if (!capsym.eden_definition) capsym.assign(!capsym.value(), eden.root.scope, Symbol.localJSAgent);
	});

	this.results.on("click", ".explore-observable", function(e) {
		var obs = e.currentTarget.parentNode.parentNode.parentNode.getAttribute("data-obs");
		if (e.ctrlKey || e.metaKey) {
			console.log("GOTO",obs);
			edenUI.gotoCode("/"+obs);
			e.stopPropagation();
		} else {
			var sym = eden.root.symbols[obs];
			if (sym) {
				if (sym.eden_definition) {
					me.console.setSource(sym.eden_definition);
				} else {
					me.console.setSource(obs + " = " + Eden.edenCodeForValue(sym.value()) + ";");
				}
				me.console.focus();
			}
		}
	});

	this.results.on("click", ".explore-expand-value", function(e) {
		var node = e.currentTarget.parentNode.parentNode.parentNode;
		var obs = node.getAttribute("data-obs");
		me.updateEntry(eden.root.lookup(obs), e.currentTarget.parentNode, true);
	});

	this.results.on("click", ".eden-path", function(e) {
		var path = e.currentTarget.textContent;
		edenUI.gotoCode(path,-1);
	});

	this.results.on("click", ".explore-entry-icon", function(e) {
		//console.log(e);
		var node = e.currentTarget.parentNode.parentNode.parentNode;
		var name = node.getAttribute("data-obs");
		var expanded = node.getAttribute("data-expanded") == "true";

		if (expanded) {
			e.currentTarget.innerHTML = "&#xf067;";
			node.setAttribute("data-expanded","false");

			var cur = node.firstChild;
			while (cur) {
				var next = cur.nextSibling;
				if (cur.nodeName == "DIV" && cur.className != "explore-entry-inner" && cur.className.includes("active") == false) node.removeChild(cur);
				cur = next;
			}

			//TODO Clear Index Entry of all children!!
		} else {
			e.currentTarget.innerHTML = "&#xf068;";
			node.setAttribute("data-expanded","true");

			var sym = eden.root.symbols[name];
			var existing = {};
			var cur = node.firstChild;
			while (cur) {
				//console.log(cur);
				if (cur.nodeName == "DIV") existing[cur.getAttribute("data-obs")] = true;
				cur = cur.nextSibling;
			}

			for (var x in sym.dependencies) {
				if (!existing[x]) {
					//node.append(me.makeEntry(x.slice(1), {}, false));
					var sym2 = sym.dependencies[x];
					var name = x;
					var ele = $('<div class="explore-entry'+((false) ? " active":"")+'" data-obs="'+name+'"><div class="explore-entry-inner"><span><span class="explore-entry-icon">&#xf067;</span><span class="explore-observable">'+name+'</span> </span><div class="symvalue"></div></div></div>');
					var valele = ele.find(".symvalue").get(0);				
					me.updateEntry(sym2, valele);	
					if (me.index[name] === undefined) me.index[name] = [];
					me.index[name].push(valele);				
					node.appendChild(ele.get(0));
				}
			}

			$(node).append(me.makeAgentEntry(sym.last_modified_by));
		}
	});

	var searchSym = eden.root.lookup("jseden_explorer_search");
	var searchVal = searchSym.value();
	if (searchVal) {
		this.searchbox.val(searchval);
	}
	searchSym.addJSObserver("explorer", function(sym, val) {
		if (val !== undefined && sym.last_modified_by.name != "*JavaScript") {
			me.searchbox.val(val);
		}
	});

	this.searchbox.on("keyup", function(e) {
		if (searchSym.eden_definition === undefined) {
			searchSym.assign(e.target.value, eden.root.scope, Symbol.localJSAgent);
		}
	});

	var watchSym = eden.root.lookup("jseden_explorer_watch");
	var watchVal = watchSym.value();
	if (Array.isArray(watchVal)) {
		//if (!this.capture) {
			//this.filter = undefined;
			this.clear();
			this.watch(watchVal);
		//}
	}
	watchSym.addJSObserver("explorer", function(sym, val) {
		if (Array.isArray(val)) {
			if (me.capture) {
				me.filter = undefined;
			} else {
				me.clear();
			}
			me.watch(val);
		}
	});

	var capSym = eden.root.lookup("jseden_explorer_capture");
	capSym.addJSObserver("explorer", function(sym, val) {
		if (val) {
			me.record();
			me.controls.find(".capture").addClass("active");
		} else {
			me.capture = false;
			me.controls.find(".capture").removeClass("active");
		}
	});
	if (capSym.value()) me.record();

	var clearSym = eden.root.lookup("jseden_explorer_clear");
	clearSym.addJSObserver("explorer", function(sym, val) {
		if (val) {
			me.clear();
		}
	});
}

EdenUI.ExplorerState.prototype.triggerUpdate = function() {
	if (this.timeout === undefined) {
		var me = this;
		this.timeout = setTimeout(function() {
			me.index = {};
			me.timeout = undefined;
			if (me.mode == "list") {
				me.updateList();
			} else if (me.mode == "tree") {
				me.updateTree();
			} else if (me.mode == "graph") {
				me.updateGraph();
			}
		}, this.delay);
	}
}

EdenUI.ExplorerState.prototype.updateList = function() {
	
}

EdenUI.ExplorerState.prototype.makeAgentEntry = function(agent) {
	var lmn = agent.name;

	if (lmn.startsWith("*Console")) {
		return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf108;</span> <b>console</b></div>');
	} else if (lmn.startsWith("*When")) {
		var aname = lmn.split(":");
		var short = aname[1].split("/");
		short = short[short.length-1];
		aname = short + ":" + aname[2];

		return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">when</span> <span class="eden-path">'+aname+'</span></div>');
	} else if (lmn.startsWith("*Action")) {
		var aname = lmn.split(":");
		var short = aname[1].split("/");
		short = short[short.length-1];
		aname = short + ":" + aname[2];

		return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">action</span> <span class="eden-path">'+aname+'</span></div>');
	} else if (lmn.charAt(0) == "/") {
		if (agent.eden_definition && agent.eden_definition.startsWith("proc")) {
			return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">proc</span> <span class="eden-path">'+lmn+'</span></div>');
		}
	} else if (lmn.charAt(0) != "*") {
		return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf15c;</span><span class="eden-path">'+lmn+'</span></div>');
	}
}

EdenUI.ExplorerState.prototype.removeEntry = function(name, valelement) {
	valelement.innerHTML = '<span style="font-weight: bold; color: red">DELETED</span>';
	delete this.watchobs[name];
	this.triggerUpdate();
}

EdenUI.ExplorerState.prototype.updateEntry = function(sym, valelement, full) {
	if (!sym) return;
	var svalue = sym.value();
	var value;
	var html;

	if (sym.eden_definition && sym.eden_definition.startsWith("func")) {
		html = '<span class="eden-keyword">func</span>';
	} else {
		if (full) {
			var ecode = Eden.edenCodeForValue(svalue, undefined, 2);
			value = (ecode.length < EdenUI.Explorer.MAXHIGHLIGHTLENGTH) ? EdenUI.Highlight.html(ecode,true) : ecode;
		} else {
			if (Array.isArray(svalue)) {
				value = '[.. <span class="explore-expand-value">&#xf0fe;</span> ..]';
			} else {
				var ecode = Eden.edenCodeForValue(svalue, undefined, 2);
				value = (ecode.length < EdenUI.Explorer.MAXHIGHLIGHTLENGTH) ? EdenUI.Highlight.html(ecode,true) : ecode;
			}		
		}
		var type = (sym.eden_definition) ? '<span class="eden-keyword">is</span>' : '<b>=</b>';
		html = type+' '+value;
	}
	valelement.innerHTML = html;
}

EdenUI.ExplorerState.prototype.makeEntry = function(name, children, active) {
	var sym = eden.root.symbols[name];
	//var svalue = sym.value();
	//var value = (Array.isArray(svalue)) ? "[...]" : EdenUI.Highlight.html(Eden.edenCodeForValue(svalue, undefined, 2));
	//var type = (sym.eden_definition) ? '<span class="eden-keyword">is</span>' : '<b>=</b>';
	var ele = $('<div class="explore-entry'+((active) ? " active":"")+'" data-obs="'+name+'"><div class="explore-entry-inner"><span><span class="explore-entry-icon">&#xf067;</span><span class="explore-observable">'+name+'</span> </span><div class="symvalue"></div></div></div>');
	var valele = ele.find(".symvalue").get(0);
	this.updateEntry(sym, valele);
	if (this.index[name] === undefined) this.index[name] = [];
	this.index[name].push(valele);
	var count = 0;

	if (children) {
		for (var x in children) {
			count++;
			ele.append(this.makeEntry(x, children[x], active));
		}
		if (count == 0) {
			//ele.append(this.makeAgentEntry(sym.last_modified_by));
		}
	}
	return ele;
}

EdenUI.ExplorerState.prototype.updateTree = function() {
	var tree = (this.capture) ? Eden.Query.dependencyTree(this.watchobs) : this.watchobs;
	//console.log(tree);

	this.results.html("");

	for (var x in tree) {
		this.results.append(this.makeEntry(x, (this.capture) ? tree[x] : undefined, this.capture));
	}
}

EdenUI.ExplorerState.prototype.watch = function(observables) {
	if (this.capture) {
		//eden.root.lookup("jseden_explorer_capture").assign(false, eden.root.scope, Symbol.localJSAgent);
		//eden.root.lookup("jseden_explorer_clear").assign(true, eden.root.scope, Symbol.localJSAgent);
		//this.clear();
	}

	if (this.filter === undefined && observables.length > 0) this.filter = {}; 

	for (var i=0; i<observables.length; i++) {
		this.filter[observables[i]] = true;
		if (!this.capture) {
			this.watchobs[observables[i]] = {
				elements: [],
				lastupdate: 1
			};
		}
	}

	this.triggerUpdate();
}

EdenUI.ExplorerState.prototype.record = function() {
	//this.clear();
	this.watchobs = {};
	this.triggerUpdate();
	this.capture = true;
}

EdenUI.ExplorerState.prototype.clear = function() {
	this.watchobs = {};
	this.filter = undefined;
	this.triggerUpdate();
}

EdenUI.ExplorerState.prototype.displayAsTree = function() {

}

EdenUI.ExplorerState.prototype.displayAsList = function() {

}

EdenUI.ExplorerState.prototype.displayAsGraph = function() {

}

EdenUI.ExplorerState.prototype.search = function(q) {

}
