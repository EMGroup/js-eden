Veden.Modifier = function(mod, x, y) {
	Veden.Element.call(this,"modifier", x, y, 40, 20);
	this.mod = mod;
	this.element = this.make();

	//this.boxConstantW += 2;

	this.snappoints = [
		new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["lvalue"],["right"]),
		new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["number","observable","group"],["left"])
	];
}

inherits(Veden.Modifier, Veden.Element);

Veden.Modifier.prototype.toString = function() {
	return " "+this.mod+" ";
}

Veden.Modifier.prototype.make = function () {
	var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
	box.setAttribute("d", "M -4 0 l 10 10 -10 10 q 24 -4 48 0 a 10 10 0 1 1 0 -20 q -24 4 -48 0 z"); //"M 15 5 a 10 10 0 1 1 0 20 l 30 0");		
	box.setAttribute("style", "fill:#e71353;fill-opacity:1;stroke:none;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")"); #e5bd1d
	box.setAttribute("x", "0");
	box.setAttribute("y", "0");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-modifier");
	text.setAttribute("x", ""+((this.width/2)));
	text.setAttribute("y", ""+((this.height/2)));
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:white;");
	text.textContent = this.mod;
	
	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(box);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}
