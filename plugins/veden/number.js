Veden.Number = function(value, x, y) {
	Veden.Element.call(this,"number", x, y, ((""+value).length-1) * 7 + 30, 20);
	this.value = value;
	this.element = this.make();

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","group", "index","modifier"], ["right","inside","lvalue"]),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator","index"],["left"])
	];
}

inherits(Veden.Number, Veden.Element);

Veden.Number.prototype.toString = function() {
	return ""+this.value;
}

Veden.Number.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box.setAttribute("width", ""+(this.width+8));
	box.setAttribute("height", "20");
	box.setAttribute("x", "-4");
	box.setAttribute("y", "0");
	box.setAttribute("ry", "10");
	box.setAttribute("rx", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("style","fill:#1e4cb6;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

	var box2 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box2.setAttribute("width", ""+(this.width+4));
	box2.setAttribute("height", "16");
	box2.setAttribute("x", "-2");
	box2.setAttribute("y", "2");
	box2.setAttribute("ry", "8");
	box2.setAttribute("rx", "0");
	box2.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box2.setAttribute("style","fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

	var fobj = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
	fobj.setAttribute("x", "5");
	fobj.setAttribute("y", "2");
	fobj.setAttribute("class", "veden-fobj");
	fobj.setAttribute("width", ""+(this.width - 5));
	fobj.setAttribute("height", ""+(this.height-4));
	var input = document.createElement("input");
	input.setAttribute("type","text");
	input.setAttribute("class", "veden-number-input");
	input.setAttribute("style", "width: "+(this.width-15)+"px;");
	input.value = this.value;
	var me = this;
	input.onkeypress = function(evt) {
		var nw = input.value.length * 7 + 30;
		var dw = nw - me.width;
		me.resize(nw, me.height);
		box.setAttribute("width", ""+(me.width+8));
		box2.setAttribute("width", ""+(me.width+4));
		fobj.setAttribute("width", ""+(me.width - 5));
		input.setAttribute("style", "width: "+(me.width-15)+"px;");
		me.deltaAll(dw,0);
		if (me.parent) me.parent.autoResize();
	};
	input.onkeyup = function(evt) {
		me.value = parseFloat(input.value);
		me.notifyChange();
	};

	fobj.appendChild(input);

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(box2);
	group.appendChild(fobj);
	//group.onmousedown = selectElement;
	return group;
}

