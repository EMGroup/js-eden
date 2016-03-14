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
	this.onattach = undefined;
	this.ondetach = undefined;
	this.onattachchild = undefined;
	this.ondetachchild = undefined;
	this.blockType = 0;
};

Veden.Element.BLOCKTYPE_BASIC = 0;
Veden.Element.BLOCKTYPE_SINGLE = 1;
Veden.Element.BLOCKTYPE_VERTICAL = 2;
Veden.Element.BLOCKTYPE_HORIZONTAL = 3;
Veden.Element.BLOCKTYPE_MULTI = 4;

Veden.Element.prototype.move = function(x, y) {
	this.x = x;
	this.y = y;
	// Update the SVG
	this.element.setAttribute("transform","matrix(1 0 0 1 "+this.x+" "+this.y+")");
}

/**
 * Attaches a node, currently being dragged or created, to this node. This
 * function must add the whole chain of elements connected to this new element
 * to the parent element of this element if there is one.
 */
Veden.Element.prototype.attach = function(destpoint, srcpoint, srcelement) {
	// The element is being connected inside this element...
	if (destpoint.external == false) {
		var chain = srcelement.chainedExternals();
		// So this element is the parent to which the chain is added
		for (var i=0; i<chain.length; i++) {
			this.addChild(chain[i]);
			if (chain[i] !== srcelement) chain[i].dock();
		}
	// This element has a parent that must also become the parent of the
	// new element being attached.
	} else if (this.parent) {
		this.parent.addChild(srcelement);
		/*var chain = srcelement.chainedExternals(this.parent);
		for (var i=0; i<chain.length; i++) {
			this.parent.addChild(chain[i]);
		}*/
	// The element being attached already has a parent so add this elements
	// chain to it.
	} else if (srcelement.parent) {
		//srcelement.parent.addChild(this);
		var chain = this.chainedExternals();
		for (var i=0; i<chain.length; i++) {
			srcelement.parent.addChild(chain[i]);
			chain[i].dock();
		}
	}

	// Update the snap points to link them together
	destpoint.counterpart = srcpoint;
	srcpoint.counterpart = destpoint;
	destpoint.element = srcelement;
	srcpoint.element = this;

	// Now call event handlers to complete attachment.
	if (this.onattach) this.onattach(destpoint);
	if (this.parent) this.parent.notifyAttachChild(destpoint);
}

Veden.Element.prototype.shiftVertical = function() {
	var curtop = this.boxConstantH/2;

	for (var i=0; i<this.snappoints.length; i++) {
		var extents;
		if (this.snappoints[i].element) {
			extents = this.snappoints[i].element.relativeChainExtent(this);
		} else {
			extents = {x: this.snappoints[i].getX(), y: this.snappoints[i].getY()-10, width: 0, height: this.snappoints[i].getY()+10};
		}
		
		// Amount to move subsequent snappoint down (should not be negative).
		extents.height = extents.height - this.snappoints[i].getY() + 10;
		// Amount to shift snappoint down (should not be negative)
		extents.y = this.snappoints[i].getY() - extents.y;
		//console.log(JSON.stringify(extents));

		if (this.snappoints[i].external) {
			curtop += extents.height-35 + ((i==0) ? 10 : 5);
		} else {
			this.snappoints[i].cy = curtop+extents.y;
			curtop += extents.y+extents.height-10 + ((i==0) ? 10 : 5);
		}
	}

	this.autoMove();
	this.minHeight = curtop;
	this.resize(this.width, 0);
}

Veden.Element.prototype.notifyAttachChild = function(point) {
	if (this.blockType == Veden.Element.BLOCKTYPE_VERTICAL) {
		this.shiftVertical();
	}

	if (this.onattachchild) this.onattachchild(point);
	if (this.parent) this.parent.notifyAttachChild(point);
}

Veden.Element.prototype.notifyDetachChild = function() {
	if (this.blockType == Veden.Element.BLOCKTYPE_VERTICAL) {
		this.shiftVertical();
	}

	if (this.ondetachchild) this.ondetachchild();
	if (this.parent) this.parent.notifyDetachChild();
}


Veden.Element.prototype.detachAll = function() {
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].element && this.snappoints[i].external && !this.snappoints[i].strong) {
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
		var p = this.parent;
		this.parent.removeChild(this);
		p.notifyDetachChild();
	}
	//this.parent = undefined;
}

Veden.Element.prototype.detach = function(ele) {
	for (var i=0; i<this.snappoints.length; i++) {
		if (this.snappoints[i].element === ele) {
			if (this.ondetach) this.ondetach(this.snappoints[i]);
			this.snappoints[i].element = undefined;
			break;
		}
	}
}

Veden.Element.prototype.accept = function(destsnap, srcsnap, element) {
	/*if (destsnap.element) return false; // && this.snappoints[i].element !== element) return false;
	if (destsnap.types && destsnap.types.indexOf(element.type) == -1) return false;
	if (destsnap.points && destsnap.points.indexOf(srcsnap.name) == -1) return false;
	return true;*/
	return destsnap.accept(srcsnap) && srcsnap.accept(destsnap);
}

Veden.Element.prototype.notifyChange = function() {
	if (this.onchange) this.onchange();
	if (this.parent) this.parent.notifyChange();
}

