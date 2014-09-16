/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 


Eden.plugins = {};

Eden.prototype.loadPlugin = function(name) {

	if (this.plugins === undefined) {
		this.plugins = {};
	}
	if (this.views === undefined) {
		this.views = {};
	}

	//If not already loaded then load.
	if (this.plugins[name] === undefined) {
		this.plugins[name] = new Eden.plugins[name](this);

		if (this.plugins.MenuBar) {
			this.plugins.MenuBar.updatePluginsMenu();
		}
	}
};

Eden.prototype.createView = function(name, type) {

	if (this.active_dialogs === undefined) {
		this.active_dialogs = {};
	}

	if (this.active_dialogs[name] !== undefined) {
		this.showView(name);
		return;
	}

	this.views[type].dialog(name+"-dialog", this.views[type].title + " ["+name+"]");
	this.active_dialogs[name] = type;
	if (this.plugins.MenuBar) {
		this.plugins.MenuBar.updateViewsMenu();
	}

	this.internal("_view_"+name+"_x");
	this.internal("_view_"+name+"_y");
	this.internal("_view_"+name+"_width");
	this.internal("_view_"+name+"_height");

	var diag = $("#"+name+"-dialog");
	root.lookup("_view_"+name+"_width").assign(diag.dialog("option","width"));
	root.lookup("_view_"+name+"_height").assign(diag.dialog("option","height"));

	diag.on( "dialogresizestop", function(event, ui) {
			root.lookup("_view_"+name+"_width").assign(ui.size.width);
			root.lookup("_view_"+name+"_height").assign(ui.size.height);
		});

	//Now construct eden agents and observables for dialog control.
	Eden.execute("proc _View_"+name+"_position : _view_"+name+"_x,_view_"+name+"_y { ${{ eden.moveView(\""+name+"\"); }}$; };");
	Eden.execute("proc _View_"+name+"_size : _view_"+name+"_width,_view_"+name+"_height { ${{ eden.resizeView(\""+name+"\"); }}$; };");
};

Eden.prototype.showView = function(name) {

	$("#"+name+"-dialog").dialog("open");
}

Eden.prototype.hideView = function(name) {

	$("#"+name+"-dialog").dialog("close");
}

Eden.prototype.moveView = function(name) {

	$("#"+name+"-dialog").dialog("option","position",[this.internals["_view_"+name+"_x"],this.internals["_view_"+name+"_y"]]);
}

Eden.prototype.resizeView = function(name) {

	var newwidth = this.internals["_view_"+name+"_width"];
	var newheight = this.internals["_view_"+name+"_height"];
	var diag = $("#"+name+"-dialog");
	var oldwidth = diag.dialog("option","width");
	var oldheight = diag.dialog("option","height");

	if (newwidth-oldwidth != 0) {
		diag.dialog("option","width",newwidth);
	}
	if (newheight-oldheight != 0) {
		diag.dialog("option","height",newheight);
	}
}

