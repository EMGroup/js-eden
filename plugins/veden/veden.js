EdenUI.plugins.Veden = function(edenUI, success) {
	var me = this;
	var selectedElement = 0;
	var currentX = 0;
	var currentY = 0;
	var offsetX = 0;
	var offsetY = 0;
	var currentMatrix = 0;
	var elements = [];

	function SnapPoint(name, x, y, external, acceptsTypes, acceptsPoints) {
		this.name = name;
		this.x = x;
		this.y = y;
		this.element = undefined;
		this.external = external;
		this.types = acceptsTypes;
		this.points = acceptsPoints;
	}

	function fVedenMove(x, y) {
		this.x = x;
		this.y = y;
		this.element.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
	}

	function fVedenAttach(destpoint, srcpoint, srcelement) {
		console.log("Attach: " + destpoint.element);
		destpoint.element = srcelement;

		/*for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].name == destpoint) {
				this.snappoints[i].element = srcelement;
				return;
			}
		}*/
	}

	function fVedenDetachAll() {
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element && this.snappoints[i].external) {
				this.snappoints[i].element.detach(this);
				this.snappoints[i].element = undefined;
			}
		}
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
		this.width = width;
		this.height = height;
		this.allowedInside = [];
		// Add to spatial datastructure ... just a list atm.
		elements.push(this);
	};
	VedenElement.prototype.move = fVedenMove;
	VedenElement.prototype.attach = fVedenAttach;
	VedenElement.prototype.detachAll = fVedenDetachAll;
	VedenElement.prototype.detach = fVedenDetach;
	VedenElement.prototype.accept = fVedenAccept;

	VedenElement.prototype.externals = function(origin) {
		var res = [];
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].element === origin) continue;
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
			console.log("chainedMove: " + dx);
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

	////////////////////////////////////////////////////////////////////////////

	function VedenObservable(name, x, y) {
		VedenElement.call(this,"observable", x, y, 20 + (name.length * 7), 20);
		this.name = name;
		this.element = this.make();

		this.snappoints = [
			new SnapPoint("left", 0, this.height/2, true, ["operator","group"], ["right","inside"]),
			new SnapPoint("right", this.width, this.height/2, true, ["operator"],["left"])
		];
	}

	inherits(VedenObservable, VedenElement);

	VedenObservable.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
		box.setAttribute("width", ""+this.width);
		box.setAttribute("height", "20");
		box.setAttribute("x", "0");
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
		VedenElement.call(this,"operator", x, y, 26, 16);
		this.op = op;
		this.element = this.make();

		this.snappoints = [
			new SnapPoint("left", 5, this.height/2, true, ["observable","group"],["right"]),
			new SnapPoint("right", this.width - 5, this.height/2, true, ["observable","group"],["left"])
		];
	}

	inherits(VedenOperator, VedenElement);

	VedenOperator.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
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

	function VedenExpGroup(x, y) {
		VedenElement.call(this,"group", x, y, 50, 30);
		this.element = this.make();

		this.snappoints = [
			new SnapPoint("left", 0, this.height/2, true, ["operator"],["right"]),
			new SnapPoint("right", this.width, this.height/2, true, ["operator"],["left"]),
			new SnapPoint("inside", 5, this.height/2, false, ["observable"],["left"])
		];

		this.allowedInside = [
			"observable",
			"operator",
			"group"
		];
	}

	inherits(VedenExpGroup, VedenElement);

	VedenExpGroup.prototype.attach = function(dest, src, element) {
		if (dest.element === element && dest.element) return;

		VedenElement.prototype.attach.call(this, dest, src, element);
		if (dest.name == "inside") {
			var nw = element.chainedWidth(this);
			console.log("New Width: " + nw);
			var dw = (nw+10) - this.width;
			this.width = nw + 10;
			this.element.childNodes[0].setAttribute("width", this.width);
			for (var i=0; i<this.snappoints.length; i++) {
				if (this.snappoints[i].name == "right") {
					this.snappoints[i].x = this.width;
					console.log(this.snappoints[i]);
					if (this.snappoints[i].element) {
						this.snappoints[i].element.chainedDeltaMove(dw, 0, this);
					}
				}
			}
		}
		//this.element.childNodes[0].setAttribute("height", h);
	}

	VedenExpGroup.prototype.detach = function(element) {
		for (var j=0; j<this.snappoints.length; j++) {
			if (this.snappoints[j].name == "inside" && this.snappoints[j].element === element) {
				var nw = 50;
				console.log("New Width: " + nw);
				var dw = nw - this.width;
				this.width = nw;
				this.element.childNodes[0].setAttribute("width", this.width);
				for (var i=0; i<this.snappoints.length; i++) {
					if (this.snappoints[i].name == "right") {
						this.snappoints[i].x = this.width;
						//console.log(this.snappoints[i]);
						if (this.snappoints[i].element) {
							this.snappoints[i].element.chainedDeltaMove(dw, 0, this);
						}
					}
				}
			}
		}

		VedenElement.prototype.detach.call(this, element);
		//this.element.childNodes[0].setAttribute("height", h);
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
		
		var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		group.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
		group.setAttribute("cursor","pointer");
		group.appendChild(box);
		group.onmousedown = selectElement;
		return group;
	}

	////////////////////////////////////////////////////////////////////////////

	function intersect(a, b, padding) {
		var ax1 = a.x - padding;
		var ay1 = a.y - padding;
		var bx1 = b.x - padding;
		var by1 = b.y - padding;
		var ax2 = a.x + a.width + padding;
		var ay2 = a.y + a.height + padding;
		var bx2 = b.x + b.width + padding;
		var by2 = b.y + b.height + padding;
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

		for (var i=0; i<near.length; i++) {
			for (var x=0; x<element.snappoints.length; x++) {
				for (var y=0; y<near[i].snappoints.length; y++) {
					var xx = element.snappoints[x].x + element.x;
					var xy = element.snappoints[x].y + element.y;
					var yx = near[i].snappoints[y].x + near[i].x;
					var yy = near[i].snappoints[y].y + near[i].y;
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
		res.sort(function(a,b) { a.dist - b.dist });
		return res[0];
	}

	function moveElement(evt){
		if (selectedElement == 0) return;
		dx = evt.layerX - currentX;
		dy = evt.layerY - currentY;

		var ele = findElement(selectedElement);
		if (ele) {
			var near = findNear(ele, 10);
			ele.x += dx;
			ele.y += dy;
			var snaps = checkSnaps(ele, near);
			if (snaps) {
				ele.x = snaps.destelement.x + snaps.destsnap.x - snaps.srcsnap.x;
				ele.y = snaps.destelement.y + snaps.destsnap.y - snaps.srcsnap.y;
				ele.attach(snaps.srcsnap, snaps.destsnap, snaps.destelement);
				snaps.destelement.attach(snaps.destsnap, snaps.srcsnap, ele);
			} else {
				ele.detachAll();
				// Now prevent overlaps... if not allowed
				for (var i=0; i<near.length; i++) {
					if (intersect(ele, near[i], 0) && near[i].allowedInside.indexOf(ele.type) == -1) {
						ele.x -= dx;
						ele.y -= dy;
					}
				}
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
		if(selectedElement != 0){
			selectedElement.removeAttributeNS(null, "onmousemove");
			selectedElement.removeAttributeNS(null, "onmouseout");
			selectedElement.removeAttributeNS(null, "onmouseup");
			selectedElement.removeAttribute("filter");
			selectedElement = 0;
		}
	}

	function selectElement(evt) {
		selectedElement = evt.target;

		while (selectedElement.nodeName != "g") {
			selectedElement = selectedElement.parentNode;
		}

		var parent = selectedElement.parentNode;
		parent.removeChild(selectedElement);
		parent.appendChild(selectedElement);

		selectedElement.setAttribute("filter","url(#fdrop)");

		var ele = findElement(selectedElement);

		offsetX = evt.layerX - ele.x;
		offsetY = evt.layerY - ele.y;
		currentX = evt.layerX;
		currentY = evt.layerY;
		currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
		console.log(evt);
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
		var op = new VedenOperator("+", 110, 10);
		var op2 = new VedenOperator("-", 110, 200);
		var obs1 = new VedenObservable("turtle_position_x", 140, 10);
		var obs2 = new VedenObservable("turtle_position_y", 21, 10);
		var group1 = new VedenExpGroup(100,100);
		svg1.append(op.element);
		svg1.append(op2.element);
		svg1.append(obs1.element);
		svg1.append(obs2.element);
		svg1.append(group1.element);

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
