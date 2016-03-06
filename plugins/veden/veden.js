EdenUI.plugins.Veden = function(edenUI, success) {
	var me = this;
	var selectedElement = 0;
	var currentX = 0;
	var currentY = 0;
	var currentMatrix = 0;
	var elements = [];

	function SnapPoint(name, x, y) {
		this.name = name;
		this.x = x;
		this.y = y;
	}

	function VedenObservable(name, x, y) {
		this.type = "observable";
		this.name = name;
		this.x = x;
		this.y = y;
		this.width = 20 + (name.length * 10);
		this.height = 20;
		this.element = this.make();
		this.left = undefined;
		this.right = undefined;

		this.snappoints = [
			new SnapPoint("left", 0, this.height/2),
			new SnapPoint("right", this.width, this.height/2)
		];

		// Add to spatial datastructure ... just a list atm.
		elements.push(this);
	}

	VedenObservable.prototype.move = function(x, y) {
		this.x = x;
		this.y = y;
	}

	VedenObservable.prototype.attach = function(name, element) {
		// Remove snap point from available.
		// build AST.
	}

	VedenObservable.prototype.accept = function(snapname, element) {
		return (snapname == "left" && this.left === undefined && element.type == "operator")
				|| (snapname == "right" && this.right === undefined && element.type == "operator");
	}

	VedenObservable.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
		box.setAttribute("width", ""+this.width);
		box.setAttribute("height", "20");
		box.setAttribute("x", "0");
		box.setAttribute("y", "0");
		box.setAttribute("ry", "10");
		box.setAttribute("rx", "0");
		box.setAttribute("transform","matrix(1 0 0 1 0 0)");
		box.setAttribute("style","fill:#000038;fill-opacity:0.60301507;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

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
		this.type = "operator";
		this.op = op;
		this.x = x;
		this.y = y;
		this.width = 26;
		this.height = 16;
		this.element = this.make();

		this.left = undefined;
		this.right = undefined;

		this.snappoints = [
			new SnapPoint("left", 0, this.height/2),
			new SnapPoint("right", this.width, this.height/2)
		];

		// Add to spatial datastructure ... just a list atm.
		elements.push(this);
	}

	VedenOperator.prototype.move = function(x, y) {
		this.x = x;
		this.y = y;
	}

	VedenOperator.prototype.accept = function(snapname, element) {
		return (snapname == "left" && this.left === undefined && element.type == "observable")
				|| (snapname == "right" && this.right === undefined && element.type == "observable");
	}

	VedenOperator.prototype.make = function () {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		box.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
		box.setAttribute("style", "fill:#ff0038;fill-opacity:0.71859294;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
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

	function checkSnaps(element) {
		var dist = 5;
		var res = [];

		var near = findNear(element, dist);
		for (var i=0; i<near.length; i++) {
			for (var x=0; x<element.snappoints.length; x++) {
				for (var y=0; y<near[i].snappoints.length; y++) {
					var xx = element.snappoints[x].x + element.x;
					var xy = element.snappoints[x].y + element.y;
					var yx = near[i].snappoints[y].x + near[i].x;
					var yy = near[i].snappoints[y].y + near[i].y;
					var d = ((xx - yx) * (xx - yx) + (xy - yy) * (xy - yy));
					if (d <= dist*dist) {
						if (element.accept(element.snappoints[x].name, near[i])
							&& near[i].accept(near[i].snappoints[y].name, element)) {
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
		dx = evt.clientX - currentX;
		dy = evt.clientY - currentY;

		var ele = findElement(selectedElement);
		if (ele) {
			ele.x += dx;
			ele.y += dy;
			var snaps = checkSnaps(ele);
			if (snaps) {
				ele.x = snaps.destelement.x + snaps.destsnap.x - snaps.srcsnap.x;
				ele.y = snaps.destelement.y + snaps.destsnap.y - snaps.srcsnap.y;
			}
			/*var near = findNearest(ele);
			if (near) {
				if (ele.y > near.y) {
					ele.y = near.y + near.height;
				} else if (ele.y < near.y) {
					ele.y = near.y - ele.height;
				}

				ele.x = near.x;
			}*/
		}

		currentMatrix[4] = ele.x;
		currentMatrix[5] = ele.y;
		newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
				
		selectedElement.setAttributeNS(null, "transform", newMatrix);
		currentX = evt.clientX;
		currentY = evt.clientY;
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

		selectedElement.setAttribute("filter","url(#fdrop)");

		currentX = evt.clientX;
		currentY = evt.clientY;
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
		var obs1 = new VedenObservable("turtle_position_x", 140, 10);
		var obs2 = new VedenObservable("turtle_position_y", 21, 10);
		svg1.append(op.element);
		svg1.append(obs1.element);
		svg1.append(obs2.element);

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
