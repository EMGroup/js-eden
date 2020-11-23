EdenUI.Grid = function(element) {
	this.element = (typeof element == "string") ? $(element)[0] : element;

	this.element.classList.add("container-fluid");

	var gridsym = eden.root.lookup("jseden_ui_grid");

	gridsym.addJSObserver("gridUpdate", (sym, grid) => {
		this.updateGrid(grid);
	});

	this.gridContainer = document.createElement("div");
}

EdenUI.Grid.prototype.updateGrid = function (grid) {

}
