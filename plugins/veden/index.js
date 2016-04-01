Veden.ListIndex = function(data, x, y) {
	Veden.Element.call(this,"index", x, y, 40, 30);
	this.index = 1;
	this.element = this.make();

	this.boxIndex = 2;

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["observable","index"], ["right"]),
		new SnapPoint(this, "right", 1.0, 5, 0.5, 0, true, ["operator","index"],["left"]),
		new SnapPoint(this, "inside", 0, 5, 0.5, 0, false, ["observable","group"],["left"])
	];
}

inherits(Veden.ListIndex, Veden.Element);

Veden.ListIndex.prototype.resize = function(w,h) {
	Veden.Element.prototype.resize.call(this, w, h);
	this.element.childNodes[2].setAttribute("width", this.width);
	this.element.childNodes[2].setAttribute("height", this.height);
	this.element.childNodes[0].setAttribute("transform", "translate(0,"+((this.height-this.minHeight)/2)+")");
	this.element.childNodes[1].setAttribute("transform", "translate("+this.width+","+((this.height-this.minHeight)/2)+")");
}

Veden.ListIndex.prototype.make = function () {
	var edge1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	edge1.setAttribute("d", "M -5 5 q 10 10 0 20 l 10 0 0 -20 -10 0 z");
	edge1.setAttribute("style", "fill:#21ad1c;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
	edge1.setAttribute("x", "0");
	edge1.setAttribute("y", "0");

	var edge2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	edge2.setAttribute("d", "M 0 5 q 10 10 0 20 l -10 0 0 -20 10 0 z");
	edge2.setAttribute("style", "fill:#21ad1c;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
	edge2.setAttribute("transform", "translate(" + this.width + " " + 0 +")");
	edge2.setAttribute("x", "0");
	edge2.setAttribute("y", "0");

	var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box.setAttribute("width", ""+this.width);
	box.setAttribute("height", ""+this.height);
	box.setAttribute("x", "0");
	box.setAttribute("y", "0");
	box.setAttribute("ry", ""+(this.height/2));
	box.setAttribute("rx", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("style","fill:#d4f9c6;fill-opacity:1;fill-rule:evenodd;stroke:#3a6927;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1");

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(edge1);
	group.appendChild(edge2);
	group.appendChild(box);
	//group.onmousedown = selectElement;
	return group;
}

