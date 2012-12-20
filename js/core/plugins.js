Eden.plugins = {};

Eden.prototype.loadPlugin = function(name) {
	if (this.plugins === undefined) {
		this.plugins = {};
	}

	this.plugins[name] = new Eden.plugins[name]();
};
