EdenUI.MenuBar = function() {
	var pinnedIcon = "images/pin.png";
	var notPinnedIcon = "images/pin-greyed.png";
	var me = this;
	this.itemViews = {};

	var obscurer = $('<div id=\"menubar-obscurer\" class=\"login-subdialog modal\" style=\"display: block;\"></div>');
	obscurer.html("<div class=\"modal-content\" style=\"width: 290px;\"><div class=\"menubar-sharebox-title\"><span class=\"menubar-shareicon\">&#xf090;</span>Login</div><iframe frameborder=\"0\" name=\"logintarget\" width=\"250\" height=\"200\" class=\"menubar-login-iframe\"></iframe><br/><button class=\"jseden button-cancel\">Cancel</button></div>");
	obscurer.hide();

	eden.execute2("views_number_created = 0;", Symbol.defaultAgent);

	// The menu bar, title and buttons...
	this.element = $('<div id="menubar-main"><a id="eden-logo" href="'+window.location.pathname+'" target="_blank" style="display: block"></a><div contenteditable class="jseden-title" title="Rename project">Construit!</div>'+((!mobilecheck()) ? '<div class="jseden-subtitle">by Some Author</div><div id="menubar-login"><span class="icon">&#xf05e;</span>Not Connected</div><div class="menubar-buttons"><div class="menubar-button enabled main share" data-obs="sharebox" title="Save or share" style="display: none;">&#xf1e0;<div id="menubar-mainitem-sharebox" class="menubar-menu"></div></div><div class="menubar-button enabled main create" data-obs="views" title="Create Views" style="display: none;">&#xf067;<div id="menubar-mainitem-views" class="menubar-menu"></div></div><div class="menubar-button enabled main existing" data-obs="existing" title="Existing" style="display: none;">&#xf2d2;<div id="menubar-mainitem-existing" class="menubar-menu"></div></div><div class="menubar-button enabled main settings" data-obs="options" title="Options" style="display: none;">&#xf013;<div id="menubar-mainitem-options" class="menubar-menu"></div></div><div class="menubar-button enabled main help" data-obs="help" title="Help" style="display: none;">&#xf128;<div id="menubar-mainitem-help" class="menubar-menu"></div></div><div class="menubar-button enabled main notifications" data-obs="notifications" title="Notifications">&#xf0f3;<span class="menubar-notification-jewel"></span><div id="menubar-mainitem-notifications" class="menubar-menu"></div></div><div class="menubar-button enabled main maker" data-obs="maker" title="Maker Mode">&#xf0ad;</div></div><div class="searchouter menusearch" style="display: none;"><input type="text" class="search menusearch" placeholder="Search..." spellcheck="false"></input><div id="menubar-searchresults"></div></div>' : '<div class="menubar-mobilebuttons"><button class="scriptview-button enabled mobilemore">&#xf078;</button></div>')+'</div>');
	$(document.body).append(this.element);

	// Login Button
	var loginButton = this.element.find("#menubar-login"); //$('<div id="menubar-login"><span class="icon">&#xf05e;</span>Not Connected</div>');
	//loginButton.appendTo(this.element);

	var usercontext = new EdenUI.ContextMenu(loginButton.get(0));
	usercontext.addItem("&#xf08b;","Log out", function() { return Eden.DB.isLoggedIn(); }, function() {
		Eden.DB.logOut(function() {
			$("#menubar-login").html('<a href="'+Eden.DB.remoteURL+'/login" target="logintarget"><span class="icon">&#xf090;</span>Login</a>');
		}); 
	});

	////////////////////////////////////////////////////////////////////////////
	//  JS-Eden event listeners
	////////////////////////////////////////////////////////////////////////////

	edenUI.listenTo('loadPlugin', this, function (name, path) {
		this.updateViewsMenu();
	}); 

	edenUI.listenTo('createView', this, function (name, path) {
		this.updateViewsMenu();
	});

	edenUI.listenTo('destroyView', this, function (name) {
		$(this.itemViews[name]).remove();
		delete this.itemViews[name];
		existingViewsInstructions();
	});

	Eden.DB.listenTo("connected", this, function(url) {
		$("#menubar-login").html('<a href="'+url+'/login" target="logintarget"><span class="icon">&#xf090;</span>Login</a>');
	});

	Eden.DB.listenTo("disconnected", this, function() {
		$("#menubar-login").html('<span class="icon">&#xf05e;</span>Not Connected');
		//me.notification("info", $('<div class="notification-content">Disconnected</div>'));
	});

	Eden.DB.listenTo("login", this, function(name) {
		if (name) {
			setTimeout(function() {
				$("#menubar-obscurer").remove();
			}, 1000);
			$("#menubar-login").html('<a href="'+Eden.DB.remoteURL+'/#" target="_blank"><span class="icon">&#xf2be;</span>'+name+"</a>");
		}
	});


	////////////////////////////////////////////////////////////////////////////


	$("#menubar-login").click(function() {
		if (Eden.DB.isConnected() && !Eden.DB.isLoggedIn()) {
			obscurer.show();
			$(document.body).append(obscurer);
			obscurer.on("click", ".button-cancel", function() {
				obscurer.remove();
			});
		} else if (Eden.DB.isConnected() && Eden.DB.isLoggedIn()) {
			
		}
	});

	var me = this;

	if (mobilecheck()) {
		var ctx = new EdenUI.ContextMenu(this.element.find(".mobilemore").get(0));
		ctx.addItem("&#xf1e0;", "Share", true, function(e) { me.script.stickAll(); });
		ctx.addItem("&#xf121;", "New Script View", true, function(e) { me.script.unstickAll(); });
		ctx.addItem("&#xf022;", "New Observable Lists", true, function(e) { me.script.clearUnstuck(); });
		ctx.addItem("&#xf03e;", "New Graphic View", true, function(e) { me.script.activateAll(); });
		this.element.on("click",".mobilemore",function(e) {
			me.element.find(".mobilemore").get(0).oncontextmenu(e);
		});
	}

	this.sharebox = new EdenUI.Sharebox(this.element.find("#menubar-mainitem-sharebox"));
	this.element.on("click", ".menubar-button.share", function(e) {
		if (e.currentTarget === e.target) me.sharebox.update();
	});

	this.searchbox = new EdenUI.SearchBox(this.element.find("#menubar-searchresults"));
	this.element.on("keyup", ".search", function(e) {
		me.searchbox.updateSearch(e.currentTarget.value);
	});
	this.element.on("focus", ".search", function(e) {
		me.searchbox.updateSearch(e.currentTarget.value);
	});

	var menuShowing = false;
	var currentMenu = undefined;

	function hideMenu() {
		$(".menubar-menu").hide();
		menuShowing = false;
		//Reset search box
		var newWindowMenu = $("#menubar-mainitem-views");
		newWindowMenu.children().css("display", "");
		//document.getElementById("menubar-view-type-search").value = "";
	}

	function showMenu(name) {
		var menu = $("#menubar-mainitem-"+name);
		menu.show();
		currentMenu = name;
		menuShowing = true;
		if (name == "sharebox") me.sharebox.show();
	}

	$(document.body).on('mousedown', function () {
		hideMenu();
		me.searchbox.element.hide();
		//if (name == "sharebox") me.sharebox.hide();
	});

	this.element.on("mousedown", ".menubar-search-outer", function(e) {
		e.stopPropagation();
	});


	this.element.on("mousedown", ".menubar-button.main", function (e) {
		var name = e.currentTarget.getAttribute("data-obs");
		//if (e.target !== e.currentTarget) return;

		if (menuShowing && e.target === this) {
			if (name == currentMenu) {
				hideMenu();
			} else {
				hideMenu();
				showMenu(name);
			}
		} else {
			//hideMenu();
			showMenu(name);
		}
		me.searchbox.element.hide();
		e.stopPropagation();
	});
	this.element.on("mouseenter", ".menubar-button.main", function(e) {
		//var name = e.currentTarget.getAttribute("data-obs");
		//if (menuShowing) {
		//	hideMenu();
		//	showMenu(name);
			//if (name == "sharebox") me.sharebox.update();
		//}
	});

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
		var viewNumberSym = root.lookup("views_number_created");
		/* The number of views created is synchronized across clients even if the views themselves
		 * are not, in case mouseFollow is enabled later.
		 */
		var viewNumber = viewNumberSym.value() + 1;
		viewNumberSym.assign(viewNumber, root.scope, Symbol.hciAgent, true);
		var viewType = this.view;
		// NOTE: Why does this not just lowercase everything? 
		// results in hTMLView!
		//var viewName = viewType.slice(0, 1).toLowerCase() + viewType.slice(1) + viewNumber;
		var viewName = viewType.toLowerCase() + viewNumber;
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
		var existingViews = $("#menubar-mainitem-existing");
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
			var title = edenUI.eden.root.lookup("view_" + viewName + "_title").value();
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

	this.updateViewsMenu();

	var optionsMenu = $("#menubar-mainitem-options");

	function checkedHTML(isChecked) {
		return isChecked && isChecked != "false"? 'checked="checked"' : '';
	}

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
						root.lookup("debug").mutate(root.scope, function (symbol) { symbol.cache.value.jsExceptions = enabled; }, Symbol.hciAgent);
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

	this.element.on("keyup", ".jseden-title", function(e) {
		try {
			if (window.localStorage) {
				window.localStorage.setItem("title", e.currentTarget.textContent);
			}
		} catch(e) {

		}
	});

	eden.root.lookup("jseden_project_title").addJSObserver("menubar", function(sym, value) {
		if (sym.origin && sym.origin.name != "*JavaScript") {
			$(".jseden-title").get(0).textContent = value;
		}
		try {
			if (window.localStorage) {
				window.localStorage.setItem("title", value);
			}
		} catch(e) {

		}
	});

	eden.root.lookup("jseden_maker").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".maker").addClass("active");
		else me.element.find(".maker").removeClass("active");
	});

	eden.root.lookup("jseden_menu_showsearch").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menusearch").show();
		else me.element.find(".menusearch").hide();
	});

	eden.root.lookup("jseden_menu_showshare").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.share").show();
		else me.element.find(".menubar-button.share").hide();
	});

	eden.root.lookup("jseden_menu_showcreate").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.create").show();
		else me.element.find(".menubar-button.create").hide();
	});

	eden.root.lookup("jseden_menu_showexisting").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.existing").show();
		else me.element.find(".menubar-button.existing").hide();
	});

	eden.root.lookup("jseden_menu_showsettings").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.settings").show();
		else me.element.find(".menubar-button.settings").hide();
	});

	eden.root.lookup("jseden_menu_showhelp").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.help").show();
		else me.element.find(".menubar-button.help").hide();
	});

	eden.root.lookup("jseden_project_subtitle").addJSObserver("menubar", function(sym, value) {
		$(".jseden-subtitle").get(0).textContent = value;
	});

	this.notifications = new EdenUI.Notifications(this.element.find("#menubar-mainitem-notifications"), this.element.find(".menubar-notification-jewel"));
	this.element.on("click",".notifications", function(e) {
		me.notifications.clearCount();
	});

	this.element.on("click",".maker", function(e) {
		var sym = eden.root.lookup("jseden_maker");
		if (!sym.eden_definition) {
			var val = sym.value();
			if (val === undefined) val = false;
			sym.assign(!val, eden.root.scope, Symbol.localJSAgent);
		}
	});

	this.element.on("keyup", ".jseden-title", function(e) {
		var sym = eden.root.lookup("jseden_project_title");
		if (!sym.eden_definition) {
			sym.assign(e.currentTarget.textContent, eden.root.scope, Symbol.localJSAgent);
		}
	});
}

EdenUI.MenuBar.reset = function() {
	$(".jseden-title").html("Construit!");
}

EdenUI.MenuBar.saveTitle = function(title) {
	eden.root.lookup("jseden_project_title").assign(title, eden.root.scope, Symbol.jsAgent);
}
