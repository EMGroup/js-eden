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
	 * @return {Symbol} return a Symbol
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
		return $("#"+dialogName+"-dialog");
	}

	/*
	 * Stores plugins that can be loaded. Plugins will modify this directly in
	 * order for them to be loaded later.
	 */
	Eden.plugins = {};

	/**
	 * Load a plugin if it is not already loaded. The plugin must have been
	 * registered first.
	 *
	 * @param {string} name - Name of the plugin to load.
	 */
	Eden.prototype.loadPlugin = function (name) {
		if (this.plugins === undefined) {
			this.plugins = {};
		}
		if (this.views === undefined) {
			this.views = {};
		}

		if (this.plugins[name] === undefined) {
			this.plugins[name] = new Eden.plugins[name](this);

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
	 * @param {string} name - unique identifier for the view.
	 * @param {string} type - used to group different types of views.
	 */
	Eden.prototype.createView = function (name, type) {
		if (this.active_dialogs === undefined) {
			this.active_dialogs = {};
		}

		if (this.active_dialogs[name] !== undefined) {
			this.showView(name);
			return;
		}

		this.views[type].dialog(name+"-dialog", this.views[type].title+" ["+name+"]");
		this.active_dialogs[name] = type;
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
		Eden.execute("proc _View_"+name+"_position : _view_"+name+"_x,_view_"+name+"_y { ${{ eden.moveView(\""+name+"\"); }}$; };");
		Eden.execute("proc _View_"+name+"_size : _view_"+name+"_width,_view_"+name+"_height { ${{ eden.resizeView(\""+name+"\"); }}$; };");
	};

	/**
	 * Make the window for a view visible.
	 * @param {string} name - unique identifier for the view.
	 */
	Eden.prototype.showView = function (name) {
		dialog(name).dialog('open');
	};

	/**
	 * Hide the window for a view.
	 * @param {string} name - unique identifier for the view.
	 */
	 */
	Eden.prototype.hideView = function (name) {
		dialog(name).dialog('close');
	};

	/**
	 * Move the window for a view base on its EDEN observables.
	 * @param {string} name - unique identifier for the view.
	 */
	Eden.prototype.moveView = function (name) {
		var x = view(name, 'x').value();
		var y = view(name, 'y').value();
		dialog(name).dialog("option", "position", [x, y]);
	};

	/**
	 * Resize the window for a view to base on its EDEN observables.
	 * @param {string} name - unique identifier for the view.
	 */
	Eden.prototype.resizeView = function (name) {
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
