EdenUI.ExplorerScripts = function(element) {
	this.outer = element;
	this.controls = $('<div class="explore-controls">\
		<span class="explorerfilter"><input type="text" class="explorerfilter" placeholder="Filter..."></input></span>\
	</div>');
	this.scripts = $('<div class="explore-scripts"></div>');
	this.outer.append(this.controls);
	this.outer.append(this.scripts);
}

EdenUI.ExplorerScripts.prototype.buildScriptTree = function(scripts) {
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

EdenUI.ExplorerScripts.prototype.makeEntry = function(element, entry) {
	for (var x in entry) {
		var ele = $('<div class="explore-sentry"><div class="explore-script-inner"><span class="explore-entry-icon">&#xf067;</span>'+x+'</div></div>');
		this.makeEntry(ele, entry[x]);
		element.append(ele);
	}
}

EdenUI.ExplorerScripts.prototype.update = function() {
	this.scripts.html("");

	var scripts = Eden.Selectors.query(">> script:has-name","id");
	var project = this.buildScriptTree(scripts);
	var cached = [];
	var snames = [];
	for (var x in Eden.Selectors.cache) {
		snames.push(x);
		cached.push(Eden.Selectors.cache[x]);
	}
	scripts = Eden.Selectors.queryWithin(cached, ">> script:has-name","id");
	scripts.push.apply(scripts, snames);
	var externals = {"External": this.buildScriptTree(scripts)};
	//var project = this.buildScriptTree(scripts);

	this.makeEntry(this.scripts, project);
	this.makeEntry(this.scripts, externals);

	//console.log(base);
}
