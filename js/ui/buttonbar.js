EdenUI.ButtonBar = function(container) {
	this.container = container;
	this.bar = $('<div class="control-bar noselect"><div class="buttonsDiv"></div></div>');
	this.buttons = {};
	this.container.appendChild(this.bar.get(0));
}

EdenUI.ButtonBar.prototype.addButton = function(name, icon, tooltip, callback) {
	var but = $('<button class="control-button control-enabled '+name+'" title="'+tooltip+'">'+icon+'</button>');
	this.bar.find('.buttonsDiv').append(but);
	but.get(0).onclick = callback;
	this.buttons[name] = but;
}

EdenUI.ButtonBar.prototype.enableButton = function(name) {
	if (this.buttons[name]) {
		this.buttons[name].addClass("control-enabled");
	}
}

EdenUI.ButtonBar.prototype.disableButton = function(name) {
	if (this.buttons[name]) {
		this.buttons[name].removeClass("control-enabled");
	}
}

