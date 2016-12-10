EdenUI.ScriptBox = function(element, options) {
	this.changeCB = undefined;
	this.outer = element;
	this.savecb = undefined;

	// Construct the inner elements required.
	this.contents = $(this.outer);
	this.contents.html('<div class="scriptbox-inputhider"><textarea autofocus tabindex="1" class="hidden-textarea"></textarea><div class="scriptbox-codearea"></div></div><div class="scriptbox-outputbox"><div class="scriptbox-statement"><div class="scriptbox-output" contenteditable="true" spellcheck="false"></div></div></div><div class="info-bar"></div></div>');
	//this.outer.appendChild(this.contents.get(0));

	//this.statements = [""];
	//var dstat = new Eden.Statement();
	this.currentstatement = undefined;
	this.statements = {};

	this.$codearea = this.contents.find('.scriptbox-codearea');
	this.codearea = this.$codearea.get(0);
	this.intextarea = this.contents.find('.hidden-textarea').get(0);
	//this.$codearea.append($('<div class="scriptbox-statement" data-statement="'+(dstat.id)+'"><div class="grippy"></div><div class="scriptbox-sticky stuck"></div><div class="scriptbox-gutter" data-statement="'+dstat.id+'"></div><div spellcheck="false" tabindex="2" contenteditable class="scriptbox-output" data-statement="'+dstat.id+'"></div></div>'));
	this.outdiv = this.contents.find('.scriptbox-output').get(0);
	this.$codearea.sortable({revert: 100, handle: ".grippy",
		distance: 10, axis: "y", scroll: false});
	//this.statements[dstat.id] = this.outdiv.parentNode;
	this.infobox = this.contents.find('.info-bar').get(0);
	this.outputbox = this.contents.find('.scriptbox-outputbox').get(0);
	this.suggestions = this.contents.find('.eden_suggestions');
	this.suggestions.hide();
	$(this.infobox).hide();
	this.highlighter = new EdenUI.Highlight(this.outdiv);

	this.enable();

	//changeClass(this.outdiv.parentNode.firstChild, "play", true);

	this.ast = undefined;
	this.refreshentire = true;
	this.dirty = true;
	this.rebuildtimer = undefined;
	this.rebuildtimeout = 10;
	this.currentlineno = 1;
	this.currentcharno = 0;
	this.dragint = false;
	this.dragline = -1;
	this.dragvalue = 0;
	this.draglast = 0;
	//this.showstars = (options && options.nobuttons !== undefined) ? !options.nobuttons : true;

	this.history = undefined;

	// Load history
	if (window.localStorage) {
		this.history = JSON.parse(window.localStorage.getItem('console_history')) || [];
	} else {
		this.history = [];
	}
	this.historyindex = this.history.length;

	//this.valuedivs = {};

	var me = this;

	/**
	 * Event handler for input change.
	 */
	function onInputChanged(e) {
		me.dirty = true;

		me.rebuild();
	}



	/**
	 * Various keys have special actions that require intercepting. Tab key
	 * must insert a tab, shift arrows etc cause selection and require a
	 * focus shift, and adding or deleting lines need to force a full
	 * rehighlight.
	 */
	function onTextKeyDown(e) {
		// Alt and AltGr for inspect mode.
		//console.log(e.keyCode);

		if (me.ast && me.ast.script && !me.ast.hasErrors() && e.keyCode == 13 && me.ast.token == "EOF" && me.intextarea.selectionStart >= me.ast.script.end) {
			//console.log("BREAK TO NEW BOX");
			//me.insertStatement(undefined, true);
			me.ast.execute(EdenUI.ScriptBox.consoleAgent);
			me.history.push(me.ast.stream.code);
			me.historyindex = me.history.length;
			if (window.localStorage) {
				window.localStorage.setItem("console_history", JSON.stringify(me.history));
			}
			$(me.outdiv).find(".fake-caret").remove();
			me.$codearea.append($('<div>'+me.outdiv.innerHTML+'</div>'));
			// Make sure scrolled to bottom.
			me.codearea.scrollTop = me.codearea.scrollHeight;
			me.setSource("");
			e.preventDefault();
			return;
		}

		if (!e.altKey) {

			// If not Ctrl or Shift key then
			if (!e.ctrlKey && e.keyCode != 17 && e.keyCode != 16) {
				// Make TAB key insert TABs instead of changing focus
				if (e.keyCode == 9) {
					e.preventDefault();
					var start = me.intextarea.selectionStart;
					var end = me.intextarea.selectionEnd;

					// set textarea value to: text before caret + tab + text after caret
					me.intextarea.value = me.intextarea.value.substring(0, start)
								+ "\t"
								+ me.intextarea.value.substring(end);

					// put caret at right position again
					me.intextarea.selectionStart =
					me.intextarea.selectionEnd = start + 1;
					//updateLineHighlight();
					me.rebuild();
				} else if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
					// Shift arrow selection, move to editable div.
					if (e.shiftKey) {
						me.setCaretToFakeCaret();
						me.outdiv.focus();
						return;
					} else if (e.keyCode == 38) {
						// Up, scroll up in history
						//console.log("UP");
						if (me.historyindex > 0) {
							me.historyindex--;
							me.setSource(me.history[me.historyindex]);
							e.preventDefault();
						}
					} else if (e.keyCode == 40) {
						// Down, scoll down in history
						//console.log("DOWN");
						if (me.historyindex < me.history.length-1) {
							me.historyindex++;
							me.setSource(me.history[me.historyindex]);
							e.preventDefault();
						} else {
							me.historyindex = me.history.length;
							me.setSource("");
						}
					}
				
					// Update fake caret position at key repeat rate
					me.updateLineCachedHighlight();
					// Adjust scroll position if required
					//checkScroll();
				} else if (e.keyCode == 13 || (e.keyCode == 8 && me.intextarea.value.charCodeAt(me.intextarea.selectionStart-1) == 10)) {
					// Adding or removing lines requires a full re-highlight at present
					me.refreshentire = true;
				}

			} else if (e.ctrlKey) {
				if (e.shiftKey) {
					if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
						// Ctrl+Shift arrow selection, move to editable div.
						me.setCaretToFakeCaret();
						me.outdiv.focus();
						return;
					}
				} else if (e.keyCode === 38) {
					// up
					onPrevious();
				} else if (e.keyCode === 40) {
					// down
					onNext();
				} else if (e.keyCode === 86) {

				} else if (e.keyCode === 65) {
					// Ctrl+A to select all.
					e.preventDefault();
					me.outdiv.focus();
					//me.selectAll();
				}
			}
		} else {
			// Alt key is pressed so.....
			if (e.keyCode == 187 || e.keyCode == 61) {
				// Alt+Plus: Zoom in
				//agent.state[obs_zoom]++;
				e.preventDefault();
			} else if (e.keyCode == 189 || e.keyCode == 173) {
				// Alt+Minus: Zoom out
				//agent.state[obs_zoom]--;
				e.preventDefault();
			} else if (e.keyCode == 48) {
				//Alt+0
				//agent.state[obs_zoom] = 0;
				e.preventDefault();
			}
		}
	}



	function onTextPaste(e) {
		me.refreshentire = true;
	}



	/**
	 * Some keys don't change content but still need a rehighlight. And,
	 * in case the input change event is skipped (Chrome!!), make sure a
	 * rebuild does happen.
	 */
	function onTextKeyUp(e) {
		if (!e.altKey) {
			if (!e.ctrlKey && (	e.keyCode == 37 ||	//Arrow keys
								e.keyCode == 38 ||
								e.keyCode == 39 ||
								e.keyCode == 40 ||
								e.keyCode == 36 ||	// Home key
								e.keyCode == 35)) {	// End key

				me.updateLineCachedHighlight();

				// Force a scroll for home and end AFTER key press...
				if (e.keyCode == 36 || e.keyCode == 35) {
					//checkScroll();
				}
			} else {
				if (!e.ctrlKey && e.keyCode == 8 && me.intextarea.value == "") {
					//me.removeStatement();
				} else {
					me.rebuild();
				}
			}
		}
	}



	/**
	 * When focus is on the output and a key is pressed. This occurs when
	 * text is selected that needs replacing.
	 */
	function onOutputKeyDown(e) {
		if (!e.altKey) {
			if (me.outdiv.style.cursor == "pointer") me.outdiv.style.cursor = "initial";
			if (e.keyCode == 16 || e.keyCode == 17 || (e.ctrlKey && e.keyCode == 67)) {
				// Ignore Ctrl and Ctrl+C.
			// If not shift selecting...
			} else if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36))) {
				var end = getCaretCharacterOffsetWithin(me.outdiv,me.shadow);
				var start = getStartCaretCharacterOffsetWithin(me.outdiv,me.shadow);

				me.intextarea.focus();
				me.intextarea.selectionEnd = end;
				me.intextarea.selectionStart = start;
				if (start != end) me.refreshentire = true;
			}
		}
	}



	function onOutputPaste(e) {
		me.intextarea.focus();
		setTimeout(function() { me.updateEntireHighlight(); }, 0);
	}



	function onOutputKeyUp(e) {
		
	}



	/**
	 * Make the caret look invisible. It must still exist to keep record
	 * of current location for selection purposes.
	 */
	function onTextBlur(e) {
		//$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
		// Finally, delete the fake caret
		$(me.outdiv).find(".fake-caret").remove();
		me.hideInfoBox();
	}



	/**
	 * Make the caret visible.
	 */
	function onTextFocus(e) {
		//$(outdiv).find(".fake-caret").removeClass("fake-blur-caret");
	}

	/**
	 * Clicking on the highlighted script needs to move the cursor position.
	 * Unless a selection is being made, in which case keep the focus on
	 * the highlighted output instead.
	 */
	function onOutputMouseUp(e) {
		me.hideInfoBox();
		//me.hideMenu();

		/*if (e.currentTarget !== me.outdiv) {
			//Eden.Statement.statements[me.currentstatement].setSource(me.intextarea.value, me.ast);
			var num = parseInt(e.currentTarget.getAttribute("data-statement"));
			me.moveTo(num);
			//return;
		}*/

		// To prevent false cursor movement when dragging numbers...
		if (document.activeElement === me.outdiv) {
			var end = getCaretCharacterOffsetWithin(me.outdiv,me.shadow);
			var start = getStartCaretCharacterOffsetWithin(me.outdiv,me.shadow);
			if (start != end) {
				// Fix to overcome current line highlight bug on mouse select.
				me.refreshentire = true;
			} else {
				// Move caret to clicked location
				var curline = me.currentlineno;
				me.intextarea.focus();
				me.intextarea.selectionEnd = end;
				me.intextarea.selectionStart = end;
				if (me.ast) {		
					me.highlighter.highlight(me.ast, curline, end);
					me.updateLineCachedHighlight();
				}
				//checkScroll();
			}
		}
	}

	function onGutterClick(e) {
		var num = parseInt(e.currentTarget.getAttribute("data-statement"));
		var stat = Eden.Statement.statements[num];

		if (stat.statement && stat.statement.errors.length == 0) {
			stat.statement.execute(eden.root, stat.ast, stat.ast, eden.root.scope);
			if (stat.statement.type == "when") {
				Eden.Statement.active[stat.id] = (Eden.Statement.active[stat.id]) ? false : true;
				changeClass(e.currentTarget, "active", Eden.Statement.active[stat.id]);
			}
		} else {
			if (stat.ast && stat.ast.script) {
				var err = stat.ast.script.errors[0];
				me.showInfoBox(e.target.offsetLeft+20, e.target.offsetTop-me.codearea.scrollTop+25, "error", err.messageText());
			}
		}
		me.updateLineCachedHighlight();
		//changeClass(e.currentTarget,"active",true);
	}

	function onStickyClick(e) {
		if (e.currentTarget.className.indexOf("stuck") >= 0) {
			changeClass(e.currentTarget,"stuck",false);
		} else {
			changeClass(e.currentTarget,"stuck",true);
		}
	}

	function onStatementClick(e) {
		if (me.dragline == -1 && (me.outdiv === undefined || e.currentTarget !== me.outdiv.parentNode)) {
			//Eden.Statement.statements[me.currentstatement].setSource(me.intextarea.value, me.ast);
			var num = parseInt(e.currentTarget.getAttribute("data-statement"));
			me.moveTo(num);
			//return;
			//me.outdiv.focus();
		}
	}

	function onValueClose(e) {
		var node = e.currentTarget.parentNode.parentNode;
		var num = parseInt(node.getAttribute("data-statement"));
		node.removeChild(me.valuedivs[num][0]);
		delete me.valuedivs[num];
	}

	// Set the event handlers
	this.contents
	.on('input', '.hidden-textarea', onInputChanged)
	.on('keydown', '.hidden-textarea', onTextKeyDown)
	.on('keyup', '.hidden-textarea', onTextKeyUp)
	.on('paste', '.hidden-textarea', onTextPaste)
	.on('keydown', '.scriptbox-output', onOutputKeyDown)
	.on('keyup', '.scriptbox-output', onOutputKeyUp)
	.on('paste', '.scriptbox-output', onOutputPaste)
	.on('blur', '.hidden-textarea', onTextBlur)
	.on('focus', '.hidden-textarea', onTextFocus)
	.on('mouseup', '.scriptbox-output', onOutputMouseUp)
	.on('click','.scriptbox-gutter', onGutterClick)
	.on('click','.scriptbox-sticky', onStickyClick)
	.on('click','.scriptbox-valueclose', onValueClose)
	.on('mousedown','.scriptbox-statement', onStatementClick);
	
	this.setSource("");

	setInterval(function() {
		for (var x in me.valuedivs) {
			//console.log("UPDATE: " + x);
			var stat = Eden.Statement.statements[x];
			if (!stat) continue;
			var valhtml = EdenUI.htmlForStatement(stat,30,30);
			//var valhtml = EdenUI.Highlight.html(val)
			var active = stat.isActive();

			//if (active) {
				me.valuedivs[x].innerHTML = '<div class="eden-line">'+valhtml+'</div>';
				//me.valuedivs[x].removeClass("inactive");
			//} else {
			//	me.valuedivs[x].innerHTML = valhtml;
				//me.valuedivs[x].addClass("inactive");
			//}
		}
	}, 200);
}

