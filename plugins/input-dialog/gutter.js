
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
	if (!ele) return;
	var res = changeClassString(ele.className, c, add);
	if (res != ele.className) {
		ele.className = res;
	}
}

//returns path string d for <path d="This string">
//a curly brace between x1,y1 and x2,y2, w pixels wide 
//and q factor, .5 is normal, higher q = more expressive bracket 
function makeCurlyBrace(x1,y1,x2,y2,w,q)
{
	//Calculate unit vector
	var dx = x1-x2;
	var dy = y1-y2;
	var len = Math.sqrt(dx*dx + dy*dy);
	dx = dx / len;
	dy = dy / len;

	//Calculate Control Points of path,
	var qx1 = x1 + q*w*dy;
	var qy1 = y1 - q*w*dx;
	var qx2 = (x1 - .25*len*dx) + (1-q)*w*dy;
	var qy2 = (y1 - .25*len*dy) - (1-q)*w*dx;
	var tx1 = (x1 -  .5*len*dx) + w*dy;
	var ty1 = (y1 -  .5*len*dy) - w*dx;
	var qx3 = x2 + q*w*dy;
	var qy3 = y2 - q*w*dx;
	var qx4 = (x1 - .75*len*dx) + (1-q)*w*dy;
	var qy4 = (y1 - .75*len*dy) - (1-q)*w*dx;

return ( "M " +  x1 + " " +  y1 +
 		" Q " + qx1 + " " + qy1 + " " + qx2 + " " + qy2 + 
  		" T " + tx1 + " " + ty1 +
  		" M " +  x2 + " " +  y2 +
  		" Q " + qx3 + " " + qy3 + " " + qx4 + " " + qy4 + 
  		" T " + tx1 + " " + ty1 );
}

