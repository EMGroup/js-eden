Eden.Selectors.UnionNode = function() {
	this.type = "union";
	this.children = [undefined];
	this.local = false;
}

Eden.Selectors.UnionNode.prototype.filter = function(statements, context) {
	//if (!statements) return this.construct();

	return new Promise((resolve,reject) => {
		var map = {};

		let p1 = (i) => {
			if (i < this.children.length) {
				this.children[i].filter(statements, context).then(stats => {
					for (var j=0; j<stats.length; j++) {
						map[stats[j].id] = stats[j];
					}
					p1(++i);
				});
			} else {
				resolve(Object.keys(map).map(function(e) { return map[e]; }));
			}
		};

		p1(0);
	});
}

Eden.Selectors.UnionNode.prototype.construct = function() {

}

Eden.Selectors.UnionNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (node.local) this.local = true;
	if (this.children[0] === undefined) {
		this.children[0] = node;
		return this;
	} else {
		this.children[0] = this.children[0].prepend(node);
		return this;
	}
}

//Eden.Selectors.UnionNode.prototype.append = Eden.Selectors.IntersectionNode.prototype.append;

Eden.Selectors.UnionNode.prototype.append = function(node) {
	if (!node) return this;
	if (node.local) this.local = true;
	//switch(node.type) {
	//case "navigate"	:	node.prepend(this); return node;
	//}

	this.children.push(node);
	return this;
}