EdenUI.ScriptBox.consoleAgent = {
	local: false,
	name: "*Console"
};

EdenUI.ScriptBox.prototype.focus = function() {
	// To prevent false cursor movement when dragging numbers...
	this.outdiv.focus();

	if (document.activeElement === this.outdiv) {
		var end = this.intextarea.value.length;
		var start = end;
		/*var end = getCaretCharacterOffsetWithin(this.outdiv,this.shadow);
		var start = getStartCaretCharacterOffsetWithin(this.outdiv,this.shadow);
		if (start != end) {
			// Fix to overcome current line highlight bug on mouse select.
			this.refreshentire = true;
		} else {*/
			// Move caret to clicked location
			var curline = this.currentlineno;
			this.intextarea.focus();
			this.intextarea.selectionEnd = end;
			this.intextarea.selectionStart = end;
			if (this.ast) {		
				this.highlighter.highlight(this.ast, curline, end);
				this.updateLineCachedHighlight();
			}
			//checkScroll();
		//}
	}
}

/**
 * Move the caret of the contenteditable div showing the highlighted
 * script to be the same location as the fake caret in the highlight
 * itself. This enables shift selection using the browsers internal
 * mechanism.
 */
EdenUI.ScriptBox.prototype.setCaretToFakeCaret = function() {
	var el = $(this.outdiv).find(".fake-caret").get(0);
	var range = document.createRange();
	var sel = window.getSelection();
	if (el.nextSibling) el = el.nextSibling;
	range.setStart(el, 0);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
	// Finally, delete the fake caret
	$(this.outdiv).remove(".fake-caret");
}

