Veden.Modifier = function(mod, x, y) {
	Veden.Element.call(this,"modifier", x, y, 40, 20);
	this.mod = mod;
	this.element = this.make();

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, {
			external: true,
			permissions: {
				lvalue: ["right"]
			}}),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, {
			external: true,
			permissions: {
				number: ["left"],
				observable: ["left"],
				group: ["left"],
				boolean: ["left"],
				string: ["left"],
				list: ["list"]
			}})
	];
}

inherits(Veden.Modifier, Veden.Element);

Veden.Modifier.prototype.toString = function() {
	return " "+this.mod+" ";
}

Veden.Modifier.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	box.setAttribute("d", "M -4 0 l 10 10 -10 10 q 24 -4 48 0 a 10 10 0 1 1 0 -20 q -24 4 -48 0 z"); //"M 15 5 a 10 10 0 1 1 0 20 l 30 0");		
	box.setAttribute("style", "fill:#c6c6c6;fill-opacity:1;stroke:none;stroke-opacity:1");
	box.setAttribute("x", "0");
	box.setAttribute("y", "0");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-modifier");
	text.setAttribute("x", ""+((this.width/2)));
	text.setAttribute("y", ""+((this.height/2)));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:#444444;");
	text.textContent = this.mod;
	
	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}
