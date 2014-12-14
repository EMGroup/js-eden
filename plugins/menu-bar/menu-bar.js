/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Menu Bar Plugin
 * Generates a bar at the top of the screen for loading plugins and creating
 * views. It also gives access to Help and other js-eden options. This should
 * be considered a fundamental plugin that allows users to manage other
 * plugins.
 * @class MenuBar Plugin
 */
 

EdenUI.plugins.MenuBar = function(edenUI, success) {
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

	this.appendStatus = function(text) {
		
		menustatus.html(menustatus.html()+text);
	}

	var menuShowing = false;

	var hideMenu = function () {
		$(".menubar-menu").hide();
		menuShowing = false;
	};

	var showMenu = function (name) {
		$("#menubar-mainitem-"+name).show();
		menuShowing = true;
	};

	$(document.body).on('mousedown', function () {
		hideMenu();
	});

	/** @private */
	var addMainItem = function(name, title) {
	
		var menuitem = $("<div class=\"menubar-mainitem\"></div>");
		menuitem.html(title+"<div id=\"menubar-mainitem-"+name+"\" class=\"menubar-menu\"></div>");
		menuitem.appendTo(menudiv);

		$("#menubar-mainitem-"+name).hide();

		var toggleMenu = function (e) {
			if (menuShowing) {
				if (e.target === this) {
					hideMenu();
				}
			} else {
				hideMenu();
				showMenu(name);
			}
			e.stopPropagation();
			e.preventDefault();
		};

		menuitem.on('mousedown', toggleMenu);
		menuitem.on('mouseover', function () {
			if (menuShowing) {
				hideMenu();
				showMenu(name);
			}
		});
	};

	/** @public */
	this.updateViewsMenu = function() {
	
		var views = $("#menubar-mainitem-views");
		var existingViews = $("#menubar-mainitem-existing-views");
		views.html("");

		//First add supported view types
		for (x in edenUI.views) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			var label = $('<div class="menubar-item-fullwidth menubar-item-clickable">'+edenUI.views[x].title+'</div>');
			viewentry.html(label);

			viewentry.appendTo(views);
			viewentry.bind("click",function(e) {
				edenUI.createView("view_"+index, this.view);
				edenUI.showView("view"+index);
				hideMenu();
				index = index + 1;
				me.updateViewsMenu();
				e.stopPropagation();
				e.preventDefault();
			});
			viewentry[0].view = x;
		}

		existingViews.html("");
		//Now add actually active view.
		for (x in edenUI.activeDialogs) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			var label = $('<div class="menubar-item-label menubar-item-clickable">'+x+' ['+edenUI.activeDialogs[x]+']</div>');
			label.bind("click", function (e) {
				edenUI.showView(this.parentNode.viewname);
				hideMenu();
				e.preventDefault();
			});

			var close = $('<div class="menubar-item-close menubar-item-clickable"><div class="menubar-item-close-icon">X</div></div>');
			close.bind("click", function (e) {
				e.preventDefault();
				edenUI.destroyView(this.parentNode.viewname);
				$(this.parentNode).remove();

				if (Object.keys && Object.keys(edenUI.activeDialogs).length === 0) {
					hideMenu();
				}
			});

			viewentry.append(label);
			viewentry.append(close);
			viewentry.appendTo(existingViews);
			viewentry[0].viewname = x;
		}
	};

	/** @private */
	var addMenuItem = function(menu,text,click) {
	
		var menu = $("#menubar-mainitem-"+menu);
		var entry = $("<div class=\"menubar-item\"></div>");
		var label = $('<div class="menubar-item-label menubar-item-clickable">'+text+'</div>');
		entry.html(label);
		entry.click(click);
		entry.appendTo(menu);
	}

	//Add main menu items.
	addMainItem("views", "New");
	addMainItem("existing-views", "Windows");

	//Put js-eden version in right corner
	$.ajax({
		url: "version.json",
		dataType: "json",
		success: function(data) {
			var versionHtml = '';
			if (data.tag) {
				versionHtml += 'Version ' + data.tag;
			}
			if (data.sha) {
				versionHtml += ' Commit <a href="https://github.com/EMgroup/js-eden/commit/' + data.sha +'">' + data.sha + '</a>';
			}
			$('<div id="menubar-version-number"></div>').html(versionHtml).appendTo($("#menubar-main"));
		},
		cache: false,
		async: true
	});

	this.updateViewsMenu();

	edenUI.eden.include("plugins/menu-bar/menu-bar.js-e", success);
};

EdenUI.plugins.MenuBar.title = "Menu Bar";
EdenUI.plugins.MenuBar.description = "Provides main menu for plugin and view management";
EdenUI.plugins.MenuBar.author = "Nicolas Pope";
