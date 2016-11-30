EdenUI.Explorer = function() {
	var me = this;

	this.element = $('<div class="explore-main"><div class="explore-symbols"></div></div>');
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

EdenUI.Explorer.prototype.updateTree = function() {
	var tree = Eden.Query.dependencyTree(this.watchobs);
	//console.log(tree);

	function makeEntry(name, children) {
		var ele = $('<div class="explore-entry"><span>'+name+'</span></div>');
		var count = 0;
		for (var x in children) {
			count++;
			ele.append(makeEntry(x, children[x]));
		}
		if (count == 0) {
			var sym = eden.root.symbols[name];
			if (sym.last_modified_by.name != "*Input Device") {
				ele.append($('<div class="explore-entry">'+sym.last_modified_by.name+'</div>'));
			}
		}
		return ele;
	}

	this.results.html("");

	for (var x in tree) {
		this.results.append(makeEntry(x, tree[x]));
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
