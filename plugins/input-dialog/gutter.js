
function changeClass(ele, c, add) {
	var list = ele.className.split(" ");
	var ix = list.indexOf(c);
	if (ix == -1) {
		if (add) {
			list.push(c);
			ele.className = list.join(" ");
		}
	} else {
		if (!add) {
			list.splice(ix,1);
			ele.className = list.join(" ");
		}
	}
}

function EdenScriptGutter(parent) {
	var me = this;
	this.$gutter = $('<div class="eden-gutter"></div>');
	this.gutter = this.$gutter.get(0);
	parent.insertBefore(this.gutter, parent.firstChild);

	this.ast = undefined;
	this.lines = [];

	var dragselect = false;
	var dragselectcount = 0;
	var holdtimeout;

	function onHold() {
		console.log("GUTTER HOLD");
		holdtimeout = undefined;

		for (var i=0; i<me.lines.length; i++) {
			if (me.lines[i].selected) {
				changeClass(me.gutter.childNodes[i], "select", false);
				changeClass(me.gutter.childNodes[i], "live", true);
				me.lines[i].selected = false;
				me.lines[i].live = true;
			}
		}
	}

	this.$gutter
	.on('mousedown', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		if (me.ast.lines[line]) {
			var lines = me.ast.getBlockLines(line);
			for (var i=lines[0]; i<=lines[1]; i++) {
				me.lines[i].selected = !me.lines[i].selected;
				changeClass(me.gutter.childNodes[i], "select", me.lines[i].selected);
				changeClass(me.gutter.childNodes[i], "hover", false);
			}
		}
		
		dragselecting = false;
		dragselect = true;
		holdtimeout = setTimeout(onHold, 2000);
	})
	.on('mouseup', '.eden-gutter-item', function(e) {
		if (!dragselecting) {
			//changeClass(e.target, "select", false);
			me.executeSelected();
			clearTimeout(holdtimeout);
			holdtimeout = undefined;
		}
		dragselect = false;
	})
	.on('mouseenter', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		if (dragselect) {
			if (me.ast.lines[line]) {
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					me.lines[i].selected = true;
					changeClass(me.gutter.childNodes[i], "select", me.lines[i].selected);
					changeClass(me.gutter.childNodes[i], "hover", false);
				}
				//me.lines[line].selected = !me.lines[line].selected;
				//changeClass(e.target, "select", me.lines[line].selected);
				dragselectcount++;
			}
		} else {
			if (me.ast.lines[line]) {
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", true);
				}
			}
		}
	})
	.on('mouseleave', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		if (dragselect) dragselecting = true;
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		if (!dragselect) {
			if (me.ast.lines[line]) {
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", false);
				}
			}
		}
	});
}



EdenScriptGutter.prototype.executeSelected = function() {
	console.log("Execute Selected");
	console.log(this.lines);
	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i].selected) {
			var sellines = this.ast.getBlockLines(i);
			for (var j=sellines[0]; j<=sellines[1]; j++) {
				this.lines[j].selected = false;
				changeClass(this.gutter.childNodes[j], "select", false);
			}
			this.ast.executeLine(i);
		}
	}
}


EdenScriptGutter.prototype.generate = function(ast, lineno) {
	this.ast = ast;
	/*var linediff = ast.lines.length - this.gutter.childNodes.length;

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
	}*/

	// Reset all lines if number of lines changes
	if (ast.lines.length != this.gutter.childNodes.length) {
		while (this.gutter.firstChild) {
			this.gutter.removeChild(this.gutter.firstChild);
		}
		for (var i=0; i<ast.lines.length; i++) {
			var ele = document.createElement("div");
			ele.className = "eden-gutter-item";
			ele.setAttribute("data-line", ""+i);
			this.gutter.appendChild(ele);
			this.lines.push({selected: false, live: false});
		}
	}

	for (var i=0; i<ast.lines.length; i++) {
		//this.gutter.appendChild(document.createElement("div"));
		var className = "eden-gutter-item";
		var content = "";
		/*if (i == lineno-1) {
			className += " eden-gutter-current";
		}*/
		if (ast.lines[i]) {
			var stat = ast.lines[i];

			if (stat.errors.length > 0) {
				className += " eden-gutter-errorblock";
				if (stat.errors[0].line == i+1) {
					className += " eden-gutter-error";
					content = "&#xf06a";
				} else if (stat.errors[0].type == "runtime") {
					className += " eden-gutter-error";
					content = "&#xf06a";
				}
			} else {
				if (stat.type == "assignment" && stat.value === undefined && stat.compiled) {
					className += " eden-gutter-warning";
					content = "&#xf071";
				}
				if (stat.executed == 1) {
					className += " eden-gutter-executed";
				} else if (stat.executed == 2) {
					className += " eden-gutter-guarded";
				} else if (stat.executed == 3) {
					className += " eden-gutter-errorblock";
				}
			}
		}

		if (className != "eden-gutter-item") {
			if (content == "") {
				var newnode = document.createElement("div");
				newnode.className = className;
				newnode.innerHTML = "";
				newnode.setAttribute("data-line", ""+i);
				//newnode.setAttribute("draggable", true);
				//this.gutter.childNodes[i].className = className;
				//this.gutter.childNodes[i].innerHTML = content;
				this.gutter.replaceChild(newnode, this.gutter.childNodes[i]);
			} else {
				this.gutter.childNodes[i].className = className;
				this.gutter.childNodes[i].innerHTML = content;
			}
		} else {
			this.gutter.childNodes[i].innerHTML = "";
			this.gutter.childNodes[i].className = this.gutter.childNodes[i].className.replace(" eden-gutter-errorblock","").replace(" eden-gutter-error","");
		}
	}
}