Veden.Element.prototype.removeChild = function(child) {
	var ix = this.children.indexOf(child);
	if (ix >= 0) {
		// Undock the child
		this.children[ix].undock();
		this.children[ix].parent = undefined;

		// Undock all elements that should no longer be connected
		var nchildren = this.chainedInternals();
		for (var i=0; i<this.children.length; i++) {
			if (nchildren.indexOf(this.children[i]) == -1) {
				this.children[i].undock();
				this.children[i].parent = undefined;
			}
		}
		this.children = nchildren;

		// Calculate new width and height
		this.autoResize();

		this.notifyChange();
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

/**
 * When a child element is added or removed, the size of the parent element
 * must be recalculated by finding maximum extents.
 */
Veden.Element.prototype.autoResize = function() {
	var nw = 0;
	var nh = 0;
	var my = 1000;
	var mx = 1000;
	for (var i=0; i<this.children.length; i++) {
		var cpos = this.children[i].offsetPosition();
		if (cpos.y < my) my = cpos.y;
		if (cpos.x < mx) mx = cpos.x;
		if (this.children[i].width+cpos.x > nw) nw = this.children[i].width+cpos.x;
		if (this.children[i].height+cpos.y > nh) nh = this.children[i].height-my+cpos.y;
	}

	// Do the actual resize using the calculated extents
	this.resize(nw+this.boxConstantW/2,nh+this.boxConstantH);
	// Propagate the resize
	if (this.parent) this.parent.autoResize();
}

/**
 * Dock an element into its attached parent element instead of it being
 * free floating. Dragged elements are undocked for moving and re-docked
 * when dragging stops and if they are attached.
 */
Veden.Element.prototype.dock = function() {
	if (!this.undocked) return;

	// Only dock if there is a parent.
	if (this.parent) {
		// Remove element from SVG root
		var parent = this.element.parentNode;
		parent.removeChild(this.element);

		// Calculate element absolute positions
		var pPos = this.parent.pagePosition();
		var ePos = this.pagePosition();

		// Move to position relative to parent
		this.move(ePos.x - pPos.x, ePos.y - pPos.y);

		// Embedd this element into its parent SVG node.
		this.parent.element.appendChild(this.element);
	}
	this.undocked = false;
}

/**
 * Undock this element from its parent node and place it floating in the root
 * SVG node.
 */
Veden.Element.prototype.undock = function() {
	if (this.undocked) return;
	this.undocked = true;

	// Detach from parent SVG node
	var parentnode = this.element.parentNode;
	parentnode.removeChild(this.element);
	var parent = this;
	var px = 0;
	var py = 0;
	// Calculate parent page position
	while (parent.parent) {
		parent = parent.parent;
		px += parent.x;
		py += parent.y;
	}
	
	// Move this element relative to absolute page position.
	this.move(this.x+px, this.y+py);
	if (parent !== this) parentnode = parent.element.parentNode;
	// Attach to root SVG
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

/**
 * Get a list of all attached external elements to this node, possibly
 * excluding one origin node to prevent cycles.
 */
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

/**
 * Get a list of all elements reachable from external attachment points,
 * except for the parent element wherever it attaches.
 */
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

/*Veden.Element.prototype.chainedDeltaMove = function(dx, dy, origin) {
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

Veden.Element.prototype.chainedHeight = function(origin) {
	var ext = this.chainedExternals(origin);
	var res = 0;
	for (var i=0; i<ext.length; i++) {
		if (ext[i].height > res) res = ext[i].height;
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
}*/

Veden.Element.prototype.relativeChainExtent = function(origin) {
	var x = 1000;
	var y = 1000;
	var width = 0;
	var height = 0;

	var chain = this.chainedExternals(origin);
	for (var i=0; i<chain.length; i++) {
		//if (chain[i] === this) continue;
		var cpos = chain[i].offsetPosition();
		if (cpos.y < y) y = cpos.y;
		if (cpos.x < x) x = cpos.x;
		if (chain[i].width+cpos.x > width) width = chain[i].width+cpos.x;
		if (chain[i].height+cpos.y > height) height = chain[i].height+cpos.y;
	}

	return {x: x, y: y, width: width, height: height};
}

Veden.Element.prototype.autoMove = function(origin, snap) {
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
				//console.log("Move SNAP: " + ele.type + "->" + dest.name + "("+(destpos.x + dest.getX() - src.getX())+","+(destpos.y + dest.getY() - src.getY())); 
				ele.move(destpos.x + dest.getX() - src.getX(), ele.y = destpos.y + dest.getY() - src.getY());
				ele.autoMove(this, src);
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
	}
	//this.move(this.x, this.y - (dh / 2));
	if (this.blockType == Veden.Element.BLOCKTYPE_SINGLE) this.move(this.x, this.y - (dh / 2));
	if (dw || dh) this.autoMove();

	if (this.onresize) this.onresize(dw,dh);
}

Veden.Element.prototype.snap = function(ele, dest, src) {
	if (typeof(dest) == "string") {
		for (var i=this.snappoints.length-1; i>=0; i--) {
			if (this.snappoints[i].name == dest) {
				dest = this.snappoints[i];
				break;
			}
		}
	}

	if (typeof(src) == "string") {
		for (var i=ele.snappoints.length-1; i>=0; i--) {
			if (ele.snappoints[i].name == src) {
				src = ele.snappoints[i];
				break;
			}
		}
	}

	if (dest.getX === undefined || src.getX === undefined) {
		console.error("Missing a named snap point: "+dest+"<-"+src+" for "+ele.type);
		return;
	}

	var destpos = this.pagePosition();
	ele.x = destpos.x + dest.getX() - src.getX();
	ele.y = destpos.y + dest.getY() - src.getY();

	if (src.element === undefined) {
		//ele.attach(snaps.srcsnap, snaps.destsnap, snaps.destelement);
		this.attach(dest, src, ele);
	}

	destpos = this.pagePosition();
	ele.x = destpos.x + dest.getX() - src.getX();
	ele.y = destpos.y + dest.getY() - src.getY();
}