EdenUI.ScriptBox.prototype.setChangeCB = function(cb) {
	this.savecb = cb;
}

/*EdenUI.ScriptBox.prototype.moveTo = function(num) {
	if (num == this.currentstatement) return;
	this.disable();
	this.changeOutput($(this.statements[num]).find(".scriptbox-output").get(0));
	this.currentstatement = num;
	this.enable();
	this.setSource(Eden.Statement.statements[this.currentstatement].source);
}

EdenUI.ScriptBox.prototype.changeOutput = function(newoutput) {
	//this.disable();
	//changeClass(this.outdiv.parentNode.firstChild, "play", false);
	if (this.outdiv) {
		$(this.outdiv).find(".fake-caret").remove();
	}
	this.outdiv = newoutput;
	//changeClass(this.outdiv.parentNode.firstChild, "play", true);
	this.highlighter = new EdenUI.Highlight(this.outdiv);
	//this.enable();
}*/

EdenUI.ScriptBox.prototype.hideInfoBox = function() {
	$(this.infobox).hide("fast");
}

/**
 * Displays the error/warning box.
 */
EdenUI.ScriptBox.prototype.showInfoBox = function(x, y, type, message) {
	console.log("SHOW INFO BOX " + message);
	if (type == "warning") {
		this.infobox.innerHTML = "<div class='info-warnitem'><span>"+message+"</span></div>";
	} else if (type == "error") {
		this.infobox.innerHTML = "<div class='info-erroritem'><span>"+message+"</span></div>";
	}
	var $info = $(this.infobox);
	$info.css("top",""+y+"px");
	$info.css("left", ""+x+"px");
	$(this.infobox).show();
}

