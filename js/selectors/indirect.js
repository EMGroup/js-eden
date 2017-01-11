Eden.Selectors.IndirectChildNode = function(props) {
	this.type = "indirect";
	this.left = undefined;
	this.right = undefined;
}

Eden.Selectors.IndirectChildNode.prototype.append = Eden.Selectors.DirectChildNode.prototype.append;
Eden.Selectors.IndirectChildNode.prototype.prepend = Eden.Selectors.DirectChildNode.prototype.prepend;

