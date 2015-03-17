/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden HTML Views Plugin.
 * A simple plugin allowing Eden code to display html within dialogs.
 * @class HTMLViews Plugin
 */

EdenUI.plugins.HTMLViews = function(edenUI, success) {
	var me = this;

	this.html = function(name,content) {
		if (!(name in edenUI.viewInstances)) {
			edenUI.createView(name,"PlainHTML");
		}
		$("#"+name+"-dialog-content").html(content);
	}

	this.createDialog = function(name,mtitle) {
	
		code_entry = $('<div id=\"'+name+'-content\" class=\"htmlviews-content\"></div>');

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230
			});
	}

	//Register the HTML view options
	edenUI.views["PlainHTML"] = {dialog: this.createDialog, title: "Plain HTML View", category: edenUI.viewCategories.visualization};

	//Load the Eden wrapper functions
	edenUI.eden.include("plugins/html-views/html.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.HTMLViews.title = "HTML Views";
EdenUI.plugins.HTMLViews.description = "Allow Eden code to display HTML output in dialogs";
EdenUI.plugins.HTMLViews.author = "Nicolas Pope";
