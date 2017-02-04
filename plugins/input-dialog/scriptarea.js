EdenUI.ScriptArea = function() {
	this.contents = document.createElement("div"); //$dialogContents.find('.inputhider').get(0);

	this.intextarea = document.createElement("textarea"); //$dialogContents.find('.hidden-textarea').get(0);
	this.intextarea.autofocus = true;
	this.intextarea.tabIndex = 1;
	this.intextarea.className = "hidden-textarea2";
	this.contents.appendChild(this.intextarea);

	this.codearea = document.createElement("div"); // $codearea.get(0);
	this.codearea.className = "inputCodeArea";
	this.contents.appendChild(this.codearea);

	this.outdiv = document.createElement("div"); //$dialogContents.find('.outputcontent').get(0);
	this.outdiv.contenteditable = true;
	this.outdiv.className = "outputcontent";
	this.outdiv.spellcheck = false;
	this.outdiv.tabIndex = 2;
	this.codearea.appendChild(this.outdiv);

	this.fragment = undefined;
	this.readonly = false;
	this.alwaysreadonly = false;
	this.currentlineno = -1;
	this.currentcharno = -1;
	this.gotomode = false;
	this.highlighter = new EdenUI.Highlight(this.outdiv);
	this.gutter = new EdenScriptGutter(this.codearea, this.infobox, this.outdiv);
	this.details = new EdenUI.ScriptArea.Details(this);
	this.cachedhlopt = undefined;
	this.disablehl = false;

	// Init the scroll optimisation.
	this.highlighter.setScrollTop(0);

	var me = this;
	this.gutterinterval = setInterval(function() {
		if (me.fragment === undefined || me.fragment.ast === undefined) return;
		me.gutter.generate(me.fragment.ast.script, me.currentlineno);
		//scriptast.clearExecutedState();

		// Also check for highlighter query lines
		for (var x in me.highlighter.metrics) {
			if (me.currentlineno == x) {
				continue;
			}
			var metric = me.highlighter.metrics[x];
			if (metric.query) {
				//console.log("METRIC",x);
				//me.highlightContent(x,me.intextarea.selectionEnd);
				//me.highlighter.highlightExactLine(me.fragment.ast, x, me.intextarea.selectionEnd);

				for (var i=0; i<metric.qelements.length; i++) {
					var qstr = metric.qelements[i].getAttribute("data-query");
					var astr = metric.qelements[i].getAttribute("data-attribs");
					var res = Eden.Selectors.query(qstr,(astr !== null && astr.length > 0) ? astr : "value");
					if (res.length == 1) res = res[0];
					else if (res.length > 1) res = res.join(", ");
					else res = "";
					metric.qelements[i].setAttribute("data-result", res);
				}
			}
			if (metric.squery) {
				me.highlightContent(x,me.intextarea.selectionEnd);
			}
		}
	}, 300);

	var keyboard = new EdenUI.ScriptArea.Keyboard(this);
	var mouse = new EdenUI.ScriptArea.Mouse(this);

	this.rebuildinterval = 400;
}

EdenUI.ScriptArea.prototype.setReadonly = function(ro) {
	this.alwaysreadonly = ro;
	if (ro === true) {
		this.readonly = true;
		this.outdiv.contentEditable = false;
	} else {
		this.readonly = (this.fragment) ? this.fragment.locked : false;
		this.outdiv.contentEditable = !this.readonly;
		if (ro == "comment") this.updateEntireHighlight();
	}
}

EdenUI.ScriptArea.prototype.setFragment = function(frag) {
	if (this.fragment && this.fragment !== frag) {
		this.fragment.unlock();
		this.currentlineno = -1;
	}
	this.details.hide();
	this.fragment = frag;

	if (frag === undefined) {
		this.gutter.clear();
		//console.log("SHOW SCRIPT BROWSER");
		//outdiv.style.display = "none";
		
		changeClass(this.outdiv, "browser", true);
		//changeClass(inputhider, "readonly", false);
		this.outdiv.contentEditable = false;
		this.readonly = true;
		return;
	}

	// Make sure it is up-to-date
	var me = this;
	frag.reset(function() {

	// Reset textarea and outdiv etc.
	changeClass(me.outdiv, "browser", false);
				
	// Find base of ast
	//var p = tab_asts[curtab];
	//while (p && p.parent) p = p.parent;
	//var base = p.base;

	me.intextarea.value = frag.getSource();
	if (frag.ast) {
		me.highlightContent(-1, 0);
		me.intextarea.focus();
		me.checkScroll();

		me.gutter.setBaseAST(frag.ast.script);
	}

	if (frag.locked) {
		me.readonly = true;
		// The readonly class changes colour scheme
		//changeClass(inputhider, "readonly", true);
		me.outdiv.contentEditable = false;
		//outdiv.style.display = "inline-block";
	} else {
		me.readonly = me.alwaysreadonly === true;
		//setSubTitle("");
		// The readonly class changes colour scheme
		//changeClass(inputhider, "readonly", false);
		me.outdiv.contentEditable = !me.readonly;
		//outdiv.style.display = "inline-block";
	}
	});
}

