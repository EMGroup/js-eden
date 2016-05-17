
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

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

EdenUI.GutterLineState = function() {
	this.live = false;
	this.selected = false;
	this.exechash = 0;
	this.changed = false;
	this.current = false;
	this.status = 0;
	this.oldstatus = -1;
	this.isundefined = false;
	this.update = false;
	this.element = undefined;
	this.hash = 0;
}

function EdenScriptGutter(parent, infob) {
	var me = this;
	this.$gutter = $('<svg class="eden-gutter"></svg>');
	this.gutter = this.$gutter.get(0);
	parent.insertBefore(this.gutter, parent.firstChild);
	this.content = $(parent).find(".outputcontent").get(0);

	this.ast = undefined;
	this.lines = [];
	this.agents = {};

	var dragselect = false;
	var dragselectcount = 0;
	var holdtimeout;
	var downline = 0;
	var alreadyselected = false;
	var alreadylive = false;
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

	function startHover(line) {
		/*if (shiftdown && dragselect) {
			if (me.ast.lines[line]) {
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					me.lines[i].selected = !alreadyselected;
					changeClass(me.gutter.childNodes[i], "select", !alreadyselected);
					changeClass(me.gutter.childNodes[i], "hover", false);
				}
				//me.lines[line].selected = !me.lines[line].selected;
				//changeClass(e.target, "select", me.lines[line].selected);
				//dragselectcount++;
			}
		} else {
			if (me.ast.lines[line]) {
				if (me.lines[line].live) {
					//me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-stop'>&#xf069;</span";
				} else {
					//me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-play'>&#xf04b;</span";
					changeClass(me.gutter.childNodes[line], "play", true);
				}
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", true);
				}
			}
		}*/
	}
	me.startHover = startHover;

	function endHover(line) {
		/*if (dragselect && !shiftdown) {
			me.lines[line].selected = !alreadyselected;
			changeClass(me.gutter.childNodes[line], "select", !alreadyselected);
			changeClass(me.gutter.childNodes[line], "hover", false);
			changeClass(me.gutter.childNodes[line], "play", false);
		}

		if (dragselect) shiftdown = true;
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		//if (!dragselect) {
			if (me.ast.lines[line]) {
				//me.gutter.childNodes[line].innerHTML = "";
				var lines = me.ast.getBlockLines(line);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", false);
					changeClass(me.gutter.childNodes[i], "play", false);
				}
			}
		//}*/
	}
	me.endHover = endHover;

	this.$gutter
	/*.on('mousedown', '.eden-gutter-item', function(e) {
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));

		shiftdown = e.shiftKey;
		downline = line;
		alreadyselected = (me.lines[line]) ? me.lines[line].selected : false;
		dragselect = true;
		alreadylive = me.lines[line] && me.lines[line].live;

		// There is a statement on this line.
		if (me.ast.lines[line]) {
			var lines = me.ast.getBlockLines(line);

			// If live already and no shift key
			if (me.lines[line].live && !shiftdown) {
				if (!me.lines[line].selected) {
					// Make all lines of this statement block non-live
					for (var i=lines[0]; i<=lines[1]; i++) {
						me.lines[i].live = false;
						changeClass(me.gutter.childNodes[i], "live", false);
					}
				} else {
					// Make all selected lines non-live
					for (var i=0; i<me.lines.length; i++) {
						if (me.lines[i].selected) {
							me.lines[i].live = false;
							changeClass(me.gutter.childNodes[i], "live", false);
						}
					}
				}
			} else {
				// For all lines associated with this statement block...
				for (var i=lines[0]; i<=lines[1]; i++) {
					// Invert selection if shift key
					if (shiftdown) me.lines[i].selected = !me.lines[i].selected;
					else me.lines[i].selected = true;

					// Update style
					changeClass(me.gutter.childNodes[i], "select", me.lines[i].selected);
					changeClass(me.gutter.childNodes[i], "hover", false);
				}
			}
		}
		
		// Hold for 1.5s to make live
		holdtimeout = setTimeout(onHold, 1000);
	})*/
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
			} else {
				me.lines[line].selected = true;
				me.executeSelected();
				me.lines[line].selected = false;
			}
		}
	})
	/*.on('mouseup', '.eden-gutter-item', function(e) {
		if (!me.ast.hasErrors() && !shiftdown) {
			var line = parseInt(e.target.getAttribute("data-line"));
			if (!((me.ast.lines[line] && me.ast.lines[line].errors.length > 0) || me.lines[line].live || alreadylive)) {
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
		}
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		dragselect = false;
	})*/
	.on('mouseenter', '.eden-gutter-item', function(e) {
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));
		startHover(line);
	})
	.on('mouseleave', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		endHover(line);
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
			this.agent.executeLine(i);
			this.lines[i].exechash = this.ast.getSource(this.ast.lines[i]).hashCode();
			console.log("Hash: " + this.lines[i].exechash);
			i = sellines[1];
		}
	}
}

