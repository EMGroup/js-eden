EdenUI.Explorer = function() {
	var me = this;

	this.element = $('<div class="explore-main"><div class="explore-controls"></div><div class="explore-symbols"></div><div class="explore-console"></div></div>');
	$(document.body).append(this.element);
	//this.element.hide();
	this.results = this.element.find(".explore-symbols");

	this.element.resizable({handles: "w"});

	this.watchobs = {};
	this.capture = false;
	this.delay = 100;
	this.timeout = undefined;
	this.mode = "tree";

	eden.root.addGlobal(function(sym, create) {
		if (!me.capture) return;
		if (Object.keys(sym.dependencies).length > 0) return;
		me.watchobs[sym.name.slice(1)] = {
			element: undefined,
			lastupdate: 1
		};
		me.triggerUpdate();
	});

	this.results.on("click", ".explore-observable", function(e) {
		var obs = e.currentTarget.parentNode.getAttribute("data-obs");
		if (e.ctrlKey) {
			console.log("GOTO",obs);
			edenUI.gotoCode("/"+obs);
			e.stopPropagation();
		}
	});

	this.results.on("click", ".explore-entry-icon", function(e) {
		//console.log(e);
		var node = e.currentTarget.parentNode;
		var name = node.getAttribute("data-obs");
		var expanded = node.getAttribute("data-expanded") == "true";

		if (expanded) {
			e.currentTarget.innerHTML = "&#xf067;";
			node.setAttribute("data-expanded","false");

			var cur = node.firstChild;
			while (cur) {
				var next = cur.nextSibling;
				if (cur.nodeName == "DIV" && cur.className.includes("active") == false) node.removeChild(cur);
				cur = next;
			}
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
					var svalue = sym2.value();
					var value = (Array.isArray(svalue)) ? "[...]" : EdenUI.Highlight.html(Eden.edenCodeForValue(svalue, undefined, 2));
					var type = (sym2.eden_definition) ? '<span class="eden-keyword">is</span>' : '<b>=</b>';
					var name = x.slice(1);
					var ele = $('<div class="explore-entry'+((false) ? " active":"")+'" data-obs="'+name+'"><span class="explore-entry-icon">&#xf067;</span><span class="explore-observable">'+name+'</span> '+type+' '+value+'</div>');
					node.appendChild(ele.get(0));
				}
			}

			var lmn = sym.last_modified_by.name;

			if (lmn.startsWith("*When")) {
				var aname = lmn.split(":");
				var short = aname[1].split("/");
				short = short[short.length-1];
				aname = short + ":" + aname[2];

				$(node).append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">when</span> <b>@</b> <span class="eden-path">'+aname+'</span></div>'));
			} else if (lmn.startsWith("*Action")) {
				var aname = lmn.split(":");
				var short = aname[1].split("/");
				short = short[short.length-1];
				aname = short + ":" + aname[2];

				$(node).append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">action</span> <b>@</b> <span class="eden-path">'+aname+'</span></div>'));
			} else if (lmn.charAt(0) != "*") {
				$(node).append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span>'+sym.last_modified_by.name+'</span></div>'));
			}
		}
	});
}

EdenUI.Explorer.prototype.triggerUpdate = function() {
	if (this.timeout === undefined) {
		var me = this;
		this.timeout = setTimeout(function() {
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

EdenUI.Explorer.prototype.makeEntry = function(name, children, active) {
	var sym = eden.root.symbols[name];
	var svalue = sym.value();
	var value = (Array.isArray(svalue)) ? "[...]" : EdenUI.Highlight.html(Eden.edenCodeForValue(svalue, undefined, 2));
	var type = (sym.eden_definition) ? '<span class="eden-keyword">is</span>' : '<b>=</b>';
	var ele = $('<div class="explore-entry'+((active) ? " active":"")+'" data-obs="'+name+'"><span class="explore-entry-icon">&#xf067;</span><span class="explore-observable">'+name+'</span> '+type+' '+value+'</div>');
	var count = 0;
	for (var x in children) {
		count++;
		ele.append(this.makeEntry(x, children[x], active));
	}
	if (count == 0) {
		var lmn = sym.last_modified_by.name;

		if (lmn.startsWith("*When")) {
			var aname = lmn.split(":");
			var short = aname[1].split("/");
			short = short[short.length-1];
			aname = short + ":" + aname[2];

			ele.append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">when</span> <b>@</b> <span class="eden-path">'+aname+'</span></div>'));
		} else if (lmn.startsWith("*Action")) {
			var aname = lmn.split(":");
			var short = aname[1].split("/");
			short = short[short.length-1];
			aname = short + ":" + aname[2];

			ele.append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span class="eden-keyword">action</span> <b>@</b> <span class="eden-path">'+aname+'</span></div>'));
		} else if (lmn.charAt(0) != "*") {
			ele.append($('<div class="explore-entry"><span class="explore-entry-icon">&#xf183;</span><span>'+sym.last_modified_by.name+'</span></div>'));
		}
	}
	return ele;
}

EdenUI.Explorer.prototype.updateTree = function() {
	var tree = Eden.Query.dependencyTree(this.watchobs);
	//console.log(tree);

	this.results.html("");

	for (var x in tree) {
		this.results.append(this.makeEntry(x, tree[x], true));
	}
}

EdenUI.Explorer.prototype.watch = function(observables) {
	if (this.capture) {
		this.capture = false;
		this.clear();
	}

	for (var i=0; i<observables.length; i++) {
		this.watchobs[observables[i]] = {
			element: undefined,
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
