
function changeClassString(str, c, add) {
	var list = str.split(" ");
	var ix = list.indexOf(c);
	if (ix == -1) {
		if (add) {
			list.push(c);
			return list.join(" ");
		}
	} else {
		if (!add) {
			list.splice(ix,1);
			return list.join(" ");
		}
	}
	return str;
}

function changeClass(ele, c, add) {
	var res = changeClassString(ele.className, c, add);
	if (res != ele.className) {
		ele.className = res;
	}
}

function EdenScriptGutter(parent, infob) {
	var me = this;
	this.$gutter = $('<div class="eden-gutter"></div>');
	this.gutter = this.$gutter.get(0);
	parent.insertBefore(this.gutter, parent.firstChild);

	this.ast = undefined;
	this.lines = [];
	this.agents = {};

	var dragselect = false;
	var dragselectcount = 0;
	var holdtimeout;
	var downline = 0;
	var alreadyselected = false;
	var shiftdown;
	var infobox = infob;

	/**
	 * Displays the error/warning box.
	 */
	function showInfoBox(x, y, type, message) {
		if (type == "warning") {
			infobox.innerHTML = "<div class='info-warnitem'><span>"+message+"</span></div>";
		} else if (type == "error") {
			infobox.innerHTML = "<div class='info-erroritem'><span>"+message+"</span></div>";
		}
		$info = $(infobox);
		$info.css("top",""+y+"px");
		$info.css("left", ""+x+"px");
		$(infobox).show("fast");
	}

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
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));

		shiftdown = e.shiftKey;
		downline = line;
		alreadyselected = (me.lines[line]) ? me.lines[line].selected : false;

		// There is a statement on this line.
		if (me.ast.lines[line]) {
			// For all lines associated with this statement block...
			var lines = me.ast.getBlockLines(line);
			for (var i=lines[0]; i<=lines[1]; i++) {
				// Invert selection if shift key
				if (shiftdown) me.lines[i].selected = !me.lines[i].selected;
				else me.lines[i].selected = true;

				// Update style
				changeClass(me.gutter.childNodes[i], "select", me.lines[i].selected);
				changeClass(me.gutter.childNodes[i], "hover", false);
			}

			// If live already and no shift key
			if (me.lines[line].live && !shiftdown) {
				// Make all lines of this statement block non-live
				for (var i=lines[0]; i<=lines[1]; i++) {
					me.lines[i].live = false;
					changeClass(me.gutter.childNodes[i], "live", false);
				}
			}
		}
		
		// Hold for 1.5s to make live
		holdtimeout = setTimeout(onHold, 1000);
	})
	.on('click', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));

		// If there is a statement
		if (me.ast.lines[line]) {
			// And if it has errors
			if (me.ast.lines[line].errors.length > 0) {
				var err = me.ast.lines[line].errors[0];

				// If the error is on this line then display it
				if (err.line == line+1 || err.type == "runtime") {
					var taboffset = 35; // TODO (agent.state[obs_showtabs]) ? 35 : 0;
					console.error(err.prettyPrint());
					showInfoBox(e.target.offsetLeft+20, e.target.offsetTop-me.gutter.parentNode.scrollTop+25+taboffset, "error", err.messageText());
				}
			}
		}
	})
	.on('mouseup', '.eden-gutter-item', function(e) {
		if (me.ast.hasErrors()) return;

		if (!shiftdown) {
			var line = parseInt(e.target.getAttribute("data-line"));
			if (me.ast.lines[line] && me.ast.lines[line].errors.length > 0) return;
			if (me.lines[line].live) return;

			//changeClass(e.target, "select", false);
			me.executeSelected();
			if (!alreadyselected) {
				if (me.ast.lines[downline]) {
					var lines = me.ast.getBlockLines(downline);
					for (var i=lines[0]; i<=lines[1]; i++) {
						me.lines[i].selected = false;
						changeClass(me.gutter.childNodes[i], "select", false);
					}
				}
			}
		}
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		//dragselect = false;
	})
	.on('mouseenter', '.eden-gutter-item', function(e) {
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));
		/*if (dragselect) {
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
		} else {*/
			if (me.ast.lines[line]) {
				if (me.lines[line].live) {
					me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-stop'>&#xf069;</span";
				} else {
					me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-play'>&#xf04b;</span";
				}
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", true);
				}
			}
		//}
	})
	.on('mouseleave', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		//if (dragselect) dragselecting = true;
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		//if (!dragselect) {
			if (me.ast.lines[line]) {
				me.gutter.childNodes[line].innerHTML = "";
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", false);
				}
			}
		//}
	});
}



EdenScriptGutter.prototype.clear = function() {
	this.ast = undefined;
	this.lines = [];
	while (this.gutter.firstChild) {
		this.gutter.removeChild(this.gutter.firstChild);
	}
}



EdenScriptGutter.prototype.setAgent = function(name) {
	if (this.agents[name] === undefined) {
		this.agents[name] = [];
	}
	while (this.gutter.firstChild) {
		this.gutter.removeChild(this.gutter.firstChild);
	}
	this.lines = this.agents[name];
	this.agent = Eden.Agent.agents[name];
}



EdenScriptGutter.prototype.executeSelected = function() {
	if (this.agent === undefined) return;
	console.log("Execute Selected");

	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i].selected) {
			var sellines = this.ast.getBlockLines(i);
			//for (var j=sellines[0]; j<=sellines[1]; j++) {
				//this.lines[j].selected = false;
				//changeClass(this.gutter.childNodes[j], "select", false);
			//}
			this.agent.executeLine(i);
			i = sellines[1]+1;
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

	var globaldoupdate = false;

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
			if (this.lines[i] === undefined) this.lines[i] = {selected: false, live: false};
		}

		globaldoupdate = true;
	}

	for (var i=0; i<ast.lines.length; i++) {
		//this.gutter.appendChild(document.createElement("div"));
		var className = "eden-gutter-item";
		var content = "";
		var doreplace = false;
		var doupdate = globaldoupdate;
		/*if (i == lineno-1) {
			className += " eden-gutter-current";
		}*/
		if (ast.lines[i]) {
			var stat = ast.lines[i];

			if (stat.errors.length > 0) {
				className += " errorblock";
				if (stat.errors[0].line == i+1) {
					className += " error";
					content = "&#xf06a";
				} else if (stat.errors[0].type == "runtime") {
					className += " error";
					content = "&#xf06a";
				}
				doupdate = true;
			} else {
				if (stat.type == "assignment" && stat.value === undefined && stat.compiled) {
					className += " warning";
					content = "&#xf071";
					doupdate = true;
				}
				if (stat.executed == 1) {
					className += " executed";
					doreplace = true;
				} else if (stat.executed == 2) {
					className += " guarded";
					doupdate = true;
				} else if (stat.executed == 3) {
					className += " errorblock";
					doupdate = true;
				}

				// Need to remove any old error messages
				if (this.gutter.childNodes[i].className.indexOf("error") >= 0) {
					doupdate = true;
				}
			}

			if (this.lines && this.lines[i]) {
				if (this.lines[i].selected) className += " select";
				if (this.lines[i].live) {
					className += " live";
					//doreplace = false;
				}
			}
		}

		if (doreplace) {
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
		} else if (doupdate) {
			if (this.gutter.childNodes[i].className.indexOf("hover") >= 0) className += " hover";
			this.gutter.childNodes[i].innerHTML = content;
			this.gutter.childNodes[i].className = className;
		}
	}
}
