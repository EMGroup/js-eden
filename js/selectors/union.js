Eden.Selectors.UnionNode = function() {
	this.type = "union";
	this.children = [undefined];
}

Eden.Selectors.UnionNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();

	var map = {};
	for (var i=0; i<this.children.length; i++) {
		var stats = this.children[i].filter(statements);
		for (var j=0; j<stats.length; j++) {
			map[stats[j].hash] = stats[j];
		}
	}

	return Object.keys(map).map(function(e) { return map[e]; });
}

Eden.Selectors.UnionNode.prototype.construct = function() {

}

Eden.Selectors.UnionNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (this.children[0] === undefined) {
		this.children[0] = node;
		return this;
	} else {
		this.children[0] = this.children[0].prepend(node);
		return this;
	}
}

Eden.Selectors.UnionNode.prototype.append = Eden.Selectors.IntersectionNode.prototype.append;

