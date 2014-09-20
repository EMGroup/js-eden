/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function () {
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
	EdenUI.prototype.loadPlugin = function (name, success) {
		if (this.plugins[name] === undefined) {
			this.plugins[name] = new EdenUI.plugins[name](this, function () { success && success(); });

			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.updatePluginsMenu();
			}
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
	 */
	EdenUI.prototype.createView = function (name, type) {
		if (this.activeDialogs[name] !== undefined) {
			this.showView(name);
			return;
		}

		this.views[type].dialog(name+"-dialog", this.views[type].title+" ["+name+"]");
		this.activeDialogs[name] = type;
		if (this.plugins.MenuBar) {
			this.plugins.MenuBar.updateViewsMenu();
		}

		var diag = dialog(name);
		view(name, 'width').assign(diag.dialog("option", "width"));
		view(name, 'height').assign(diag.dialog("option", "height"));

		diag.on("dialogresizestop", function (event, ui) {
			view(name, 'width').assign(ui.size.width);
			view(name, 'height').assign(ui.size.height);
		});

		// Now construct eden agents and observables for dialog control.
		this.eden.execute("proc _View_"+name+"_position : _view_"+name+"_x,_view_"+name+"_y { ${{ edenUI.moveView(\""+name+"\"); }}$; };", function () {
			this.eden.execute("proc _View_"+name+"_size : _view_"+name+"_width,_view_"+name+"_height { ${{ edenUI.resizeView(\""+name+"\"); }}$; };");
		});
	};

	/**
	 * Make the window for a view visible.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.showView = function (name) {
		dialog(name).dialog('open');
	};

	/**
	 * Hide the window for a view.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.hideView = function (name) {
		dialog(name).dialog('close');
	};

	/**
	 * Move the window for a view base on its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.moveView = function (name) {
		var x = view(name, 'x').value();
		var y = view(name, 'y').value();
		dialog(name).dialog("option", "position", [x, y]);
	};

	/**
	 * Resize the window for a view to base on its EDEN observables.
	 *
	 * @param {string} name Unique identifier for the view.
	 */
	EdenUI.prototype.resizeView = function (name) {
		var newwidth = view(name, 'width').value();
		var newheight = view(name, 'height').value();
		var diag = dialog(name);
		var oldwidth = diag.dialog("option", "width");
		var oldheight = diag.dialog("option", "height");

		if (newwidth - oldwidth !== 0) {
			diag.dialog("option", "width", newwidth);
		}
		if (newheight - oldheight !== 0) {
			diag.dialog("option", "height", newheight);
		}
	};
}());
