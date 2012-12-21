/**
 * JS-Eden Menu Bar Plugin
 * Generates a bar at the top of the screen for loading plugins and creating
 * views. It also gives access to Help and other js-eden options. This should
 * be considered a fundamental plugin that allows users to manage other
 * plugins.
 * @class MenuBar Plugin
 */
Eden.plugins.MenuBar = function(context) {
	/** @private */
	var menudiv = $("<div id=\"menubar-main\"></div>");
	menudiv.appendTo($("body"));

	var addMainItem = function(name, title) {
		var menuitem = $("<div class=\"menubar-mainitem\"></div>");
		menuitem.html(title+"<ul id=\"menubar-mainitem-"+name+"\"></ul>");
		menuitem.appendTo(menudiv);
		$("#menubar-mainitem-"+name).menu({
			blur: function(event,ui) {
				ui.hide();
			}
		}).hide();
		menuitem.click(function() {
			$("#menubar-mainitem-"+name).show();
		});
	};

	addMainItem("jseden","JS-Eden");
	addMainItem("plugins","Plugins");
	addMainItem("views","Views");
	addMainItem("help","Help");
};
