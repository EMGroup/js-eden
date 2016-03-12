Veden.Boolean = function(value, x, y) {
	Veden.Element.call(this,"boolean", x, y, 40, 20);
	this.value = value;
	this.element = this.make();

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","group", "index","modifier","when"], ["right","inside","lvalue","cond"]),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator","index"],["left"])
	];
}

inherits(Veden.Boolean, Veden.Element);

Veden.Boolean.prototype.toString = function() {
	return this.value;
}

Veden.Boolean.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box.setAttribute("width", ""+(this.width+8));
	box.setAttribute("height", "20");
	box.setAttribute("x", "-4");
	box.setAttribute("y", "0");
	box.setAttribute("ry", "10");
	box.setAttribute("rx", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("style","fill:#21ad1c;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-boolean");
	text.setAttribute("x", ""+((this.width/2)));
	text.setAttribute("y", ""+((this.height/2)));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:white;");
	text.textContent = ""+this.value;
	//console.log(text.getComputedTextLength());

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}