EdenUI.ScriptBox.prototype.disable = function() {
	if (!this.outdiv) return;
	changeClass(this.outdiv, "goto", false);
	//console.log("DISABLE: " + this.currentstatement);
	this.valuedivs[this.currentstatement] = this.outdiv;
	var valhtml = EdenUI.htmlForStatement(Eden.Statement.statements[this.currentstatement],30,30);
	this.valuedivs[this.currentstatement].innerHTML = '<div class="eden-line">'+valhtml+'</div>';
	//console.log(this.valuedivs);

	//this.outdiv.contentEditable = false;
	changeClass(this.outdiv.parentNode, "readonly", true);
	if (this.ast) {
		//this.highlighter.hideComments();
		//this.highlighter.highlight(this.ast,-1,-1);
	}
}

EdenUI.ScriptBox.prototype.enable = function() {
	if (!this.outdiv) return;
	this.outdiv.contentEditable = true;
	//if (this.valuedivs[this.currentstatement]) delete this.valuedivs[this.currentstatement];
	//console.log("ENABLE: " + this.currentstatement);
	changeClass(this.outdiv.parentNode, "readonly", false);
	if (this.ast) {
		//this.highlighter.showComments();
		this.highlighter.highlight(this.ast,-1,-1);
	}
}

EdenUI.ScriptBox.prototype.setSource = function(src) {
	//if (this.currentstatement === undefined) return;
	this.intextarea.value = src;
	this.ast = new Eden.AST(src,undefined,EdenUI.ScriptBox.consoleAgent);
	this.highlightContent(this.ast, -1, 0);
	this.intextarea.focus();
	if (this.ast.script && this.ast.script.errors.length == 0) {
		console.log("NO ERRORS!!!");
		//Eden.Statement.statements[this.currentstatement].setSource(src,this.ast);
		changeClass(this.outdiv.parentNode,"error",false);
	} else if (src == "") {
		changeClass(this.outdiv.parentNode,"error",false);
	} else {
		changeClass(this.outdiv.parentNode,"error",true);
	}

	//if (this.ast.warnings.length > 0) {
		//changeClass(this.outdiv.parentNode,"warning",true);
	//}
	//checkScroll();
	//this.outdiv.textContent = src;
	this.outdiv.contentEditable = true;
}

