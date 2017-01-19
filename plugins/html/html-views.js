/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden HTML Views Plugin.
 * A simple plugin allowing Eden code to display html within dialogs.
 * @class HTMLContent Plug-in
 */

EdenUI.plugins.HTMLContent = function(edenUI, success) {
	var me = this;

	this.createDialog = function(name, mtitle) {
		//Remove -dialog name suffix.
		var viewName = name.slice(0, -7);

		function viewobs(name) { return "view_"+viewName+"_"+name; };

		var observables = [
			viewobs("background_colour"),
			viewobs("content")
		];

		var code_entry = $('<div id=\"' + name + '-content\" class=\"htmlviews-content\" data-observables="'+observables.join(",")+'"></div>');
		code_entry.on("mousedown", "button", function(e) {
			var name = e.currentTarget.name;
			var value = e.currentTarget.getAttribute("data-value");
			if (value !== null && value.charAt(0).match(/[0-9]?/) !== null) value = parseInt(value);
			eden.root.lookup(name).assign((value === null) ? true : value, eden.root.scope, Symbol.hciAgent);
			//eden.root.lookup(name).assign(false, eden.root.scope, Symbol.hciAgent);
		});
		code_entry.on("mouseup", "button", function(e) {
			var name = e.currentTarget.name;
			var value = e.currentTarget.getAttribute("data-value");
			if (value === null) eden.root.lookup(name).assign(false, eden.root.scope, Symbol.hciAgent);
			//eden.root.lookup(name).assign(false, eden.root.scope, Symbol.hciAgent);
		});
		code_entry.on("click", function(e) {
			var script = e.srcElement.getAttribute("data-jseden");
			if (script && script != "") {
				console.log(script);
				eden.execute2(script, {name: "execute"});
			}
		});

		var contentSym = root.lookup("view_" + viewName + "_content");
		var updateView = function (sym, value) {
			if (value === undefined) {
				code_entry.html('<div class="htmlviews-undefined">Give view_' + viewName +'_content a value to display HTML formatted text here.</div>');
			} else {
				code_entry.html(value);
			}
		};
		updateView(contentSym, contentSym.value());
		contentSym.addJSObserver("repaintView", updateView);

		var bgSym = root.lookup("view_"+viewName+"_background_colour");
		function updateBG(sym, value) {
			diag.get(0).parentNode.style.background = value;
		}
		bgSym.addJSObserver("changeColour", updateBG);

		var diag = $('<div id="' + name +'"></div>')
			.html(code_entry)
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "htmlviews-dialog"
			});

		var bgcolour = bgSym.value();
		if (bgcolour) {
			updateBG(bgSym, bgcolour);
		}

		return {confirmClose: true};
	}

	//Register the HTML view options
	edenUI.views["HTMLContent"] = {dialog: this.createDialog, title: "HTML Content", category: edenUI.viewCategories.visualization, holdsContent: true};

	//Load the Eden wrapper functions
	/*Eden.Agent.importAgent("plugins/html", "default", ["enabled"], function() {
		eden.root.lookup("plugins_html_loaded").assign(true, eden.root.scope, Symbol.localJSAgent);
		if (success) success();
	});*/
	Eden.Selectors.execute("plugins > html > html", function() {
		eden.root.lookup("plugins_html_loaded").assign(true, eden.root.scope, Symbol.localJSAgent);
		if (success) success();
	});
};

/* Plugin meta information */
EdenUI.plugins.HTMLContent.title = "HTML Content";
EdenUI.plugins.HTMLContent.description = "Provides construals with the ability to create windows dedicated to displaying HTML content created using EDEN code.";
