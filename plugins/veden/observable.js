Veden.Observable = function(name, x, y) {
	Veden.Element.call(this,"observable", x, y, 10 + (name.length * 6), 20);
	this.name = name.split("_").join(" ");
	this.element = this.make();

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, {
			external: true,
			permissions: {
				operator: ["right"],
				group: ["inside"],
				index: ["inside"],
				modifier: ["right"],
				when: ["cond"]
			}}),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, {
			external: true,
			permissions: {
				operator: ["left"],
				index: ["left"],
				"with": ["left"]
			}})
	];
}

inherits(Veden.Observable, Veden.Element);

Veden.Observable.prototype.toString = function() {
	return this.name.split(" ").join("_");
}

Veden.Observable.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box.setAttribute("width", ""+(this.width+8));
	box.setAttribute("height", "20");
	box.setAttribute("x", "-4");
	box.setAttribute("y", "0");
	box.setAttribute("ry", "10");
	box.setAttribute("rx", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("style","fill:#525277;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-observable");
	text.setAttribute("x", ""+((this.width/2)));
	text.setAttribute("y", ""+((this.height/2)));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:white;");
	text.textContent = this.name;
	//console.log(text.getComputedTextLength());

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}

