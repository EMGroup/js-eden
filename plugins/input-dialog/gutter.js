function EdenScriptGutter(parent) {
	this.$gutter = $('<div class="eden-gutter"></div>');
	this.gutter = this.$gutter.get(0);
	parent.appendChild(this.gutter);
}

EdenScriptGutter.prototype.generate = function(ast, lineno) {
	var linediff = ast.lines.length - this.gutter.childNodes.length;

	if (linediff < 0) {
		linediff = Math.abs(linediff);
		// Too many lines, remove nodes
		for (var i=0; i<linediff; i++) {
			this.gutter.removeChild(this.gutter.lastChild);
		}
	} else if (linediff > 0) {
		// Not enough lines, add nodes
		for (var i=0; i<linediff; i++) {
			var item = document.createElement("div");
			item.className = "eden-gutter-item";
			this.gutter.appendChild(item);
		}
	}

	for (var i=0; i<ast.lines.length; i++) {
		var className = "eden-gutter-item";
		var content = "";
		if (i == lineno-1) {
			className += " eden-gutter-current";
		}
		if (ast.lines[i]) {
			if (ast.lines[i].errors.length > 0) {
				className += " eden-gutter-errorblock";
				if (ast.lines[i].errors[0].line == i+1) {
					className += " eden-gutter-error";
					content = "&#xf06a";
				}
			}
			if (ast.lines[i].executed == 1) {
				className += " eden-gutter-executed";
			} else if (ast.lines[i].executed == 2) {
				className += " eden-gutter-guarded";
			}
		}

		this.gutter.childNodes[i].className = className;
		this.gutter.childNodes[i].innerHTML = content;
	}
}
