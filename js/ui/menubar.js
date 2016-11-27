EdenUI.MenuBar = function() {
	var pinnedIcon = "images/pin.png";
	var notPinnedIcon = "images/pin-greyed.png";
	var me = this;
	this.itemViews = {};

	eden.execute2("_views_number_created = 0;", "*Default");

	// The menu bar, title and buttons...
	this.element = $('<div id="menubar-main"><div id="eden-logo"></div><div contenteditable class="jseden-title" title="Rename project">Construit!</div>'+((!mobilecheck()) ? '<div class="jseden-subtitle">by Some Author</div><div id="menubar-login"><span class="icon">&#xf05e;</span>Not Connected</div><div class="menubar-buttons"><div class="menubar-button enabled share" data-obs="menu_new_scriptview" title="Save or share">&#xf1e0;</div><div class="menubar-button enabled main" data-obs="views" title="Create Views">&#xf067;<div id="menubar-mainitem-views" class="menubar-menu"></div></div><div class="menubar-button enabled main" data-obs="existing" title="Existing">&#xf2d2;<div id="menubar-mainitem-existing" class="menubar-menu"></div></div><div class="menubar-button enabled main" data-obs="options" title="Options">&#xf013;<div id="menubar-mainitem-options" class="menubar-menu"></div></div><div class="menubar-button enabled main" data-obs="help" title="Help">&#xf128;<div id="menubar-mainitem-help" class="menubar-menu"></div></div><div class="menubar-button enabled main notifications" data-obs="notifications">&#xf0f3;<span class="menubar-notification-jewel"></span><div id="menubar-mainitem-notifications" class="menubar-menu"></div></div></div><div class="searchouter menusearch"><input type="text" class="search menusearch" placeholder="Search..."></input></div>' : '<div class="menubar-mobilebuttons"><button class="scriptview-button enabled mobilemore">&#xf078;</button></div>')+'</div>');
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
			var obscurer = $('<div id=\"menubar-obscurer\" class=\"login-subdialog modal\" style=\"display: block;\"></div>');
			obscurer.html("<div class=\"modal-content\" style=\"width: 290px;\"><div class=\"menubar-sharebox-title\"><span class=\"menubar-shareicon\">&#xf090;</span>Login</div><iframe frameborder=\"0\" name=\"logintarget\" width=\"250\" height=\"200\" class=\"menubar-login-iframe\"></iframe><br/><button class=\"jseden button-cancel\">Cancel</button></div>");
			$(document.body).append(obscurer);
			obscurer.on("click", ".button-cancel", function() {
				obscurer.remove();
			});
		} else if (Eden.DB.isConnected() && Eden.DB.isLoggedIn()) {
			
		}
	});

	this.sharebox = $('<div class="modal"><div class="modal-content" style="width: 400px;"><div class="menubar-sharebox-title"><span class="menubar-shareicon">&#xf1e0;</span>Save and Share</div><div class="menubar-sharebox-content"><div id="projectoptions"></div><div id="projectuploadbox"></div><br/><br/>Download to file: <span class="downloadurl"></span><br/><br><button class="jseden done" style="margin-top: 20px;">Finished</button></div></div></div>');
	this.element.append(this.sharebox);
	this.sharebox.hide();
	var projectoptions = this.sharebox.find("#projectoptions");
	projectoptions.html('<h3>Tags</h3><div>Add tags to your project:<div class=\"projecttags\" contenteditable></div></div><h3>Thumbnail</h3><div><input class="thumbnailtype" type="radio" name="thumbnail" value="auto" checked>Default</input><input class="thumbnailtype" type="radio" name="thumbnail" value="canvas">Canvas</input><input class="thumbnailtype" type="radio" name="thumbnail" value="manual">File</input><div id="projectthumb"></div></div><h3>Description</h3><div><textarea></textarea></div>');
	projectoptions.accordion({
		collapsible: true,
		heightStyle: "content",
		classes: {
			"ui-accordian-header": "ui-corner-top sharebox-header",
			"ui-accordian-header-collapsed": "ui-corner-all sharebox-header-collapsed"
		}
	});
	var thumb = projectoptions.find("#projectthumb");
	var thumbdata;
	var thumbimg = $("<img></img>");
	thumb.append(thumbimg);

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

	this.sharebox.on("click",".done",function() {
		me.sharebox.hide();
	});

	this.sharebox.on("change",".thumbnailtype", function(e) {
		var ttype = e.currentTarget.value;
		if (ttype == "manual") {
			thumb.html("");
			var thumbinput = $('<input type="file"></input>');
			thumb.append(thumbinput);
			thumbinput.change(function() {
				thumb.html("");
				var fileinput = thumbinput.get(0);
				var file = fileinput.files[0];
				var reader = new FileReader();
				reader.onload = function(e) {
					//Eden.loadFromString(e.target.result);
					var tcanvas = document.createElement("canvas");
					tcanvas.setAttribute("width","200");
					tcanvas.setAttribute("height","112");
					var ctx = tcanvas.getContext("2d");
					var img = new Image();
					img.src = e.target.result;


					var imgwidth = img.width;
					var imgheight = img.height;
					var canwidth = 200;
					var canheight = 112;

					var imageAspectRatio = imgwidth / imgheight;
					var canvasAspectRatio = canwidth / canheight;
					var renderableHeight, renderableWidth, xStart, yStart;

					// If image's aspect ratio is less than canvas's we fit on height
					// and place the image centrally along width
					if(imageAspectRatio < canvasAspectRatio) {
						renderableHeight = canheight;
						renderableWidth = imgwidth * (renderableHeight / imgheight);
						xStart = (canwidth - renderableWidth) / 2;
						yStart = 0;
					}

					// If image's aspect ratio is greater than canvas's we fit on width
					// and place the image centrally along height
					else if(imageAspectRatio > canvasAspectRatio) {
						renderableWidth = canwidth
						renderableHeight = imgheight * (renderableWidth / imgwidth);
						xStart = 0;
						yStart = (canheight - renderableHeight) / 2;
					}

					// Happy path - keep aspect ratio
					else {
						renderableHeight = canheight;
						renderableWidth = canwidth;
						xStart = 0;
						yStart = 0;
					}

					ctx.drawImage(img, xStart, yStart, renderableWidth, renderableHeight);
					var png = tcanvas.toDataURL("image/png");
					thumbdata = png;
					var thumbimg = $("<img></img>");
					thumb.append(thumbimg);
					thumbimg.get(0).src = png;
				};
				reader.readAsDataURL(file);
			});
		} else if (ttype == "canvas") {
			thumb.html("");
			thumbdata = undefined;
		} else if (ttype == "auto") {
			thumb.html("");
			var thumbimg = $("<img></img>");
			thumb.append(thumbimg);
			// Generate the default thumbnail...
			edenUI.plugins.Canvas2D.thumbnail(function(png) {
				thumbdata = png;
				thumbimg.get(0).src = png;
			});
		}
	});

	function updateTags() {
		var tagbox = me.sharebox.find(".projecttags");

		var tagstr = tagbox.get(0).textContent;

		tags = tagstr.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
		/*for (var i=0; i<tags.length; i++) {
			if (tags[i].charAt(0) != "#") tags[i] = "#" + tags[i];
		}*/

		if (tags && tags.length > 0) {
			var taghtml = "";
			for (var i=0; i<tags.length; i++) {
				taghtml += "<span class=\"project-tag\">" + tags[i] + "</span>";
				if (i < tags.length-1) taghtml += " ";
			}
			tagbox.html(taghtml);
		}
	}

	this.sharebox.on("keydown",".projecttags",function(e) { if (e.keyCode == 32) {
		var tagbox = me.sharebox.find(".projecttags").get(0);

		var spacer = document.createTextNode(" ");
		tagbox.appendChild(spacer);
		var newElement = document.createElement('span');
		newElement.className = "project-tag";
		newElement.innerHTML = "&#8203;";
		tagbox.appendChild(newElement);

		var range = document.createRange();
		var sel = window.getSelection();
		//var currange = sel.getRangeAt(0);
		//var element = currange.startContainer();
		range.selectNodeContents(newElement);
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);

		e.preventDefault();
	} });
	this.sharebox.on("blur",".projecttags",updateTags);

	this.sharebox.on("click",".upload", function(e) {
		var title = me.element.find(".jseden-title").get(0).textContent;
		var tagbox = me.sharebox.find(".projecttags");
		var tagstr = tagbox.get(0).textContent;
		tagstr = tagstr.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");

		me.sharebox.find("#projectuploadbox").html('<br/><br/>Saved to your projects and shared at:<div class="projecturl">Saving...</div>');
		Eden.Agent.uploadAll(function() {
			Eden.DB.save(title, function(status) {
				if (status.path) {
					var url = "?load="+status.path+"&tag="+status.saveID;
					me.sharebox.find(".projecturl").html(window.location.href+url);
					//function selectElementContents(el) {
					var range = document.createRange();
					range.selectNodeContents(me.sharebox.find(".projecturl").get(0));
					var sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					//}
				} else {
					me.sharebox.find(".projecturl").html('<b>Save failed</b>, not logged in.');
				}
			}, {thumb: thumbdata, tags: tagstr});
		});
	});

	this.sharebox.on("click",".publish", function(e) {
		var title = me.element.find(".jseden-title").get(0).textContent;
		var tagbox = me.sharebox.find(".projecttags");
		var tagstr = tagbox.get(0).textContent;
		tagstr = tagstr.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");

		me.sharebox.find("#projectuploadbox").html('<br/><br/>Saved to your projects and shared at:<div class="projecturl">Saving...</div>');
		Eden.Agent.publishAll(function() {
			Eden.DB.save(title, function(status) {
				if (status.path) {
					var url = "?load="+status.path+"&tag="+status.saveID;
					me.sharebox.find(".projecturl").html(window.location.href+url);
					//function selectElementContents(el) {
					var range = document.createRange();
					range.selectNodeContents(me.sharebox.find(".projecturl").get(0));
					var sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					//}
				} else {
					me.sharebox.find(".projecturl").html('<b>Save failed</b>, not logged in.');
				}
			}, {publish: true, thumb: thumbdata, tags: tagstr});
		});
	});

	this.element.on("click", ".menubar-button.share", function(e) {
		var title = me.element.find(".jseden-title").get(0).textContent;

		if (Eden.DB.isLoggedIn()) {
			me.sharebox.find("#projectuploadbox").html('<button class="sharebox-button upload">Upload</button><button class="sharebox-button publish" style="margin-top: 20px;">Publish</button>');
		} else {
			me.sharebox.find("#projectuploadbox").html('');
		}
		me.sharebox.show();

		// Generate the default thumbnail...
		edenUI.plugins.Canvas2D.thumbnail(function(png) {
			thumbimg.get(0).src = png;
			thumbdata = png;
		});

		//Saved to your projects and shared at:<div class="projecturl"></div>

		var tags;

		if (tags === undefined || tags.length == 0) {
			tags = title.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
			//console.log(tags);
			//for (var i=0; i<tags.length; i++) tags[i] = "#" + tags[i];
			//Eden.DB.meta[status.path].tags = tags;
			if (Eden.DB.isLoggedIn()) {
				var nametags = Eden.DB.username.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
				tags.push.apply(tags,nametags);
			}
		}

		if (tags && tags.length > 0) {
			var taghtml = "";
			for (var i=0; i<tags.length; i++) {
				taghtml += "<span class=\"project-tag\">" + tags[i] + "</span>";
				if (i < tags.length-1) taghtml += " ";
			}
			me.sharebox.find(".projecttags").html(taghtml);
		}

		me.projectsource = Eden.DB.generateSource(title);
		var source = "data:application/octet-stream," + encodeURIComponent(me.projectsource);
		me.sharebox.find(".downloadurl").html('<a href="'+source+'" download="'+title+'.js-e">'+title+'.js-e</a>');
	});

	var menuShowing = false;

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
		menuShowing = true;
	}

	$(document.body).on('mousedown', function () {
		hideMenu();
	});


	this.element.on("mousedown", ".menubar-button.main", function (e) {
		var name = e.currentTarget.getAttribute("data-obs");
		if (menuShowing) {
			if (e.target === this) {
				hideMenu();
			}
		} else {
			hideMenu();
			showMenu(name);
		}
		e.stopPropagation();
	});
	this.element.on("mouseenter", ".menubar-button.main", function(e) {
		var name = e.currentTarget.getAttribute("data-obs");
		if (menuShowing) {
			hideMenu();
			showMenu(name);
		}
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
		$(".jseden-title").get(0).textContent = value;
		try {
			if (window.localStorage) {
				window.localStorage.setItem("title", value);
			}
		} catch(e) {

		}
	});

	eden.root.lookup("jseden_project_subtitle").addJSObserver("menubar", function(sym, value) {
		$(".jseden-subtitle").get(0).textContent = value;
	});

	this.notifications = new EdenUI.Notifications(this.element.find("#menubar-mainitem-notifications"), this.element.find(".menubar-notification-jewel"));
	this.element.on("click",".notifications", function(e) {
		me.notifications.clearCount();
	});
}

EdenUI.MenuBar.reset = function() {
	$(".jseden-title").html("Construit!");
}

EdenUI.MenuBar.saveTitle = function(title) {
	eden.root.lookup("jseden_project_title").assign(title, eden.root.scope, Symbol.jsAgent);
}