/**
 * Re-parse the entire script and then re-highlight the current line
 * (and one line either size).
 */
EdenUI.ScriptBox.prototype.updateLineHighlight = function() {
	var lineno = -1; // Note: -1 means update all.
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
		lineno = this.getLineNumber(this.intextarea);
	}

	this.ast = new Eden.AST(this.intextarea.value, undefined, EdenUI.ScriptBox.consoleAgent);
	//scriptagent.setSource(intextarea.value, false, lineno);
	this.highlighter.ast = this.ast;

	this.runScript(lineno);

	this.highlightContent(this.ast, lineno, pos);
	//rebuildNotifications();

	if (this.ast.script && this.ast.script.errors.length == 0) {
		console.log("NO ERRORS!!!");
		//Eden.Statement.statements[this.currentstatement].setSource(this.intextarea.value,this.ast);
		changeClass(this.outdiv.parentNode,"error",false);
	} else {
		changeClass(this.outdiv.parentNode,"error",true);
	}
}



/**
 * Re-highlight the current line without re-parsing the script.
 * Used when moving around the script without actually causing a code
 * change that needs a reparse.
 */
EdenUI.ScriptBox.prototype.updateLineCachedHighlight = function() {
	var lineno = -1;
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
		lineno = this.getLineNumber(this.intextarea);
	}

	this.highlightContent(this.ast, lineno, pos);
}



