EdenUI.Grid = function(element) {
	this.element = (typeof element == "string") ? $(element)[0] : element;

	var gridsym = eden.root.lookup("jseden_ui_grid");

	gridsym.addJSObserver("gridUpdate", (sym, grid) => {
		this.updateGrid(grid);
	});	

	this.gridElement = document.createElement("div");
	this.gridElement.classList.add("container-fluid");
	this.gridElement.style.position = "relative";
	this.element.appendChild(this.gridElement);

	this.gridDimX = 40;
	this.cellSpacing = 10;
	this.cellSize = 2;

	this.gridCells = {};
	this.cells = {};
}

EdenUI.Grid.prototype.indexComponent = function(comp) {
	if (!comp) return undefined;
	comp = comp.toLowerCase();

	var valX = 0;
	var valY = 0;
	var pos = 0;
	while (pos < comp.length) {
		if (comp[pos].match(/[a-z]/i)) {
			valX *= 25;
			valX += comp.charCodeAt(pos) - 97;
			++pos;
		} else {
			break;
		}
	}
	valY = parseInt(comp.substr(pos));
	return [valX,valY-1];
}

EdenUI.Grid.prototype.convertRange = function(str) {
	if (typeof str == "string") {
		var [start,end] = str.split(":");
		start = this.indexComponent(start);
		end = this.indexComponent(end);

		if (end) return [start,end];
		else return [start,start];
	}
}

EdenUI.Grid.prototype.getRangeGeometry = function(range) {
	var [start, end] = (typeof range == "string") ? this.convertRange(range) : range;
	var [sx,sy] = start;
	var [ex,ey] = end;
	sx *= this.cellSize;
	sy *= this.cellSize;
	ex *= this.cellSize;
	ey *= this.cellSize;
	var width = ex - sx;
	var height = ey - sy;
	if (width <= 0 || height <= 0) return [0,0,0,0];
	return [sx,sy,width,height];
}

EdenUI.Grid.prototype.updateElement = function(ele, value) {
	var type = typeof value;

	// TODO: Be clever, only change what needs to change
	while (ele.lastChild) ele.removeChild(ele.lastChild);

	if (type == "object" && !Array.isArray(value)) {
		if (value.type) {
			if (value.type == "view") {
				ele.appendChild(value.viewData.contents[0]);
			}
		}
	} else {
		var code = Eden.edenCodeForValue(value);
		var e = document.createElement("div");
		e.classList.add("card-body");

		var s = document.createElement("span");
		s.innerHTML = code;
		if (type == "string") s.classList.add("eden-string");
		else if (type == "number") s.classList.add("eden-number");
		e.appendChild(s);
		ele.appendChild(e);
	}
}

EdenUI.Grid.prototype.updateGrid = function (grid) {
	while (this.gridElement.lastChild) this.gridElement.removeChild(this.gridElement.lastChild);

	if (Array.isArray(grid)) {
		for (var item of grid) {

			var [x,y,width,height] = this.getRangeGeometry(item.range);

			console.log("Geometry", x, y, width, height);

			var ele = document.createElement("div");
			ele.className = "eden-tile card";
			ele.style.position = "absolute";
			ele.style.width = ""+width+"em";
			ele.style.height = ""+height+"em";
			ele.style.top = ""+y+"em";
			ele.style.left = ""+x+"em";
			
			if (item.content instanceof EdenSymbol) {
				var val = item.content.value();
				this.updateElement(ele, val);
				item.content.addJSObserver("gridCell", (sym, value) => {
					this.updateElement(ele, value);
				});
			} else {
				this.updateElement(ele, item.content);
			}

			this.gridElement.appendChild(ele);
		}
	}
}
