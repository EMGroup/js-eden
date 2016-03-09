Veden = {};

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

EdenUI.plugins.Veden = function(edenUI, success) {
	var me = this;
	var selectedElement = 0;
	var currentX = 0;
	var currentY = 0;
	var offsetX = 0;
	var offsetY = 0;
	var currentMatrix = 0;
	var lastsnap = undefined;


	////////////////////////////////////////////////////////////////////////////

	var elementFactory = {
		"statement": Veden.Statement,
		"modifier": Veden.Modifier,
		"number": Veden.Number,
		"observable": Veden.Observable,
		"lvalue": Veden.LValue,
		"operator": Veden.Operator,
		"index": Veden.ListIndex,
		"group": Veden.ExpGroup
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

	this.createCommon = function(name,mtitle, code) {
		var elements = [];

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
					snaps.destelement.snap(ele, snaps.destsnap, snaps.srcsnap);

					// Now repeat snaps check to find any at distance 0
					snaps = checkSnaps(ele, near);
					while (snaps && snaps.dist == 0) {
						//ele.snap(snaps.destelement, snaps.srcsnap, snaps.destsnap);
						snaps.destelement.snap(ele, snaps.destsnap, snaps.srcsnap);
						snaps = checkSnaps(ele, near);
					}

					/*if (lastsnap && snaps.destsnap !== lastsnap.destsnap) {
						ele.notifyChange();
					}
					lastsnap = snaps;*/
				} else {
					/*if (lastsnap) {
						ele.notifyChange();
					}
					lastsnap = undefined;*/
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


		var code_entry = $('<div id=\"'+name+'-content\" class=\"veden-content\"></div>');
		var svg1 = $('<svg width="100%" height="100%" version="1.1"\
			 baseProfile="full"\
			 xmlns="http://www.w3.org/2000/svg">\
			<defs>\
    <filter id="fdrop" x="0" y="0" width="200%" height="200%">\
      <feOffset result="offOut" in="SourceGraphic" dx="5" dy="5" />\
	  <feColorMatrix result="matrixOut" in="offOut" type="matrix"\
		values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />\
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
  </defs>\
		</svg>');
		code_entry.append(svg1);

		function makeElement(type, data, x, y) {
			var ele = new elementFactory[type](data, x, y);
			elements.push(ele);
			svg1.append(ele.element);
			ele.element.onmousedown = selectElement;
			return ele;
		}

		function generate(str) {
			var stream = new EdenStream(str);
			var data = new EdenSyntaxData();
			stream.data = data;
			var estack = [];
			var lasty = 10;
			var lastheight = 0;
			var statements = [];

			function pushElement(ele, a, b) {
				ele.undocked = true;
				estack[estack.length-1].snap(ele, a, b);
				ele.dock();
				estack.push(ele);
			}
			
			while (stream.valid()) {
				var token = stream.readToken();
				if (estack.length == 0) estack.push(makeElement("statement",undefined,10,lasty+lastheight+5));
				statements.push(estack[estack.length-1]);

				if (token == "OBSERVABLE" && estack[estack.length-1].type == "group") {
					pushElement(makeElement("observable", data.value, 10, 10), "inside", "left");
				} else if (token == "OBSERVABLE" && estack[estack.length-1].type == "statement") {
					pushElement(makeElement("lvalue", data.value, 10, 10), "lvalue", "left");
				} else if (token == "OBSERVABLE") {
					pushElement(makeElement("observable", data.value, 10, 10), "right", "left");
				} else if (token == "is") {
					pushElement(makeElement("modifier", "is", 10, 10), "right", "left");
				} else if (token == "=") {
					pushElement(makeElement("modifier", "=", 10, 10), "right", "left");
				} else if (token == "NUMBER" && estack[estack.length-1].type == "group") {
					pushElement(makeElement("number", data.value, 10, 10), "inside", "left");
				} else if (token == "NUMBER") {
					pushElement(makeElement("number", data.value, 10, 10), "right", "left");
				} else if (token == ";") {
					lastheight = estack[0].height;
					lasty = estack[0].y;
					estack = [];
				} else if (token == "+") {
					pushElement(makeElement("operator", "\u002B", 10, 10), "right", "left");
				} else if (token == "-") {
					pushElement(makeElement("operator", "\u2212", 10, 10), "right", "left");
				} else if (token == "*") {
					pushElement(makeElement("operator", "\u00D7", 10, 10), "right", "left");
				} else if (token == "/") {
					pushElement(makeElement("operator", "\u00F7", 10, 10), "right", "left");
				} else if (token == "//") {
					pushElement(makeElement("operator", "\u2981", 10, 10), "right", "left");
				} else if (token == "(") {
					pushElement(makeElement("group", undefined, 10, 10), "right", "left");
				} else if (token == ")") {
					while (estack.length > 0 && estack[estack.length-1].type != "group") estack.pop();
					if (estack.length > 0) estack.pop();
				}
			}
		}

		/*makeElement("operator", "\u002B", 10, 10);
		makeElement("operator", "\u2212", 50, 10);
		makeElement("operator", "\u00D7", 90, 10);
		makeElement("operator", "\u00F7", 130, 10);
		makeElement("operator", "\u2981", 170, 10);
		makeElement("observable", "turtle_position_x", 10, 70);
		makeElement("observable", "turtle_position_y", 150, 70);
		makeElement("observable", "mouse_y", 10, 100);
		makeElement("observable", "screenWidth", 10, 130);
		makeElement("lvalue", "mouse_x", 150, 100);
		makeElement("number", 10, 80, 100);
		makeElement("group", undefined, 10, 160);
		makeElement("group", undefined, 10, 200);
		makeElement("statement", "is", 10, 280);
		makeElement("modifier", "is", 200, 280);*/

		//generate("turtle_position_x = 100;\nturtle_position_y = 100;\nturtle_size = 1.0;");
		if (code) generate(code);

		return {confirmClose: false, contents: code_entry};
	}

	this.createDialog = function(name, mtitle) {
		var viewdata = me.createCommon(name,mtitle);

		$('<div id="'+name+'"></div>')
			.html(viewdata.contents)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "veden-dialog"
			});
		return viewdata;
	}

	this.createEmbedded = function(name, mtitle, code) {
		var viewdata = me.createCommon(name, mtitle, code);
		return viewdata;
	}

	//Register the DBView options
	edenUI.views["Veden"] = {dialog: this.createDialog, embed: this.createEmbedded, title: "Visual Eden", category: edenUI.viewCategories.interpretation};

	success();
}

/* Plugin meta information */
EdenUI.plugins.Veden.title = "Veden";
EdenUI.plugins.Veden.description = "Visual Eden Code Editor";
