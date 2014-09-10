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

Eden.plugins.HTMLViews = function(context) {

	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				//this.createDialog(name+"-dialog","Default HTML");
				context.createView(name,"PlainHTML");
			}
			$("#"+defaultview+"-content").html(content);
		} else {
			$("#"+name+"-dialog-content").html(content);
		}
	}

	this.createDialog = function(name,mtitle) {
	
		if (defaultview == "") {
			defaultview = name;
		}

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
	context.views["PlainHTML"] = {dialog: this.createDialog, title: "Plain HTML View"};

	//Load the Eden wrapper functions
	Eden.executeFile("plugins/html-views/html.js-e");
};

/* Plugin meta information */
Eden.plugins.HTMLViews.title = "HTML Views";
Eden.plugins.HTMLViews.description = "Allow Eden code to display HTML output in dialogs";
Eden.plugins.HTMLViews.author = "Nicolas Pope";