function EdenScriptGutter(parent, infob, lineelements) {
	var me = this;
	this.lineelements = lineelements;
	this.$gutter = $('<div class="eden-gutter"></div>');

	var xmlns = "http://www.w3.org/2000/svg";
    var boxWidth = 300;
    var boxHeight = 300;

    this.brace = document.createElementNS(xmlns, "svg");
    //this.brace.setAttribute("src", "images/pathbrace.svg");
	this.brace.style.position = "absolute";
	this.brace.style.display = "none";
	this.brace.setAttribute("width", "22");
	this.brace.style.left = "10px";
	this.bracepath = document.createElementNS(xmlns, "path");
	this.bracepath.setAttribute("style","stroke: #444; fill: none; stroke-width: 3px");
	this.brace.appendChild(this.bracepath);

	this.gutter = this.$gutter.get(0);
	parent.insertBefore(this.gutter, parent.firstChild);
	parent.insertBefore(this.brace, parent.firstChild);
	//parent.appendChild(this.gutter);

	this.ast = undefined;
	this.lines = [];
	this.errors = [];
	this.agents = {};
	this.hovering = false;
	this.ctx = undefined;

	this.edits = undefined;

	var dragselect = false;
	var dragselectcount = 0;
	var holdtimeout;
	var downline = 0;
	var alreadyselected = false;
	var alreadylive = false;
	var shiftdown;
	var infobox = infob;

	this.curline = -1;

	this.textwidth = getTextWidth("M","14px/20px Roboto Mono,monospace");

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

	function startHover(line, shiftdown) {
		if (shiftdown && dragselect) {
			var stat = me.ast.getStatementByLine(line);
			if (stat) {
				var lines = stat.getRange();
				if (lines[0] < lines[1]) me.showBrace(lines[0],lines[1]);
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
			var stat = me.ast.getStatementByLine(line);
			if (stat) {
				var lines = stat.getRange();
				//var avgline = Math.floor((lines[1] - lines[0]) / 2) + lines[0];

				if (me.lines[line].live) {
					//me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-stop'>&#xf069;</span";
				} else { //if (stat.executed == 0) {
					//me.gutter.childNodes[line].innerHTML = ""; //<span class='eden-gutter-play'>&#xf04b;</span";
					if (!shiftdown) changeClass(me.gutter.childNodes[line], "play", true);
				}

				/*if (lines[0] < lines[1]) me.showBrace(lines[0],lines[1]);
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", true);
				}*/
				me.selectLine(line+1, true);
				me.hovering = true;
			}
		}
	}
	me.startHover = startHover;

	function endHover(line, shiftdown) {
		if (dragselect && !shiftdown) {
			me.lines[line].selected = !alreadyselected;
			changeClass(me.gutter.childNodes[line], "select", !alreadyselected);
			changeClass(me.gutter.childNodes[line], "hover", false);
			changeClass(me.gutter.childNodes[line], "play", false);
		}

		if (dragselect) shiftdown = true;
		me.hovering = false;
		clearTimeout(holdtimeout);
		holdtimeout = undefined;
		//if (!dragselect) {
		var stat = me.ast.getStatementByLine(line);
			if (stat) {
				//me.gutter.childNodes[line].innerHTML = "";
				var lines = stat.getRange();
				me.hideBrace();
				for (var i=lines[0]; i<=lines[1]; i++) {
					changeClass(me.gutter.childNodes[i], "hover", false);
					changeClass(me.gutter.childNodes[i], "play", false);
				}
			}
		//}
	}
	me.endHover = endHover;

	this.$gutter
	.on('mousedown', '.eden-gutter-item', function(e) {
		if (this.edits) return;
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));

		shiftdown = e.shiftKey;
		downline = line;
		alreadyselected = (me.lines[line]) ? me.lines[line].selected : false;
		dragselect = e.shiftKey;
		alreadylive = me.lines[line] && me.lines[line].live;
		//if (e.shiftKey) return;

		// There is a statement on this line.
		var stat = me.ast.getStatementByLine(line);
		if (stat) {
			var lines = stat.getRange();

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
	})
	.on('click', '.eden-gutter-item', function(e) {
		if (this.edits) return;
		var line = parseInt(e.target.getAttribute("data-line"));
		var stat = me.ast.getStatementByLine(line);

		// If there is a statement
		if (stat) {
			// And if it has errors
			/*if (me.ast.lines[line].errors.length > 0) {
				var err = me.ast.lines[line].errors[0];

				// If the error is on this line then display it
				if (err.line == line+1 || err.type == "runtime") {
					var taboffset = 35; // TODO (agent.state[obs_showtabs]) ? 35 : 0;
					console.error(err.prettyPrint());
					showInfoBox(e.target.offsetLeft+20, e.target.offsetTop-me.gutter.parentNode.scrollTop+25+taboffset, "error", err.messageText());
				}
			}*/
		}
	})
	.on('mouseup', '.eden-gutter-item', function(e) {
		if (this.edits) return;
		if (!me.ast.hasErrors() && !shiftdown) {
			var line = parseInt(e.target.getAttribute("data-line"));
			var stat = me.ast.getStatementByLine(line);
			if (!((stat && stat.hasErrors()) || me.lines[line].live || alreadylive)) {
				//changeClass(e.target, "select", false);

				me.executeSelected();
				if (!alreadyselected) {
					var stat = me.ast.getStatementByLine(downline);
					if (stat) {
						var lines = stat.getRange();
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
	})
	.on('mouseenter', '.eden-gutter-item', function(e) {
		if (me.ast.hasErrors()) return;

		var line = parseInt(e.target.getAttribute("data-line"));
		startHover(line, e.shiftKey);
	})
	.on('mouseleave', '.eden-gutter-item', function(e) {
		var line = parseInt(e.target.getAttribute("data-line"));
		endHover(line, e.shiftKey);
	});
}



EdenScriptGutter.prototype.clear = function() {
	this.ast = undefined;
	this.lines = [];
	this.curline = -1;
	this.hideBrace();
	while (this.gutter.firstChild) {
		this.gutter.removeChild(this.gutter.firstChild);
	}
}



EdenScriptGutter.prototype.setBaseAST = function(base, errors) {
	while (this.gutter.firstChild) {
		this.gutter.removeChild(this.gutter.firstChild);
	}
	this.ast = base;
	this.errors = errors;
	this.lines = [];
	this.edits = undefined;
	this.hideBrace();
}



EdenScriptGutter.prototype.executeSelected = function() {
	if (this.ast === undefined) return;
	//console.log("Execute Selected");

	var agent = {name: "*Gutter"};

	console.log("EXE SEL",this.ast);

	for (var i=0; i<this.lines.length; i++) {
		if (this.lines[i].selected) {
			var stat = this.ast.getStatementByLine(i);
			var sellines = this.ast.getStatementByLine(i).getRange();
			//this.ast.executeLine(i, agent);
			eden.project.ast.executeStatement(stat, i, eden.project);
			i = sellines[1];
			eden.root.lookup("jseden_fragment_executed").assign(".id("+stat.id+")", eden.root.scope, Symbol.hciAgent);
		}
	}
}


EdenScriptGutter.prototype.showBrace = function(start, end) {
	this.brace.style.display = "block";
	var top = this.lineelements.childNodes[start].offsetTop;
	this.brace.style.top = top + "px";
	var height = this.lineelements.childNodes[end].offsetTop+this.lineelements.childNodes[end].clientHeight;
	height -= top;
	this.brace.setAttribute("height", "" + height);
	this.bracepath.setAttribute("d", makeCurlyBrace(20,4,20,height-4,20,0.52));
}

EdenScriptGutter.prototype.hideBrace = function() {
	this.brace.style.display = "none";
}


EdenScriptGutter.prototype.selectLine = function(lineno, notcurrent) {
	if (this.edits) return;
	if (this.ast.errors.length > 0) return;

	if (this.curline >= 0) {
		//var sellines = this.ast.getBlockLines(this.curline);
		//changeClass(this.gutter.childNodes[sellines[0]],"first",false);
		//changeClass(this.gutter.childNodes[sellines[1]],"last",false);
		//for (var i=sellines[0]; i<=sellines[1]; i++) {
		//	changeClass(this.gutter.childNodes[i],"current",false);
		//	changeClass(this.gutter.childNodes[i],"play",false);
		//}

		var stat = this.ast.getStatementByLine(this.curline);
		if (stat) {
			var sellines = stat.getRange();
			var avgline = Math.floor((sellines[1] - sellines[0]) / 2) + sellines[0];
			if (!notcurrent) {
				changeClass(this.gutter.childNodes[avgline],"play",false);
				changeClass(this.gutter.childNodes[avgline],"current",false);
			}
		}
	}
	this.curline = lineno-1;
	var stat = this.ast.getStatementByLine(lineno-1);
	if (stat) {
		if (!stat.getRange) console.error("NO GETRANGE",stat);
		var sellines = stat.getRange();

		if (sellines[0] < sellines[1]) {
			this.showBrace(sellines[0], sellines[1]);
		} else {
			this.hideBrace();
			if (stat) { // && stat.executed == 0) {
				var avgline = Math.floor((sellines[1] - sellines[0]) / 2) + sellines[0];
				changeClass(this.gutter.childNodes[avgline], "play", "true");
				if (!notcurrent) changeClass(this.gutter.childNodes[avgline], "current", "true");
			}
		}
	}
}


EdenScriptGutter.prototype.setDiffs = function(diff) {
	this.edits = diff;
	var lineshift = 0;

	while (this.gutter.firstChild) {
		this.gutter.removeChild(this.gutter.firstChild);
	}

	if (diff === undefined) return;

	this.hideBrace();

	var nline = 0;
	var oline = 0;
	var total = this.ast.lines.length + Object.keys(diff.remove).length;
	var waspartial = false;

	for (var i=0; i<total; i++) {
		if (diff.remove[oline] && diff.remove[oline].nline <= nline) {
			var ele = document.createElement("div");
			var classname = "eden-gutter-item removed";
			ele.className = classname;
			//ele.innerHTML = EdenUI.Highlight.html(diff.remove[oline].rline);
			ele.textContent = diff.remove[oline].rline;
			this.gutter.appendChild(ele);

			// Highlight exact remove point
			var entries = diff.remove[oline].chars;
			for (var j=0; j<entries.length; j++) {
				var hlight = document.createElement("div");
				hlight.style.position = "absolute";
				hlight.style.background = "rgba(255,0,0,0.3)";
				hlight.style.height = "20px";
				hlight.style.width = ""+(entries[j].length*this.textwidth)+"px";
				hlight.style.top = "0px";
				hlight.style.left = ""+(entries[j].start*this.textwidth + 43)+"px";
				ele.appendChild(hlight);
			}

			if (diff.remove[oline].partial) {
				oline++;
				waspartial = true;
			} else {
				oline++;
				continue;
			}
		}

		var ele = document.createElement("div");
		var classname = "eden-gutter-item";
		if (waspartial || diff.insert[nline]) {
			classname += " inserted";
			var waszero = false;

			if (diff.insert[nline]) {			
				// Highlight exact remove point
				var entries = diff.insert[nline].chars;
				for (var j=0; j<entries.length; j++) {
					var hlight = document.createElement("div");
					hlight.style.position = "absolute";
					hlight.style.background = "rgba(0,255,0,0.3)";
					hlight.style.height = "20px";
					hlight.style.width = ""+(entries[j].length*this.textwidth)+"px";
					waszero = waszero || (entries[j].length == 0 && !diff.insert[nline].partial);
					hlight.style.top = "0px";
					hlight.style.left = ""+(entries[j].start*this.textwidth + 43)+"px";
					ele.appendChild(hlight);
				}
			}

			if (((diff.insert[nline] && diff.insert[nline].partial)) && !waspartial) oline++;
		}
		else oline++;
		waspartial = false;
		ele.className = classname;
		ele.setAttribute("data-line", ""+nline);
		this.gutter.appendChild(ele);
		nline++;

		if (this.lines[nline] === undefined) this.lines[nline] = {selected: false, live: false};
	}
}

EdenScriptGutter.prototype.updateLine = function(i, globaldoupdate) {
	//this.gutter.appendChild(document.createElement("div"));
	var className = "eden-gutter-item";
	var ast = this.ast;
	var content = "";
	var doreplace = false;
	var doupdate = globaldoupdate;
	var errorline = undefined;
	var title = undefined;
	/*if (i == lineno-1) {
		className += " eden-gutter-current";
	}*/

	var stat = ast.getStatementByLine(i);
	if (stat) {

		if (stat.errors.length > 0) {
			//className += " errorblock";
			if (stat.errors[0].line == i+1) {
				className += " error";
				content = "&#xf06a";
				title = stat.errors[0].messageText();
				errorline = i;
			} else if (stat.errors[0].type == "runtime") {
				className += " error";
				content = "&#xf06a";
				title = stat.errors[0].messageText();
			}
			this.lines[i].errored = true;
			doupdate = true;
		} else {
			if (this.lines[i].errored) {
				doupdate = true;
				this.lines[i].errored = false;
			}
			if (stat.warning) {
				className += " warning";
				content = "&#xf071";
				doupdate = true;
				if (stat.warning) title = stat.warning.messageText();
			}
			if (stat.executed == 1) {
				className += " executed";
				doupdate = true;
				this.lines[i].executed = true;
			} else if (stat.executed == 2) {
				className += " guarded";
				doupdate = true;
				this.lines[i].executed = true;
			} else if (stat.executed == 3) {
				className += " errorblock";
				doupdate = true;
			}

			// Need to remove any old error messages
			//if (this.gutter.childNodes[i].className.indexOf("error") >= 0) {
			//	doupdate = true;
			//}
		}

		if (this.lines && this.lines[i]) {
			if (this.lines[i].executed && stat.executed <= 0) {
				doupdate = true;
				this.lines[i].executed = false;
			}

			if (this.lines[i].selected) className += " select";
			if (this.lines[i].live) {
				className += " live";
				//doreplace = false;
			}
		}
	} else {
		// Clear any only gutter info form line that is no longer a script line.
		if (this.errors && this.errors.length > 0 && this.errors[0].line == i+1) {
			if (!this.lines[i].errored) {
				className += " error";
				content = "&#xf06a";
				title = this.errors[0].messageText();
				errorline = i;
				this.lines[i].errored = true;
				doupdate = true;
			}
		} else if (this.lines[i].errored) {
			doupdate = true;
			this.lines[i].errored = false;
			title = "";
		}

		if (this.lines[i].executed) {
			doupdate = true;
			this.lines[i].executed = true;
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
		if (this.gutter.childNodes[i].className.indexOf("play") >= 0) className += " play";
		if (this.gutter.childNodes[i].className.indexOf("current") >= 0) className += " current";
		this.gutter.childNodes[i].innerHTML = content;
		this.gutter.childNodes[i].className = className;
		if (title) this.gutter.childNodes[i].title = title;
	}
}


EdenScriptGutter.prototype.generate = function(ast, lineno) {
	this.ast = ast;
	if (this.edits) return;

	var globaldoupdate = false;
	var numlines = ast.getNumberOfLines()+1;

	if (numlines > this.lineelements.childNodes.length) {
		numlines = this.lineelements.childNodes.length;
	}

	// Reset all lines if number of lines changes
	if (numlines != this.gutter.childNodes.length) {
		this.hideBrace();

		while (this.gutter.firstChild) {
			this.gutter.removeChild(this.gutter.firstChild);
		}
		for (var i=0; i<numlines; i++) {
			var ele = document.createElement("div");
			ele.className = "eden-gutter-item";
			ele.setAttribute("data-line", ""+i);
			ele.style.height = this.lineelements.childNodes[i].clientHeight+"px";
			this.gutter.appendChild(ele);
			if (this.lines[i] === undefined) this.lines[i] = {selected: false, live: false, executed: false, errored: false};
		}

		globaldoupdate = true;
	}

	for (var i=0; i<numlines; i++) {
		this.updateLine(i, globaldoupdate);
	}

	if (this.ast.errors.length > 0) {
		this.hideBrace();
		/*var errlines = this.ast.getBlockLines(errorline);
		if (errlines[0] < errlines[1]) {
			this.showBrace(errlines[0], errlines[1]);
		}*/
	} else {
		if (!this.hovering) this.selectLine(lineno);
	}
}