EdenUI.ScriptArea.prototype.refresh = function() {
	this.intextarea.value = this.fragment.getSource();
	if (this.fragment.ast) {
		this.highlightContent(-1, 0);
		//this.intextarea.focus();
		//this.checkScroll();

		//this.gutter.setBaseAST(frag.ast.script);
	}
}

EdenUI.ScriptArea.prototype.updateSource = function(src, line) {
	this.fragment.setSource(src);
	this.highlighter.ast = this.fragment.ast;
	//this.gutter.clear();
	//console.log("Update line",line);
	//this.gutter.ast = this.fragment.ast.script;
	//this.gutter.updateLine(line-1,false);
}


/**
 * Re-parse the entire script and then re-highlight the current line
 * (and one line either size).
 */
EdenUI.ScriptArea.prototype.updateLineHighlight = function() {
	var lineno = -1; // Note: -1 means update all.
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
		lineno = this.getLineNumber(this.intextarea);
	}

	this.updateSource(this.intextarea.value, lineno);

	this.runScript(lineno);
	// Emit

	this.highlightContent(lineno, pos);
}


EdenUI.ScriptArea.prototype.runScript = function(line) {
	//console.log("LIVE EDIT",line);
	// If we should run the statement (there are no errors)
	if (this.gutter.lines[line-1] && this.gutter.lines[line-1].live && !this.fragment.ast.hasErrors()) {
		//this.fragment.ast.executeLine(line-1);
		var stat = this.fragment.ast.script.getStatementByLine(line-1);
		//console.log("LIVE LINE",stat);
		this.fragment.ast.executeStatement(stat, line, this.fragment);
	}
}



EdenUI.ScriptArea.prototype.hideInfoBox = function() {
	//$(infobox).hide("fast");
}




/**
 * Re-highlight the current line without re-parsing the script.
 * Used when moving around the script without actually causing a code
 * change that needs a reparse.
 */
EdenUI.ScriptArea.prototype.updateLineCachedHighlight = function() {
	if (!this.fragment) return;
	var lineno = -1;
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
		lineno = this.getLineNumber(this.intextarea);
	}

	this.highlightContent(lineno, pos);
}



/**
 * Parse the script and do a complete re-highlight. This is slow but
 * is required when there are changes across multiple lines (or there
 * could be such changes), for example when pasting.
 */
EdenUI.ScriptArea.prototype.updateEntireHighlight = function(rerun, options) {
	if (this.fragment === undefined) return;
	this.cachedhlopt = options;

	this.updateSource(this.intextarea.value, -1);

	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
	}

	if (rerun) {
		runScript(0);
	}

	this.highlightContent(-1, pos, options);
}

EdenUI.ScriptArea.prototype.updateCachedHighlight = function(options) {
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
	}
	this.highlightContent(-1, pos, (options) ? options : this.cachedhlopt);
}

/**
 * When clicking or using a syntax highlighted element, find which
 * source line this corresponds to. Used by number dragging.
 */
EdenUI.ScriptArea.prototype.findElementLineNumber = function(element) {
	var el = element;
	while (el.parentNode !== this.outdiv) el = el.parentNode;

	var line = parseInt(el.getAttribute("data-line"));
	return line;

	/*for (var i=0; i<this.outdiv.childNodes.length; i++) {
		if (this.outdiv.childNodes[i] === el) return i;
	}
	return -1;*/
}

/**
 * Replace a particular line with the given content.
 * Can be used for autocompletion and number dragging.
 */
EdenUI.ScriptArea.prototype.replaceLine = function(lineno, content) {
	var lines = this.intextarea.value.split("\n");
	lines[lineno] = content;
	this.intextarea.value = lines.join("\n");
}

