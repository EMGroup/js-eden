Eden.Selectors.IntersectionNode = function(a,b) {
	this.type = "intersection";
	this.children = [a,b];
	this.local = false;
}

Eden.Selectors.IntersectionNode.prototype.append = function(node) {
	if (!node) return this;

	if (node.local) this.local = true;
	
	switch(node.type) {
	case "navigate"	:	node.prepend(this); return node;
	}

	this.children.push(node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (node.local) this.local = true;
	this.children.splice(0,0,node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.filter = function(statements, context) {
	return new Promise((resolve,reject) => {
		//if (!statements) return this.construct();
		//if (!statements) statements = [];

		let p1 = (i, s) => {
			if (i < this.children.length) {
				this.children[i].filter(s, context).then(ss => {
					p1(++i, ss);
				});
			} else {
				console.log("INTERSECTION", s);
				resolve((s) ? s : []);
			}
		};

		p1(0, statements);
	});
}

Eden.Selectors.IntersectionNode.prototype.construct = function() {
	// Determine best order of properties
	// Possibly compile a query function if the query is complex?
}

