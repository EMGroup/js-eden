Eden.Selectors.NavigateNode = function(direction, deep) {
	this.type = "navigate";
	this.left = undefined;
	this.right = undefined;
	this.direction = direction;
	this.deep = deep;
	this.local = false;
}

Eden.Selectors.NavigateNode.prototype.append = function(node) {
	if (!node) return this;
	if (node.local) this.local = true;
	if (node.type == "union") {
		node.prepend(this);
		return node;
	} else {
		if (this.right) this.right.append(node);
		else this.right = node;
		return this;
	}
}

Eden.Selectors.NavigateNode.prototype.prepend = function(node) {
	if (!node) return this;
	if (node.local) this.local = true;
	if (this.left) this.left = this.left.prepend(node);
	else this.left = node;
	return this;
}

Eden.Selectors.NavigateNode.prototype.filter = function(statements, context) {
	if (this.direction == ">") {
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
	} else if (this.direction == "<") {
		if (!statements && this.left === undefined) {
			if (this.right) return this.right.filter(statements,context).filter(function(stat) {
				return stat.type == "script" || stat.type == "when" || stat.type == "if" || stat.type == "for";
			});
			else return Eden.Index.getAll().filter(function(stat) {
				return stat.type == "script" || stat.type == "when" || stat.type == "if" || stat.type == "for";
			});
		}

		var lstats;
		if (this.left === undefined) {
			lstats = statements.filter(function(stat) {
				return stat.type == "script" || stat.type == "when" || stat.type == "if" || stat.type == "for";
			});		
		} else {
			lstats = this.left.filter(statements,context);
		}

		if (this.deep) {
			var res = [];
			for (var i=0; i<lstats.length; i++) {
				var stat = lstats[i];

				while (stat.parent) {
					if (stat.parent.type == "script" && stat.parent.parent && stat.parent.parent.type != "script") {
						if (stat.parent.parent.type == "codeblock") {
							stat = stat.parent.parent.parent;
							res.push(stat);
						} else {
							stat = stat.parent.parent;
							res.push(stat);
						}
					} else if (stat.parent.type == "codeblock") {
						stat = stat.parent.parent;
						res.push(stat);
					} else {
						stat = stat.parent;
						res.push(stat);
					}
				}
			}

			if (this.right) return this.right.filter(res,context);
			else return res;
		} else {
			var res = [];
			for (var i=0; i<lstats.length; i++) {
				if (lstats[i].parent) {
					if (lstats[i].parent.type == "script" && lstats[i].parent.parent && lstats[i].parent.parent.type != "script") {
						if (lstats[i].parent.parent.type == "codeblock") res.push(lstats[i].parent.parent.parent);
						else res.push(lstats[i].parent.parent);
					} else if (lstats[i].parent.type == "codeblock") {
						res.push(lstats[i].parent.parent);
					} else {
						res.push(lstats[i].parent);
					}
				}
			}

			if (this.right) return this.right.filter(res,context);
			else return res;
		}
	}
}

Eden.Selectors.NavigateNode.prototype.construct = function() {
	console.log("Construct direct children");
	return [];
}

