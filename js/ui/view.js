EdenUI.viewsID = "jseden-views";

EdenUI.View = function(view) {
	this.viewData = view;
	this.element = document.createElement("div");
	this.element.className = "card";
	this.header = document.createElement("div");
	this.header.className = "card-header";
	this.element.appendChild(this.header);
	this.body = document.createElement("div");
	this.body.className = "card-body";
	this.element.appendChild(this.body);
	this.body.appendChild(view.contents[0]);

	//document.getElementById(EdenUI.viewsID).appendChild(this.element);
}

EdenUI.View.prototype.update = function(data) {
	if (this.viewData.update) this.viewData.update(data);
}

EdenUI.View.prototype.destroy = function(data) {
	if (this.viewData.destroy) this.viewData.destroy(data);
}

EdenUI.View.prototype.setValue = function(data) {
	if (this.viewData.setValue) this.viewData.setValue(data);
}

EdenUI.View.prototype.resize = function(e,ui) {
	if (this.viewData.resize) this.viewData.resize(e,ui);
}
