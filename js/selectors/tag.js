Eden.Selectors.TagNode = function(tag) {
	this.type = "tag";
	this.tag = tag;
	this.options = undefined;
	this.isreg = tag.indexOf("*") != -1;
	this.local = false;
}

Eden.Selectors.TagNode.prototype.filter = function(statements) {
	return new Promise((resolve, reject) => {
		if (!statements) statements = this.construct().then((statements) => {
			//resolve(this._filter(statements));
			resolve(statements);
		});
		else resolve(this._filter(statements));
	});
}

Eden.Selectors.TagNode.prototype._filter = function(statements) {
	var me = this;
	return statements.filter(function(stat) {
		return stat.doxyComment && stat.doxyComment.hasTag(me.tag);
	});
}

Eden.Selectors.TagNode.prototype.construct = function() {
	return new Promise((resolve, reject) => {
		if (this.isreg) {
			var reg = Eden.Selectors.makeRegex(this.tag);
			stats = Eden.Index.getByTagRegex(reg);
		} else {
			stats = Eden.Index.getByTag(this.tag);
		}

		if (!this.options || !this.options.history) {
			resolve(stats.filter(function(e) {
				return e.executed >= 0;
			}));
		} else resolve(stats);
	});
}

Eden.Selectors.TagNode.prototype.append = Eden.Selectors.PropertyNode.prototype.append;
Eden.Selectors.TagNode.prototype.prepend = Eden.Selectors.PropertyNode.prototype.prepend;