/**
 * Parse the script and do a complete re-highlight. This is slow but
 * is required when there are changes across multiple lines (or there
 * could be such changes), for example when pasting.
 */
EdenUI.ScriptBox.prototype.updateEntireHighlight = function(rerun) {
	this.ast = new Eden.AST(this.intextarea.value, undefined, EdenUI.ScriptBox.consoleAgent);
	this.highlighter.ast = this.ast;
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
	}

	if (rerun) {
		this.runScript(0);
	}

	this.highlightContent(this.ast, -1, pos);

	if (this.ast.script && this.ast.script.errors.length == 0) {
		console.log("NO ERROR so execute!");
		//Eden.Statement.statements[this.currentstatement].setSource(this.intextarea.value,this.ast);
		//changeClass(this.outdiv.parentNode.childNodes[(this.showstars)?2:1],"error",false);
	} else {
		console.log("indicated error");
		//changeClass(this.outdiv.parentNode.childNodes[(this.showstars)?2:1],"error",true);
	}
}

/**
 * Call the highlighter to generate the new highlight output, and then
 * post process this to allow for extra warnings and number dragging.
 */
EdenUI.ScriptBox.prototype.highlightContent = function(ast, lineno, position) {
	this.highlighter.highlight(ast, lineno, position);
	//gutter.generate(ast,lineno);

	// Process the scripts main doxy comment for changes.
	if (ast.mainDoxyComment && (lineno == -1 || (lineno >= 1 && lineno <= ast.mainDoxyComment.endline))) {
		// Find all doc tags
		var taglines = ast.mainDoxyComment.content.match(/@[a-z]+.*\n/ig);
		if (taglines) {
			for (var i=0; i<taglines.length; i++) {
				// Extract tag and content
				var ix = taglines[i].search(/\s/);
				if (ix >= 0) {
					var tag = taglines[i].substring(0,ix);
					var content = taglines[i].substr(ix).trim();

					// Set title tag found
					if (tag == "@title") {
						//setTitle(content);
					}
				}
			}
		}
	}

	// Make sure caret remains inactive if we don't have focus
	if (document.activeElement !== this.intextarea) {
		$(this.outdiv).find(".fake-caret").addClass("fake-blur-caret");
	}

	var me = this;

	/* Number dragging code, but only if live */
	//if (!readonly) {
		$(this.outdiv).find('.eden-number').draggable({
			helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
			axis: 'x',
			distance: 5,
			drag: function(e,u) {
				//if (readonly) return;
				var newval;
				if (me.dragint) {
					newval = Math.round(me.dragvalue + ((u.position.left - me.dragstart) / 2));
				} else {
					newval = me.dragvalue + ((u.position.left - me.dragstart) * 0.005);
					newval = newval.toFixed(4);
				}

				// TODO: this is no good for floats
				if (newval != me.draglast) {
					me.draglast = newval;
					e.target.innerHTML = "" + newval;

					var content = e.target.parentNode.textContent;
					if (content.charAt(content.length-1) == "\n") {
						content = content.slice(0,-1);
					}
					me.replaceLine(me.dragline, content);

					//me.setSource(me.intextarea.value, false, dragline);
					me.ast = new Eden.AST(me.intextarea.value, undefined, EdenUI.ScriptBox.consoleAgent);
					me.highlighter.ast = me.ast;

					//console.log("Dragline: " + dragline);

					// Execute if no errors!
					//if (gutter.lines[dragline] && gutter.lines[dragline].live && !scriptagent.hasErrors()) {
					//	scriptagent.executeLine(dragline);
					//}

					me.highlightContent(me.ast, me.dragline, -1);
					Eden.Statement.statements[me.currentstatement].setSource(me.intextarea.value,me.ast);
				}
			},
			start: function(e,u) {
				//if (readonly) return;
				me.edited = true;
				// Calculate the line we are on
				me.dragline = me.findElementLineNumber(e.target);
				me.dragstart = u.position.left;
				var content = e.target.textContent;
				if (content.indexOf(".") == -1) {
					me.dragvalue = parseInt(content);
					me.dragint = true;
				} else {
					me.dragvalue = parseFloat(content);
					me.dragint = false;
				}
				me.draglast = me.dragvalue;

				$(e.target).addClass("eden-select");
				$(me.outdiv).css("cursor","ew-resize");
			},
			stop: function(e,u) {
				//if (readonly) return;
				$(e.target).removeClass("eden-select");
				$(me.outdiv).css("cursor","text");
				//updateEntireHighlight();
				me.dragline = -1;
			},
			cursor: 'move',
			cursorAt: {top: -5, left: -5}
		// Following line is hack to allow click through editing...
		}).click(function() { $(this).draggable({disabled: true}); }) .blur(function() { $(this).draggable({disabled: false}); });
	//}
}



