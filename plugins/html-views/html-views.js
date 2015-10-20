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

	/**Don't delete this method.  It looks like obsolete code from the old way that views were
	 * implemented but it is not obsolete.  It is required for the EDEN html() procedure to work!
	 */
	this.html = function(name,content) {
		if (!(name in edenUI.viewInstances)) {
			edenUI.createView(name,"HTMLContent");
		}
		$("#"+name+"-dialog-content").html(content);
	}

	this.createDialog = function(name,mtitle) {
	
		var code_entry = $('<div id=\"'+name+'-content\" class=\"htmlviews-content\"></div>');

		$('<div id="'+name+'"></div>')
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
