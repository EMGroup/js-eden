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

