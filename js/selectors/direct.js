Eden.Selectors.DirectChildNode = function(props) {
	this.type = "direct";
	this.left = undefined;
	this.right = undefined;
}

Eden.Selectors.DirectChildNode.prototype.append = function(node) {
	if (!node) return this;
	if (this.right) this.right.append(node);
	else this.right = node;
	return this;
}

Eden.Selectors.DirectChildNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (this.left) this.left = this.left.prepend(node);
	else this.left = node;
	return this;
}

Eden.Selectors.DirectChildNode.prototype.filter = function(statements, context) {
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

	var stats = Eden.Selectors.getChildren(lstats, false);
	if (this.right) return this.right.filter(stats,context);
	else return stats;
}

Eden.Selectors.DirectChildNode.prototype.construct = function() {
	console.log("Construct direct children");
	return [];
}

