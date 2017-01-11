Eden.Selectors.IntersectionNode = function(a,b) {
	this.type = "intersection";
	this.children = [a,b];
}

Eden.Selectors.IntersectionNode.prototype.append = function(node) {
	if (!node) return this;
	switch(node.type) {
	case "direct"	:
	case "indirect"	:	node.prepend(this); return node;
	}

	this.children.push(node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.prepend = function(node) {
	this.children.splice(0,0,node);
	return this;
}

Eden.Selectors.IntersectionNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();

	for (var i=0; i<this.children.length; i++) {
		statements = this.children[i].filter(statements);
	}

	return statements;
}

