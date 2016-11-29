EdenUI.SearchBox = function(element) {
	var me = this;

	this.element = element;

	element.on("click", ".menubar-search-result", function(e) {
		var obs = e.currentTarget.getAttribute("data-obs");
		me.updateSymbolDetails($(e.currentTarget), obs);
	});
};

EdenUI.SearchBox.prototype.updateSymbolDetails = function(element, name) {
	var docele = element.find(".doxy-search-details");
	if (docele && docele.length > 0 && eden.dictionary[name]) {
		var stripped = eden.dictionary[name].pretty();
		if (stripped && stripped.length > 0) {
			docele.html(stripped);
		}
	}
}

EdenUI.SearchBox.prototype.makeSymbolResult = function(name) {
	var sym = eden.root.lookup(name);
	var symstr;

	if (sym.eden_definition) {
		if (sym.eden_definition.startsWith("func")) {
			symstr = "func " + name;
		} else if (sym.eden_definition.startsWith("proc")) {
			symstr = "proc " + name;
		} else if (sym.eden_definition.length > 55) {
			symstr = sym.eden_definition.substr(0,55) + "...";
		} else {
			symstr = sym.eden_definition;
		}
	} else {
		var valstr = Eden.edenCodeForValue(sym.value());
		if (valstr.length + name.length + 3 > 55) {
			symstr = name + " = " + valstr.substr(0,55 - name.length - 3)+"...";
		} else {
			symstr = name + " = " + valstr + ";";
		}
	}

	var ctrlstr = '<div class="menubar-search-rescontrols"><span>&#xf044;</span><span>&#xf06e;</span></div>';

	var docstr = "";
	if (eden.dictionary[name]) {
		var stripped = eden.dictionary[name].brief();
		if (stripped && stripped.length > 0) {
			docstr = '<div class="doxy-search-details">'+stripped+'</div>';
		}
	}

	var ele = $('<div class="menubar-search-result" data-obs="'+name+'">'+EdenUI.Highlight.html(symstr)+ctrlstr+docstr+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.updateSearch = function(q) {
	if (!q || q == "") {
		this.element.hide();
	} else {
		this.element.show();

		this.element.html("");
		var resouter = $('<div class="menubar-search-outer"></div>');
		/*var categories = $('<div class="menubar-search-cat"><div class="menubar-search-category symbols active">&#xf06e;</div><div class="menubar-search-category agents">&#xf007;</div><div class="menubar-search-category views">&#xf2d0;</div></div>');*/
		var symresults = $('<div class="menubar-search-results"></div>');
		//resouter.append(categories);
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