EdenUI.ScriptArea.prototype.focusOutput = function() {
	this.setCaretToFakeCaret();
	this.outdiv.focus();
}

EdenUI.ScriptArea.prototype.focusText = function() {
	if (this.readonly) return;
	var end = getCaretCharacterOffsetWithin(this.outdiv);
	var start = getStartCaretCharacterOffsetWithin(this.outdiv);

	this.intextarea.focus();
	this.intextarea.selectionEnd = end;
	this.intextarea.selectionStart = start;
	if (start != end) this.refreshentire = true;
}

EdenUI.ScriptArea.prototype.toggleHighlighting = function() {
	this.disablehl = !this.disablehl;
	this.updateEntireHighlight();
	this.gutter.clear();
}

/**
 * Call the highlighter to generate the new highlight output, and then
 * post process this to allow for extra warnings and number dragging.
 */
EdenUI.ScriptArea.prototype.highlightContent = function(lineno, position, options) {
	if (!this.fragment) return;

	var ast = this.fragment.ast;
	var me = this;

	if (!ast) return;

	if (options === undefined && this.disablehl) options = {};
	if (this.disablehl) options.disabled = true;

	this.highlighter.highlight(ast, lineno, position, options);
	//gutter.generate(ast,lineno);


	// Make sure caret remains inactive if we don't have focus
	if (document.activeElement !== this.intextarea) {
		// TODO Make this efficient by keeping record of fake-caret.
		$(this.outdiv).find(".fake-caret").addClass("fake-blur-caret");
	}

	if (this.alwaysreadonly == "comment") {
		var clines = $(this.outdiv).find(".eden-comment-line");

		for (var i=0; i<clines.length; i++) {
			clines[i].contentEditable = false;
		}
	}

	// Make sure number dragging always works.
	this.delayRebuild();
}

EdenUI.ScriptArea.prototype.moveCaret = function() {
	// Update fake caret position at key repeat rate
	this.updateLineCachedHighlight();
	// Adjust scroll position if required
	this.checkScroll();
}

/* Is this needed???? */
EdenUI.ScriptArea.prototype.selectAll = function() {
		this.outdiv.focus();
		var range = document.createRange();
		range.selectNodeContents(this.outdiv);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

EdenUI.ScriptArea.prototype.makeNumbersDrag = function() {
	var me = this;

	/* Number dragging code, but only if live */
	if (!this.readonly) {
		console.log("MAKE NUMBERS DRAG");

		$(this.outdiv).find('.eden-number').draggable({
			helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
			axis: 'x',
			distance: 5,
			drag: function(e,u) {
				if (me.readonly) return;
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

					me.updateSource(me.intextarea.value, me.dragline);

					//scriptagent.setSource(intextarea.value, false, dragline);
					//highlighter.ast = scriptagent.ast;

					//console.log("Dragline: " + dragline);

					// Execute if no errors!
					// TODO This should happen on fragment change event
					me.runScript(me.dragline+1);

					me.highlightContent(me.dragline, -1);
				}
			},
			start: function(e,u) {
				if (me.readonly) return;
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
				if (me.readonly) return;
				$(e.target).removeClass("eden-select");
				$(me.outdiv).css("cursor","text");
				//updateEntireHighlight();
				me.dragline = -1;
			},
			cursor: 'move',
			cursorAt: {top: -5, left: -5}
		// Following line is hack to allow click through editing...
		}).click(function() { $(this).draggable({disabled: true}); }) .blur(function() { $(this).draggable({disabled: false}); });
	}
}

/**
 * Return the current line. Also, set currentlineno.
 */
EdenUI.ScriptArea.prototype.getLineNumber = function() {
	var lines = this.intextarea.value.substr(0, this.intextarea.selectionStart).split("\n");
	this.currentlineno = lines.length;
	this.currentcharno = lines[lines.length-1].length;
	return this.currentlineno;
}

EdenUI.ScriptArea.prototype.gotoLine = function(line) {
	var lines = this.intextarea.value.split("\n");
	lines.length = line+1;
	var end = lines.join("\n").length;

	// Move caret to clicked location
	this.intextarea.focus();
	this.intextarea.selectionEnd = end;
	this.intextarea.selectionStart = end;
	//gutter.selectLine(curline);
	//if (this.fragment) {		
		this.updateLineCachedHighlight();
	//}
}

/**
 * Update scroll position if cursor is near to an edge.
 * TODO Fix for new scroll elements
 */
