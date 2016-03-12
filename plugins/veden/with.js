Veden.With = function(data, x, y) {
	Veden.Element.call(this,"with", x, y, 100, 29);
	this.element = this.make();
	//this.boxConstantW += 10;
	
	this.ast = undefined;

	this.statementCount = 0;

	this.snappoints = [
		new SnapPoint(this, "left", 0, 14, 0, 10, true, ["observable","group","number","string","list","boolean"],["right"])
	];

	this.addStatementPoint();

	this.allowedInside = [
		"observable",
		"operator",
		"group"
	];

	var me = this;
	/*this.onchange = function(e) {
		var str = me.toString();
		//console.log(str);
		me.ast = new Eden.AST(str);
		if (me.ast.hasErrors()) {
			me.element.childNodes[1].setAttribute("style","fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#ff0000;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:6,2;stroke-opacity:1;stroke-dashoffset:0");
		} else {
			me.element.childNodes[1].setAttribute("style","fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#00ff00;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:6,2;stroke-opacity:1;stroke-dashoffset:0");
		}
	}*/
}

inherits(Veden.With, Veden.Element);

Veden.With.prototype.toString = function() {
	var res = "";
	for (var i=0; i<this.children.length; i++) {
		res += this.children[i].toString();
	}
	res += ";";
	return res;
}

Veden.With.prototype.make = function () {
	var me = this;

	var lbar = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	lbar.setAttribute("width", "10");
	lbar.setAttribute("height", "15"); //+(this.height-35));
	lbar.setAttribute("x", "0");
	lbar.setAttribute("y", "24");
	lbar.setAttribute("ry", "0");
	lbar.setAttribute("rx", "0");
	lbar.setAttribute("transform","matrix(1 0 0 1 0 0)");
	lbar.setAttribute("style","fill:#e5bd1d;fill-opacity:1;stroke:none;stroke-opacity:1");

	var lbar2 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	lbar2.setAttribute("width", "30");
	lbar2.setAttribute("height", "2"); //+(this.height-35));
	lbar2.setAttribute("x", "0");
	lbar2.setAttribute("y", "22");
	lbar2.setAttribute("ry", "0");
	lbar2.setAttribute("rx", "0");
	lbar2.setAttribute("transform","matrix(1 0 0 1 0 0)");
	lbar2.setAttribute("style","fill:#e5bd1d;fill-opacity:1;stroke:none;stroke-opacity:1");

	var lbar3 = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
	lbar3.setAttribute("width", "10");
	lbar3.setAttribute("height", "4"); //+(this.height-35));
	lbar3.setAttribute("x", "28");
	lbar3.setAttribute("y", "20");
	lbar3.setAttribute("ry", "0");
	lbar3.setAttribute("rx", "0");
	lbar3.setAttribute("transform","matrix(1 0 0 1 0 0)");
	lbar3.setAttribute("style","fill:#e5bd1d;fill-opacity:1;stroke:none;stroke-opacity:1");


	var block = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
	block.setAttribute("d", "M 10 0 a 10 10 0 1 1 0 20 l 50 0 a 10 10 0 1 0 0 -20 l -50 0 z");		
	block.setAttribute("style", "fill:#e5bd1d;fill-opacity:1;stroke:none;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
	block.setAttribute("x", "0");
	block.setAttribute("y", "0");
	//block.setAttribute("style", "fill:url(#linearGradient4210);fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1");

	var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	text.setAttribute("class", "veden-modifier");
	text.setAttribute("x", "25");
	text.setAttribute("y", "13");
	//text.setAttribute("text-anchor", "middle");
	//text.setAttribute("alignment-baseline", "middle");
	text.setAttribute("style","fill:#0f2787;");
	text.textContent = "with";

	var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');

	this.onattachchild = function() {
		//block.setAttribute("d", "M 15 "+(me.height/2 - 10)+" a 10 10 0 1 0 0 20 l 40 0 -10 -10 10 -10 -40 0 z");
		// For each internal snap point, calculate chain height and adjust snappoint position accordingly.
		var curtop = 0;
		
		console.log("START REHEIGHT");
		for (var i=1; i<me.snappoints.length; i++) {
			var chainh;
			if (me.snappoints[i].element) {
				chainh = me.snappoints[i].element.chainedHeight(me);
			} else {
				chainh = 20;
			}
			console.log(chainh);
			if (i >= 1 && me.snappoints[i].DOM) {
				console.log("New y: " + i + " = " + curtop);
				me.snappoints[i].DOM.setAttribute("d", "M 15 "+(curtop+((chainh-20) / 2))+" a 10 10 0 1 0 0 20 l 15 0 -10 -10 10 -10 -15 0 z");	
			} else if (i == 0) {
				block.setAttribute("d", "M 15 "+(curtop+((chainh-20) / 2))+" a 10 10 0 1 0 0 20 l 50 0 a 10 10 0 1 1 0 -20 l -50 0 z");
				text.setAttribute("y", ""+(curtop+((chainh-20) / 2)+13));
				lbar.setAttribute("y", ""+(curtop+(chainh / 2)));
			}

			me.snappoints[i].cy = curtop + (chainh / 2);
			curtop += chainh + ((i==0) ? 10 : 5);
		}
		me.autoMove();
		me.minHeight = curtop;
		me.resize(me.width, 0);
		//me.element.childNodes[0].setAttribute("height", ""+(me.height-(me.snappoints[0].cy+18)));
	}

	this.onattach = function(s) {
		if (s === me.snappoints[me.snappoints.length-1]) {
			me.addStatementPoint();
		}
	}

	group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	group.setAttribute("cursor","pointer");
	group.appendChild(lbar);
	group.appendChild(lbar2);
	group.appendChild(lbar3);
	group.appendChild(block);
	group.appendChild(text);
	//group.onmousedown = selectElement;
	return group;
}

Veden.With.prototype.addStatementPoint = function() {
	this.statementCount++;

	var block = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
	block.setAttribute("d", "M 10 "+(this.height)+" a 10 10 0 1 0 0 20 l 15 0 -10 -10 10 -10 -15 0 z");		
	block.setAttribute("style", "fill:#e5bd1d;fill-opacity:1;stroke:none;stroke-opacity:1");
	//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
	block.setAttribute("x", "0");
	block.setAttribute("y", "0");
	this.element.appendChild(block);

	var snap = new SnapPoint(this, "lvalue", 0, 21, 0, this.height+10, false, ["lvalue"],["left"]);
	snap.DOM = block;
	this.snappoints.push(snap);

	this.minHeight = 20 + ((this.snappoints.length - 1) * 25);
	this.resize(this.width, 0);
	//this.element.childNodes[0].setAttribute("height", ""+(this.height-33-5));
}

