Eden.Selectors.TagNode = function(tag) {
	this.type = "tag";
	this.tag = tag;
}

Eden.Selectors.TagNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();
	var me = this;
	return statements.filter(function(stat) {
		return stat.doxyComment && stat.doxyComment.hasTag(me.tag);
	});
}

Eden.Selectors.TagNode.prototype.construct = function() {
	console.log("Tag construct",this.tag);
	return [];
}

Eden.Selectors.TagNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.TagNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

