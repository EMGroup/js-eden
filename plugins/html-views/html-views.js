/**
 * JS-Eden HTML Views Plugin.
 * A simple plugin allowing Eden code to display html within dialogs.
 * @class HTMLViews Plugin
 */
Eden.plugins.HTMLViews = function(context) {

	//Register the HTML view options
	context.views["PlainHTML"] = {dialog: this.createDialog, title: "Plain HTML View"};

	//Load the Eden wrapper functions
	Eden.executeFile("plugins/html-views/html.js-e");
};

/* Plugin meta information */
Eden.plugins.HTMLViews.title = "HTML Views";
Eden.plugins.HTMLViews.description = "Allow Eden code to display HTML output in dialogs";
Eden.plugins.HTMLViews.author = "Nicolas Pope";
