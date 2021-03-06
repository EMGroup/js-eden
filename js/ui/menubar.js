EdenUI.MenuBar = function() {
	var pinnedIcon = "images/pin.png";
	var notPinnedIcon = "images/pin-greyed.png";
	var me = this;
	this.itemViews = {};

	var ismobile = mobilecheck();

	var obscurer = $('<div id=\"menubar-obscurer\" class=\"login-subdialog modal\" style=\"display: block;\"></div>');
	obscurer.html(`<div class="modal-content" style="width: 350px; height: 400px;"><div class="menubar-sharebox-title"><span class="menubar-shareicon">&#xf090;</span>${Language.ui.menu_bar.signin}</div><iframe frameborder="0" name="logintarget" width="340px" height="300px" class="menubar-login-iframe"></iframe><button class="jseden button-cancel">${Language.ui.menu_bar.cancel}</button></div>`);
	obscurer.hide();

	if (Eden.AST) eden.execute2("views_number_created = 0;", EdenSymbol.defaultAgent);

	// The menu bar, title and buttons...
	//<div class="jseden-subtitle">by Some Author</div>

	if (ismobile) {
		this.element = $('<div id="menubar-main" class="no-print">\
			<div class="menubar-buttons">\
				<div class="menubar-button enabled main share" data-obs="sharebox" title="Save or share" style="display: none;">&#xf1e0;<div id="menubar-mainitem-sharebox" class="menubar-menu"></div></div>\
				<div class="menubar-button enabled main notifications" data-obs="notifications" title="Notifications">&#xf0f3;<span class="menubar-notification-jewel"></span><div id="menubar-mainitem-notifications" class="menubar-menu"></div></div>\
				<div class="menubar-button enabled main more" data-obs="more" title="More Options">&#xf0c9;</div></div>\
			<div class="searchouter menusearch" style="display: none;"><input type="text" class="search menusearch" placeholder="Search..." spellcheck="false"></input>\
				<div id="menubar-searchresults"></div>\
			</div></div>');
	} else {
		this.element = $(`<div id="menubar-main" class="no-print">
			<a id="eden-logo" title="${Language.ui.tooltips.home_logo}" href="${window.location.pathname}" target="_blank" style="display: block"></a>
			<div class="jseden-title" title="${Language.ui.tooltips.rename}"></div>
			<div id="menubar-login"><span class="icon">&#xf05e;</span>${Language.ui.menu_bar.notconnected}</div>
			<div class="menubar-buttons">
				<div class="menubar-button enabled main share" data-obs="sharebox" title="${Language.ui.tooltips.save}" style="display: none;">&#xf1e0;<div id="menubar-mainitem-sharebox" class="menubar-menu"></div></div>
				<div class="menubar-button enabled main create" data-obs="views" title="${Language.ui.tooltips.create}" style="display: none;">&#xf067;<div id="menubar-mainitem-views" class="menubar-menu"></div></div>
				<div class="menubar-button enabled main existing" data-obs="existing" title="${Language.ui.tooltips.existing}" style="display: none;">&#xf2d2;<div id="menubar-mainitem-existing" class="menubar-menu"></div></div>
				<div class="menubar-button enabled main settings" data-obs="options" title="${Language.ui.tooltips.options}" style="display: none;">&#xf013;<div id="menubar-mainitem-options" class="menubar-menu"></div></div>
				<div class="menubar-button enabled main help" data-obs="help" title="${Language.ui.tooltips.help}">&#xf128;<div id="menubar-mainitem-help" class="menubar-menu">
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="?load=54">Getting Started...</a></div>					
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="resources/doc/cheat.pdf">Cheat Sheet (PDF)</a></div>
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="https://www.youtube.com/channel/UCQUAv0AU1FF2EN0qwOOZCag">Tutorial Videos (YouTube)</a></div>
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="https://github.com/EMGroup/js-eden/wiki/Eden-Functions">Library Reference</a></div>
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="https://github.com/EMGroup/js-eden/wiki/FAQ">FAQ</a></div>
					<div class="menubar-item-fullwidth menubar-item-clickable"><a target="_blank" style="color: inherit; text-decoration: none;" href="http://construit.org">About Construit</a></div>
				</div></div>
				<div class="menubar-button enabled main notifications" data-obs="notifications" title="${Language.ui.tooltips.notifications}">&#xf0f3;<span class="menubar-notification-jewel"></span><div id="menubar-mainitem-notifications" class="menubar-menu"></div></div>
				<div class="menubar-button enabled main maker" data-obs="maker" title="${Language.ui.tooltips.maker}" style="display: none;">&#xf0ad;</div></div>
			<div class="searchouter menusearch" style="display: none;"><input type="text" class="search menusearch" placeholder="${Language.ui.menu_bar.search}" spellcheck="false"></input>
				<div id="menubar-searchresults"></div>
			</div></div>`);
	}
	$(document.body).append(this.element);

	// Login Button
	var loginButton = this.element.find("#menubar-login"); //$('<div id="menubar-login"><span class="icon">&#xf05e;</span>Not Connected</div>');
	//loginButton.appendTo(this.element);

	if (!ismobile) {
		var usercontext = new EdenUI.ContextMenu(loginButton.get(0));
		usercontext.addItem("&#xf08b;","Log out", function() { return Eden.DB.isLoggedIn(); }, function() {
			Eden.DB.logOut(function() {
				$("#menubar-login").html('<span class="icon">&#xf090;</span>Sign-in');
			}); 
		});
	}

	this.timeout = null;

	////////////////////////////////////////////////////////////////////////////
	//  JS-Eden event listeners
	////////////////////////////////////////////////////////////////////////////

	edenUI.listenTo('loadPlugin', this, function (name, path) {
		if (ismobile) {

		} else {
			if (!this.timeout) this.timeout = setTimeout(() => { this.updateStaticViewsMenu(); this.timeout = null; }, 200);
		}
	}); 

	edenUI.listenTo('createView', this, function (name, path) {
		if (ismobile) {

		} else {
			if (!this.timeout) this.timeout = setTimeout(() => { this.updateViewsMenu(); this.timeout = null; }, 200);
		}
	});

	edenUI.listenTo('destroyView', this, function (name) {
		if (ismobile) {

		} else {
			$(this.itemViews[name]).remove();
			delete this.itemViews[name];
			existingViewsInstructions();
		}
	});

	Eden.DB.listenTo("connected", this, function(url) {
		if (ismobile) {

		} else {
			$("#menubar-login").html(`<span class="icon">&#xf090;</span>${Language.ui.menu_bar.signin}`);
		}
	});

	Eden.DB.listenTo("disconnected", this, function() {
		if (ismobile) {

		} else {
			$("#menubar-login").html(`<span class="icon">&#xf05e;</span>${Language.ui.menu_bar.notconnected}`);
			//me.notification("info", $('<div class="notification-content">Disconnected</div>'));
		}
	});

	Eden.DB.listenTo("login", this, function(name) {
		if (ismobile) {

		} else {
			if (name) {
				Eden.DB.log("login");
				setTimeout(function() {
					$("#menubar-obscurer").remove();
				}, 1000);
				$("#menubar-login").html('<a href="'+Eden.DB.remoteURL+'/#" target="_blank"><span class="icon">&#xf2be;</span>'+name+"</a>");
			}
		}
	});


	////////////////////////////////////////////////////////////////////////////

	var me = this;


	if (!ismobile) {
		$("#menubar-login").click(function() {
			me.showLogin();
		});
	}

	this.showLogin = function() {
		if (Eden.DB.isConnected() && !Eden.DB.isLoggedIn()) {
			obscurer.show();
			$(document.body).append(obscurer);
			obscurer.find("iframe").attr('src',Eden.DB.remoteURL + "/login");
			obscurer.on("click", ".button-cancel", function() {
				obscurer.remove();
			});
		} else if (Eden.DB.isConnected() && Eden.DB.isLoggedIn()) {
			
		}
	}

	/*if (mobilecheck()) {
		var ctx = new EdenUI.ContextMenu(this.element.find(".mobilemore").get(0));
		ctx.addItem("&#xf1e0;", "Share", true, function(e) { me.script.stickAll(); });
		ctx.addItem("&#xf121;", "New Script View", true, function(e) { me.script.unstickAll(); });
		ctx.addItem("&#xf022;", "New Observable Lists", true, function(e) { me.script.clearUnstuck(); });
		ctx.addItem("&#xf03e;", "New Graphic View", true, function(e) { me.script.activateAll(); });
		this.element.on("click",".mobilemore",function(e) {
			me.element.find(".mobilemore").get(0).oncontextmenu(e);
		});
	}*/

	if (Eden.AST) {
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
	}

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
		if (me.searchbox) me.searchbox.element.hide();
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
		if (me.searchbox) me.searchbox.element.hide();
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
		viewNumberSym.assign(viewNumber, root.scope, EdenSymbol.hciAgent, true);
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
		var name = this.parentNode.title;
		if (edenUI.viewInstances[name].confirmClose) {
			hideMenu();
		}
		//edenUI.closeView(name);
		edenUI.destroyView(name);
		existingViewsInstructions();
	}
	
	function onClickPinWindow(e) {
		console.log("PIN",e);
		var image = e.currentTarget.children[0];
		var name = this.parentNode.title;

		if (edenUI.viewInstances[name].pinned) {
			edenUI.unpinView(name);
			image.src = notPinnedIcon;
		} else {
			edenUI.pinView(name);
			image.src = pinnedIcon;
		}
	}

	function menuItem(parts) {
		//var item = $("<div class='menubar-item'></div>");
		var item = document.createElement("DIV");
		item.className = "menubar-item";

		for (var i = 0; i < parts.length; ++i) {
			//item.append(parts[i]);
			item.appendChild(parts[i][0]);
		}
		return $(item);
	}
	
	function menuItemPart(className, content, itemClass) {
		let ele = document.createElement("DIV");
		ele.className = className + " menubar-item-clickable";
		let item = document.createElement("SPAN");
		item.innerText = content;
		item.className = itemClass;
		ele.appendChild(item);
		return $(ele);
		//return $('<div class="'+className+' menubar-item-clickable">'+content+'</div>');
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

	this.ready = false;

	Eden.Project.listenTo("load", this, (project) => {
		this.ready = true;
		this.updateViewsMenu();
		this.updateStaticViewsMenu();
	});

	this.updateViewsMenu = function() {
		if (!this.ready) return;
		var existingViews = $("#menubar-mainitem-existing");
		existingViews.html("");

		me.itemViews = {};
		existingViewsInstructions();

		// Now add existing windows
		for (viewName in edenUI.activeDialogs) {
			var myHover = hoverFunc(viewName);
			var title = edenUI.eden.root.lookup("view_" + viewName + "_title").value();
			label = menuItemPart('menubar-item-label', title, 'menubar-view-name');
			label.click(myHover.click);

			/*var pinImageURL;
			if (edenUI.viewInstances[viewName].pinned) {
				pinImageURL = "menubar-item-pin-icon pinned";
			} else {
				pinImageURL = "menubar-item-pin-icon";
			}
			pin = menuItemPart('menubar-item-pin', '&#xf276;',pinImageURL);
			pin.click(onClickPinWindow);*/

			close = menuItemPart('menubar-item-close', 'X', "menubar-item-close-icon");
			close.click(onClickCloseWindow);

			viewEntry = menuItem([label, close]);
			viewEntry.bind('mouseover', myHover.mouseover);
			viewEntry.bind('mouseout', myHover.mouseout);
			//viewEntry[0].viewname = viewName;  // FIXME: This is bad practice!
			viewEntry[0].title = viewName;
			viewEntry.appendTo(existingViews);

			me.itemViews[viewName] = viewEntry[0];
		}
	}

	this.updateStaticViewsMenu = function () {

		var views = $("#menubar-mainitem-views");
		
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

			//console.log("MENUBAR");

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
	};

	this.updateStaticViewsMenu();
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
						root.lookup("debug").mutate(root.scope, function (symbol) { symbol.cache.value.jsExceptions = enabled; }, EdenSymbol.hciAgent);
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
			root.lookup("debug").mutate(root.scope, function (symbol) { symbol.cache.value.jsExceptions = enabled; }, EdenSymbol.hciAgent);
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
		if (ismobile) return;
		if (sym.origin && sym.origin !== EdenSymbol.hciAgent) {
			var title = $(".jseden-title").get(0);
			title.contentEditable = true;
			title.textContent = value;
			document.title = value;
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
		if (value) {
			me.element.find(".menusearch").show();
			if (ismobile) me.element.find("#eden-logo").hide();
		} else {
			me.element.find(".menusearch").hide();
			if (ismobile) me.element.find("#eden-logo").show();
		}
	});

	eden.root.lookup("jseden_explorer_enabled").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.maker").show();
		else me.element.find(".menubar-button.maker").hide();
	});

	eden.root.lookup("jseden_menu_visible").addJSObserver("menubar", function(sym, value) {
		if (value) {
			me.element.show();
			$('#jseden-main').removeClass("nomenu");
		} else {
			me.element.hide();
			$('#jseden-main').addClass("nomenu");
		}
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

	eden.root.lookup("jseden_menu_shownotifications").addJSObserver("menubar", function(sym, value) {
		if (value) me.element.find(".menubar-button.notifications").show();
		else me.element.find(".menubar-button.notifications").hide();
	});

	eden.root.lookup("jseden_project_subtitle").addJSObserver("menubar", function(sym, value) {
		//$(".jseden-subtitle").get(0).textContent = value;
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
			sym.assign(!val, eden.root.scope, EdenSymbol.localJSAgent);
		}
	});

	this.element.on("keyup", ".jseden-title", function(e) {
		var sym = eden.root.lookup("jseden_project_title");
		if (!sym.definition) {
			sym.assign(e.currentTarget.textContent, eden.root.scope, EdenSymbol.hciAgent);
		}
	});
}

EdenUI.MenuBar.prototype.hide = function() {
	this.element.hide();
}

EdenUI.MenuBar.prototype.show = function() {
	this.element.show();
}

EdenUI.MenuBar.reset = function() {
	$(".jseden-title").html("CONSTRUIT");
}

EdenUI.MenuBar.saveTitle = function(title) {
	eden.root.lookup("jseden_project_title").assign(title, eden.root.scope, EdenSymbol.jsAgent);
}
