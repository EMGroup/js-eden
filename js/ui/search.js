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
			docstr = '<div class="doxy-search-details"><p>'+stripped+'</p></div>';
		}
	}

	var ele = $('<div class="menubar-search-result" data-obs="'+name+'">'+EdenUI.Highlight.html(symstr)+ctrlstr+docstr+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.makeAgentResult = function(when) {
	var symstr;

	if (when.base) {
		symstr = when.base.getSource(when).split("{")[0];
	} else {
		return;
	}
	if (symstr.length > 55) {
		symstr = symstr.substr(0,55) + "...";
	}

	var ctrlstr = '<div class="menubar-search-rescontrols"><span>&#xf044;</span><span>&#xf06e;</span></div>';

	var docstr = "";
	if (when.doxyComment) {
		var stripped = when.doxyComment.brief();
		if (stripped && stripped.length > 0) {
			docstr = '<div class="doxy-search-details"><p>'+stripped+'</p></div>';
		}
	}

	var ele = $('<div class="menubar-search-result" data-agent="'+when.name+'">'+EdenUI.Highlight.html(symstr)+ctrlstr+docstr+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.makeStatementResult = function(stat) {
	var symstr;

	//console.log("MAKE STATEMENT",stat);

	var base = stat.base;
	if (base === undefined) {
		// Attempt to find base.
		var p = stat.parent;
		while (p.parent) p = p.parent;
		base = p.base;
	}

	if (base) {
		symstr = base.getSource(stat).split("\n")[0];
	} else {
		symstr = stat.type;
	}
	if (symstr.length > 55) {
		symstr = symstr.substr(0,55) + "...";
	}

	var ctrlstr = '<div class="menubar-search-rescontrols"><span>&#xf044;</span><span>&#xf06e;</span></div>';

	var docstr = "";
	if (stat.doxyComment) {
		var stripped = stat.doxyComment.brief();
		if (stripped && stripped.length > 0) {
			docstr = '<div class="doxy-search-details"><p>'+stripped+'</p></div>';
		}
	}

	var ele = $('<div class="menubar-search-result">'+EdenUI.Highlight.html(symstr)+ctrlstr+docstr+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.makeScriptResult = function(script) {
	var symstr;

	symstr = '<b>script</b> ' + script;
	if (symstr.length > 55) {
		symstr = symstr.substr(0,55) + "...";
	}

	var ctrlstr = '<div class="menubar-search-rescontrols"><span>&#xf044;</span><span>&#xf06e;</span></div>';

	var docstr = "";
	if (Eden.Agent.agents[script]) {
		var ag = Eden.Agent.agents[script];
		if (ag.ast && ag.ast.mainDoxyComment) {
			var brief = ag.ast.mainDoxyComment.brief();
			if (brief && brief.length > 0) {
				docstr = '<div class="doxy-search-details"><p>'+brief+'</p></div>';
			}
		}
	}

	var ele = $('<div class="menubar-search-result" data-script="'+script+'">'+symstr+ctrlstr+docstr+'</div>');
	return ele;
}

EdenUI.SearchBox.prototype.updateSearch = function(q) {
	if (!q || q == "") {
		this.element.hide();
	} else {
		this.element.show();
		var me = this;

		// Views
		// Whens by trigger
		// Observables
		// Scripts by hashtag and observable.
		// Peer users
		// Project manager
		Eden.Query.search(q, function(res) {
			me.element.html("");
			var resouter = $('<div class="menubar-search-outer"></div>');
			/*var categories = $('<div class="menubar-search-cat"><div class="menubar-search-category symbols active">&#xf06e;</div><div class="menubar-search-category agents">&#xf007;</div><div class="menubar-search-category views">&#xf2d0;</div></div>');*/
			var symresults = $('<div class="menubar-search-results"></div>');
			//resouter.append(categories);
			resouter.append(symresults);
			me.element.append(resouter);

			var i = 0;
			var MAXRES = 8;
			var count = 0;

			for (i=0; i<res.all.length; i++) {
				if (count >= MAXRES) break;
				count++;
				var ele;
				if (typeof res.all[i] == "object") {
					if (res.all[i].type == "when") {
						ele = me.makeAgentResult(res.all[i])
					} else if (res.all[i].type) {
						ele = me.makeStatementResult(res.all[i]);
					}
				} else if (res.all[i].charAt(0) == "/") {
					ele = me.makeSymbolResult(res.all[i].slice(1))
				} else {
					ele = me.makeScriptResult(res.all[i]);
				}
				symresults.append(ele);
			}

			/*for (i=0; i<res.symbols.length; i++) {
				if (count >= MAXRES) break;
				count++;
				symresults.append(me.makeSymbolResult(res.symbols[i]));
			}

			for (i=0; i<res.whens.length; i++) {
				if (count >= MAXRES) break;
				count++;
				symresults.append(me.makeAgentResult(res.whens[i]));
			}

			for (i=0; i<res.scripts.length; i++) {
				if (count >= MAXRES) break;
				count++;
				symresults.append(me.makeScriptResult(res.scripts[i]));
			}*/

			function doMore() {
				var more = $('<div class="menubar-search-more">&#xf078;</div>');
				symresults.append(more);
				more.on("click", function() {
					symresults.html("");
					var count = 0;
					for (; i<res.all.length; i++) {
						if (count > MAXRES) break;
						count++;
						var ele;
						if (typeof res.all[i] == "object") {
							if (res.all[i].type == "when") {
								ele = me.makeAgentResult(res.all[i])
							}
						} else if (res.all[i].charAt(0) == "/") {
							ele = me.makeSymbolResult(res.all[i].slice(1))
						} else {
							ele = me.makeScriptResult(res.all[i]);
						}
						symresults.append(ele);
					}
					// Do we need to show a more button
					if (i < res.all.length) {
						doMore();
					}
				});
			}

			// Do we need to show a more button
			if (i < res.all.length) {
				doMore();
			}
		});
	}
}


