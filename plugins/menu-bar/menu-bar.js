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
	EdenUI.plugins.MenuBar.title = Language.ui.menu_bar.title;
	EdenUI.plugins.MenuBar.description = Language.ui.menu_bar.description;

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

	var pinnedIcon = "images/pin.png";
	var notPinnedIcon = "images/pin-greyed.png";

	var menudiv = $('<div id="menubar-main"></div>');
	var menustatus = $('<div id="menubar-status"></div>');
	menustatus.appendTo(menudiv);
	menudiv.appendTo("body");
	$('<div id="menubar-bottom"></div>').appendTo("body");

	var menuStyle = getStyleBySelector(".menubar-menu");
	menuStyle.maxHeight = "calc(100vh - " + String(30 + edenUI.scrollBarSize2) + "px)";

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
		//Reset search box
		var newWindowMenu = $("#menubar-mainitem-views");
		newWindowMenu.children().css("display", "");
		document.getElementById("menubar-view-type-search").value = "";
	}

	function showMenu(name) {
		var menu = $("#menubar-mainitem-"+name);
		menu.show();
		menuShowing = true;
	}

	$(document.body).on('mousedown', function () {
		hideMenu();
	});

	function addMainGroup() {
		var group = $('<div></div>');
		group.appendTo(menudiv);
		group.menuGroupWidth = 0;
		return group;
	}

	var numMenus = 0;

	function addMainItem(name, title, group) {
		var menuitem = $('<div class="menubar-mainitem"></div>');
		numMenus++;
		menuitem.attr("tabindex", numMenus);
		menuitem.html(title);
		menuitem.appendTo(group);
		var width = menuitem[0].clientWidth + 10;
		group.menuGroupWidth = group.menuGroupWidth + width + 10; //10px padding
		menuitem[0].style.width =  width + "px";
		menuitem.html(title + '<div id="menubar-mainitem-'+ name + '" class="menubar-menu"></div>');

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
		};

		menuitem.on('mousedown', toggleMenu);
		menuitem.on('mouseenter', function () {
			if (menuShowing) {
				hideMenu();
				showMenu(name);
			}
		});
		return menuitem;
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
		var viewNumberSym = root.lookup("_views_number_created");
		/* The number of views created is synchronized across clients even if the views themselves
		 * are not, in case mouseFollow is enabled later.
		 */
		var viewNumber = viewNumberSym.value() + 1;
		viewNumberSym.assign(viewNumber, root.scope, Symbol.hciAgent, true);
		var viewType = this.view;
		var viewName = viewType.slice(0, 1).toLowerCase() + viewType.slice(1) + viewNumber;
		if (followMouse) {
			edenUI.eden.execute('createView("' + viewName + '", "' + viewType + '");');
		} else {
			edenUI.createView(viewName, viewType);
		}
		me.updateViewsMenu();
	}
	
	function onClickCloseWindow(e) {
		var name = this.parentNode.viewname;
		if (edenUI.viewInstances[name].confirmClose) {
			hideMenu();
		}
		edenUI.closeView(name);
		existingViewsInstructions();
	}
	
	function onClickPinWindow(e) {
		var image = e.currentTarget.children[0];
		var name = this.parentNode.viewname;

		if (edenUI.viewInstances[name].pinned) {
			edenUI.unpinView(name);
			image.src = notPinnedIcon;
		} else {
			edenUI.pinView(name);
			image.src = pinnedIcon;
		}
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
		return $("<div class='menubar-item menubar-nonselectable'><div class='menubar-item-fullwidth menubar-item-separator'>" + name + "</div></div>");
	}

	function hoverFunc(viewName) {
		return {
			mouseover: function (e) {
				edenUI.highlightView(viewName, true);
			},
			mouseout: function (e) {
				edenUI.stopHighlightingView(viewName, true, false);
			},
			click: function (e) {
				edenUI.stopHighlightingView(viewName, true, true);
				hideMenu();
			}
		};
	}

	this.updateViewsMenu = function () {
		var views = $("#menubar-mainitem-views");
		var existingViews = $("#menubar-mainitem-existing-views");
		views.html("");

		var searchBox = $('<input id="menubar-view-type-search" class="menubar-search-box" type="text" placeholder="search"/>');
		var searchBoxElem = searchBox[0];
		var searchItemPart = $('<div class="menubar-item-fullwidth"></div>');
		searchItemPart.append(searchBox);
		var searchItem = $("<div class='menubar-item-search'></div>");
		searchItem.append(searchItemPart);

		searchBoxElem.search = function () {
			var searchStr = searchBoxElem.value;
			var re = new RegExp("(^|\\s)"+ searchStr, "i");
			var lastCategory;
			var categoryMatch = false;
			views.children().each(function (index, element) {
				if (element.classList.contains("menubar-item-search")) {
					return;
				}
				var inner = element.children[0];
				var name = inner.innerHTML;
				var isCategory = inner.classList.contains("menubar-item-separator");
				if (isCategory) {
					if (searchStr.length > 1) {
						categoryMatch = re.test(name);
					}
					lastCategory = element;
					if (categoryMatch) {
						element.style.display = "";
					} else {
						element.style.display = "none";
					}
				} else {
					if (categoryMatch) {
						element.style.display = "";
					} else if (re.test(name)) {
						element.style.display = "";
						lastCategory.style.display = "";
					} else {
						element.style.display = "none";
					}
				}
			});
		};
		searchBox.on("input", searchBoxElem.search);

		// First add supported view types
		var viewArray = [];
		var viewName;
		var viewType;
		var viewEntry;
		var label, pin, close;

		for (viewType in edenUI.views) {
			var viewDetails = edenUI.views[viewType];
			var title = viewDetails.title;
			var categoryLabel = viewDetails.category.getLabel();
			var categoryPriority = viewDetails.category.getMenuPriority();
			var itemPriority = viewDetails.menuPriority;

			label = menuItemPart('menubar-item-fullwidth menubar-view', title);

			viewEntry = menuItem([label]);
			viewEntry[0].view = viewType;
			viewEntry.click(onClickNewWindow);

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
		views.append(searchItem);

		existingViews.html("");

		me.itemViews = {};
		existingViewsInstructions();

		// Now add existing windows
		for (viewName in edenUI.activeDialogs) {
			var myHover = hoverFunc(viewName);
			var title = edenUI.eden.root.lookup("_view_" + viewName + "_title").value();
			label = menuItemPart('menubar-item-label', title + ' <span class="menubar-view-name">[' + viewName + ']</span>');
			label.click(myHover.click);

			var pinImageURL;
			if (edenUI.viewInstances[viewName].pinned) {
				pinImageURL = pinnedIcon;
			} else {
				pinImageURL = notPinnedIcon;
			}
			pin = menuItemPart('menubar-item-pin', '<img src="' + pinImageURL + '" width="18" height="18" class="menubar-item-pin-icon"/>');
			pin.click(onClickPinWindow);

			close = menuItemPart('menubar-item-close', '<div class="menubar-item-close-icon">X</div>');
			close.click(onClickCloseWindow);

			viewEntry = menuItem([label, pin, close]);
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
	var jsedenGroup = addMainGroup();
	function createMenus() {

		var viewTypesMenu = addMainItem("views", Language.ui.menu_bar.main_views, jsedenGroup);

		viewTypesMenu.on("keypress", function (event) {
			var searchBoxElem = document.getElementById("menubar-view-type-search");
			if (searchBoxElem === event.target) {
				return;
			}
			searchBoxElem.value = searchBoxElem.value + String.fromCharCode(event.which);
			searchBoxElem.search();
		});
		viewTypesMenu.on("keyup", null, "backspace", function (event) {
			var searchBoxElem = document.getElementById("menubar-view-type-search");
			if (searchBoxElem === event.target) {
				return;
			}
			searchBoxElem.value = searchBoxElem.value.slice(0, -1);
			searchBoxElem.search();
		});

		addMainItem("existing-views", Language.ui.menu_bar.main_existing, jsedenGroup);
		me.updateViewsMenu();

		addMainItem("options", Language.ui.menu_bar.main_options, jsedenGroup);	

		var optionsMenu = $("#menubar-mainitem-options");

		function addCheckboxOption(optionName, description, defaultValue, onChange) {
			var initialOptionValue = edenUI.getOptionValue(optionName);
			if (initialOptionValue === null) {
				initialOptionValue = defaultValue;
			}
			var checkbox = menuItemPart("menubar-item-input", '<input id="menu-' + optionName +'" type="checkbox"' + checkedHTML(initialOptionValue) + ' />');
			var inputElement = checkbox.get(0).children[0];
			var label = menuItemPart('menubar-item-label', description);
			var item = menuItem([checkbox, label]);
			item.click(function (event) {
				if (event.target != inputElement) {
					inputElement.checked = !inputElement.checked;
				}
				edenUI.setOptionValue(optionName, inputElement.checked);
			});
			edenUI.listenTo("optionChange", undefined, function (changedName, value) {
				if (changedName == optionName) {
					var ticked = (value === "true");
					inputElement.checked = ticked;
					if (onChange) {
						onChange(optionName, ticked);
					}
				}
			});
			item.appendTo(optionsMenu);
		}

		addCheckboxOption("optConfirmUnload", Language.ui.menu_bar.opt_confirm, true, function(optName, confirm) {
			if (confirm) {
				window.addEventListener("beforeunload", confirmUnload);
			} else {
				window.removeEventListener("beforeunload", confirmUnload);
			}
		});
		addCheckboxOption("optSimpleWildcards", Language.ui.menu_bar.opt_simple_search, true);
		addCheckboxOption("optHideOnMinimize", Language.ui.menu_bar.opt_hide, false);
		addCheckboxOption("optCollapseToTitleBar", Language.ui.menu_bar.opt_collapse, false, function (optName, collapse) {
			var action;
			if (collapse) {
				action = "collapse";
			} else {
				action = "maximize";
			}
			$(".ui-dialog-content").each(function () { $(this).dialogExtend("option", "dblclick", action); });
		});

		addCheckboxOption("developer", Language.ui.menu_bar.opt_debug, false, function (optName, enabled) {
			var pathname;
			if (enabled) {
				pathname = "/index-dev.html";
			} else {
				pathname = "/index.html";
			}
			var currentPath = document.location.pathname;
			pathname = currentPath.slice(0, currentPath.lastIndexOf("/")) + pathname;
			if (pathname != document.location.pathname) {
				hideMenu();
				edenUI.modalDialog(
					"Restart Required",
					'<p>JS-EDEN must be restarted for this change to fully take effect.  Would you like to restart JS-EDEN now?</p>',
					["Restart Now", "Restart Later"],
					1,
					function (button) {
						if (button == 0) {
							//Restart, switching between minified and non-minified.
							window.onbeforeunload = undefined;
							document.location.pathname = pathname;
						} else if (button == 1) {
							//Don't restart but apply the debugging preference in as many areas as possible without restarting.
							root.lookup("debug").mutate(function (symbol) { symbol.cached_value.jsExceptions = enabled; }, Symbol.hciAgent);
						} else {
							//Cancel the change.
							var checkbox = document.getElementById("menu-developer");
							checkbox.checked = !checkbox.checked;
							edenUI.setOptionValue("developer", checkbox.checked);
						}
					}
				);
			} else {
				//No need to restart, but do apply changes.
				root.lookup("debug").mutate(root.scope, function (symbol) { symbol.cache.value.jsExceptions = enabled; }, Symbol.hciAgent);
			}
		});
	}

	createMenus();

	// Put JS-EDEN version number or name in top-right corner.
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
		construalGroup.menuGroupWidth = 0;
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
					construalGroup.menuGroupWidth = construalGroup.menuGroupWidth + menu.element.clientWidth;
				}
			}
		}
		var statusStyle = menustatus[0].style;
		var statusLeft = 20 + jsedenGroup.menuGroupWidth + construalGroup.menuGroupWidth;
		statusStyle.left = statusLeft + "px";
		statusStyle.minWidth = "calc(100% - " + (2 * statusLeft) + "px)";
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

	this.Menu.prototype.toString = function () {
		return "Menu(" + Eden.edenCodeForValues(this.text, this.items) + ")";
	}	
	this.Menu.prototype.getEdenCode = this.Menu.prototype.toString;

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
				symbol.assign(true, root.scope);
				symbol.assign(false, root.scope);
			});
			this.element = item.get(0);
		}
	}
	
	this.SimpleMenuItem.prototype.toString = function () {
		return "MenuItem(" + Eden.edenCodeForValues(this.name, this.text) + ")";
	}	
	this.SimpleMenuItem.prototype.getEdenCode = this.SimpleMenuItem.prototype.toString;

	edenUI.eden.include("plugins/menu-bar/menu-bar.js-e", success);
};


