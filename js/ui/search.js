EdenUI.SearchBox = function(element) {
	this.element = element;
};

EdenUI.SearchBox.prototype.makeSymbolResult = function(name) {
	var sym = eden.root.lookup(name);
	var symstr;

	if (sym.eden_definition) {
		symstr = sym.eden_definition;
	} else {
		symstr = name + " = " + Eden.edenCodeForValue(sym.value());
	}

	var ele = $('<div class="menubar-search-result">'+EdenUI.Highlight.html(symstr)+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.updateSearch = function(q) {
	if (!q || q == "") {
		this.element.hide();
	} else {
		this.element.show();

		this.element.html("");
		var resouter = $('<div class="menubar-search-outer"></div>');
		var categories = $('<div class="menubar-search-cat"><div class="menubar-search-category symbols active">&#xf06e;</div><div class="menubar-search-category agents">&#xf007;</div><div class="menubar-search-category views">&#xf2d0;</div></div>');
		var symresults = $('<div class="menubar-search-results"></div>');
		resouter.append(categories);
		resouter.append(symresults);
		this.element.append(resouter);

		// Views
		// Whens by trigger
		// Observables
		// Scripts by hashtag and observable.
		// Peer users
		// Project manager
		var res = Eden.Query.search(q);
		console.log(res);

		for (var i=0; i<res.symbols.length; i++) {
			if (i > 6) break;
			this.makeSymbolResult(res.symbols[i]).appendTo(symresults);
		}
	}
}


