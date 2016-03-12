Veden.LValue = function(name, x, y) {
	Veden.Element.call(this,"lvalue", x, y, 20 + (name.length * 6), 20);
	this.name = name.split("_").join(" ");
	this.element = this.make();

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["statement","when","with"], ["lvalue"]),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["modifier","index"],["left"])
	];
}

inherits(Veden.LValue, Veden.Element);

Veden.LValue.prototype.toString = function() {
	return this.name.split(" ").join("_");
}

Veden.LValue.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	box.setAttribute("x", "0");
	box.setAttribute("y", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("d", "M 6 0 l -10 10 10 10 "+(this.width-12)+" 0 +10 -10 -10 -10 -"+(this.width-12)+" 0 z");
	box.setAttribute("style","fill:#525277;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-observable");
	text.setAttribute("x", ""+((this.width/2)));
	text.setAttribute("y", ""+((this.height/2)));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:white;");
	text.textContent = this.name;

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}
