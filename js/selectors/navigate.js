Eden.Selectors.NavigateNode = function(direction, deep) {
	this.type = "navigate";
	this.left = undefined;
	this.right = undefined;
	this.direction = direction;
	this.deep = deep;
}

Eden.Selectors.NavigateNode.prototype.append = function(node) {
	if (!node) return this;
	if (this.right) this.right.append(node);
	else this.right = node;
	return this;
}

Eden.Selectors.NavigateNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (this.left) this.left = this.left.prepend(node);
	else this.left = node;
	return this;
}

Eden.Selectors.NavigateNode.prototype.filter = function(statements, context) {
	if (!statements && this.left === undefined) {
		if (this.right) return this.right.filter(statements,context).filter(function(stat) {
			return stat.parent !== undefined;
		});
		else return [];
	}

	var lstats;
	if (this.left === undefined) {
		lstats = statements.filter(function(stat) {
			return stat.parent !== undefined;
		});		
	} else {
		lstats = this.left.filter(statements,context);
	}

	var stats = Eden.Selectors.getChildren(lstats, this.deep);
	if (this.right) return this.right.filter(stats,context);
	else return stats;
}

Eden.Selectors.NavigateNode.prototype.construct = function() {
	console.log("Construct direct children");
	return [];
}