EdenScriptGutter.prototype.executeRange = function(a,b) {
	if (this.agent === undefined) return;

	for (var i=a; i<=b; i++) {
		//if (this.lines[i].selected) {
			var sellines = this.ast.getBlockLines(i);
			this.agent.executeLine(i);
			this.lines[i].exechash = this.ast.getSource(this.ast.lines[i]).hashCode();
			console.log("Hash: " + this.lines[i].exechash);
			i = sellines[1];
		//}
	}
}


EdenScriptGutter.prototype.findDeltaLine = function() {
	var delta = this.ast.lines.length - this.lines.length;

	if (delta > 0) {
		var i=0;
		while (i < this.ast.lines.length) {
			if (i >= this.lines.length) return i;
			if (this.ast.lines[i] === undefined && this.lines[i].hash == 0) {
				i++;
				continue;
			}

			if (this.ast.lines[i]) {
				var diff = this.ast.lines[i].hash;
				if (diff == 0) {
					diff = this.ast.getSource(this.ast.lines[i]).hashCode();
					this.ast.lines[i].hash = diff;
				}
				if (this.lines[i] === undefined) return i;
				if (this.lines[i].hash != diff) {
					//this.lines[i].hash = diff;
					return i;
				}
			} else {
				return i;
			}
			i++;
		}
		return i;
	} else {
		var i=0;
		while (i < this.lines.length) {
			if (i >= this.ast.lines.length) return i;
			if (this.ast.lines[i] === undefined && this.lines[i].hash == 0) {
				i++;
				continue;
			}

			if (this.ast.lines[i]) {
				var diff = this.ast.lines[i].hash;
				if (diff == 0) {
					diff = this.ast.getSource(this.ast.lines[i]).hashCode();
					this.ast.lines[i].hash = diff;
				}
				if (this.lines[i] === undefined) return i;
				if (this.lines[i].hash != diff) {
					//this.lines[i].hash = diff;
					return i;
				}
			} else {
				return i;
			}
			i++;
		}
		return i;
	}
}


EdenScriptGutter.prototype.processAST = function() {
	var lineno = 999999;
	// Check for line insertion/removal and shift
	if (this.ast.lines.length != this.lines.length && this.ast.hasErrors() == false) {
		var delta = this.ast.lines.length - this.lines.length;
		lineno = this.findDeltaLine();
		console.log("Delta("+delta+") line: " + lineno);

		// Split at lineno and insert/delete delta lines
		if (delta > 0) {
			for (var i=0; i<delta; i++) {
				this.lines.splice(lineno+i,0,new EdenUI.GutterLineState());
			}

			//console.log(this.lines);
		} else {
			// Must delete SVG elements
			for (var j=lineno; j<lineno+delta; j++) {
				if (this.lines[j].element) this.gutter.removeChild(this.lines[j].element);
			}
			this.lines.splice(lineno, 0-delta);
		}
	}

	for (var i=0; i<this.lines.length; i++) {
		if (i >= this.ast.lines.length) break;
		var astline = this.ast.lines[i];
		var line = this.lines[i];
		if (astline === undefined) {
			if (this.lines[i]) {
				this.lines[i].status = 0;
				if (line.status != line.oldstatus) {
					line.update = true;
					line.oldstatus = line.status;
				} else {
					line.update = false;
				}

				if (i >= lineno-1) line.update = true;
			}
			continue;
		}
		// Mark or remove errors
		line.errorblock = (astline && astline.errors && astline.errors.length > 0);

		// Check if line changed since last execution
		var diff = astline.hash;
		if (diff == 0) {
			diff = this.ast.getSource(astline).hashCode();
			astline.hash = diff;
		}
		line.hash = diff;
		line.changed = (astline.hash != line.exechash);

		// Check if the line is the currently active one
		if (astline && astline.type == "definition") {
			var sym = eden.root.symbols[astline.lvalue.name];
			if (sym) {
				line.current = (astline.hash == sym.hash);
				line.isundefined = sym.cache.value === undefined;
			}
		} else {
			line.current = true;
			line.isundefined = false;
		}

		// If a "when" then mark condition status
		// Check for undefined values
		// Mark line as having changed status if it has

		// Give it a status value
		if (line.error) {
			line.status = 1;
		} else if (line.errorblock) {
			line.status = 2;
		} else if (line.changed) {
			line.status = 3;
		} else if (line.current) {
			line.status = 4;
		} else if (line.isundefined) {
			line.status = 5;
		} else if (line.hash != 0) {
			line.status = 6;
		} else {
			line.status = 0;
		}

		if (line.status != line.oldstatus) {
			line.update = true;
			line.oldstatus = line.status;
		} else {
			line.update = false;
		}

		if (i >= lineno-1) line.update = true;
	}

	// Merge lines with identical status
}

