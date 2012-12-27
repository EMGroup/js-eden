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

