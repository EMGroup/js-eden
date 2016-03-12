Veden.ExpGroup = function(data, x, y) {
	Veden.Element.call(this,"group", x, y, 50, 30);
	this.element = this.make();

	this.boxIndex = 2;
	this.boxConstantW += 10;
	//this.boxConstantH -= 10;

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","modifier","group","when"],["right","inside","cond"]),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator"],["left"]),
		new SnapPoint(this, "inside", 0, 10, 0.5, 0, false, ["observable","number","group","boolean","string","list"],["left"])
	];

	this.allowedInside = [
		"observable",
		"operator",
		"group"
	];
}

inherits(Veden.ExpGroup, Veden.Element);

Veden.ExpGroup.prototype.toString = function() {
	var res = "(";
	for (var i=0; i<this.children.length; i++) {
		res += this.children[i].toString();
	}
	res += ")";
	return res;
}

Veden.ExpGroup.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	box.setAttribute("width", ""+this.width);
	box.setAttribute("height", ""+this.height);
	box.setAttribute("x", "0");
	box.setAttribute("y", "0");
	box.setAttribute("ry", ""+(this.height/2));
	box.setAttribute("rx", "0");
	box.setAttribute("transform","matrix(1 0 0 1 0 0)");
	box.setAttribute("style","fill:#e7e7f3;fill-opacity:1;fill-rule:evenodd;stroke:#273769;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-miterlimit:4;stroke-dasharray:none");
	
	var lblock = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
	lblock.setAttribute("d", "M 6 5 a 10 10 0 1 0 0 20 l 10 0 0 -20 -10 0 z");		
	lblock.setAttribute("style", "fill:#273769;fill-opacity:1;stroke:none;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
	lblock.setAttribute("x", "0");
	lblock.setAttribute("y", "0");

	var rblock = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
	rblock.setAttribute("d", "M "+(this.width-6)+" 5 a 10 10 0 1 1 0 20 l -10 0 0 -20 10 0 z");		
	rblock.setAttribute("style", "fill:#273769;fill-opacity:1;stroke:none;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
	rblock.setAttribute("x", "0");
	rblock.setAttribute("y", "0");

	var me = this;
	this.onresize = function(dw,dh) {
		me.move(me.x, me.y - (dh / 2));
		rblock.setAttribute("d", "M "+(me.width-6)+" "+(me.height/2 - 10)+" a 10 10 0 1 1 0 20 l -10 0 0 -20 10 0 z");
		lblock.setAttribute("d", "M 6 "+(me.height/2 - 10)+" a 10 10 0 1 0 0 20 l 10 0 0 -20 -10 0 z");
	}

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(lblock);
	group.appendChild(rblock);
	group.appendChild(box);
	//group.onmousedown = selectElement;
	return group;
}
