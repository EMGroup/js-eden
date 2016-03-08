EdenUI.plugins.Veden = function(edenUI, success) {
	var me = this;
	var selectedElement = 0;
	var currentX = 0;
	var currentY = 0;
	var offsetX = 0;
	var offsetY = 0;
	var currentMatrix = 0;
	var elements = [];
	var lastsnap = undefined;

	function SnapPoint(owner, name, mx, cx, my, cy, external, acceptsTypes, acceptsPoints) {
		this.owner = owner;
		this.name = name;
		this.mx = mx;
		this.my = my;
		this.cx = cx;
		this.cy = cy;
		this.element = undefined;
		this.external = external;
		this.types = acceptsTypes;
		this.points = acceptsPoints;
	}

	SnapPoint.prototype.getX = function() {
		return this.owner.width*this.mx + this.cx;
	}

	SnapPoint.prototype.getY = function() {
		return this.owner.height*this.my + this.cy;
	}

	function fVedenMove(x, y) {
		this.x = x;
		this.y = y;
		this.element.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	}

	function fVedenAttach(destpoint, srcpoint, srcelement) {
		//console.log("Attach: " + destpoint.element);
		destpoint.element = srcelement;
		srcpoint.element = this;

		if (destpoint.external == false) {
			//srcelement.parent = this;
			//this.updateChainWidth(srcelement.chainedWidth(this));
			this.addChild(srcelement);
		} else if (this.parent) {
			//console.log("Has parent");
			//srcelement.parent = this.parent;
			//this.parent.updateChainWidth(this.chainedWidth(this.parent));
			this.parent.addChild(srcelement);
		}
	}

	function fVedenDetachAll() {
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element && this.snappoints[i].external) {
				this.snappoints[i].element.detach(this);

				// Are we the parent attach point?
				/*if (this.snappoints[i].element === this.parent) {
					this.snappoints[i].element = undefined;
					// Then remove all child elements from parent...
					var ext = this.chainedExternals(this);
					this.parent.updateChainWidth(50);
					console.log("DETACHING MAIN ChILD");
					
				} else {*/
					this.snappoints[i].element = undefined;
				//}
			}
		}
		if (this.parent) {
			this.parent.removeChild(this);
		}
		//this.parent = undefined;
	}

	function fVedenDetach(ele) {
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element === ele) {
				this.snappoints[i].element = undefined;
			}
		}
	}

	function fVedenAccept(destsnapname, srcsnapname, element) {
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].name == destsnapname) {
				if (this.snappoints[i].element && this.snappoints[i].element !== element) return false;
				if (this.snappoints[i].types && this.snappoints[i].types.indexOf(element.type) == -1) return false;
				if (this.snappoints[i].points && this.snappoints[i].points.indexOf(srcsnapname) == -1) return false;
				return true;
			}
		}
	}

	function inherits(child, parent) {
		child.prototype = Object.create(parent.prototype);
		child.prototype.constructor = child;
	};

	////////////////////////////////////////////////////////////////////////////

	function VedenElement(type, x, y, width, height) {
		this.type = type;
		this.x = x;
		this.y = y;
		this.undocked = false;
		this.width = width;
		this.height = height;
		this.allowedInside = [];
		this.parent = undefined;
		this.children = [];
		this.minWidth = width;
		this.minHeight = height;
		this.boxIndex = -1;
		this.boxConstantW = 10;
		this.boxConstantH = 10;
		this.onchange = undefined;
		this.onresize = undefined;
		// Add to spatial datastructure ... just a list atm.
		elements.push(this);
	};
	VedenElement.prototype.move = fVedenMove;
	VedenElement.prototype.attach = fVedenAttach;
	VedenElement.prototype.detachAll = fVedenDetachAll;
	VedenElement.prototype.detach = fVedenDetach;
	VedenElement.prototype.accept = fVedenAccept;

	VedenElement.prototype.notifyChange = function() {
		if (this.onchange) this.onchange();
		if (this.parent) this.parent.notifyChange();
	}

	VedenElement.prototype.removeChild = function(child) {
		var ix = this.children.indexOf(child);
		if (ix >= 0) {
			// Also undock all subsequent children
			for (var i=ix; i<this.children.length; i++) {
				this.children[i].undock();
				this.children[i].parent = undefined;
			}

			this.children = this.children.slice(0,ix);

			// Calculate new width
			this.autoResize();

			//console.trace("REMOVED CHILD");
			//console.log(this.children);
		}
	}

	VedenElement.prototype.addChild = function(child) {
		this.children.push(child);
		child.parent = this;
		//child.dock();
		// Calculate new width
		this.autoResize();
		//console.log(this.children);
		this.notifyChange();
	}

	VedenElement.prototype.autoResize = function() {
		var nw = this.boxConstantW;
		var nh = 0;
		for (var i=0; i<this.children.length; i++) {
			nw += this.children[i].width;
			if (this.children[i].height > nh) nh = this.children[i].height;
		}
		this.resize(nw,nh+this.boxConstantH);
		if (this.parent) this.parent.autoResize();
	}

	VedenElement.prototype.dock = function() {
		if (!this.undocked) return;
		if (this.parent) {
			// Something being added to my insides...
			var parent = this.element.parentNode;
			parent.removeChild(this.element);

			var pPos = this.parent.pagePosition();
			var ePos = this.pagePosition();

			this.move(ePos.x - pPos.x, ePos.y - pPos.y);

			this.parent.element.appendChild(this.element);
			//ele.parent.updateChainWidth(ele.chainedWidth(ele.parent));
		}
		this.undocked = false;
	}

	VedenElement.prototype.undock = function() {
		if (this.undocked) return;
		this.undocked = true;

		// Detach from any existing points
		var parentnode = this.element.parentNode;
		parentnode.removeChild(this.element);
		var parent = this;
		var px = 0;
		var py = 0;
		while (parent.parent) {
			parent = parent.parent;
			px += parent.x;
			py += parent.y;
		}
		//console.log(evt);
		//console.log("Move From: "+ele.x+","+ele.y+" by "+px+","+py);
		this.move(this.x+px, this.y+py);
		if (parent !== this) parentnode = parent.element.parentNode;
		parentnode.appendChild(this.element);
	}

	VedenElement.prototype.pagePosition = function() {
		if (this.undocked) return {x: this.x, y: this.y};
		var px = 0;
		var py = 0;
		var parent = this.parent;
		while(parent) {
			px += parent.x;
			py += parent.y;
			parent = parent.parent;
		}
		return {x: this.x+px, y: this.y+py};
	}

	VedenElement.prototype.externals = function(origin) {
		var res = [];
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element === origin) continue;
			if (this.snappoints[i].element === this.parent) continue;
			if (this.snappoints[i].external && this.snappoints[i].element) res.push(this.snappoints[i].element);
		}
		return res;
	}

	VedenElement.prototype.internals = function(origin) {
		var res = [];
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element === origin) continue;
			if (!this.snappoints[i].external && this.snappoints[i].element) res.push(this.snappoints[i].element);
		}
		return res;
	}

	VedenElement.prototype.chainedExternals = function(origin) {
		var ext = this.externals(origin);
		var res = [this];
		for (var i=0; i<ext.length; i++) {
			//res.push(ext[i]);
			res.push.apply(res, ext[i].chainedExternals(this));
		}
		return res;
	}

	VedenElement.prototype.chainedInternals = function(origin) {
		var ext = this.internals(origin);
		var res = [this];
		for (var i=0; i<ext.length; i++) {
			//res.push(ext[i]);
			res.push.apply(res, ext[i].chainedExternals(this));
		}
		return res;
	}

	VedenElement.prototype.chainedDeltaMove = function(dx, dy, origin) {
			//console.log("chainedMove: " + dx);
			//this.move(this.x + dx, this.y + dy);
			var chain = this.chainedExternals(origin);
			for (var i=0; i<chain.length; i++) {
				chain[i].move(chain[i].x+dx, chain[i].y+dy);
			}
	}

	VedenElement.prototype.chainedWidth = function(origin) {
		var ext = this.chainedExternals(origin);
		var res = 0;
		for (var i=0; i<ext.length; i++) {
			res += ext[i].width;
		}
		return res;
	}

	VedenElement.prototype.deltaAll = function(dw,dh) {
		for (var i=0; i<this.snappoints.length; i++) {
			// TODO UPDATE SNAPPOINT HEIGHT
			//if (this.snappoints[i].name == "right") {
				//this.snappoints[i].x = this.width;
				//console.log(this.snappoints[i]);
				if (this.snappoints[i].element) {
					this.snappoints[i].element.chainedDeltaMove(dw*this.snappoints[i].mx, dh*this.snappoints[i].my, this);
				}
			//}
		}
	}

	VedenElement.prototype.resize = function(nw,nh) {
		if (nw < this.minWidth) nw = this.minWidth;
		if (nh < this.minHeight) nh = this.minHeight;

		var dw = (nw) - this.width;
		var dh = nh - this.height;
		this.width = nw;
		this.height = nh;
		if (this.boxIndex >= 0) {
			this.element.childNodes[this.boxIndex].setAttribute("width", this.width);
			this.element.childNodes[this.boxIndex].setAttribute("height", this.height);
			//this.element.childNodes[this.boxIndex].setAttribute("y", ""+((this.minHeight - this.height) / 2));
			//this.element.childNodes[0].setAttribute("ry", this.height/2);
			this.move(this.x, this.y - (dh / 2))
			this.deltaAll(dw,dh);
			//this.deltaAll(dw,0);
		}

		if (this.onresize) this.onresize();
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenListIndex(x, y) {
		VedenElement.call(this,"index", x, y, 40, 30);
		this.index = 1;
		this.element = this.make();

		this.boxIndex = 2;

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["observable","index"], ["right"]),
			new SnapPoint(this, "right", 1.0, 5, 0.5, 0, true, ["operator","index"],["left"]),
			new SnapPoint(this, "inside", 0, 5, 0.5, 0, false, ["observable","group"],["left"])
		];
	}

	inherits(VedenListIndex, VedenElement);

	VedenListIndex.prototype.resize = function(w,h) {
		VedenElement.prototype.resize.call(this, w, h);
		this.element.childNodes[2].setAttribute("width", this.width);
		this.element.childNodes[2].setAttribute("height", this.height);
		this.element.childNodes[0].setAttribute("transform", "translate(0,"+((this.height-this.minHeight)/2)+")");
		this.element.childNodes[1].setAttribute("transform", "translate("+this.width+","+((this.height-this.minHeight)/2)+")");
	}

	VedenListIndex.prototype.make = function () {
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
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenObservable(name, x, y) {
		VedenElement.call(this,"observable", x, y, 10 + (name.length * 6), 20);
		this.name = name.split("_").join(" ");
		this.element = this.make();

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","group", "index","modifier"], ["right","inside","lvalue"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator","index"],["left"])
		];
	}

	inherits(VedenObservable, VedenElement);

	VedenObservable.prototype.toString = function() {
		return this.name.split(" ").join("_");
	}

	VedenObservable.prototype.make = function () {
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
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenNumber(x, y) {
		VedenElement.call(this,"number", x, y, 30, 20);
		this.value = 0;
		this.element = this.make();

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","group", "index","modifier"], ["right","inside","lvalue"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator","index"],["left"])
		];
	}

	inherits(VedenNumber, VedenElement);

	VedenNumber.prototype.toString = function() {
		return ""+this.value;
	}

	VedenNumber.prototype.make = function () {
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


		/*var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		text.setAttribute("class", "veden-number");
		text.setAttribute("x", ""+((this.width/2)));
		text.setAttribute("y", ""+((this.height/2)));
		text.setAttribute("text-anchor", "middle");
		text.setAttribute("alignment-baseline", "middle");
		text.setAttribute("style","fill:black;");
		text.setAttribute("editable", "simple");
		text.textContent = ""+this.value;*/

		var fobj = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
		fobj.setAttribute("x", "5");
		fobj.setAttribute("y", "2");
		fobj.setAttribute("width", ""+(this.width - 5));
		fobj.setAttribute("height", ""+(this.height - 2));
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
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenLValue(name, x, y) {
		VedenElement.call(this,"lvalue", x, y, 20 + (name.length * 6), 20);
		this.name = name.split("_").join(" ");
		this.element = this.make();

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["statement"], ["lvalue"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["modifier","lvindex"],["left"])
		];
	}

	inherits(VedenLValue, VedenElement);

	VedenLValue.prototype.toString = function() {
		return this.name.split(" ").join("_");
	}

	VedenLValue.prototype.make = function () {
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
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenOperator(op, x, y) {
		VedenElement.call(this,"operator", x, y, 30, 20);
		this.op = op;
		this.element = this.make();

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["number","observable","group","index"],["right"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["number","observable","group"],["left"])
		];
	}

	inherits(VedenOperator, VedenElement);

	VedenOperator.prototype.toString = function() {
		switch (this.op) {
		case "\u002B": return " + ";
		case "\u2212": return " - ";
		case "\u00D7": return " * ";
		case "\u00F7": return " / ";
		case "\u2981": return " // ";
		}
	}

	VedenOperator.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
		box.setAttribute("d", "M -4 0 a 10 10 0 1 1 0 20 q 20 -4 38 0 a 10 10 0 1 1 0 -20 q -20 4 -38 0 z");		
		box.setAttribute("style", "fill:#e71353;fill-opacity:1;stroke:none;stroke-opacity:1");
		//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
		box.setAttribute("x", "0");
		box.setAttribute("y", "0");

		var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		text.setAttribute("class", "veden-operator");
		text.setAttribute("x", ""+((this.width/2)));
		text.setAttribute("y", ""+((this.height/2)));
		text.setAttribute("text-anchor", "middle");
		text.setAttribute("alignment-baseline", "middle");
		text.setAttribute("style","fill:white;");
		text.textContent = this.op;
		
		var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
		group.setAttribute("cursor","pointer");
		group.appendChild(box);
		group.appendChild(text);
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenModifier(mod, x, y) {
		VedenElement.call(this,"modifier", x, y, 40, 20);
		this.mod = mod;
		this.element = this.make();

		//this.boxConstantW += 2;

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["lvalue"],["right"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["number","observable","group"],["left"])
		];
	}

	inherits(VedenModifier, VedenElement);

	VedenModifier.prototype.toString = function() {
		return " "+this.mod+" ";
	}

	VedenModifier.prototype.make = function () {
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
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenExpGroup(x, y) {
		VedenElement.call(this,"group", x, y, 50, 30);
		this.element = this.make();

		this.boxIndex = 2;
		this.boxConstantW += 10;

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, ["operator","modifier","group"],["right","inside"]),
			new SnapPoint(this, "right", 1.0, 0, 0.5, 0, true, ["operator"],["left"]),
			new SnapPoint(this, "inside", 0, 10, 0.5, 0, false, ["observable","number","group"],["left"])
		];

		this.allowedInside = [
			"observable",
			"operator",
			"group"
		];
	}

	inherits(VedenExpGroup, VedenElement);

	VedenExpGroup.prototype.toString = function() {
		var res = "(";
		for (var i=0; i<this.children.length; i++) {
			res += this.children[i].toString();
		}
		res += ")";
		return res;
	}

	VedenExpGroup.prototype.make = function () {
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
		this.onresize = function() {
			rblock.setAttribute("d", "M "+(me.width-6)+" "+(me.height/2 - 10)+" a 10 10 0 1 1 0 20 l -10 0 0 -20 10 0 z");
			lblock.setAttribute("d", "M 6 "+(me.height/2 - 10)+" a 10 10 0 1 0 0 20 l 10 0 0 -20 -10 0 z");
		}

		var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
		group.setAttribute("cursor","pointer");
		group.appendChild(lblock);
		group.appendChild(rblock);
		group.appendChild(box);
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function VedenStatement(kind, x, y) {
		VedenElement.call(this,"statement", x, y, 100, 30);
		this.element = this.make();

		this.boxIndex = 0;
		this.boxConstantW = 60;

		this.snappoints = [
			new SnapPoint(this, "left", 0, 0, 0.5, 0, true, [],["right"]),
			new SnapPoint(this, "lvalue", 0, 51, 0.5, 0, false, ["lvalue"],["left"])
		];

		this.allowedInside = [
			"observable",
			"operator",
			"group"
		];

		var me = this;
		this.onchange = function(e) {
			var str = me.toString();
			console.log(str);
			var ast = new Eden.AST(str);
			if (ast.hasErrors()) {
				me.element.childNodes[0].setAttribute("style","fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#ff0000;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:6,2;stroke-opacity:1;stroke-dashoffset:0");
			} else {
				me.element.childNodes[0].setAttribute("style","fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#00ff00;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:6,2;stroke-opacity:1;stroke-dashoffset:0");
			}
		}
	}

	inherits(VedenStatement, VedenElement);

	VedenStatement.prototype.toString = function() {
		var res = "";
		for (var i=0; i<this.children.length; i++) {
			res += this.children[i].toString();
		}
		res += ";";
		return res;
	}

	VedenStatement.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
		box.setAttribute("width", ""+this.width);
		box.setAttribute("height", ""+this.height);
		box.setAttribute("x", "0");
		box.setAttribute("y", "0");
		box.setAttribute("ry", ""+(this.height/2));
		box.setAttribute("rx", "0");
		box.setAttribute("transform","matrix(1 0 0 1 0 0)");
		box.setAttribute("style","fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#9a6a16;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:6,2;stroke-opacity:1;stroke-dashoffset:0");

		var block = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		//box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
		block.setAttribute("d", "M 15 5 a 10 10 0 1 0 0 20 l 40 0 -10 -10 10 -10 -40 0 z");		
		block.setAttribute("style", "fill:#c1c3c6;fill-opacity:1;stroke:none;stroke-opacity:1");
		//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
		block.setAttribute("x", "0");
		block.setAttribute("y", "0");
		//block.setAttribute("style", "fill:url(#linearGradient4210);fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1");

		var me = this;
		this.onresize = function() {
			block.setAttribute("d", "M 15 "+(me.height/2 - 10)+" a 10 10 0 1 0 0 20 l 40 0 -10 -10 10 -10 -40 0 z");
		}

		var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
		group.setAttribute("cursor","pointer");
		group.appendChild(box);
		group.appendChild(block);
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function intersect(a, b, padding) {
		var aPos = a.pagePosition();
		var bPos = b.pagePosition();
		var ax1 = aPos.x - padding;
		var ay1 = aPos.y - padding;
		var bx1 = bPos.x - padding;
		var by1 = bPos.y - padding;
		var ax2 = aPos.x + a.width + padding;
		var ay2 = aPos.y + a.height + padding;
		var bx2 = bPos.x + b.width + padding;
		var by2 = bPos.y + b.height + padding;
		return (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);
	}

	function findElement(domele) {
		for (var i=0; i<elements.length; i++) {
			if (elements[i].element === domele) return elements[i];
		}
		return undefined;
	}

	function findNear(element, dist) {
		var res = [];
		for (var i=0; i<elements.length; i++) {
			if (elements[i] === element) continue;
			if (intersect(elements[i], element, dist)) res.push(elements[i]);
		}
		return res;
	}

	/*function findNearest(element) {
		var near = findNear(element);
		var cx = element.x + (element.width / 2);
		var cy = element.y + (element.height / 2);
		var mind = 10000000;
		var nearest = undefined;

		for (var i=0; i<near.length; i++) {
			var ax = near[i].x + (near[i].width / 2);
			var ay = near[i].y + (near[i].height / 2);
			var d = (ax - cx) * (ax - cx) + (ay - cy) * (ay - cy);
			if (d < mind) {
				mind = d;
				nearest = near[i];
			}
		}
		return nearest;
	}*/

	function checkSnaps(element, near) {
		var dist = 10;
		var res = [];

		if (near === undefined) {
			near = findNear(element, dist);
		}

		var elePos = element.pagePosition();

		for (var i=0; i<near.length; i++) {
			var nearPos = near[i].pagePosition();

			for (var x=0; x<element.snappoints.length; x++) {
				for (var y=0; y<near[i].snappoints.length; y++) {
					var xx = element.snappoints[x].getX() + elePos.x;
					var xy = element.snappoints[x].getY() + elePos.y;
					var yx = near[i].snappoints[y].getX() + nearPos.x;
					var yy = near[i].snappoints[y].getY() + nearPos.y;
					var d = ((xx - yx) * (xx - yx) + (xy - yy) * (xy - yy));
					if (d <= dist*dist) {
						if (element.accept(element.snappoints[x].name, near[i].snappoints[y].name, near[i])
							&& near[i].accept(near[i].snappoints[y].name, element.snappoints[x].name, element)) {
							res.push({dist: d, srcsnap: element.snappoints[x],
								destelement: near[i],
								destsnap: near[i].snappoints[y]});
						}
					}
				}
			}
		}
		if (res.length == 0) return undefined;
		res = res.sort(function(a,b) { return a.dist - b.dist });
		if (res.length > 1) console.log(res);
		return res[0];
	}

	function moveElement(evt){
		if (selectedElement == 0) return;
		evt.preventDefault();
		dx = evt.layerX - currentX;
		dy = evt.layerY - currentY;

		var ele = findElement(selectedElement);
		if (ele) {
			ele.x += dx;
			ele.y += dy;
			var near = findNear(ele, 10);
			ele.detachAll(); // Needed to free up snap point options...
			var snaps = checkSnaps(ele, near);

			// TODO Could desnap from one directly to another and not be
			// properly detached!!!!!

			if (snaps) {
				/*if (lastsnap && snaps.destsnap !== lastsnap.destsnap) {
					ele.detachAll();
				}*/

				if (snaps.srcsnap.element === undefined) {
					//ele.attach(snaps.srcsnap, snaps.destsnap, snaps.destelement);
					snaps.destelement.attach(snaps.destsnap, snaps.srcsnap, ele);
				}
				var destpos = snaps.destelement.pagePosition();
				ele.x = destpos.x + snaps.destsnap.getX() - snaps.srcsnap.getX();
				ele.y = destpos.y + snaps.destsnap.getY() - snaps.srcsnap.getY();

				//lastsnap = snaps;
			} else {
				//ele.detachAll();
				// Now prevent overlaps... if not allowed
				/*for (var i=0; i<near.length; i++) {
					if (intersect(ele, near[i], 0)) {
						if (near[i].allowedInside.indexOf(ele.type) == -1) {
							ele.x -= dx;
							ele.y -= dy;
						} else {
							//near[i].insert(ele);
						}
					}
				}*/
			}
		}

		currentMatrix[4] = ele.x;
		currentMatrix[5] = ele.y;
		newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
				
		selectedElement.setAttributeNS(null, "transform", newMatrix);
		//currentX = evt.clientX;
		//currentY = evt.clientY;
		if (ele) {
			currentX = ele.x + offsetX;
			currentY = ele.y + offsetY;
		}
	}

	function deselectElement(evt){
		//console.log(elements);
		//evt.preventDefault();
		if(selectedElement != 0){
			var ele = findElement(selectedElement);
			ele.dock();
			selectedElement.removeAttributeNS(null, "onmousemove");
			selectedElement.removeAttributeNS(null, "onmouseout");
			selectedElement.removeAttributeNS(null, "onmouseup");
			selectedElement.removeAttribute("filter");
			selectedElement = 0;
		}
	}

	function selectElement(evt) {
		//evt.preventDefault();
		if (selectedElement != 0) return;
		if (evt.target.nodeName == "INPUT") return;
		//console.log(evt);

		selectedElement = evt.target;

		// Get block base element
		while (selectedElement.nodeName != "g") {
			selectedElement = selectedElement.parentNode;
		}

		var ele = findElement(selectedElement);
		ele.undock();

		// Add drop shadow effect
		selectedElement.setAttribute("filter","url(#fdrop)");

		offsetX = evt.layerX - ele.x;
		offsetY = evt.layerY - ele.y;
		currentX = evt.layerX;
		currentY = evt.layerY;
		//console.log("Current: " + currentX+","+currentY);
		currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
		  for(var i=0; i<currentMatrix.length; i++) {
			currentMatrix[i] = parseFloat(currentMatrix[i]);
		  }

		selectedElement.parentNode.onmousemove = moveElement;
		//selectedElement.onmouseout = deselectElement;
		selectedElement.parentNode.onmouseup = deselectElement;
	}

	this.createDialog = function(name,mtitle) {
		var code_entry = $('<div id=\"'+name+'-content\" class=\"veden-content\"></div>');
		var svg1 = $('<svg width="100%" height="100%" version="1.1"\
			 baseProfile="full"\
			 xmlns="http://www.w3.org/2000/svg">\
			<defs>\
    <filter id="fdrop" x="0" y="0" width="200%" height="200%">\
      <feOffset result="offOut" in="SourceAlpha" dx="5" dy="5" />\
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
  </defs>\
		</svg>');
		code_entry.append(svg1);
		var op = new VedenOperator("\u002B", 10, 10);
		var op2 = new VedenOperator("\u2212", 50, 10);
		var op3 = new VedenOperator("\u00D7", 90, 10);
		var op4 = new VedenOperator("\u00F7", 130, 10);
		var op5 = new VedenOperator("\u2981", 170, 10);
		var obs1 = new VedenObservable("turtle_position_x", 10, 70);
		var obs2 = new VedenObservable("turtle_position_y", 150, 70);
		var obs3 = new VedenObservable("mouse_y", 10, 100);
		var num1 = new VedenNumber(80, 100);
		var obs4 = new VedenLValue("mouse_x", 150, 100);
		var obs5 = new VedenObservable("screenWidth", 10, 130);
		var group1 = new VedenExpGroup(10,160);
		var group2 = new VedenExpGroup(10,200);
		var list1 = new VedenListIndex(10,240);
		var stat1 = new VedenStatement("is", 10, 280);
		var mod1 = new VedenModifier("is", 200, 280);
		svg1.append(op.element);
		svg1.append(op2.element);
		svg1.append(op3.element);
		svg1.append(op4.element);
		svg1.append(op5.element);
		svg1.append(obs1.element);
		svg1.append(obs2.element);
		svg1.append(obs3.element);
		svg1.append(num1.element);
		svg1.append(obs4.element);
		svg1.append(obs5.element);
		svg1.append(group1.element);
		svg1.append(group2.element);
		svg1.append(list1.element);
		svg1.append(stat1.element);
		svg1.append(mod1.element);

		$('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "veden-dialog"
			});
		return {confirmClose: false};
	}

	//Register the DBView options
	edenUI.views["Veden"] = {dialog: this.createDialog, title: "Visual Eden", category: edenUI.viewCategories.interpretation};

	success();
}

/* Plugin meta information */
EdenUI.plugins.Veden.title = "Veden";
EdenUI.plugins.Veden.description = "Visual Eden Code Editor";
