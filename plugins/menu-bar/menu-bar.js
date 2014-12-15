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
		var viewArray = [];
		for (x in edenUI.views) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			var title = edenUI.views[x].title;
			var label = $('<div class="menubar-item-fullwidth menubar-item-clickable">'+title+'</div>');
			viewentry.html(label);

			viewArray.push({title: title, viewentry: viewentry});
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

		viewArray = viewArray.sort(function (a, b) {
			if (a.title > b.title) {
				return 1;
			} else if (a.title < b.title) {
				return -1;
			}
			return 0;
		});

		for (var i = 0; i < viewArray.length; ++i) {
			viewArray[i].viewentry.appendTo(views);
		}

		existingViews.html("");
		var hoverFunc = function (x) {
			var lastDialog;
			var previousZIndex;

			return {
				mouseover: function (e) {
					// temporarily highlight the view
					lastDialog = edenUI.getDialogWindow(x);
					var lastDialogMin = edenUI.getDialogContent(x).data('dialog-extend-minimize-controls');
					if (lastDialogMin) {
						lastDialogMin.addClass('menubar-window-raise');
						previousZIndex = lastDialogMin.css('z-index');
						lastDialogMin.css('z-index', 2147483646);
						lastDialogMin.css('position', 'relative');
					} else {
						lastDialog.addClass('menubar-window-raise');
						previousZIndex = lastDialog.css('z-index');
						lastDialog.css('z-index', 2147483646);
					}
				},
				mouseout: function (e) {
					if (lastDialog) {
						var lastDialogMin = edenUI.getDialogContent(x).data('dialog-extend-minimize-controls');
						if (lastDialogMin) {
							lastDialogMin.removeClass('menubar-window-raise');
							lastDialogMin.css('z-index', previousZIndex);
							lastDialog = undefined;
							previousZIndex = undefined;
						} else {
							lastDialog.removeClass('menubar-window-raise');
							lastDialog.css('z-index', previousZIndex);
							lastDialog = undefined;
							previousZIndex = undefined;
						}
					}
				},
				click: function (e) {
					e.preventDefault();
					if (lastDialog) {
						var lastDialogMin = edenUI.getDialogContent(x).data('dialog-extend-minimize-controls');
						if (lastDialogMin) {
							lastDialogMin.removeClass('menubar-window-raise');
							lastDialogMin.css('z-index', previousZIndex);
							lastDialog = undefined;
							previousZIndex = undefined;
						} else {
							lastDialog.removeClass('menubar-window-raise');
							lastDialog.css('z-index', previousZIndex);
							lastDialog = undefined;
							previousZIndex = undefined;
						}
					}
					edenUI.showView(x);
					hideMenu();
				}
			};
		};

		//Now add actually active view.
		for (x in edenUI.activeDialogs) {
			viewentry = $("<div class=\"menubar-item\"></div>");
			var myHover = hoverFunc(x);
			viewentry.bind('mouseover', myHover.mouseover);
			viewentry.bind('mouseout', myHover.mouseout);

			var label = $('<div class="menubar-item-label menubar-item-clickable">'+x+' ['+edenUI.activeDialogs[x]+']</div>');
			label.bind("click", myHover.click);

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
