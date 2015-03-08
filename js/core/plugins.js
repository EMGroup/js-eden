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
	 */
	EdenUI.prototype.createView = function (name, type) {
		if (this.activeDialogs[name] !== undefined) {
			this.showView(name);
			return this.viewInstances[name];
		}

		this.viewInstances[name] = this.views[type].dialog(name+"-dialog", this.views[type].title+" ["+name+"]");
		var position = this.viewInstances[name] && this.viewInstances[name].position;

		// add minimise button to created dialog
		dialog(name)
		.dialog({
			draggable: true,
			position: position,
			close: function () {
				edenUI.destroyView(name);
			}
		})
		.dialogExtend({
			minimizable: true,
			minimize: function () {
				var dialogMin = dialog(name).data('dialog-extend-minimize-controls');
				// dialogExtend sets position: static and top, left, but doesn't need to.
				// override this so we can add position absolute elements into the minimized controls.
				dialogMin.css('position', 'relative');
				dialogMin.css('top', '');
				dialogMin.css('left', '');
			}
		});
		this.activeDialogs[name] = type;
		this.emit('createView', [name, type]);

		var diag = dialog(name);
		//Allow mouse drags that position the dialog partially outside of the browser window.
		diag.dialog("widget").draggable("option", "containment", [-Number.MAX_VALUE, -10, Number.MAX_VALUE, Number.MAX_VALUE]);
		
		//Initialize observables
		view(name, 'width').assign(diag.dialog("option", "width"));
		view(name, 'height').assign(diag.dialog("option", "height"));

		diag.on("dialogresizestop", function (event, ui) {
			view(name, 'width').assign(ui.size.width);
			view(name, 'height').assign(ui.size.height);
		});
		diag.on("dialogdragstop", function (event, ui) {
			view(name, 'x').assign(ui.position.left);
			view(name, 'y').assign(ui.position.top);
		});
		

		function viewEdenCode() {
			var code = 'proc _View_'+name+'_position : _view_'+name+'_x, _view_'+name+'_y {\n'+
					'${{ edenUI.moveView("'+name+'"); }}$;\n'+
				'};\n'+
				'proc _View_'+name+'_size : _view_'+name+'_width,_view_'+name+'_height {\n'+
					'${{ edenUI.resizeView("'+name+'"); }}$;\n'+
				'};'+
				'if (_view_list == @) { _view_list = []; }\n'+
				'append _view_list, "'+name+'";\n';

			if (position) {
				code += '_view_'+name+'_position = [\"'+position.join('\", \"')+'\"];\n';
			}

			return code;
		}

		// Now construct eden agents and observables for dialog control.
		this.eden.execute(viewEdenCode());
		return this.viewInstances[name];
	};

	EdenUI.prototype.destroyView = function (name) {
		dialog(name).dialog('destroy');
		dialog(name).remove();
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
		dialog(name).dialog('open').dialog('moveToTop').dialogExtend('restore');
		return this.activeDialogs[name];
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
		dialog(name).parent().offset({left: x, top: y});
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
