/**
 * JS-Eden Menu Bar Plugin
 * Generates a bar at the top of the screen for loading plugins and creating
 * views. It also gives access to Help and other js-eden options. This should
 * be considered a fundamental plugin that allows users to manage other
 * plugins.
 * @class MenuBar Plugin
 */
Eden.plugins.MenuBar = function(context) {
	var me = this;
	var index = 0;

	/** @private */
	var menudiv = $("<div id=\"menubar-main\"></div>");
	var menustatus = $("<div id=\"menubar-status\"></div>");
	menustatus.appendTo(menudiv);
	menudiv.appendTo($("body"));
	$("<div id=\"menubar-bottom\"></div>").appendTo($("body"));

	this.updateStatus = function(text) {
		menustatus.html(text);
	}

	/** @private */
	var addMainItem = function(name, title) {
		var menuitem = $("<div class=\"menubar-mainitem\"></div>");
		menuitem.html(title+"<div id=\"menubar-mainitem-"+name+"\" class=\"menubar-menu\"></div>");
		menuitem.appendTo(menudiv);
		$("#menubar-mainitem-"+name).hide();
		menuitem.click(function() {
			if ($("#menubar-mainitem-"+name).css("display") != "block") {
				$(".menubar-menu").hide();
				$("#menubar-mainitem-"+name).show(200);
			} else {
				$(".menubar-menu").hide();
			}
		}).hover(function() {
			$(this).css("font-weight","bold");
		},function() {
			$(this).css("font-weight","normal");
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
			pluginentry.appendTo(plugins);
			pluginentry.bind("click",function() {
				//console.log("Load Plugin: "+ this.plugin);
				context.loadPlugin(this.plugin);
				me.updatePluginsMenu();
				me.updateViewsMenu();
			});
			pluginentry[0].plugin = x;
		}
		//plugins.menu();
	};

	/** @public */
	this.updateViewsMenu = function() {
		var views = $("#menubar-mainitem-views");
		views.html("");

		//First add supported view types
		for (x in context.views) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			viewentry.html(context.views[x].title);

			viewentry.appendTo(views);
			viewentry.bind("click",function() {
				//console.log("Create and Show View: "+ this.view);
				context.createView("view-"+index, this.view);
				context.showView("view"+index);
				index = index + 1;
				me.updateViewsMenu();
			});
			viewentry[0].view = x;
		}

		//Now add actually active view.
		$("<hr></hr>").appendTo(views);
		for (x in context.active_dialogs) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			viewentry.html(x + " ["+context.active_dialogs[x]+"]");

			viewentry.appendTo(views);
			viewentry.bind("click",function() {
				//console.log("Show View: "+ this.viewname);
				context.showView(this.viewname);
			});
			viewentry[0].viewname = x;
		}
	};

	/** @private */
	var addMenuItem = function(menu,text,click) {
		var menu = $("#menubar-mainitem-"+menu);
		var entry = $("<div class=\"menubar-item\"></div>");
		entry.html(text);
		entry.click(click);
		entry.appendTo(menu);
	}

	//Add main menu items.
	addMainItem("jseden","JS-Eden");
	addMainItem("plugins","Plugins");
	addMainItem("views","Views");
	addMainItem("help","Help");

	addMenuItem("jseden","Error Log", function() {
		$('#error-window').dialog("open");
	});

	//Put js-eden version in right corner
	$.ajax({
		url: "version.rhtml",
		success: function(data) {
			$('<div id="menubar-version-number"></div>').html("js-eden "+data).appendTo($("#menubar-main"));
		},
		cache: false,
		async: true
	});

	//Hide all menus on click.
	//$(document).mouseup(function() {
	//	$(".menubar-menu").hide();
	//});

	this.updatePluginsMenu();
	this.updateViewsMenu();
};

Eden.plugins.MenuBar.title = "Menu Bar";
Eden.plugins.MenuBar.description = "Provides main menu for plugin and view management";
Eden.plugins.MenuBar.author = "Nicolas Pope";
