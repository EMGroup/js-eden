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

EdenUI.ExplorerScripts.prototype.start = function() {
	if (this.interval) return;
	this.interval = setInterval(() => {
		this.update();
	}, 200);
}

EdenUI.ExplorerScripts.prototype.stop = function() {
	clearInterval(this.interval);
	this.interval = null;
}

EdenUI.ExplorerScripts.prototype.update = function() {
	this.scripts.html("");

	/*var scripts = Eden.Selectors.queryWithinSync(null, ">> .type(when).enabled","id");
	var project = this.buildScriptTree(scripts);
	var cached = [];
	var snames = [];
	for (var x in Eden.Selectors.cache) {
		snames.push(x);
		cached.push(Eden.Selectors.cache[x]);
	}
	scripts = Eden.Selectors.queryWithinSync(cached, ">> .type(when).enabled","id");
	scripts.push.apply(scripts, snames);
	var externals = {"External": this.buildScriptTree(scripts)};
	//var project = this.buildScriptTree(scripts);

	this.makeEntry(this.scripts, project);
	this.makeEntry(this.scripts, externals);*/

	let groups = {};

	for (let x in eden.project.ast.whens) {
		let when = eden.project.ast.whens[x];
		if (!when.enabled) continue;

		let s = when.parent;
		while (s && !s.name) s = s.parent;

		let name = (s && s.name) ? s.name : "Unknown";
		if (!groups.hasOwnProperty(name)) groups[name] = [];
		groups[name].push(when);
	}

	let ts = Date.now();

	for (let x in groups) {
		let ele = document.createElement("DIV");
		ele.className = "explore-sentry";
		let inner = document.createElement("DIV");
		inner.className = "explore-script-inner";
		inner.textContent = x;
		ele.appendChild(inner);

		let g = groups[x];
		for (let i=0; i<g.length; ++i) {
			let when = g[i];
			let ele2 = document.createElement("DIV");
			ele2.className = "explore-sentry";

			let age = (ts - when.triggertimestamp) / 1000.0;
			const DELAY = 2.0;

			let sage = 1.0 - (Math.max(0, Math.min(DELAY, age)) / DELAY);
			sage = sage*sage;
			sage = 1.0 - sage;
			ele2.style.background = "rgb("+(sage*255.0)+",255,"+(sage*255.0)+")";

			let src = when.getSource();
			let lineix = src.indexOf("\n");
			if (lineix > 0) src = src.substring(0,lineix);
			EdenUI.Highlight.htmlElement(src, ele2);
			ele.appendChild(ele2);
		}
		this.scripts[0].appendChild(ele);
	}

	//console.log(base);
}
