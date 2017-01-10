EdenUI.SearchBox = function(element) {
	var me = this;

	this.element = element;

	element.on("click", ".menubar-search-result", function(e) {
		var obs = e.currentTarget.getAttribute("data-obs");
		var script = e.currentTarget.getAttribute("data-script");
		if (obs && obs != "") {
			me.updateSymbolDetails($(e.currentTarget), obs);
		} else if (script && script != "") {
			
		}
	});

	element.on('click', '.edit-result', function(e) {
		//console.log(e);
		//edenUI.gotoCode("/"+e.target.parentNode.parentNode.getAttribute("data-obs"),-1);
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

EdenUI.SearchBox.prototype.makeStatementResult = function(stat) {
	var symstr;
	var iconstr;

	if (stat.type == "script") {
		if (stat.name) {
			symstr = "action " + stat.name;
		} else {
			symstr = stat.getInnerSource();
		}
	} else if (stat.type == "when") {

	} else {
		symstr = stat.getSource().split("\n")[0];
	}

	if (symstr.length > 55) {
		symstr = symstr.substr(0,55) + "...";
	}

	//var ctrlstr = '<div class="menubar-search-rescontrols"><span>&#xf044;</span><span>&#xf06e;</span></div>';

	var docstr = "";
	if (stat.doxyComment) {
		var stripped = stat.doxyComment.brief();
		if (stripped && stripped.length > 0) {
			docstr = '<div class="doxy-search-details"><p>'+stripped+'</p></div>';
		}
	}

	var ele = $('<div class="menubar-search-result">'+EdenUI.Highlight.html(symstr)+docstr+'</div>');
	return ele;
}



EdenUI.SearchBox.prototype.makeScriptResult = function(script) {
	/*var symstr;

	var meta = Eden.DB.meta[script];

	if (meta && meta.title && meta.title != "Script View" && meta.title != "Agent") {
		symstr = meta.title;
	} else {
		symstr = script;
	}
	if (symstr.length > 55) {
		symstr = symstr.substr(0,55) + "...";
	}

	symstr = '<span class="search-scriptres">&#xf15c;</span> ' + symstr;

	var ctrlstr = '<div class="menubar-search-rescontrols"><span class="edit-result">&#xf044;</span><span>&#xf06e;</span></div>';

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
	return ele;*/
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
		Eden.Selectors.query(q, undefined, undefined, 100, function(res) {
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

			console.log(res);

			for (i=0; i<res.length; i++) {
				if (count >= MAXRES) break;
				count++;
				var ele;

				//if (res[i] instanceof Symbol) {
				//	ele = me.makeSymbolResult(res[i]);
				//} else {
					ele = me.makeStatementResult(res[i]);
				//}

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
					for (; i<res.length; i++) {
						if (count > MAXRES) break;
						count++;
						var ele;
						if (res[i] instanceof Symbol) {
							ele = me.makeSymbolResult(res[i]);
						} else {
							ele = me.makeStatementResult(res[i]);
						}

						symresults.append(ele);
					}
					// Do we need to show a more button
					if (i < res.length) {
						doMore();
					}
				});
			}

			// Do we need to show a more button
			if (i < res.length) {
				doMore();
			}
		});
	}
}


