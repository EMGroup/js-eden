/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function () {
	//Prevent jQuery from cancelling attempts to reposition a dialog so that it isn't fully within the boundaries of the window.
	$.extend($.ui.dialog.prototype.options.position, { collision: 'none' });
	
	/**
	 * Helper to return the Symbol for a view property.
	 *
	 * @param {string} viewName
	 * @param {string} propName
	 * @return {Symbol}
	 */
	function view(viewName, propName) {
		return root.lookup("_view_"+viewName+"_"+propName);
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
	EdenUI.prototype.menuBarHeight = 30;
	EdenUI.prototype.dialogBorderWidth = 3.133;
	EdenUI.prototype.titleBarHeight = 33.6563 + EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.scrollBarYSize = 17;
	EdenUI.prototype.dialogFrameWidth = EdenUI.prototype.scrollBarYSize + 2 * EdenUI.prototype.dialogBorderWidth;
	EdenUI.prototype.dialogFrameHeight = EdenUI.prototype.titleBarHeight;

	/**
	 * Stores plugins that can be loaded. Plugins will modify this directly in
	 * order for them to be loaded later.
	 */
	EdenUI.plugins = {};

	/**
	 * Load a plugin if it is not already loaded. The plugin must have been
	 * registered first.
	 *
	 * @param {string} name Name of the plugin to load.
	 * @param {function()?} success
	 */
	EdenUI.prototype.loadPlugin = function (name, agent, success) {
		if (arguments.length === 2) {
			success = agent;
			agent = {name: '/loadPlugin'};
		}

		var me = this;
		var wrappedSuccess = function () {
			me.emit('loadPlugin', [name]);
			success && success.call(agent);
		}

		if (this.plugins[name] === undefined) {
			this.plugins[name] = new EdenUI.plugins[name](this, wrappedSuccess);
		} else {
			wrappedSuccess();
		}
	};

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
	 * @param {*} initData Data passed to the plug-in's createDialog function and ascribed meaning
	 * by the particular plug-in. (optional)
	 */
	EdenUI.prototype.createView = function (name, type, initData) {
		if (!(type in this.views)) {
			this.eden.error(new Error("View type " + type + " is unavailable.  Check that the associated plug-in is loaded."));
			return;
		}
		if ("name" in this.views[type]) {
			// Single instance view type (e.g. error log)
			name = this.views[type].name;
		}
		
		if (this.activeDialogs[name] !== undefined) {
			this.showView(name);
			return this.viewInstances[name];
		}
		var me = this;
		var agent = root.lookup("createView");
		var desktopTop = this.plugins.MenuBar? this.menuBarHeight : 0;
		var title = this.views[type].title;
		var viewData = this.views[type].dialog(name + "-dialog", title, initData);
		$("#windowsArea").freetile();
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
/*		dialog(name)
		.dialog({
			beforeClose: function () {
				if (viewData.closing) {
					viewData.closing = false;
					return true;
				}
				return me.closeView(name);
			}
		})
		.dialogExtend({
			dblclick: titleBarAction,
			minimizable: true,
			maximizable: true,
			beforeMinimize: function () {
				var hide = edenUI.getOptionValue("optHideOnMinimize");
				if (hide == "true") {
					me.hideView(name);
					return false;
				} else {
					return true;
				}
			},
			minimize: function () {
				var dialogMin = dialog(name).data('dialog-extend-minimize-controls');
				// dialogExtend sets position: static and top, left, but doesn't need to.
				// override this so we can add position absolute elements into the minimized controls.
				dialogMin.css('position', 'relative');
				dialogMin.css('top', '');
				dialogMin.css('left', '');
			},
			restore: function (event) {
				$(event.target).dialog('moveToTop');
			}
		});*/
		this.activeDialogs[name] = type;
		this.emit('createView', [name, type]);
		var diag = dialog(name);
		var $aHandle = $("<div class='tileHandle'>" + title + "<span class=\"closeTile\"><span class=\"ui-icon ui-icon-closethick\"></span></span><span class=\"maximiseTile\"><span class=\"ui-icon ui-icon-extlink\"></span></span><span class=\"minimiseTile\"><span class=\"ui-icon ui-icon-minus\"></span></span></div>");
		
		diag.prepend($aHandle);
		diag.draggable({handle: ".tileHandle", stop: function(ev,ui){
			diag.trigger("tiledragstop",ev,ui);
		}}).resizable({stop: function(ev,ui){
			diag.trigger("tileresizestop",ev,ui);
		}});
		
		diag.find(".closeTile").click(function(){
			me.closeView(name);
		});
		
		/* Initialize observables
		 * _view_xxx_width and _view_xxx_height are the width and height respectively of the usable
		 * client window area.  They don't include the space reserved for the title bar, scroll bars
		 * and resizing widget.  The actual size of the window with these elements included is
		 * bigger than the dimensions described these observables.  Thus:
		 *   _view_b_x = _view_a_x + _view_a_width;
		 * will position the windows with a slight overlap, though no information will be hidden.
		 */
		view(name, 'width').assign(diag.width() - this.scrollBarYSize, agent);
		view(name, 'height').assign(diag.height() - this.titleBarHeight, agent);
		var topLeft = diag.offset();
		view(name, 'x').assign(topLeft.left, agent);
		view(name, 'y').assign(topLeft.top - desktopTop, agent);

		//Set the title bar text and allow the construal to change it later.
		var titleSym = view(name, "title");
		titleSym.addJSObserver("updateTitleBar", function (symbol, value) {
//			diag.dialog("option", "title", value);
			
			me.plugins.MenuBar.updateViewsMenu();
		});
		titleSym.assign(title, agent);

		//Allow mouse drags that position the dialog partially outside of the browser window but not over the menu bar.
		//diag.dialog("widget").draggable("option", "containment", [-Number.MAX_VALUE, desktopTop, Number.MAX_VALUE, Number.MAX_VALUE]);
		diag.on("dialogresize", function (event, ui) {
			var provisionalTop = ui.position.top;
			if (provisionalTop < desktopTop) {
				ui.size.height = ui.size.height - (desktopTop - provisionalTop);
				ui.position.top = desktopTop;
			}
		});

		diag.on("dialogresizestop", function (event, ui) {
			var root = me.eden.root;
			var autocalcSym = root.lookup("autocalc");
			var autocalcOnEntry = autocalcSym.value();
			if (autocalcOnEntry) {
				autocalcSym.assign(0, Symbol.hciAgent);
			}
			view(name, 'width').assign(ui.size.width - me.scrollBarYSize, Symbol.hciAgent);
			view(name, 'height').assign(ui.size.height - me.titleBarHeight + 6, Symbol.hciAgent);

			var xSym = view(name, "x");
			if (xSym.value() != ui.position.left) {
				xSym.assign(ui.position.left, Symbol.hciAgent);
			}
			var ySym = view(name, "y");
			var possibleNewY = ui.position.top - desktopTop;
			if (ySym.value() != possibleNewY) {
				ySym.assign(possibleNewY, Symbol.hciAgent);
			}

			if (autocalcOnEntry) {
				autocalcSym.assign(1, Symbol.hciAgent);
			}
		});
		
		diag.on("tileresizestop", function (event, ui) {
			var root = me.eden.root;
			var autocalcSym = root.lookup("autocalc");
			var autocalcOnEntry = autocalcSym.value();
			if (autocalcOnEntry) {
				autocalcSym.assign(0, Symbol.hciAgent);
			}
			view(name, 'width').assign($(event.target).width() - me.scrollBarYSize, Symbol.hciAgent);
			view(name, 'height').assign($(event.target).height() - me.titleBarHeight + 6, Symbol.hciAgent);

			var xSym = view(name, "x");
			if (xSym.value() != $(event.target).offset().left) {
				xSym.assign($(event.target).offset().left, Symbol.hciAgent);
			}
			var ySym = view(name, "y");
			var possibleNewY = $(event.target).offset().top - desktopTop;
			if (ySym.value() != possibleNewY) {
				ySym.assign(possibleNewY, Symbol.hciAgent);
			}

			if (autocalcOnEntry) {
				autocalcSym.assign(1, Symbol.hciAgent);
			}
		});

		diag.on("tiledragstop", function(event){
			var root = me.eden.root;
			var autocalcSym = root.lookup("autocalc");
			var autocalcOnEntry = autocalcSym.value();
			if (autocalcOnEntry) {
				autocalcSym.assign(0, Symbol.hciAgent);
			}
			view(name, 'x').assign($(event.target).offset().left, Symbol.hciAgent);
			view(name, 'y').assign($(event.target).offset().top - desktopTop, Symbol.hciAgent);
			if (autocalcOnEntry) {
				autocalcSym.assign(1, Symbol.hciAgent);
			}
		});
		diag.on("dialogdragstop", function (event, ui) {
			var root = me.eden.root;
			var autocalcSym = root.lookup("autocalc");
			var autocalcOnEntry = autocalcSym.value();
			if (autocalcOnEntry) {
				autocalcSym.assign(0, Symbol.hciAgent);
			}
			view(name, 'x').assign(ui.position.left, Symbol.hciAgent);
			view(name, 'y').assign(ui.position.top - desktopTop, Symbol.hciAgent);
			if (autocalcOnEntry) {
				autocalcSym.assign(1, Symbol.hciAgent);
			}
		});


		function viewEdenCode() {
			var code = 'proc _View_'+name+'_position : _view_'+name+'_x, _view_'+name+'_y {\n' +
					'${{ edenUI.moveView("'+name+'"); }}$;\n'+
				'};\n' +
				'proc _View_'+name+'_size : _view_'+name+'_width,_view_'+name+'_height {\n' +
					'${{ edenUI.resizeView("'+name+'"); }}$; \n' +
				'}; \
				if (_view_list == @) { _view_list = []; } \
				append _view_list, "'+name+'";';

			if (position) {
				code += '_view_'+name+'_position = [\"'+position.join('\", \"')+'\"];\n';
			}

			return code;
		}
		// Now construct eden agents and observables for dialog control.
		this.eden.execute(viewEdenCode());
		return viewData;
	};

	/**Simulates clicking a view's close button, prompting the user to confirm their intentions if necessary.
	 *@return {boolean} True if the view's dialog should actually be closed now, or false if we need
	 * to wait for confirmation first.
	 */
	EdenUI.prototype.closeView = function (name) {
		var me = this;
		if (this.viewInstances[name].confirmClose) {
			this.modalDialog(
				"Window Close Action",
				"<p>Removing this window from the work space will cause any unsaved changes associated with it to be lost.  You may need to reload the construal if you wish to see this window again.</p> \
				<p>Are you sure you want to permanently delete this information?  Or would you prefer to hide the window instead?</p>",
				["Close Forever", "Hide"],
				1, //Suggest hiding the window as the default option.
				function (optNum) {
					if (optNum == 0) {
						me.destroyView(name);
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
		} else {
			this.destroyView(name);
			return true;
		}
	}

	EdenUI.prototype.destroyView = function (name) {
		if (!(name in this.viewInstances)) {
			//View already closed or never existed.
			return;
		}
		this.viewInstances[name].closing = true;
		if (this.viewInstances[name].destroy) {
			//Call clean-up handler.
			this.viewInstances[name].destroy();
		}
		var theDialog = dialog(name);
		console.log("Trying to delete ");
		console.log(theDialog);
		theDialog.remove();
		theDialog.html("");
		delete this.activeDialogs[name];
		delete this.viewInstances[name];
		root.lookup("forgetAll").definition(root)("^_[vV]iew_" + name + "_", true, false, true);
		
		var viewListSym = root.lookup("_view_list");
		var viewList = viewListSym.value();
		if (Array.isArray(viewList)) {
			var index = viewList.indexOf(name);
			var newViewList;
			if (index == 0) {
				newViewList = viewList.slice(1);
			} else {
				newViewList = viewList.slice(0, index).concat(viewList.slice(index + 1));
			}
			viewListSym.assign(newViewList);
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
//		dialog(name).dialog('open').dialog('moveToTop').dialogExtend('restore');
		return this.activeDialogs[name];
	};

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
			dialog(name).dialogExtend('minimize');
		}
	};

	/**
	 * Move the window for a view base on its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.moveView = function (name) {
		var x = view(name, 'x').value();
		var y = view(name, 'y').value();
		if (this.plugins.MenuBar) {
			y = y  + this.menuBarHeight;
		}
//		dialog(name).parent().offset({left: x, top: y});
	};

	/**
	 * Resize the window for a view to base on its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.resizeView = function (name) {
		console.log("Resized");
		var diag = dialog(name);
		
		var oldWidth = diag.width();
		var oldHeight = diag.height();
		var newWidth = view(name, 'width').value();
		var newHeight = view(name, 'height').value();
		var resized = false;

		if (newWidth != oldWidth) {
//			diag.dialog("option", "width", newWidth + this.scrollBarYSize);
			resized = true;
		}

		if (newHeight != oldHeight) {
	//		diag.dialog("option", "height", newHeight + this.titleBarHeight);
			resized = true;
		}

		if (resized) {
			var viewData = this.viewInstances[name];
			if ("resize" in viewData) {
				viewData.resize(newWidth, newHeight);
			}
		}
	};

	/**Creates a modal dialogue box that permits the user to choose from a small number of fixed
	 * options.  The user cannot must choose an option before they can have any other interaction
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
			title: title,
			close: function () {
				callback(cancelValue);
			},
			open: function () {
				$(this).parent().find("button")[defaultOptionNum].focus();				
			}
		});
	}

}());
