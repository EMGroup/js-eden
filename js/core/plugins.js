/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function () {

	/*Prevent jQuery from cancelling attempts to reposition a dialog so that it isn't fully within
	 * the boundaries of the browser window.
	 */
	//$.extend($.ui.dialog.prototype.options.position, { collision: 'none' });
	
	/**
	 * Helper to return the Symbol for a view property.
	 *
	 * @param {string} viewName
	 * @param {string} propName
	 * @return {Symbol}
	 */
	function view(viewName, propName) {
		return root.lookup("view_"+viewName+"_"+propName);
	}

	/**
	 * Helper to find the dialog using jQuery and return it.
	 *
	 * @param {string} viewName
	 * @return {jQuery} A jQuery object with the dialog element in it.
	 */
	function dialog(viewName) {
		return $("#"+viewName+"-dialog");
	}

	//Dimensions of various UI components.
	EdenUI.prototype.menuBarHeight = 45;
	EdenUI.prototype.dialogBorderWidth = 1;
	EdenUI.prototype.titleBarHeight = 0; //27.75 + EdenUI.prototype.dialogBorderWidth; //41.22 for script view
	EdenUI.prototype.largeTitleBar = 41.22 + EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.scrollBarSize = 14 + EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.scrollBarSize2 = window.innerHeight-$(window).height();
	EdenUI.prototype.dialogFrameWidth = 2 * EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.dialogFrameHeight = EdenUI.prototype.titleBarHeight + EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.bottomBarHeight = 34.906;

	//Configuration options
	//30 pixels seems like a good grid cell width on a display 1920 pixels wide.
	EdenUI.prototype.gridSizeX = Math.floor(window.innerWidth * 30 / 1920);
	EdenUI.prototype.gridSizeY = Math.floor(window.innerHeight * 30 / 1920);
	//Case when a window is moved off to the left of the screen.
	EdenUI.prototype.minimumWindowWidthShowing = 72 + EdenUI.prototype.dialogBorderWidth;


	EdenUI.prototype.createEmbedded = function(name, type) {
		if (this.embeddedInstances[name]) return this.embeddedInstances[name];
		var eview;
		if (edenUI.views[type].embed) eview = edenUI.views[type].embed(name, name, "");
		else if (edenUI.views[type].embedded) eview = edenUI.views[type].embedded(name, name, "");
		if (eview) {
			this.embeddedInstances[name] = eview;
			return eview;
		} else {
			return;
		}
	}

	EdenUI.prototype.createView = function (name, type, creatingAgent) {
		if (this.viewInstances[name]) return this.viewInstances[name];
		var eview;
		if (edenUI.views[type].embed) eview = edenUI.views[type].embed(name, name, name);
		else if (edenUI.views[type].embedded) eview = edenUI.views[type].embedded(name, name, name);
		if (eview) {
			let viewinst = new EdenUI.View(eview);
			this.viewInstances[name] = viewinst;
			return viewinst;
		} else {
			return;
		}
	}

	/**
	 * A view is a window which appears in the JsEden UI.
	 *
	 * This inserts an element for the view window, and also creates observables
	 * and agents that allow for interaction from EDEN.
	 *
	 * Afterwards, the {show,hide}View methods can be used to modify the view.
	 * And the {move,resize}View methods can be used to update a view using the
	 * current values in the view's observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 * @param {string} type Used to group different types of views.
	 */
	/*EdenUI.prototype.createView = function (name, type, creatingAgent) {
		if (!(type in this.views)) {
			this.eden.error(new Error("View type " + type + " is unavailable.  Check that the associated plug-in is loaded."));
			return;
		}
		if ("name" in this.views[type]) {
			// Single instance view type (e.g. error log)
			name = this.views[type].name;
		}


		var me = this;
		var agent = EdenSymbol.defaultAgent;

		var currentType = this.activeDialogs[name];
		var visibilitySym = view(name, "visibility");
		var visibility = visibilitySym.value();
		var titleSym = view(name, "title");
		var title = titleSym.value();

		if (currentType == type) {
			if (visibility != "visible") {
				visibilitySym.assign("visible", root.scope, agent);
			}

			this.brieflyHighlightView(name);
			return this.viewInstances[name];
		}

		this.eden.root.beginAutocalcOff();
		if (currentType !== undefined) {
			if (title == this.views[currentType].title) {
				title = undefined;
			}
			this.destroyView(name, false);
		}

		this.titleBarHeight = (currentType == "ScriptView") ? this.largeTitleBar : this.titleBarHeight;

		var desktopTop = this.menuBarHeight;
		var defaultTitle = this.views[type].title;
		var viewData = this.views[type].dialog(name + "-dialog", defaultTitle);
		if (viewData === undefined) {
			viewData = {};
		}
		this.viewInstances[name] = viewData;
		var position = viewData.position;

		//Create and set behaviour for minimize, maximize and close buttons.
		var collapseOnDblClick = edenUI.getOptionValue("optCollapseToTitleBar");
		var titleBarAction;
		if (collapseOnDblClick == "true") {
			titleBarAction = "collapse";
		} else {
			titleBarAction = "maximize";
		}
		var diag = dialog(name);
		diag.dialog({
			closeOnEscape: false,
			//draggable: true,
			position: {using: function() {}},
			beforeClose: function () {
				if (viewData.closing) {
					viewData.closing = false;
					return true;
				}
				return me.closeView(name);
			},
			focus: function () {
				//Disabled pending fix.
				//me.minimizeObscuredViews(name);
				//diag.dialog("moveToTop");
				//console.log("HAS FOCUS");
			}
		});

		//diag.parent().on("click", function() { diag.dialog("moveToTop"); });

		// Add associated observables...
		function viewobs(obs) { return "view_"+name+"_"+obs; };

		var observables = [
			viewobs("type"),
			viewobs("x"),
			viewobs("y"),
			viewobs("width"),
			viewobs("height"),
			viewobs("lock"),
			viewobs("noborder"),
			viewobs("title"),
			viewobs("visibility")
		];
		diag.get(0).setAttribute("data-observables", observables.join(","));



		var dialogWindow = this.getDialogWindow(name);
		diag.dialogExtend({
			dblclick: titleBarAction,
			minimizable: true,
			maximizable: true,
			beforeMinimize: function (event) {
				$(event.target).parent().removeClass("window-activated");
				//var hide = edenUI.getOptionValue("optHideOnMinimize");
				//if (hide == "true") {
					me.hideView(name);
					return false;
				//} else {
				//	return true;
				//}
			},
			minimize: function () {
				var dialogMin = dialog(name).data('dialog-extend-minimize-controls');
				// dialogExtend sets position: static and top, left, but doesn't need to.
				// override this so we can add position absolute elements into the minimized controls.
				dialogMin.css('position', 'relative');
				dialogMin.css('top', '');
				dialogMin.css('left', '');
			},
			maximize: function (event) {
				var windowElem = dialogWindow[0];
				var contentElem = diag[0];
				windowElem.style.top = desktopTop + "px";
				var height = window.innerHeight - desktopTop - me.scrollBarSize2 - 2 * me.dialogBorderWidth;
				if (edenUI.getOptionValue("optHideOnMinimize") != "true") {
					height = height - me.bottomBarHeight;
				}
				windowElem.style.height = height + "px";
				contentElem.style.height = (height - me.titleBarHeight) + "px";
			},
			restore: function (event) {
				diag.dialog('moveToTop');
				me.brieflyHighlightView(event.target.id.slice(0,-7));
				//The following lines are needed because of bugs in dialogExtend, which might be fixed in the latest version.
				diag.dialog("widget").draggable("option", "containment", [-Number.MAX_VALUE, desktopTop, Number.MAX_VALUE, Number.MAX_VALUE]);
				
			}
		});
		this.activeDialogs[name] = type;
		

		var typeSym = view(name, 'type');
		if (typeSym.value() != type) {
			typeSym.removeJSObserver("changeType");
			typeSym.assign(type, root.scope, EdenSymbol.localJSAgent);
			typeSym.addJSObserver("changeType", function (sym, newType) {
				if (newType !== undefined && root.lookup("views_list").value().indexOf(name) !== -1) {
					me.createView(name, newType);
				}
			});
		}
		var viewListSym = root.lookup("views_list");
		var viewList = viewListSym.value();
		if (Array.isArray(viewList)) {
			if (viewList.indexOf(name) === -1) {
				viewList = viewList.slice();
				viewList.push(name);
				viewListSym.assign(viewList, root.scope, EdenSymbol.localJSAgent);
			}
		} else {
			viewListSym.assign([name], root.scope, EdenSymbol.localJSAgent);
		}

		function updateSize(sym, value) {
			me.resizeView(name);
		}
		function updatePosition(sym, value) {
			me.moveView(name);
		}

		var lockSym = view(name, 'lock');
		var lockval = lockSym.value();
 
		widthSym = view(name, 'width');
		widthSym.addJSObserver("plugins", updateSize);
		if (!widthSym.definition && widthSym.value() === undefined) {
			widthSym.assign(diag.dialog("option", "width") , root.scope, agent);
		}
		var heightSym = view(name, 'height');
		heightSym.addJSObserver("plugins", updateSize);
		if (!heightSym.definition && heightSym.value() === undefined) {
			heightSym.assign(diag.dialog("option", "height") - ((lockval) ? 0 : this.titleBarHeight), root.scope, agent);
		}
		updateSize();
		var topLeft = diag.closest('.ui-dialog').position();
		var xSym = view(name, 'x');
		xSym.addJSObserver("plugins", updatePosition);
		if (!xSym.definition && xSym.value() === undefined) {
			xSym.assign(topLeft.left, root.scope, agent);
		}
		var ySym = view(name, 'y');
		ySym.addJSObserver("plugins", updatePosition);
		if (!ySym.definition && ySym.value() === undefined) {
			ySym.assign(topLeft.top, root.scope, agent);
		}
		updatePosition();

		function updateVisibility(sym, state) {
			var windowState = diag.dialogExtend("state");
			if (state == "hidden") {
				if (windowState != "minimized") {
					me.minimizeView(name);
				}
			} else if (state == "maximized") {
				if (windowState != "maximized") {
					//me.maximizeView(name);
				}
			} else {
				if (!diag.dialog("isOpen") || windowState == "minimized" || windowState == "collapsed") {
					me.showView(name);
				}
			}
		}
		if (visibility != "visible") {
			if (visibility === undefined) {
				visibilitySym.assign("visible", root.scope, agent);
			} else {
				updateVisibility(visibilitySym, visibility);
			}
		}
		visibilitySym.addJSObserver("changeState", updateVisibility);

		var theTitleBarInfo = viewData.titleBarInfo;
		delete viewData.titleBarInfo;
		Object.defineProperty(viewData, "titleBarInfo", {
			get: function () { return theTitleBarInfo; },
			set: function (info) {
				theTitleBarInfo = info;
				var title = titleSym.value();
				if (info !== undefined) {
					title = title + " (" + info + ")";
				}
				diag.dialog("option", "title", title);
			},
			enumerable: true
		});
		//Set the title bar text and allow the construal to change it later.
		function updateTitleBar(symbol, value) {
			var title = value;
			if (viewData.titleBarInfo !== undefined) {
				title = title + " (" + viewData.titleBarInfo + ")";
			}
			diag.dialog("option", "title", title);
			if (edenUI.menu) edenUI.menu.updateViewsMenu();
		}
		titleSym.addJSObserver("updateTitleBar", updateTitleBar);
		if (title === undefined) {
			titleSym.assign(defaultTitle, root.scope, agent);
		} else {
			updateTitleBar(titleSym, title);
		}

		// Lock a dialog
		function updateLock(symbol, state) {
			lockVal = state;
			if (state) {
				diag.siblings('.ui-dialog-titlebar').css("display","none");
				diag.dialog("option", "resizable", false);
				me.resizeView(name);
				//diag.dialog("option", "height", heightSym.value());
				//heightSym.assign(diag.dialog("option", "height") - this.titleBarHeight, root.scope, agent);
			} else {
				diag.siblings('.ui-dialog-titlebar').css("display","block");
				diag.dialog("option", "resizable", true);
				//diag.dialog("option", "height", heightSym.value() - me.titleBarHeight);
				me.resizeView(name);
			}
		}
		lockSym.addJSObserver("changeState",updateLock);
		if (lockval !== undefined) {
			updateLock(lockSym, lockval);
		}

		// Remove the dialog border
		var borderSym = view(name, 'noborder');
		function updateBorder(symbol, state) {
			var style = diag.get(0).parentNode.style;
			if (state) {
				style.border = "none";
				style.boxShadow = "none";
			} else {
				style.border = "1px solid #777";
				style.boxShadow = "0 0 40px #6d8cac";
			}
		}
		borderSym.addJSObserver("changeState",updateBorder);
		var borderval = borderSym.value();
		if (borderval !== undefined) {
			updateBorder(borderSym, borderval);
		}

		// Pin the view on top
		var pinSym = view(name, 'pin');
		function updatePin(symbol, state) {
			if (state) me.pinView(name);
			else me.unpinView(name);
		}
		pinSym.addJSObserver("changeState",updatePin);
		var pinval = pinSym.value();
		if (pinval !== undefined) {
			updatePin(pinSym, pinval);
		} else {
			this.unpinView(name);
		}



		diag.on("dialogresizestop", function (event, ui) {
			diag.previousWidth = undefined;
			diag.momentum = 0;
			diag.resizeExtend = 0;

			var widthSym = view(name, 'width');
			var heightSym = view(name, 'height');



			var root = me.eden.root;
			root.beginAutocalcOff();
			widthSym.assign(ui.size.width, root.scope, EdenSymbol.hciAgent); //  - me.scrollBarSize
			heightSym.assign(ui.size.height - me.titleBarHeight, root.scope, EdenSymbol.hciAgent); //  - me.titleBarHeight + 2 * me.dialogBorderWidth


			root.endAutocalcOff();
		});
		diag.on("dialogdragstop", function (event, ui) {
			var root = me.eden.root;
			root.beginAutocalcOff();
			console.log(ui);
			view(name, 'x').assign(ui.position.left, eden.root.scope, EdenSymbol.hciAgent);
			view(name, 'y').assign(ui.position.top, eden.root.scope, EdenSymbol.hciAgent);
			root.endAutocalcOff();
		});
		diag.on("dialogdragstart", function() {
			if (view(name, 'x').definition || view(name, 'y').definition) return false;
		});
		diag.on("dialogresizestart", function() {
			// TODO This doesn't seem to work!!!
			if (view(name, 'width').definition || view(name, 'height').definition) return false;
		});

		this.eden.root.endAutocalcOff();
		this.emit('createView', [name, type]);

		var nostackSym = view(name, 'nostack');
		if (!nostackSym.value()) diag.get(0).parentNode.className += " ui-front";
		else diag.get(0).parentNode.className += " ui-back";
		return viewData;
	};*/

	/**Simulates clicking a view's close button, prompting the user to confirm their intentions if necessary.
	 *@return {boolean} True if the view's dialog should actually be closed now, or false if we need
	 * to wait for confirmation first.
	 */
	EdenUI.prototype.closeView = function (name) {
		var me = this;
		// TODO If we want to keep this dialog, make it work with latest jquery
		/*if (this.viewInstances[name].confirmClose) {
			this.modalDialog(
				"Window Close Action",
				"<p>Removing this window from the work space will cause any unsaved changes associated with it to be lost.  You may need to reload the construal if you wish to see this window again.</p> \
				<p>Are you sure you want to permanently delete this information?  Or would you prefer to hide the window instead?</p>",
				["Close Forever", "Hide"],
				1, //Suggest hiding the window as the default option.
				function (optNum) {
					if (optNum == 0) {
						me.destroyView(name, true);
						edenUI.eden.root.collectGarbage();
					} else if (optNum == 1) {
						if (me.plugins.MenuBar) {
							me.hideView(name);
						} else {
							me.minimizeView(name);
						}
					}
				}
			);
			return false;
		} else {*/
			this.hideView(name);
			//this.destroyView(name, true);
			edenUI.eden.root.collectGarbage();
			return true;
		//}
	}

	EdenUI.prototype.destroyAllViews = function() {
		for (var v in this.viewInstances) {
			this.destroyView(v, true);
		}
	}

	EdenUI.prototype.destroyView = function (name, forgetObservables) {
		if (!(name in this.viewInstances) || this.viewInstances[name].closing) {
			//View already closed, never existed or already closing.
			return;
		}
		this.viewInstances[name].closing = true;

		if (this.viewInstances[name].destroy) {
			//Call clean-up handler.
			this.viewInstances[name].destroy();
		}
		root.forgetAll("^View_" + name + "_", true, false, true);
		if (forgetObservables) {
			root.forgetAll("^view_" + name + "_", true, false, true);
		} else {
			// We at least need to remove javascript observers!
			root.lookup("view_"+name+"_title").removeJSObserver("updateTitleBar");
		}
		var theDialog = dialog(name);
		theDialog.dialog('destroy');
		theDialog.remove();
		theDialog.html("");
		delete this.activeDialogs[name];
		delete this.viewInstances[name];

		if (forgetObservables) {
			var viewListSym = root.lookup("views_list");
			var viewList = viewListSym.value();
			if (Array.isArray(viewList)) {
				var index = viewList.indexOf(name);
				if (index !== -1) {
					var newViewList;
					if (index == 0) {
						newViewList = viewList.slice(1);
					} else {
						//newViewList = viewList.slice(0, index).concat(viewList.slice(index + 1));
						viewList.splice(index, 1);
						newViewList = viewList;
					}
					viewListSym.assign(newViewList, root.scope, EdenSymbol.hciAgent);
				}
			}
		}
		
		this.emit('destroyView', [name]);
	};

	EdenUI.prototype.getDialogContent = function (name) {
		return dialog(name);
	};

	EdenUI.prototype.getDialogWindow = function (name) {
		return dialog(name).parent();
	};

	/**
	 * Make the window for a view visible.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.showView = function (name) {
		/*var diag = dialog(name);
		diag.dialog('open').dialog('moveToTop');
		var state = diag.dialogExtend("state");
		if (state != "normal" && state != "maximized") {
			diag.dialogExtend('restore');
		}*/
		var view = this.viewInstances[name];
		if (view) view.show();
		return this.activeDialogs[name];
	};

	EdenUI.prototype.updateView = function (name, data) {
		var view = this.viewInstances[name];
		if (view && view.update) {
			view.update(data);
		}
	}

	/**Highlights a view until the stopHighlightingView method is called.
	 * N.B. More than one view can be highlighted simultaneously, but only one can be raised.
	 * @param {string} name The name of the view that should become the currently highlighted view.
	 * @param {boolean} raise Whether or not display the view (if it is not already displayed) and
	 * ensure that it is not obscured by any other views.
	 */
	EdenUI.prototype.highlightView = function (name, raise) {
		if (raise) {
			this.windowHighlighter.highlight(name);
		} else {
			var element = this.getDialogContent(name).data('dialog-extend-minimize-controls') || this.getDialogWindow(name);
			element.addClass("window-highlighted");
		}
	};

	/**Removes the highlighting effect from a view that was previously highlighted.  If the
	 * view no longer highlighted is the raised one then it will no longer be raised and will return
	 * to its original position in the UI.
	 */
	EdenUI.prototype.stopHighlightingView = function (name, wasRaised, show) {
		if (wasRaised) {
			this.windowHighlighter.stopHighlight(name, show);
			if (show) {
				this.getDialogContent(name).dialog("moveToTop");
			}
		} else {
			var element = this.getDialogContent(name).data('dialog-extend-minimize-controls') || this.getDialogWindow(name);
			element.removeClass("window-highlighted");
		}
	};

	/**Momentarily provides a visual cue to direct the user's gaze towards a particular view.
	 * @param {string} name The name of the view to draw attention to.
	 */
	EdenUI.prototype.brieflyHighlightView = function (name) {
		var dialogWindow = this.getDialogWindow(name);
		dialogWindow.addClass("window-activated");
		setTimeout(function () {
			dialogWindow.removeClass("window-activated");
		}, 600);
	}

	/**
	 * Hide the window for a view.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.hideView = function (name) {
		if (!(name in this.viewInstances)) {
			//View has been destroyed or never existed.
			return;
		}
		this.viewInstances[name].closing = true;
		dialog(name).dialog('close');
	};

	/**
	 * Minimize the window for a view.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.minimizeView = function (name) {
		var hide = edenUI.getOptionValue("optHideOnMinimize");
		if (hide == "true") {
			this.hideView(name);
		} else {
			if (!(name in this.viewInstances)) {
				//View has been destroyed or never existed.
				return;
			}
			dialog(name).dialogExtend('minimize');
		}
	};

	/**
	 * Prevents a window from becoming completely obscured by another window by minimizing the first
	 * window so that appears in the minimized windows area instead of hidden behind the other window.
	 *
	 * This method is specific to the jQuery dialog UI implementation.  Other implementations are
	 * not required to implement it.  It should not be called from outside of the jQuery UI implementation.
	 *
	 * @private
	 */
	EdenUI.prototype.minimizeObscuredViews = function (name) {
		if (edenUI.getOptionValue("optHideOnMinimize") == "true") {
			return;
		}
		var diag = dialog(name);
		var diagWindow = diag.closest('.ui-dialog');
		if (diagWindow.is(this.windowHighlighter.lastDialog)) {
			return;
		}
		if (diag.dialogExtend("state") != "normal") {
			return;
		}
		var diagElem = diag.get(0);
		var tolerance = 0;
		var topLeft = diagWindow.position();
		var left = topLeft.left;
		var top = topLeft.top;
		var width = diag.dialog("option", "width") + 2 * EdenUI.prototype.dialogBorderWidth;
		var height = diag.dialog("option", "height") + 2 * EdenUI.prototype.dialogBorderWidth;
		var pinned = diagWindow.hasClass("ui-top");

		var dialogs = $(".ui-dialog-content");
		for (var i = 0; i < dialogs.length; i++) {
			var compareDialog = $(dialogs[i]);
			if (dialogs[i] === diagElem || compareDialog.dialogExtend("state") != "normal") {
				continue;
			}
			var compareWindow = compareDialog.closest('.ui-dialog');
			if (compareWindow.hasClass("ui-front") && !pinned) {
				continue;
			}
			var compareTopLeft = compareWindow.position();
			var compareLeft = compareTopLeft.left;
			var compareTop = compareTopLeft.top;
			var compareWidth = compareDialog.dialog("option", "width") + 2 * EdenUI.prototype.dialogBorderWidth;
			var compareHeight = compareDialog.dialog("option", "height") + 2 * EdenUI.prototype.dialogBorderWidth;
			
			if (compareLeft >= left - tolerance &&
				compareLeft + compareWidth <= left + width + tolerance &&
				compareTop >= top - tolerance &&
				compareTop + compareHeight <= top + height + tolerance
			) {
				compareDialog.dialogExtend('minimize');
			}
		}
	}

	/**
	 * Move the window for a view so that its position matches its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.moveView = function (name) {
		var diag = dialog(name);
		var xSym = view(name, 'x');
		var ySym = view(name, 'y');
		var x = xSym.value();
		var y = ySym.value();
		var realX, realY;
		var minX = this.minimumWindowWidthShowing - diag.dialog("option", "width");
		if (x < minX) {
			realX = minX;
		} else {
			realX = x; //Math.round(x / this.gridSizeX) * this.gridSizeX;
		}
		if (y < 0) {
			realY = 0;
		} else {
			realY = y; //Math.round(y / this.gridSizeY) * this.gridSizeY;
		}
		//xSym.cached_value = realX;
		//ySym.cached_value = realY;
		//if (this.plugins.MenuBar) {
			//realY = realY  + this.menuBarHeight;
		//}

		var p = diag.parent().get(0);
		p.style.left = ""+realX+"px";
		p.style.top = ""+realY+"px"; //.offset({left: realX, top: realY});
	};

	/**
	 * Resize a view so that its size matches its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.resizeView = function (name) {
		var viewData = this.viewInstances[name];
		if (viewData.resizing) {
			return;
		}
		
		var diag = dialog(name);
		var position = diag.parent().position();
		var left = position.left;
		var top = position.top;
		var widthSym = view(name, 'width');
		var newWidth = widthSym.value();
		var heightSym = view(name, 'height');
		var newHeight = heightSym.value() + this.titleBarHeight;
		var locked = view(name, 'lock');
		var tbarheight = (locked) ? 0 : this.titleBarHeight;
		var right = left + newWidth + this.scrollBarSize + this.dialogBorderWidth;
		var bottom = top + newHeight + this.titleBarHeight - 1;
		var xMax = window.innerWidth + document.body.scrollLeft;
		var yMax = window.innerHeight + document.body.scrollTop - this.scrollBarSize2;
		var bottomBarY = yMax - this.bottomBarHeight;			
		var hciName = EdenSymbol.hciAgent.name;
		//Round the width.  For some reason the width set by jquery.ui isn't always aligned to the grid.
		/*var adjustedWidth = Math.round((newWidth + this.scrollBarSize + this.dialogBorderWidth) / this.gridSizeX) * this.gridSizeX - 2 * this.dialogBorderWidth;
		if (widthSym.last_modified_by != hciName) {
			if (adjustedWidth < newWidth + this.scrollBarSize) {
				//...but if the width was set by EDEN code instead of the UI then don't make the window narrower than the width requested.
				adjustedWidth = adjustedWidth + this.gridSizeX;
			}
			if (right <= xMax && left + adjustedWidth + this.dialogBorderWidth > xMax) {
				//...and don't go off of the screen (unless originally requested).
				adjustedWidth = xMax - this.dialogBorderWidth - left;
			}
		}

		//Round the height.  For some reason the height set by jquery.ui isn't always aligned to the grid.
		var adjustedHeight = Math.round((newHeight + tbarheight) / this.gridSizeY) * this.gridSizeY;
		if (heightSym.last_modified_by != hciName) {
			if (adjustedHeight < newHeight + tbarheight) {
				//...but if the height was set by EDEN code instead of the UI then don't make the window shorter than the height requested.
				adjustedHeight = adjustedHeight + this.gridSizeY;
			}
			if (bottom <= bottomBarY && top + adjustedHeight > bottomBarY) {
				// ... and don't go into the minimized windows area (unless originally requested).
				adjustedHeight = bottomBarY - top;
			} else if (bottom <= yMax && top + adjustedHeight > yMax) {
				// ... and don't go off the screen (unless originally requested).
				adjustedHeight = yMax - top;
			}
		} else {
			// When resizing is performed by dragging in the UI:
			if (top + adjustedHeight > bottomBarY && top + adjustedHeight < yMax) {
				//Snap to align with the minimized windows area.
				adjustedHeight = bottomBarY - top;
			} else if (top + adjustedHeight > yMax) {
				//Snap to align with the bottom of the browser window.
				adjustedHeight = yMax - top;
			}
		}*/

		//diag.dialog("option", "width", adjustedWidth);
		//diag.dialog("option", "height", adjustedHeight);
		if (widthSym.origin !== EdenSymbol.hciAgent) diag.dialog("option", "width", newWidth);
		if (heightSym.origin !== EdenSymbol.hciAgent) diag.dialog("option", "height", newHeight);
		//No idea why the following line is needed but it makes things work smoother when the window is positioned more than the value of the CSS height of the body element down the page.
		//diag.parent().offset({top: top - document.body.scrollTop});

		//newWidth = adjustedWidth - this.scrollBarSize;
		//newHeight = adjustedHeight - tbarheight;

		//viewData.resizing = true;
		/*this.eden.root.beginAutocalcOff();
		if (widthSym.definition === undefined) {
			widthSym.assign(newWidth, eden.root.scope, Symbol.hciAgent);
		}
		if (heightSym.definition === undefined) {
			heightSym.assign(newHeight, eden.root.scope, Symbol.hciAgent);
		}
		this.eden.root.endAutocalcOff();

		viewData.resizing = false;*/
		if ("resize" in viewData) {
			viewData.resize(newWidth, newHeight);
		}
	};

	/**Makes the view less likely to be obscured by other views/other page content.
	 * @param {string} name The view's name.
	 */
	EdenUI.prototype.pinView = function (name) {
		var dialogWindow = this.getDialogWindow(name);
		dialogWindow.removeClass("ui-front");
		dialogWindow.addClass("ui-top");
		this.viewInstances[name].pinned = true;
	};

	/**Reduce a view's importance to the same status as other windows.
	 * @param {string} name The view's name.
	 */
	EdenUI.prototype.unpinView = function (name) {
		var dialogWindow = this.getDialogWindow(name);
		if (this.viewInstances[name].pinned) {
			dialogWindow.removeClass("ui-top");
			dialogWindow.get(0).style.zIndex = 9999;
			dialogWindow.addClass("ui-front");
			this.viewInstances[name].pinned = false;
			this.windowHighlighter.unpin(dialogWindow);
		}
	};

	EdenUI.prototype.newProject = function () {
		this.eden.reset();
		this.destroyView("jspe", true);
		if ("Canvas2D" in this.plugins) {
			this.eden.executeEden('createCanvas("picture");', "new project", "", EdenSymbol.hciAgent, noop);
		}
		if ("ScriptInput" in this.plugins) {
			this.eden.executeEden('createView("input", "ScriptInput");', "new project", "", EdenSymbol.hciAgent, noop);
		}
		if (this.views.ErrorLog.errorWindow) {
			this.views.ErrorLog.errorWindow.html('');
		}
		Eden.Agent.removeAll();
	}

	/**Creates a modal dialogue box that permits the user to choose from a small number of fixed
	 * options.  The user must choose an option before they can have any other interaction
	 * with JS-EDEN.
	 * @param {string} title The text to go in the window's title bar.
	 * @param {string} message The text to display as a prompt message.  Can include HTML.
	 * @param {Array} options An array of strings.  Each one provides the text used to create a
	 * button at the foot of the dialogue box.
	 * @param {Number} defaultOptionNum The number of the option that should be taken if the user
	 * presses the enter or space key. (Can use the tab key to select a different option.)
	 * @param {function} callback A function to call once the user has clicked a button.  The
	 * function should have a single integer parameter.  If n options are provided then the function
	 * will be invoked with a value between 0 and n inclusive.  Values 0 through n-1 correspond to
	 * the options provided in the options argument.  n means that the user has clicked "Cancel",
	 * which is an option that is always provided, regardless of the contents of the options array.
	 */
	EdenUI.prototype.modalDialog = function (title, message, options, defaultOptionNum, callback) {
		var dialog = $('<div id="modal"></div>');
		
		var callCallback = function (i) {
			return function (event) {
				dialog.dialog("destroy");
				dialog.remove();
				callback(i);
			};
		};
		
		var text = $('<div>' + message + '</div>');
		dialog.append(text);
		
		var buttons = [];
		for (var i = 0; i < options.length; i++) {
			var button = {
				text: options[i],
				click: callCallback(i)
			};
			buttons.push(button);
		}
		var cancelValue = options.length;
		var cancelButton = {
			text: "Cancel",
			click: callCallback(cancelValue)
		};
		buttons.push(cancelButton);
		
		dialog.dialog({
			buttons: buttons,
			modal: true,
			resizable: false,
			show: "fade",
			title: title,
			close: function () {
				callback(cancelValue);
			},
			open: function () {
				$(this).parent().find("button")[defaultOptionNum].focus();				
			},
			width: 375
		})
		$(".ui-widget-overlay").css("z-index", 10001);
		dialog.parent().css("z-index", 10002);
	}

}());
