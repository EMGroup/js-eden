EdenUI.SearchBox = function(element) {
	this.element = element;
};

EdenUI.SearchBox.prototype.updateSearch = function(q) {
	if (!q || q == "") {
		this.element.hide();
	} else {
		this.element.show();
	}
}


