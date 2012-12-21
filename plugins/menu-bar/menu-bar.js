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

	/** @private */
	var addMainItem = function(name, title) {
		var menuitem = $("<div class=\"menubar-mainitem\"></div>");
		menuitem.html(title+"<div id=\"menubar-mainitem-"+name+"\" class=\"menubar-menu\"></div>");
		menuitem.appendTo(menudiv);
		$("#menubar-mainitem-"+name).hide();
		menuitem.click(function() {
			$(".menubar-menu").hide();
			$("#menubar-mainitem-"+name).show();
		});
	};

	/** @public */
	this.updatePluginsMenu = function() {
		var plugins = $("#menubar-mainitem-plugins");
		plugins.html("");
		for (x in Eden.plugins) {
			pluginentry = $("<div class=\"menubar-item\"></div>");
			if (context.plugins[x] === undefined) {
				pluginentry.html(Eden.plugins[x].title);
			} else {
				pluginentry.html("<b>"+Eden.plugins[x].title+"</b>");
			}
			pluginentry.click(function() {
				console.log("Load Plugin: "+x);
				context.loadPlugin(x);
			});
			pluginentry.appendTo(plugins);
		}
		//plugins.menu();
	};

	//Add main menu items.
	addMainItem("jseden","JS-Eden");
	addMainItem("plugins","Plugins");
	addMainItem("views","Views");
	addMainItem("help","Help");

	//Hide all menus on click.
	//$(document).mouseup(function() {
	//	$(".menubar-menu").hide();
	//});

	this.updatePluginsMenu();
};

Eden.plugins.MenuBar.title = "Menu Bar";
Eden.plugins.MenuBar.description = "Provides main menu for plugin and view management";
Eden.plugins.MenuBar.author = "Nicolas Pope";