EdenScriptGutter.prototype.makeElement = function(a,b,s) {
	var me = this;
	if (s == 0) return undefined;
	if (s == 3) {
		var element = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		var h = (b-a+1) * 20;
		var hby2 = h / 2;
		element.setAttribute("x", "0");
		element.setAttribute("y", "0");
		element.setAttribute("transform","matrix(1 0 0 1 0 0)");
		element.setAttribute("d", "M 0 "+(a*20)+" l 22 0 10 "+hby2+" -10 "+hby2+" -22 0 0 -"+h+" z");
		element.setAttribute("style","fill:#26b300;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
		element.onclick = function(e) {
			console.log("Clicked: " + a + "->" + b + " with status " + s);
			me.executeRange(a,b);
		}
	} else if (s == 6) {
		var element = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		var h = (b-a+1) * 20;
		var hby2 = h / 2;
		element.setAttribute("x", "0");
		element.setAttribute("y", "0");
		element.setAttribute("transform","matrix(1 0 0 1 0 0)");
		element.setAttribute("d", "M 0 "+(a*20)+" l 22 0 10 "+hby2+" -10 "+hby2+" -22 0 0 -"+h+" z");
		element.setAttribute("style","fill:#525277;fill-opacity:0.4;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
		element.onclick = function(e) {
			console.log("Clicked: " + a + "->" + b + " with status " + s);
			me.executeRange(a,b);
		}
	} else if (s == 4) {
		var element = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		var h = (b-a+1) * 20;
		var hby2 = h / 2;
		element.setAttribute("x", "0");
		element.setAttribute("y", "0");
		element.setAttribute("transform","matrix(1 0 0 1 0 0)");
		element.setAttribute("d", "M 0 "+(a*20)+" l 22 0 10 "+hby2+" -10 "+hby2+" -22 0 0 -"+h+" z");
		element.setAttribute("style","fill:#dddddd;fill-opacity:0.8;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
		element.onclick = function(e) {
			console.log("Clicked: " + a + "->" + b + " with status " + s);
			me.executeRange(a,b);
		}
	} else if (s == 2) {
		var element = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		var h = (b-a+1) * 20;
		var hby2 = h / 2;
		element.setAttribute("x", "0");
		element.setAttribute("y", "0");
		element.setAttribute("transform","matrix(1 0 0 1 0 0)");
		element.setAttribute("d", "M 0 "+(a*20)+" l 22 0 a 10 "+hby2+" 0 1 1 0 "+h+" l -22 0 0 -"+h+" z");
		element.setAttribute("style","fill:red;fill-opacity:0.8;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
		element.onclick = function(e) {
			console.log("Clicked: " + a + "->" + b + " with status " + s);
			me.executeRange(a,b);
		}
	}
	return element;
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
	/*if (ast.lines.length != this.lines.length) {

		for (var i=0; i<ast.lines.length; i++) {
			//var ele = document.createElement("div");
			//ele.className = "eden-gutter-item";
			//ele.setAttribute("data-line", ""+i);
			//this.gutter.appendChild(ele);
			if (this.lines[i] === undefined) this.lines[i] = new EdenUI.GutterLineState(); //this.lines[i] = {selected: false, live: false};
		}

		globaldoupdate = true;
	}*/

	this.processAST();

	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i] && this.lines[i].update) {
			//console.log("" + i + ": " + JSON.stringify(this.lines[i]));
			// Find all equal preceeding status
			var sline = i;
			while (sline > 0 && this.lines[sline-1] && this.lines[sline-1].status == this.lines[i].status) sline--;

			// Find all equal succeeding status
			var eline = i;
			while (eline+1 < this.lines.length && this.lines[eline+1] && this.lines[eline+1].status == this.lines[i].status) eline++;

			//console.log("Lines changed: " + sline + "->" + eline);

			// Construct combined SVG
			var element = this.makeElement(sline, eline, this.lines[i].status);
			for (var j=sline; j<=eline; j++) {
				if (this.lines[j].element && (j == sline || this.lines[j-1].element !== this.lines[j].element)) {
					this.gutter.removeChild(this.lines[j].element);
					this.lines[j].element = undefined;
				}
			}
			this.lines[i].element = element;
			if (element) this.gutter.appendChild(element);

			switch (this.lines[i].status) {
			case 6: this.content.childNodes[i].className = "eden-line line-notcurrent"; break;
			default: this.content.childNodes[i].className = "eden-line";
			}

			i = eline;
		}
	}

	/*if (lineno >= 0 && ast.lines[lineno-1] && this.lines[lineno-1]) {
		var diff = ast.getSource(ast.lines[lineno-1]).hashCode() - this.lines[lineno-1].exechash;
		console.log("Diff: " + diff);
		this.lines[lineno-1].changed = diff != 0;
	} else if (lineno == -1) {
		for (var i=0; i<ast.lines.length; i++) {
			if (ast.lines[i] && this.lines[i]) {
				var diff = ast.getSource(ast.lines[i]).hashCode() - this.lines[i].exechash;
				console.log("Diff: " + diff);
				this.lines[i].changed = diff != 0;
			}
		}
	}*/

	/*for (var i=0; i<ast.lines.length; i++) {
		//this.gutter.appendChild(document.createElement("div"));
		var className = "eden-gutter-item";
		var lineclass = "eden-line";
		var content = "";
		var doreplace = false;
		var doupdate = globaldoupdate;

		if (ast.lines[i]) {
			var stat = ast.lines[i];

			if (stat.errors.length > 0) {
				className += " errorblock";
				if (stat.errors[0].line == i+1) {
					className += " error";
					//content = "&#xf06a";
				} else if (stat.errors[0].type == "runtime") {
					className += " error";
					//content = "&#xf06a";
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
				var diff = ast.lines[i].hash;
				if (diff == 0) {
					diff = ast.getSource(ast.lines[i]).hashCode();
					ast.lines[i].hash = diff;
				}
				//console.log("Diff: " + diff);
				if (this.lines[i].exechash == 0 || (diff - this.lines[i].exechash != 0)) {
					className += " changed";
					//lineclass += " line-changed";
					if (!this.lines[i].changed) doupdate = true;
					this.lines[i].changed = true;
				} else if (diff - this.lines[i].exechash == 0) {
					if (this.lines[i].changed) doupdate = true;
					this.lines[i].changed = false;

					if (ast.lines[i].type == "definition") {
						var sym = eden.root.symbols[ast.lines[i].lvalue.name];
						if (sym && sym.eden_definition) {
							var sdiff = sym.hash;
							if (diff - sdiff != 0) {
								//className += " notcurrent";
								lineclass += " line-notcurrent";
								if (!this.lines[i].current) doupdate = true;
								this.lines[i].current = true;
							} else if (diff - sdiff == 0) {
								if (this.lines[i].current) doupdate = true;
								this.lines[i].current = false;
							}
						}
					} else if (ast.lines[i].type == "assignment") {
						var sym = eden.root.symbols[ast.lines[i].lvalue.name];
						if (sym) {
							var sdiff = sym.hash;
							if (diff - sdiff != 0) {
								//className += " notcurrent";
								lineclass += " line-notcurrent";
								if (!this.lines[i].current) doupdate = true;
								this.lines[i].current = true;
							} else if (diff - sdiff == 0) {
								if (this.lines[i].current) doupdate = true;
								this.lines[i].current = false;
							}
						}
					}
				}
			}
		}

		if (doreplace) {
			if (content == "") {
				var newnode = document.createElement("div");
				newnode.className = className;
				newnode.innerHTML = "";
				this.content.childNodes[i].className = lineclass;
				newnode.setAttribute("data-line", ""+i);
				//newnode.setAttribute("draggable", true);
				//this.gutter.childNodes[i].className = className;
				//this.gutter.childNodes[i].innerHTML = content;
				this.gutter.replaceChild(newnode, this.gutter.childNodes[i]);
			} else {
				this.gutter.childNodes[i].className = className;
				this.gutter.childNodes[i].innerHTML = content;
				this.content.childNodes[i].className = lineclass;
			}
		} else if (doupdate) {
			if (this.gutter.childNodes[i].className.indexOf("hover") >= 0) className += " hover";
			this.gutter.childNodes[i].innerHTML = content;
			this.gutter.childNodes[i].className = className;
			this.content.childNodes[i].className = lineclass;
		}
	}*/
}
