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

		var code_entry = $('<div id=\"' + name + '-content\" class=\"htmlviews-content\"></div>');

		var contentSym = root.lookup("_view_" + viewName + "_content");
		var updateView = function (sym, value) {
			if (value === undefined) {
				code_entry.html('<div class="htmlviews-undefined">Give _view_' + viewName +'_content a value to display HTML formatted text here.</div>');
			} else {
				code_entry.html(value);
			}
		};
		updateView(contentSym, contentSym.value());
		contentSym.addJSObserver("repaintView", updateView);

		$('<div id="' + name +'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230
			});
		return {confirmClose: true};
	}

	//Register the HTML view options
	edenUI.views["HTMLContent"] = {dialog: this.createDialog, title: "HTML Content", category: edenUI.viewCategories.visualization, holdsContent: true};

	//Load the Eden wrapper functions
	edenUI.eden.include("plugins/html-views/html.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.HTMLContent.title = "HTML Content";
EdenUI.plugins.HTMLContent.description = "Provides construals with the ability to create windows dedicated to displaying HTML content created using EDEN code.";
