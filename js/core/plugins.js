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

	//Now construct eden agents and observables for dialog control.
	Eden.execute("_view_"+name+"_x = "+$("#"+name+"-dialog").dialog("option","position").left+";");
	Eden.execute("_view_"+name+"_y = "+$("#"+name+"-dialog").dialog("option","position").top+";");
	Eden.execute("proc _View_"+name+"_position : _view_"+name+"_x,_view_"+name+"_y { ${{ var x = root.lookup(\"_view_"+name+"_x\").value(); var y = root.lookup(\"_view_"+name+"_y\").value(); eden.moveView("+name+",x,y); }}$; };");
};

Eden.prototype.showView = function(name) {
	$("#"+name+"-dialog").dialog("open");
}

Eden.prototype.hideView = function(name) {
	$("#"+name+"-dialog").dialog("close");
}

Eden.prototype.moveView = function(name, x,y) {
	$("#"+name+"-dialog").dialog("option","position",[x,y]);
}

Eden.prototype.resizeView = function(name, x,y) {
	$("#"+name+"-dialog").dialog("option","width",x).dialog("option","height",y);
}

