EdenUI.SearchBox = function(element) {
	var me = this;

	this.element = element;

	element.on("click", ".menubar-search-result", function(e) {
		var obs = e.currentTarget.getAttribute("data-id");

		if (obs && obs != "") {
			me.updateSymbolDetails(e.currentTarget, obs);
		} else if (script && script != "") {
			
		}
	});

	element.on('click', '.edit-result', function(e) {
		//console.log(e);
		//edenUI.gotoCode("/"+e.target.parentNode.parentNode.getAttribute("data-obs"),-1);
	});

	element.on('click', '.script-goto', function(e) {
		var id = e.currentTarget.parentNode.parentNode.parentNode.getAttribute("data-id");
		me.element.hide();
		Eden.Selectors.goto(id);
	});
};

EdenUI.SearchBox.prototype.updateSymbolDetails = function(element, name) {
	console.log("Update details", name);
	var ast = Eden.Selectors.query("@history " + name, undefined, undefined, 1);
	if (ast.length == 0) {
		console.log("No result");
		return;
	}
	ast = ast[0];

	var docele = $(element).find(".doxy-search-details");
	if (docele === null || docele.length == 0) {
		docele = $('<div class="doxy-search-details"></div>');
		element.appendChild(docele.get(0));
	}
	docele = docele.get(0);

	var html = (ast.executed != -1) ? '<p><button class="script-button script-goto">Goto</button><button class="script-button">Watch</button><button class="script-button">More</button></p>' : '';

	if (ast instanceof Symbol && ast.type != "function") {
		html += "<p>";
		html += "<b>Path:</b> " + name + "<br>";
		html += "<b>Current Value:</b> " + Eden.edenCodeForValue(ast.value());
		html += "</p>";
	} else if (ast.lvalue && eden.root.symbols[ast.lvalue.name] && eden.root.symbols[ast.lvalue.name].origin === ast) {
		html += "<p>";
		html += "<b>Path:</b> " + name + "<br>";
		html += "<b>Current Value:</b> " + Eden.edenCodeForValue(eden.root.symbols[ast.lvalue.name].value());
		html += "</p>";
	} else {
		html += "<p>";
		html += "<b>Path:</b> " + name;
		html += "</p>";
	}

	if (ast.doxyComment) {
		var tags = ast.doxyComment.getHashTags();
		if (tags && tags.length > 0) {
			html += "<p><b>Tags:</b> " + tags.join(" ") + "</p>";
		}
		var stripped = ast.doxyComment.pretty();
		if (stripped && stripped.length > 0) {
			html += stripped;
		}
	}

	docele.innerHTML = html;
}

EdenUI.SearchBox.prototype.makeStatementResult = function(stat) {
	var symstr;
	var iconstr = "";
	var extraclass = "";

	if (stat.executed == -1) extraclass = " historic";

	if (stat.type == "script") {
		iconstr = '<span class="search-scriptres">&#xf15c;</span>';
		if (stat.name) {
			symstr = "action " + stat.name;
		} else {
			symstr = stat.getInnerSource();
		}
	} else if (stat.type == "when") {
		symstr = stat.prefix.trim();
	} else {
		if (!stat.getSource()) console.error("NO SOURCE",stat);
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

	var ele = $('<div class="menubar-search-result'+extraclass+'" data-id="'+Eden.Selectors.getID(stat)+'">'+iconstr+EdenUI.Highlight.html(symstr)+docstr+'</div>');
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