EdenUI.ScriptArea.prototype.checkScroll = function() {
	return;
	// Get the cursor
	var el = $(this.outdiv.childNodes[this.currentlineno-1]).find(".fake-caret").get(0);
	if (el === undefined) return;
	var area = $codearea.get(0);

	// How far from left or right?
	var distleft = el.offsetLeft - area.scrollLeft + 25;
	var distright = area.clientWidth + area.scrollLeft - el.offsetLeft - 25;

	// Need to find the current line element
	while (el.parentNode != outdiv) el = el.parentNode;

	// How far is this line from the top or bottom
	var disttop = el.offsetTop - area.scrollTop + 15;
	var distbottom = area.clientHeight + area.scrollTop - el.offsetTop - 15;

	// Move if needed.
	if (distleft < 80) area.scrollLeft = area.scrollLeft - (80-distleft);
	if (distright < 80) area.scrollLeft = area.scrollLeft + (80-distright);
	if (disttop < 40) area.scrollTop = area.scrollTop - (40-disttop);
	if (distbottom < 40) area.scrollTop = area.scrollTop + (40-distbottom);
}

/**
 * Move the caret of the contenteditable div showing the highlighted
 * script to be the same location as the fake caret in the highlight
 * itself. This enables shift selection using the browsers internal
 * mechanism.
 */
EdenUI.ScriptArea.prototype.setCaretToFakeCaret = function() {
	var el = $(this.outdiv).find(".fake-caret").get(0);
	if (!el) return;
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

EdenUI.ScriptArea.prototype.makeDiff = function() {
	var spacing = {};
	var edits = this.fragment.diff();
	var lineshift = 0;

	// For each remove line, insert a blank line into the highlighter.
	for (var x in edits.remove) {
		if (edits.remove[x].consecutive) continue;
		var oline = parseInt(x);
		var j = 0;
		var height = 20;
		do {
			height += 20;
			j++;
		} while (edits.remove[oline+j] && edits.remove[oline+j].consecutive);

		spacing[edits.remove[x].nline+lineshift] = height;
	}

	this.gutter.setDiffs(edits);
	this.cachedhlopt = {spacing: spacing};
	this.updateCachedHighlight();
}

/**
 * Script contents have changed, so re-parse, re-highlight and
 * if live, re-execute. Used in a short interval timeout from the
 * raw input/keyup events.
 */
EdenUI.ScriptArea.prototype.doRebuild = function() {
	// rebuildTabs
	this.makeNumbersDrag();
}


EdenUI.ScriptArea.prototype.delayRebuild = function() {
	var me = this;
	// Using a timer to make rebuild async. Allows input and keyup to
	// trigger a single rebuild which overcomes Chrome input event bug.
	clearTimeout(this.rebuildtimer);
	this.rebuildtimer = setTimeout(function() { me.doRebuild(); }, this.rebuildinterval);
}

/**
 * Set the rebuild timeout. Note: rebuildinterval MUST be less than the
 * keyboard repeat rate or you will not see a change when holding keys
 * down.
 */
EdenUI.ScriptArea.prototype.rebuild = function() {
	var me = this;
	if (this.gutter.edits) {
		this.updateSource(this.intextarea.value, -1);
		this.gutter.ast = this.fragment.ast;
		this.makeDiff();
	} else {
		this.edited = true;
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
		this.checkScroll();
		this.dirty = false;
	}
}

EdenUI.ScriptArea.prototype.enableGotoMode = function() {
	if (!this.gotomode) {
		this.outdiv.contentEditable = false;
		changeClass(this.outdiv, "goto", true);
		this.gotomode = true;
	}
}

EdenUI.ScriptArea.prototype.disableGotoMode = function() {
	if (this.gotomode) {
		this.outdiv.contentEditable = true;
		changeClass(this.outdiv, "goto", false);
		this.gotomode = false;
		//this.updateCachedHighlight();
		//this.intextarea.focus();
	}
}

EdenUI.ScriptArea.prototype.insertTab = function() {
	var start = this.intextarea.selectionStart;
	var end = this.intextarea.selectionEnd;

	// set textarea value to: text before caret + tab + text after caret
	this.intextarea.value = this.intextarea.value.substring(0, start)
				+ "\t"
				+ this.intextarea.value.substring(end);

	// put caret at right position again
	this.intextarea.selectionStart =
	this.intextarea.selectionEnd = start + 1;
	//updateLineHighlight();
	this.rebuild();
}


