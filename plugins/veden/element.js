function inherits(child, parent) {
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
};


Veden.Element = function(type, x, y, width, height) {
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
};

Veden.Element.prototype.move = function(x, y) {
	this.x = x;
	this.y = y;
	this.element.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
}

Veden.Element.prototype.attach = function(destpoint, srcpoint, srcelement) {
	//console.log("Attach: " + destpoint.element);

	if (destpoint.external == false) {
		//srcelement.parent = this;
		//this.updateChainWidth(srcelement.chainedWidth(this));
		//this.addChild(srcelement);
		var chain = srcelement.chainedExternals();
		for (var i=0; i<chain.length; i++) {
			this.addChild(chain[i]);
			if (chain[i] !== srcelement) chain[i].dock();
		}
	} else if (this.parent) {
		//console.log("Has parent");
		//srcelement.parent = this.parent;
		//this.parent.updateChainWidth(this.chainedWidth(this.parent));
		this.parent.addChild(srcelement);
		/*var chain = srcelement.chainedExternals(this.parent);
		for (var i=0; i<chain.length; i++) {
			this.parent.addChild(chain[i]);
		}*/
	} else if (srcelement.parent) {
		//srcelement.parent.addChild(this);
		var chain = this.chainedExternals();
		for (var i=0; i<chain.length; i++) {
			srcelement.parent.addChild(chain[i]);
			chain[i].dock();
		}
	}

	destpoint.counterpart = srcpoint;
	srcpoint.counterpart = destpoint;
	destpoint.element = srcelement;
	srcpoint.element = this;
}

Veden.Element.prototype.detachAll = function() {
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

Veden.Element.prototype.detach = function(ele) {
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].element === ele) {
			this.snappoints[i].element = undefined;
			break;
		}
	}
}

Veden.Element.prototype.accept = function(destsnapname, srcsnapname, element) {
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].name == destsnapname) {
			if (this.snappoints[i].element) return false; // && this.snappoints[i].element !== element) return false;
			if (this.snappoints[i].types && this.snappoints[i].types.indexOf(element.type) == -1) return false;
			if (this.snappoints[i].points && this.snappoints[i].points.indexOf(srcsnapname) == -1) return false;
			return true;
		}
	}
}

Veden.Element.prototype.notifyChange = function() {
	if (this.onchange) this.onchange();
	if (this.parent) this.parent.notifyChange();
}

Veden.Element.prototype.removeChild = function(child) {
	var ix = this.children.indexOf(child);
	if (ix >= 0) {
		// Also undock all subsequent children
		//for (var i=ix; i<this.children.length; i++) {
			this.children[ix].undock();
			this.children[ix].parent = undefined;
		//}

		//this.children = this.children.slice(0,ix);
		var nchildren = this.chainedInternals();
		for (var i=0; i<this.children.length; i++) {
			if (nchildren.indexOf(this.children[i]) == -1) {
				this.children[i].undock();
				this.children[i].parent = undefined;
			}
		}
		this.children = nchildren;

		// Calculate new width
		this.autoResize();

		this.notifyChange();

		//console.trace("REMOVED CHILD");
		//console.log(this.children);
	}
}

Veden.Element.prototype.addChild = function(child) {
	this.children.push(child);
	child.parent = this;
	//child.dock();
	// Calculate new width
	this.autoResize();
	//console.log(this.children);
	this.notifyChange();
}

Veden.Element.prototype.autoResize = function() {
	var nw = 0; // = this.boxConstantW;
	var nh = 0; // this.boxConstantH;
	var my = 1000;
	for (var i=0; i<this.children.length; i++) {
		//nw += this.children[i].width;
		var cpos = this.children[i].offsetPosition();
		if (cpos.y < my) my = cpos.y;
		if (this.children[i].width+cpos.x > nw) nw = this.children[i].width+cpos.x;
		if (this.children[i].height+cpos.y > nh) nh = this.children[i].height+cpos.y;
	}
	this.resize(nw+this.boxConstantW/2,nh-my+this.boxConstantH);
	if (this.parent) this.parent.autoResize();
}

Veden.Element.prototype.dock = function() {
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

Veden.Element.prototype.undock = function() {
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

Veden.Element.prototype.pagePosition = function() {
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

Veden.Element.prototype.offsetPosition = function() {
	if (!this.undocked) return {x: this.x, y: this.y};
	var px = 0;
	var py = 0;
	var parent = this.parent;
	while(parent) {
		px += parent.x;
		py += parent.y;
		parent = parent.parent;
	}
	return {x: this.x-px, y: this.y-py};
}

Veden.Element.prototype.externals = function(origin) {
	var res = [];
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].element === origin) continue;
		if (this.snappoints[i].element === this.parent) continue;
		if (this.snappoints[i].external && this.snappoints[i].element) res.push(this.snappoints[i].element);
	}
	return res;
}

Veden.Element.prototype.internals = function(origin) {
	var res = [];
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].element === origin) continue;
		if (!this.snappoints[i].external && this.snappoints[i].element) res.push(this.snappoints[i].element);
	}
	return res;
}