EdenUI.ScriptBox.prototype.clear = function() {
	this.$codearea.html("");
	this.setSource("");
}



/**
 * Return the current line. Also, set currentlineno.
 */
EdenUI.ScriptBox.prototype.getLineNumber = function(textarea) {
	var lines = textarea.value.substr(0, textarea.selectionStart).split("\n");
	this.currentlineno = lines.length;
	this.currentcharno = lines[lines.length-1].length;
	return this.currentlineno;
}

/**
 * Script contents have changed, so re-parse, re-highlight and
 * if live, re-execute. Used in a short interval timeout from the
 * raw input/keyup events.
 */
EdenUI.ScriptBox.prototype.doRebuild = function() {
	// Regenerate the AST and highlight the code.
	if (this.refreshentire) {
		this.updateEntireHighlight();
		this.refreshentire = false;
	} else { // if (dirty) {
		this.updateLineHighlight();
	/*} else {
		updateLineCachedHighlight();*/
	}
	// Adjust scroll position if required
	//checkScroll();
	//this.dirty = false;

	//Eden.Statement.statements[this.currentstatement].setSource(this.intextarea.value,this.ast);
}

EdenUI.ScriptBox.prototype.runScript = function(line) {
	// If we should run the statement (there are no errors)
	//if (gutter.lines[line-1] && gutter.lines[line-1].live && !scriptagent.hasErrors()) {
	//	scriptagent.executeLine(line-1);
	//}
}

/**
 * Set the rebuild timeout. Note: rebuildinterval MUST be less that the
 * keyboard repeat rate or you will not see a change when holding keys
 * down.
 */
EdenUI.ScriptBox.prototype.rebuild = function() {
	//edited = true;

	// Using a timer to make rebuild async. Allows input and keyup to
	// trigger a single rebuild which overcomes Chrome input event bug.
	clearTimeout(this.rebuildtimer);
	var me = this;
	this.rebuildtimer = setTimeout(function() { me.doRebuild(); }, this.rebuildinterval);
}

/**
 * When clicking or using a syntax highlighted element, find which
 * source line this corresponds to. Used by number dragging.
 */
EdenUI.ScriptBox.prototype.findElementLineNumber = function(element) {
	var el = element;
	while (el.parentNode !== this.outdiv) el = el.parentNode;

	for (var i=0; i<this.outdiv.childNodes.length; i++) {
		if (this.outdiv.childNodes[i] === el) return i;
	}
	return -1;
}

/**
 * Replace a particular line with the given content.
 * Can be used for autocompletion and number dragging.
 */
EdenUI.ScriptBox.prototype.replaceLine = function(lineno, content) {
	var lines = this.intextarea.value.split("\n");
	lines[lineno] = content;
	this.intextarea.value = lines.join("\n");
}



