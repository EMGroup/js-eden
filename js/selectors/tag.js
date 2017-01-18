Eden.Selectors.TagNode = function(tag) {
	this.type = "tag";
	this.tag = tag;
	this.options = undefined;
	this.isreg = tag.indexOf("*") != -1;
	this.local = false;
}

Eden.Selectors.TagNode.prototype.filter = function(statements) {
	if (!statements) return this.construct();
	var me = this;
	return statements.filter(function(stat) {
		return stat.doxyComment && stat.doxyComment.hasTag(me.tag);
	});
}

Eden.Selectors.TagNode.prototype.construct = function() {
	if (this.isreg) {
		var reg = Eden.Selectors.makeRegex(this.tag);
		stats = Eden.Index.getByTagRegex(reg);
	} else {
		stats = Eden.Index.getByTag(this.tag);
	}

	if (!this.options || !this.options.history) {
		return stats.filter(function(e) {
			return e.executed >= 0;
		});
	}
	return stats;
}

Eden.Selectors.TagNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.TagNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