Veden.Element.prototype.chainedExternals = function(origin) {
	var ext = this.externals(origin);
	var res = [this];
	for (var i=0; i<ext.length; i++) {
		//res.push(ext[i]);
		res.push.apply(res, ext[i].chainedExternals(this));
	}
	return res;
}

Veden.Element.prototype.chainedInternals = function(origin) {
	var ext = this.internals(origin);
	var res = [];
	for (var i=0; i<ext.length; i++) {
		//res.push(ext[i]);
		res.push.apply(res, ext[i].chainedExternals(this));
	}
	return res;
}

Veden.Element.prototype.chainedDeltaMove = function(dx, dy, origin) {
		//console.log("chainedMove: " + dx);
		//this.move(this.x + dx, this.y + dy);
		var chain = this.chainedExternals(origin);
		for (var i=0; i<chain.length; i++) {
			chain[i].move(chain[i].x+dx, chain[i].y+dy);
		}
}

Veden.Element.prototype.chainedWidth = function(origin) {
	var ext = this.chainedExternals(origin);
	var res = 0;
	for (var i=0; i<ext.length; i++) {
		res += ext[i].width;
	}
	return res;
}

Veden.Element.prototype.deltaAll = function(dw,cw,dh,ch) {
	for (var i=0; i<this.snappoints.length; i++) {
		// TODO UPDATE SNAPPOINT HEIGHT
		//if (this.snappoints[i].name == "right") {
			//this.snappoints[i].x = this.width;
			//console.log(this.snappoints[i]);
			if (this.snappoints[i].element) { // && this.snappoints[i].external) {
				this.snappoints[i].element.chainedDeltaMove((dw*this.snappoints[i].mx)+cw, (dh*this.snappoints[i].my)+ch, this);
			}
		//}
	}
}

Veden.Element.prototype.autoMove = function(origin) {
	for (var i=0; i<this.snappoints.length; i++) {
		// TODO UPDATE SNAPPOINT HEIGHT
		//if (this.snappoints[i].name == "right") {
			//this.snappoints[i].x = this.width;
			//console.log(this.snappoints[i]);
			var ele = this.snappoints[i].element;
			var src = this.snappoints[i].counterpart;
			var dest = this.snappoints[i];
			if (ele && ele !== origin && ele !== this.parent) { // && this.snappoints[i].external) {
				var destpos = (this.snappoints[i].external) ? this.offsetPosition() : {x:0,y:0};
				console.log("Move SNAP: " + ele.type + "->" + dest.name + "("+(destpos.x + dest.getX() - src.getX())+","+(destpos.y + dest.getY() - src.getY())); 
				ele.move(destpos.x + dest.getX() - src.getX(), ele.y = destpos.y + dest.getY() - src.getY());
				ele.autoMove(this);
			}
		//}
	}
}

Veden.Element.prototype.resize = function(nw,nh) {
	if (nw < this.minWidth) nw = this.minWidth;
	if (nh < this.minHeight) nh = this.minHeight;

	var dw = nw - this.width;
	var dh = nh - this.height;
	this.width = nw;
	this.height = nh;
	if (this.boxIndex >= 0) {
		this.element.childNodes[this.boxIndex].setAttribute("width", this.width);
		this.element.childNodes[this.boxIndex].setAttribute("height", this.height);
		//this.element.childNodes[this.boxIndex].setAttribute("y", ""+((this.minHeight - this.height) / 2));
		//this.element.childNodes[0].setAttribute("ry", this.height/2);
		this.move(this.x, this.y - (dh / 2))
	}
	if (dw || dh) this.autoMove();
	//this.deltaAll(dw,0,dh,0);
	//this.move(this.x, this.y - (dh / 2));
	/*for (var i=0; i<this.children.length; i++) {
		this.children[i].x *= dw;
		this.children[i].y *= dh;
	}*/

	if (this.onresize) this.onresize();
}

Veden.Element.prototype.snap = function(ele, dest, src) {
	if (typeof(dest) == "string") {
		for (var i=0; i<this.snappoints.length; i++) {
			if (this.snappoints[i].name == dest) {
				dest = this.snappoints[i];
				break;
			}
		}
	}

	if (typeof(src) == "string") {
		for (var i=0; i<ele.snappoints.length; i++) {
			if (ele.snappoints[i].name == src) {
				src = ele.snappoints[i];
				break;
			}
		}
	}

	var destpos = this.pagePosition();
	ele.x = destpos.x + dest.getX() - src.getX();
	ele.y = destpos.y + dest.getY() - src.getY();

	if (src.element === undefined) {
		//ele.attach(snaps.srcsnap, snaps.destsnap, snaps.destelement);
		this.attach(dest, src, ele);
	}

	//destpos = this.pagePosition();
	//ele.x = destpos.x + dest.getX() - src.getX();
	//ele.y = destpos.y + dest.getY() - src.getY();
}
