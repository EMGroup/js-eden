/*f
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Menu Bar Plugin
 * Generates a bar at the top of the screen for loading plugins and creating
 * views.
 * @class MenuBar Plugin
 */
EdenUI.plugins.MenuBar = function (edenUI, success) {
	var me = this;
	this.itemViews = {};

	edenUI.listenTo('createView', this, function (name, path) {
		this.updateViewsMenu();
	});

	edenUI.listenTo('destroyView', this, function (name) {
		$(this.itemViews[name]).remove();
		delete this.itemViews[name];
		existingViewsInstructions();
	});

	edenUI.listenTo('loadPlugin', this, function (name, path) {
		this.updateViewsMenu();
	});

	var menudiv = $('<div id="menubar-main"></div>');
	var menustatus = $('<div id="menubar-status"></div>');
	menustatus.appendTo(menudiv);
	menudiv.appendTo("body");
	$('<div id="menubar-bottom"></div>').appendTo("body");

	this.updateStatus = function (text) {
		menustatus.html(Eden.htmlEscape(text, true, true));
	};

	this.appendStatus = function (text) {
		menustatus.html(menustatus.html() + Eden.htmlEscape(text, true, true));
	};

	var menuShowing = false;

	function hideMenu() {
		$(".menubar-menu").hide();
		menuShowing = false;
	}

	function showMenu(name) {
		$("#menubar-mainitem-"+name).show();
		menuShowing = true;
	}

	$(document.body).on('mousedown', function () {
		hideMenu();
	});

	function addMainGroup() {
		var group = $('<div></div>');
		group.appendTo(menudiv);
		return group;
	}
	
	function addMainItem(name, title, width, group) {
		width = width + 40;
		var menuitem = $('<div class="menubar-mainitem" style="width: ' + width + 'px"></div>');
		menuitem.html(title+'<div id="menubar-mainitem-'+ name + '" class="menubar-menu"></div>');
		menuitem.appendTo(group);

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
	}
		
	function existingViewsInstructions() {
		var existingViews = $("#menubar-mainitem-existing-views");
		if (Object.keys && Object.keys(edenUI.activeDialogs).length === 0) {
			existingViews.html('<div class="menubar-item-fullwidth">Use the "New Window" menu to create windows.</div>');
		}
	}

	function onClickNewWindow(e) {
		hideMenu();
		var root = edenUI.eden.root;
		var followMouse = root.lookup("mouseFollow").value();
		var viewNumberSym = root.lookup("_view_number");
		var viewNumber = viewNumberSym.value() + 1;
		viewNumberSym.assign(viewNumber, Symbol.hciAgent, followMouse);
		if (followMouse) {
			edenUI.eden.execute("createView(\"view_" + viewNumber + "\", \"" + this.view + "\");");
		} else {
			edenUI.createView("view_" + viewNumber, this.view);
		}
		me.updateViewsMenu();
		e.stopPropagation();
		e.preventDefault();
	}
	
	function onClickCloseWindow(e) {
		e.preventDefault();
		edenUI.destroyView(this.parentNode.viewname);
		existingViewsInstructions();
	}

	function menuItem(parts) {
		var item = $("<div class='menubar-item'></div>");
		for (var i = 0; i < parts.length; ++i) {
			item.append(parts[i]);
		}
		return item;
	}
	
	function menuItemPart(className, content) {
		return $('<div class="'+className+' menubar-item-clickable">'+content+'</div>');
	}

	function menuSeparator(name) {
		return $("<div class='menubar-item'><div class='menubar-item-fullwidth menubar-item-separator'>" + name + "</div></div>");
	}

	function hoverFunc(viewName) {
		return {
			mouseover: function (e) {
				edenUI.highlight(viewName);
			},
			mouseout: function (e) {
				edenUI.stopHighlight(viewName);
			},
			click: function (e) {
				e.preventDefault();
				edenUI.stopHighlight();
				edenUI.showView(viewName);
				hideMenu();
			}
		};
	}

	this.updateViewsMenu = function () {
		var views = $("#menubar-mainitem-views");
		var existingViews = $("#menubar-mainitem-existing-views");
		views.html("");

		// First add supported view types
		var viewArray = [];
		var viewName;
		var viewType;
		var viewEntry;
		var label;
		var close;

		for (viewType in edenUI.views) {
			var viewDetails = edenUI.views[viewType];
			var title = viewDetails.title;
			var categoryLabel = viewDetails.category.getLabel();
			var categoryPriority = viewDetails.category.getMenuPriority();
			var itemPriority = viewDetails.menuPriority;

			label = menuItemPart('menubar-item-fullwidth menubar-view', title);

			viewEntry = menuItem([label]);
			viewEntry[0].view = viewType;
			viewEntry.bind("click", onClickNewWindow);

			viewArray.push({title: title, viewEntry: viewEntry,
				categoryLabel: categoryLabel, categoryPriority: categoryPriority, itemPriority: itemPriority});
		}

		viewArray = viewArray.sort(function (a, b) {
			if (a.categoryPriority != b.categoryPriority) {
				return a.categoryPriority - b.categoryPriority;
			}
			if (a.itemPriority !== undefined) {
				if (b.itemPriority !== undefined) {
					if (a.itemPriority != b.itemPriority) {
						return a.itemPriority - b.itemPriority;
					}
				} else {
					return -1;
				}
			} else if (b.itemPriority !== undefined) {
				return 1;
			}
			if (a.title > b.title) {
				return 1;
			} else if (a.title < b.title) {
				return -1;
			}
			return 0;
		});

		var prevCategory;
		for (var i = 0; i < viewArray.length; ++i) {
			var item = viewArray[i];
			var category = item.categoryLabel;
			if (prevCategory != category) {
				var separator = menuSeparator(category);
				separator.appendTo(views);
				prevCategory = category;
			}
			item.viewEntry.appendTo(views);
		}

		existingViews.html("");

		me.itemViews = {};
		existingViewsInstructions();

		// Now add existing windows
		for (viewName in edenUI.activeDialogs) {
			var myHover = hoverFunc(viewName);
			var title = edenUI.eden.root.lookup("_view_" + viewName + "_title").value();
			label = menuItemPart('menubar-item-label', title +' [' + viewName + ']');
			label.bind("click", myHover.click);

			close = menuItemPart('menubar-item-close', '<div class="menubar-item-close-icon">X</div>');
			close.bind("click", onClickCloseWindow);

			viewEntry = menuItem([label, close]);
			viewEntry.bind('mouseover', myHover.mouseover);
			viewEntry.bind('mouseout', myHover.mouseout);
			viewEntry[0].viewname = viewName;
			viewEntry.appendTo(existingViews);

			me.itemViews[viewName] = viewEntry[0];
		}
	};

	function checkedHTML(isChecked) {
		return isChecked && isChecked != "false"? 'checked="checked"' : '';
	}
	
	// Add main menu items
	function createMenus() {
		var jsedenGroup = addMainGroup();
		
		var optionsMenu;
		var label, checkbox, inputElement, initialOptionValue, item;
		
		addMainItem("views", "New Window", 60, jsedenGroup);
		addMainItem("existing-views", "Existing Windows", 85, jsedenGroup);
		me.updateViewsMenu();

		addMainItem("options", "Options", 60, jsedenGroup);	
		optionsMenu = $("#menubar-mainitem-options");

		initialOptionValue = edenUI.getOptionValue("optConfirmUnload");
		checkbox = menuItemPart("menubar-item-input", '<input type="checkbox"' + checkedHTML(initialOptionValue) + ' />');
		inputElement = checkbox.get(0).children[0];
		label = menuItemPart('menubar-item-label', "Confirm Closing Environment");
		item = menuItem([checkbox, label]);
		item.click(function (event) {
			if (event.target != inputElement) {
				inputElement.checked = !inputElement.checked;
			}
			edenUI.setOptionValue("optConfirmUnload", inputElement.checked);
		});
		item.appendTo(optionsMenu);
	}

	createMenus();

	// Put js-eden version in right corner
	$.ajax({
		url: "version.json",
		dataType: "json",
		success: function (data) {
			var versionHtml = '';
			if (data.tag) {
				versionHtml += 'Version ' + data.tag;
				document.title = document.title + " " + data.tag;
			}
			if (data.sha) {
				versionHtml += ' Commit <a href="https://github.com/EMgroup/js-eden/commit/' + data.sha +'">' + data.sha + '</a>';
			}
			$('<div id="menubar-version-number"></div>').html(versionHtml).appendTo($("#menubar-main"));
		},
		cache: false
	});

	//Additional menus defined by the construal.
	var construalGroup = addMainGroup();
	
	edenUI.eden.root.lookup("menus").addJSObserver("updateMenus", function (symbol, menus) {
		var previousChildren = construalGroup.children();
		previousChildren.detach();
		if (Array.isArray(menus)) {
			for (var i = 0; i < menus.length; i++) {
				var menu = menus[i];
				if (menu.element === undefined) {
					var menuID = "construal-" + i;
					addMainItem(menuID, menu.text, construalGroup);
					var menuDiv = $('#menubar-mainitem-' + menuID);
					menu.generate(menuDiv);
				} else {
					construalGroup.append(menu.element);
				}
			}
		}
	});
	
	this.Menu = function (text, items) {
		this.text = text;
		this.items = items;
	}

	this.Menu.prototype.generate = function (menuDiv) {
		if (this.element === undefined) {
			for (var i = 0; i < this.items.length; i++) {
				var item = this.items[i];
				item.generate();
				menuDiv.append(item.element);
			}
			this.element = menuDiv.parent().get(0);
		}
	}

	this.SimpleMenuItem = function (name, text) {
		this.name = name;
		this.text = text;
	}

	this.SimpleMenuItem.prototype.generate = function () {
		if (this.element === undefined) {
			var label = menuItemPart('menubar-item-fullwidth', this.text);
			var item = menuItem([label]);
			var name = this.name;
			item.bind("click", function (event) {
				hideMenu();
				var symbol = root.lookup(name + "_clicked");
				symbol.assign(true);
				symbol.assign(false);
			});
			this.element = item.get(0);
		}
	}

	edenUI.eden.include("plugins/menu-bar/menu-bar.js-e", success);
};

EdenUI.plugins.MenuBar.title = "Menu Bar";
EdenUI.plugins.MenuBar.description = "Creates the menu bar.";
