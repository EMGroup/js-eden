EdenUI.Explorer = function() {
	var me = this;

	this.element = $('<div class="explore-main"><div class="explore-controls"><button class="explorer-control capture"><span class="explorer-control-icon">&#xf111;</span>Capture</button><button class="explorer-control clear"><span class="explorer-control-icon">&#xf05e;</span>Clear</button><span class="explorerfilter"><input type="text" class="explorerfilter" placeholder="Filter..."></input></span></div><div class="explore-symbols"></div><div class="explore-console"><div class="explore-console-code"></div></div></div>');
	$(document.body).append(this.element);
	this.results = this.element.find(".explore-symbols");
	this.consoleele = this.element.find(".explore-console-code");

	this.element.resizable({handles: "w"});

	this.watchobs = {};
	this.capture = false;
	this.delay = 100;
	this.delay2 = 20;
	this.timeout = undefined;
	this.timeout2 = undefined;
	this.mode = "tree";
	this.index = {};
	this.todo = {};

	// Make the console...
	this.console = new EdenUI.ScriptBox(this.consoleele.get(0), {nobuttons: true});

	eden.root.addGlobal(function(sym, kind) {
		//if (!me.capture) return;
		//if (Object.keys(sym.dependencies).length > 0) return;
		var name = sym.name.slice(1);

		if (me.capture && (kind != Symbol.EXPIRED || me.watchobs[name] === undefined)) {
			if (me.watchobs[name] === undefined) {
				me.watchobs[sym.name.slice(1)] = 1;
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

	this.element.on("click", ".clear", function(e) {
		var clrsym = eden.root.lookup("jseden_explorer_clear");
		if (!clrsym.eden_definition) clrsym.assign(true, eden.root.scope, Symbol.localJSAgent);
	});

	this.element.on("click", ".capture", function(e) {
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
			}
		}
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
				if (!existing[x.slice(1)]) {
					//node.append(me.makeEntry(x.slice(1), {}, false));
					var sym2 = sym.dependencies[x];
					var name = x.slice(1);
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

	var expSym = eden.root.lookup("jseden_explorer_enabled");
	var expVal = expSym.value();
	if (!expVal) {
		this.enabled = false;
		this.element.hide();
	}
	expSym.addJSObserver("explorer", function(sym, val) {
		me.enabled = val;
		if (!val) {
			me.element.hide();
		} else if (eden.root.lookup("jseden_explorer_visible").value()) {
			me.element.show();
		}
	});

	var visSym = eden.root.lookup("jseden_explorer_visible");
	var visVal = expSym.value();
	if (!visVal) {
		this.element.hide();
	}
	visSym.addJSObserver("explorer", function(sym, val) {
		if (val && me.enabled) me.element.show();
		else me.element.hide();
	});

	var capSym = eden.root.lookup("jseden_explorer_capture");
	capSym.addJSObserver("explorer", function(sym, val) {
		if (val) {
			me.record();
			me.element.find(".capture").addClass("active");
		} else {
			me.capture = false;
			me.element.find(".capture").removeClass("active");
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

EdenUI.Explorer.prototype.triggerUpdate = function() {
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

EdenUI.Explorer.prototype.updateList = function() {
	
}

EdenUI.Explorer.prototype.makeAgentEntry = function(agent) {
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
			return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">proc</span> <span class="eden-path">'+lmn.slice(1)+'</span></div>');
		}
	} else if (lmn.charAt(0) != "*") {
		return $('<div class="explore-entry"><span class="explore-entry-icon">&#xf15c;</span><span class="eden-path">'+lmn+'</span></div>');
	}
}

EdenUI.Explorer.prototype.removeEntry = function(name, valelement) {
	valelement.innerHTML = '<span style="font-weight: bold; color: red">DELETED</span>';
	delete this.watchobs[name];
	this.triggerUpdate();
}

EdenUI.Explorer.prototype.updateEntry = function(sym, valelement) {
	if (!sym) return;
	var svalue = sym.value();
	var value = (Array.isArray(svalue)) ? '[.. <span class="explore-expand-value">&#xf0fe;</span> ..]' : EdenUI.Highlight.html(Eden.edenCodeForValue(svalue, undefined, 2));
	var type = (sym.eden_definition) ? '<span class="eden-keyword">is</span>' : '<b>=</b>';
	var html = type+' '+value;
	valelement.innerHTML = html;
}

EdenUI.Explorer.prototype.makeEntry = function(name, children, active) {
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

EdenUI.Explorer.prototype.updateTree = function() {
	var tree = (this.capture) ? Eden.Query.dependencyTree(this.watchobs) : this.watchobs;
	//console.log(tree);

	this.results.html("");

	for (var x in tree) {
		this.results.append(this.makeEntry(x, (this.capture) ? tree[x] : undefined, this.capture));
	}
}

EdenUI.Explorer.prototype.watch = function(observables) {
	if (this.capture) {
		eden.root.lookup("jseden_explorer_capture").assign(false, eden.root.scope, Symbol.localJSAgent);
		//eden.root.lookup("jseden_explorer_clear").assign(true, eden.root.scope, Symbol.localJSAgent);
		this.clear();
	}

	for (var i=0; i<observables.length; i++) {
		this.watchobs[observables[i]] = {
			elements: [],
			lastupdate: 1
		};
	}

	this.triggerUpdate();
}

EdenUI.Explorer.prototype.record = function() {
	this.clear();
	this.capture = true;
}

EdenUI.Explorer.prototype.clear = function() {
	this.watchobs = {};
	this.triggerUpdate();
}

EdenUI.Explorer.prototype.displayAsTree = function() {

}

EdenUI.Explorer.prototype.displayAsList = function() {

}

EdenUI.Explorer.prototype.displayAsGraph = function() {

}

EdenUI.Explorer.prototype.search = function(q) {

}

EdenUI.Explorer.prototype.showConsole = function() {

}

EdenUI.Explorer.prototype.hideConsole = function() {

}
