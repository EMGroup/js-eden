Eden.Selectors.IntersectionNode = function(a,b) {
	this.type = "intersection";
	this.children = [a,b];
}

Eden.Selectors.IntersectionNode.prototype.append = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "navigate"	:	node.prepend(this); return node;
	}

	this.children.push(node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.prepend = function(node) {
	this.children.splice(0,0,node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.filter = function(statements, context) {
	//if (!statements) return this.construct();

	for (var i=0; i<this.children.length; i++) {
		statements = this.children[i].filter(statements, context);
	}

	return (statements) ? statements : [];
}

Eden.Selectors.IntersectionNode.prototype.construct = function() {
	// Determine best order of properties
	// Possibly compile a query function if the query is complex?
}

