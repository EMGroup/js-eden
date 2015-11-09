/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

 
 // First of all, prevent missing browser functionality from causing errors.
/*
 * If supported by the browser then JS-EDEN will measure how long it takes to
 * execute the user's code each time they press the submit button in the input
 * window and print the result in the JavaScript console.  If the browser
 * doesn't natively support making timing measurements then the functionality is
 * simply disabled.
*/
if (!("time" in console)) {
	console.time = function (timerName) {
		return;
	};
	console.endTime = function (timerName) {
		return;
	};
}



/**
 * Support function to get the caret position within the syntax highlighted
 * div. Used when clicking or selecting the highlighted script.
 */
function getCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.endContainer, range.endOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}



/**
 * Support function to get the start of a selection of the highlighted script.
 */
function getStartCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.startContainer, range.startOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

 
/**
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */
EdenUI.plugins.ScriptInput = function(edenUI, success) {
	/* Plugin meta information */
	// TODO This should not be here
	EdenUI.plugins.ScriptInput.title = Language.ui.input_window.title;
	EdenUI.plugins.ScriptInput.description = Language.ui.input_window.description;

	var me = this;
	var inputAgent = {name: Symbol.getInputAgentName()};
	this.history = [];
	this.index = 0;
	this.history = JSON.parse(edenUI.getOptionValue('history')) || [];
	this.index = this.history.length;

	this.addHistory = function(text) {
		this.history.push(text);
		this.index = this.history.length;
		edenUI.setOptionValue('history', JSON.stringify(this.history.slice(-50)));
	}

	this.updateHistory = function(text) {
		if (text == "") return;
		this.history[this.index] = text;
		edenUI.setOptionValue('history', JSON.stringify(this.history.slice(-50)));
	}

	this.getHistory = function(index) {
		if (me.history.length == 0) {
			return "";
		} else {
			return me.history[this.index];
		}
	}

	this.previousHistory = function (){
	
		if (this.index <= 0) {
			this.index = 1;
		}
		if (this.index > me.history.length) {
			this.index = me.history.length;
		}
		return this.getHistory(--this.index);
	}

	this.nextHistory = function(){
	
		if (this.index < 0) {
			this.index = 0;
		}
		if (this.index >= me.history.length-1) {
			this.index++;
			return "";
		}
		return this.getHistory(++this.index);
	}

	var historydialog = undefined;


	var closeInput = function(options) {
		var $dialog = options.$dialog;
		$dialog.dialog('close');
	}

	var openInput = function(options) {

		var $dialog = options.$dialog;
		$dialog.dialog('open');
		$(options.editor.getInputField()).focus();
	}

	this.generateHistory = function() {

		result = "";
		for (var i=0; i<me.history.length; i++) {
			var theclass = "input-history-line";
			result = result + "<div class=\""+theclass+"\"><p style=\"word-wrap: break-word;\">" + Eden.htmlEscape(me.history[i]) + "</p></div>";
		}
		return result;
	}

	this.createHistory = function(name,mtitle) {

		historydialog = $('<div id="'+name+'"></div>')
			.html("<div class=\"history\">"+edenUI.plugins.ScriptInput.generateHistory()+"</div>")
			.dialog({
				title: mtitle,
				width: 500,
				height: 500,
				minHeight: 300,
				minWidth: 300

			}).find(".history");
	}



	/**
	 * Common input window view constructor.
	 */
	this.createCommon = function (name, mtitle, code, power, embedded) {
		var $dialogContents = $('<div class="inputdialogcontent"><div class="inputhider"><textarea autofocus tabindex="1" class="hidden-textarea"></textarea><div class="inputCodeArea"><div class="eden_suggestions"></div><div spellcheck="false" contenteditable class="outputcontent"></div></div></div><div class="info-bar"></div><div class="outputbox"></div></div></div>')
		//var $optmenu = $('<ul class="input-options-menu"><li>Mode</li><li>Word-wrap</li><li>Spellcheck</li><li>All Leaves</li><li>All Options</li></ul>');		
		var position = 0;
		var $codearea = $dialogContents.find('.inputCodeArea');
		var intextarea = $dialogContents.find('.hidden-textarea').get(0);
		var outdiv = $dialogContents.find('.outputcontent').get(0);
		var infobox = $dialogContents.find('.info-bar').get(0);
		var outputbox = $dialogContents.find('.outputbox').get(0);
		var suggestions = $dialogContents.find('.eden_suggestions');
		suggestions.hide();
		$(infobox).hide();

		var gutter = new EdenScriptGutter($codearea.get(0));

		//$dialogContents.append($optmenu);
		//$optmenu.menu();

		var dragstart = 0;
		var dragvalue = 0;
		var draglast = 0;
		var dragline = -1;
		var dragint = false;
		var typingtimer;
		var rebuildtimer;
		var amtyping = false;
		var typinginterval = 2000;
		var rebuildinterval = 10;
		var currentlineno = 1;
		var currentcharno = 0;
		var highlighter = new EdenUI.Highlight(outdiv);
		var autoexec = power;
		var inputchanged = false;
		var refreshentire = false;
		var edited = false;
		var dirty = false;



		/**
		 * If the input window is a dialog then set its title.
		 */
		function setTitle(title) {
			var p = $dialogContents.get(0).parentNode;
			if (p) {
				p = p.parentNode;
				if (p) {
					$(p).find(".ui-dialog-title").html(title);
				}
			}
		}



		/**
		 * Generate the script text from a list. The list can contain strings
		 * for each line, or a symbol reference to get the current definition.
		 * Used on load and when _script changes.
		 */
		function preloadScript(sym, value) {
			var res = "";
			if (value instanceof Array) {
				for (var i=0; i < value.length; i++) {
					if (typeof value[i] == "string") {
						res += value[i] + "\n";
					} else if (typeof value[i] == "object") {
						res += value[i].eden_definition+"\n";
					}
				}
			}
			intextarea.value = res;
			updateEntireHighlight();
		}



		/**
		 * Load a file from the server as the script.
		 */
		function loadFile(sym, value) {
			$.get(value, function(data) {
				intextarea.value = data;
				updateEntireHighlight();
			}, "text");
		}



		function switchPower(sym, value) {
			if (value) powerOn();
			else powerOff();
		}



		// Use the agent wrapper for dealing with view interaction via symbols.
		var obs_script = "_view_"+name+"_script";
		var obs_next = "_view_"+name+"_next";
		var obs_prev = "_view_"+name+"_prev";
		var obs_override = "_view_"+name+"_override";
		var obs_file = "_view_"+name+"_file";
		var obs_power = "_view_"+name+"_power";
		var agent = new Eden.Agent([obs_script,obs_next,obs_prev,obs_override, obs_file, obs_power], eden.root.scope);

		// Whenever _script is changed, regenerate the contents.
		agent.on(obs_script, preloadScript);
		agent.on(obs_file, loadFile);
		agent.on(obs_power, switchPower);

		edenUI.eden.root.addGlobal(function(sym, create) {
			if (highlighter.ast) {
				var whens = highlighter.ast.triggers[sym.name.slice(1)];
				if (whens) {
					//clearExecutedState();
					for (var i=0; i<whens.length; i++) {
						whens[i].execute(eden.root, undefined, highlighter.ast);
					}
					gutter.generate(highlighter.ast,-1);
					clearExecutedState();
				}
			}
		});



		function refreshGutter() {
			gutter.generate(highlighter.ast,-1);
			clearExecutedState();
			setTimeout(refreshGutter, 500);
		}
		//setTimeout(refreshGutter,500);



		/**
		 * Re-parse the entire script and then re-highlight the current line
		 * (and one line either size).
		 */
		function updateLineHighlight() {
			var ast = new EdenAST(intextarea.value);
			highlighter.ast = ast;
			var lineno = -1; // Note: -1 means update all.
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			runScript();

			highlightContent(ast, lineno, pos);
			//rebuildNotifications();
		}



		/**
		 * Re-highlight the current line without re-parsing the script.
		 * Used when moving around the script without actually causing a code
		 * change that needs a reparse.
		 */
		function updateLineCachedHighlight() {
			var lineno = -1;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			highlightContent(highlighter.ast, lineno, pos);
		}



		/**
		 * Parse the script and do a complete re-highlight. This is slow but
		 * is required when there are changes across multiple lines (or there
		 * could be such changes), for example when pasting.
		 */
		function updateEntireHighlight(rerun) {
			var ast = new EdenAST(intextarea.value);
			highlighter.ast = ast;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
			}

			var cacheline = currentlineno;
			if (rerun) {
				// Execute entire script
				currentlineno = 0;
			} else {
				// Don't execute
				currentlineno = -1;
			}
			runScript();
			currentlineno = cacheline;

			highlightContent(ast, -1, pos);
		}



		/**
		 * Check if any of the listed symbols are undefined. Used in generating
		 * warnings about use of undefined observables.
		 */
		function checkUndefined(dependencies) {
			var res = [];
			for (var d in dependencies) {
				if (eden.root.lookup(d).value() === undefined) {
					res.push(d);
				}
			}
			return res;
		}



		/* Execute a particular line of script.
		 * If the statement is part of a larger statement block then execute
		 * that instead (eg. a proc).
		 */
		function submitLine(ast, lineno) {
			var line = lineno;
			// Make sure we are not in the middle of a proc or func.
			while ((line > 0) && (ast.lines[line] === undefined)) {
				line--;
			}

			var statement;
			if (lineno == -1) {
				statement = ast.script;
			} else {
				statement = ast.lines[line];
			}
			if (!statement) return;

			// Find root statement and execute that one
			while (statement.parent !== undefined && statement.parent.parent !== undefined) statement = statement.parent;

			// Execute only the currently changed root statement
			me.submit(statement, highlighter.ast);

			// Oops, mark the errors
			/*if (statement.errors.length > 0) {
				showInfoBox("error", statement.errors[0].messageText());
				addErrorLine(line+1);
			}*/
		}



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



		function hideInfoBox() {
			$(infobox).hide("fast");
		}



		/* UNUSED DUE TO PERFORMANCE BUG */
		function rebuildNotifications() {
			for (var i=0; i<highlighter.ast.lines.length; i++) {
				if (highlighter.ast.lines[i] &&
						highlighter.ast.lines[i].lvalue) {
					eden.root.lookup(highlighter.ast.lines[i].lvalue.observable).addJSObserver(name+"_scriptLines", notifyOutOfDate);
				}
			}
		}



		/**
		 * Add a warning icon to the left of the specified line
		 */
		function addWarningLine(lineno, msg) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-warnline");
			if (msg) {
				outdiv.childNodes[lineno-1].title = msg;
			}
		}



		/**
		 * Add an extension icon to the left of the specified line
		 */
		function addExtendedLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-extendedline");
		}



		/**
		 * Add a link icon to the left of the specified line
		 */
		function addParentLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-parentline");
		}



		/**
		 * Add an error icon to the left of the specified line
		 */
		function addErrorLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-errorline");
		}



		/* UNUSED */
		function notifyOutOfDate(symbol, value) {
			// If power is off, don't show conflict warnings
			if (!autoexec) return;

			// Find the symbol in the ast lines and highlight that line
			var count = 0;
			var name = symbol.name.slice(1);
			for (var i=0; i<highlighter.ast.lines.length; i++) {
				var curast = highlighter.ast.lines[i];

				// Ignore number dragging line
				if (i == dragline) continue;

				if (curast && curast.lvalue &&
						curast.lvalue.observable == name) {

					// Any statement with a parent should be ignored
					// TODO: check if statements
					if (curast.parent) continue;

					if (curast.type == "definition") {
						// Compare eden definitions
						if (symbol.eden_definition != highlighter.ast.getSource(curast)) {
							//addWarningLine(i+1, "Definition has been changed elsewhere.");
							commentOutLine(i+1);
						}
					} else if (curast.type == "assignment") {
						var myval = curast.expression.execute(eden.root,undefined);
						// TODO compare eden value string?
						if (!rt.equal(myval,value)) {
							//addWarningLine(i+1, "This line says '"+name+"' = '" + myval + "', but somewhere else it changed to '"+value+"'. Please choose a resolution.");
							commentOutLine(i+1);
						}
					}
					count++;
				}
			}
			if (count > 0) {
				updateEntireHighlight();
			}
		}



		/**
		 * Called by a timeout after a period of inactivity. Displays any
		 * error and warning messages.
		 */
		function doneTyping() {
			amtyping = false;

			if (autoexec && highlighter.ast.script.errors.length == 0) {
				// Get current line number
				var lineno = getLineNumber(intextarea)-1;

				// If the current line has a statement
				if (highlighter.ast.lines[lineno]) {
					var ast = highlighter.ast.lines[lineno];

					// If the statement is a definition or assignment
					if (ast.type == "definition" || ast.type == "assignment") {
						var observable = highlighter.ast.lines[lineno].lvalue.observable;
						var sym = eden.root.lookup(observable);
						var val = sym.value();

						// Show a warning if it evaluates to undefined
						// TODO: use _option_showundefined
						if (val === undefined) {
							// Find why it is undefined...
							var undef = checkUndefined(ast.dependencies);

							// One of its dependencies is undefined...
							if (undef.length > 0) {
								var undefstr = "";
								for (var i=0; i<undef.length; i++) {
									undefstr += "<b>"+undef[i]+"</b>";
									if (i != undef.length - 1) undefstr += ",";
								}
								if (undef.length == 1) {
									addWarningLine(currentlineno);
									//showInfoBox("warning", "<b>" + observable + "</b> "+ Language.ui.input_window.is_undef_because +" "+undefstr+" " + Language.ui.input_window.is_undef);
								} else {
									addWarningLine(currentlineno);
									//showInfoBox("warning", "<b>" + observable + "</b> "+ Language.ui.input_window.is_undef_because +" "+undefstr+" " + Language.ui.input_window.are_undef);
								}
							// Its undefined but we don't know why
							} else {
								addWarningLine(currentlineno);
								//showInfoBox("warning", observable + " " + Language.ui.input_window.is_undef);
							}
						// Not undefined
						} else {
							//hideInfoBox();
						}
					} else {
						//hideInfoBox();
					}
				} else {
					//hideInfoBox();
				}
			} else if (highlighter.ast.script.errors.length != 0) {
				//showInfoBox("error", highlighter.ast.script.errors[0].messageText());
				//addErrorLine(highlighter.ast.script.errors[0].line, highlighter.ast.script.errors[0].messageText());
			} else {
				//hideInfoBox();
			}
		}



		/**
		 * Replace a particular line with the given content.
		 * Can be used for autocompletion and number dragging.
		 */
		function replaceLine(lineno, content) {
			var lines = intextarea.value.split("\n");
			lines[lineno] = content;
			intextarea.value = lines.join("\n");
		}



		/**
		 * Insert an array of lines into the script at the given line.
		 * Potentially used when expanding definition filters.
		 * CURRENTLY UNUSED
		 */
		function insertLines(lineno, newlines) {
			var lines = intextarea.value.split("\n");
			for (var i=0; i<newlines.length; i++) {
				lines.splice(lineno, 0, newlines[i]);
			}
			intextarea.value = lines.join("\n");
		}



		/**
		 * Prepend ## to a line to comment it out.
		 * CURRENTLY UNUSED.
		 */
		function commentOutLine(lineno) {
			var lines = intextarea.value.split("\n");
			lines[lineno-1] = "##" + lines[lineno-1];
			intextarea.value = lines.join("\n");
		}



		/**
		 * When clicking or using a syntax highlighted element, find which
		 * source line this corresponds to. Used by number dragging.
		 */
		function findElementLineNumber(element) {
			var el = element;
			while (el.parentNode !== outdiv) el = el.parentNode;

			for (var i=0; i<outdiv.childNodes.length; i++) {
				if (outdiv.childNodes[i] === el) return i;
			}
			return -1;
		}



		/**
		 * Update scroll position if cursor is near to an edge.
		 */
		function checkScroll() {
			// Get the cursor
			var el = $(outdiv).find(".fake-caret").get(0);
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
		 * Call the highlighter to generate the new highlight output, and then
		 * post process this to allow for extra warnings and number dragging.
		 */
		function highlightContent(ast, lineno, position) {
			highlighter.highlight(ast, lineno, position);
			gutter.generate(ast,lineno);

			// If the first line is a comment, set the title to that
			if (lineno == -1 || lineno == 1) {
				if (ast.stream.code.charAt(0) == "#") {
					setTitle(ast.stream.code.split("\n")[0].substr(2));
				} else {
					setTitle(Language.ui.input_window.title);
				}
			}

			// Post process lines, adding links and warnings
			for (var i=0; i<ast.lines.length; i++) {
				if (ast.lines[i]) {
					if (ast.lines[i].type == "definition") {
						var sym = eden.root.lookup(ast.lines[i].lvalue.observable);
						if (sym.extend) {
							if (ast.lines[i].lvalue.lvaluep.length > 0) {
								addParentLine(i+1);
							} else {
								addExtendedLine(i+1);
							}
						}
					}
				}
			}

			// Adjust scroll position if required
			checkScroll();

			// Make sure caret remains inactive if we don't have focus
			if (document.activeElement !== intextarea) {
				$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			}

			/*$(outdiv).on('mouseup', '.eden-extendedline', function(e) {
				if (e.offsetX < 0) {
					var lineno = currentlineno+1;
					var filters = [];
					var curast = highlighter.ast.lines[lineno];
					console.log(curast);
					if (curast) {
						var sym = eden.root.lookup(curast.lvalue.observable);
						for (var e in sym.extend) {
							filters.push(sym.extend[e].source);
						}
						insertLines(lineno+1, filters);
					}
				}
			});*/

			/* Number dragging code, but only if live */
			if (autoexec) {
				$(outdiv).find('.eden-number').draggable({
					helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
					axis: 'x',
					drag: function(e,u) {
						var newval;
						if (dragint) {
							newval = Math.round(dragvalue + ((u.position.left - dragstart) / 2));
						} else {
							newval = dragvalue + ((u.position.left - dragstart) * 0.005);
							newval = newval.toFixed(4);
						}

						// TODO: this is no good for floats
						if (newval != draglast) {
							draglast = newval;
							e.target.innerHTML = "" + newval;

							var content = e.target.parentNode.textContent;
							if (content.charAt(content.length-1) == "\n") {
								content = content.slice(0,-1);
							}
							replaceLine(dragline, content);

							var ast = new EdenAST(intextarea.value);
							highlighter.ast = ast;

							// Execute if no errors!
							if (autoexec && ast.script.errors.length == 0) {
								submitLine(ast, dragline);
							}

							highlightContent(ast, dragline, -1);
						}
					},
					start: function(e,u) {
						edited = true;
						// Calculate the line we are on
						dragline = findElementLineNumber(e.target);
						dragstart = u.position.left;
						var content = e.target.textContent;
						if (content.indexOf(".") == -1) {
							dragvalue = parseInt(content);
							dragint = true;
						} else {
							dragvalue = parseFloat(content);
							dragint = false;
						}
						draglast = dragvalue;

						$(e.target).addClass("eden-select");
						$(outdiv).css("cursor","ew-resize");
					},
					stop: function(e,u) {
						$(e.target).removeClass("eden-select");
						$(outdiv).css("cursor","text");
						//updateEntireHighlight();
						dragline = -1;
						inputchanged = true;
					},
					cursor: 'move',
					cursorAt: {top: -5, left: -5}
				});
			}
		}



		/**
		 * Return the current line. Also, set currentlineno.
		 */
		function getLineNumber(textarea) {
			var lines = textarea.value.substr(0, textarea.selectionStart).split("\n");
			currentlineno = lines.length;
			currentcharno = lines[lines.length-1].length;
			return currentlineno;
		}



		/**
		 * Turn the power button grey and disable live coding.
		 */
		function powerOff() {
			powerOk();
			$powerbutton.removeClass("power-on").addClass("power-off");
			autoexec = false;
		}



		/**
		 * Turn the power button green and enable live coding.
		 */
		function powerOn() {
			$powerbutton.removeClass("power-off").addClass("power-on");
			autoexec = true;
		}



		/**
		 * If we are live coding, turn the power button red.
		 */
		function powerError() {
			if (autoexec) {
				$powerbutton.addClass("power-error");
			}
		}



		/**
		 * Remove error status, turning power button green again.
		 */
		function powerOk() {
			if ($powerbutton.hasClass("power-error")) {
				$powerbutton.removeClass("power-error");
			}
		}



		function powerToggle() {
			if (autoexec) {
				powerOff();
			} else {
				powerOn();
			}
		}



		/**
		 * Move the caret of the contenteditable div showing the highlighted
		 * script to be the same location as the fake caret in the highlight
		 * itself. This enables shift selection using the browsers internal
		 * mechanism.
		 */
		function setCaretToFakeCaret() {
			var el = $(outdiv).find(".fake-caret").get(0);
			var range = document.createRange();
			var sel = window.getSelection();
			if (el.nextSibling) el = el.nextSibling;
			range.setStart(el, 0);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		}



		/* Is this needed???? */
		function selectAll() {
			var range = document.createRange();
			range.selectNodeContents(outdiv);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}



		/**
		 * Script contents have changed, so re-parse, re-highlight and
		 * if live, re-execute. Used in a short interval timeout from the
		 * raw input/keyup events.
		 */
		function doRebuild() {
			// Regenerate the AST and highlight the code.
			if (refreshentire) {
				updateEntireHighlight();
				refreshentire = false;
			} else { // if (dirty) {
				updateLineHighlight();
			/*} else {
				updateLineCachedHighlight();*/
			}
			dirty = false;
		}



		function runScript() {
			// If we should run the statement (there are no errors)
			if (autoexec && highlighter.ast.script.errors.length == 0) {
				powerOk();
				console.log("Currentline: " + currentlineno);
				submitLine(highlighter.ast, currentlineno-1);
				//console.log(highlighter.ast.lines);
			} else if (autoexec) {
				console.log(highlighter.ast.script.errors);
				powerError();
			}
		}



		/**
		 * Set the rebuild timeout. Note: rebuildinterval MUST be less that the
		 * keyboard repeat rate or you will not see a change when holding keys
		 * down.
		 */
		function rebuild() {
			edited = true;
			// Using a timer to make rebuild async. Allows input and keyup to
			// trigger a single rebuild which overcomes Chrome input event bug.
			clearTimeout(rebuildtimer);
			rebuildtimer = setTimeout(doRebuild, rebuildinterval);
		}



		function clearExecutedState() {
			for (var i=0; i<highlighter.ast.lines.length; i++) {
				if (highlighter.ast.lines[i]) {
					if (highlighter.ast.lines[i].executed > 0) {
						highlighter.ast.lines[i].executed = 0;
					}
				}
			}
		}



		/**
		 * Event handler for input change.
		 */
		function onInputChanged(e) {
			inputchanged = true;
			dirty = true;

			// Typing status, error messages and result value are delayed
			// by "typinginterval", so restart timeout.
			clearTimeout(typingtimer);
			if (amtyping == false) {
				hideInfoBox();
				amtyping = true;
			}
			typingtimer = setTimeout(doneTyping, typinginterval);

			rebuild();

				/* Suggestions Box */
				//console.log(window.getSelection().getRangeAt(0));
				// Is there an abstract syntax tree node for this line?
				/*var curast = stream.ast.lines[stream.currentline-1];
				if (curast) {
					var pattern = stream.ast.getSource(curast).split("\n")[0];
					//console.log("Fill: " + pattern);

					// Get the current line and its screen position to
					// position the suggestions box correctly.
					var curlineele = $(textarea).find(".eden-currentline");
					var pos = curlineele.position();
					if (pos === undefined) pos = $(textarea).position();
					pos.top += $dialogContents.get(0).scrollTop;
					
					if (curast.type == "definition") {
						var rhs = pattern.split("is")[1].trim();
						//console.log("RHS: " + rhs);
						var sym = eden.root.lookup(curast.lvalue.observable);
						var def = sym.eden_definition;
						if (def) def = def.split("is")[1].trim();
						if (def && def.substr(0,rhs.length) == rhs) {
							//console.log("SUGGEST: " + sym.eden_definition);
							suggestions.text(sym.eden_definition.split("is")[1].trim());
							if (suggestions.is(":visible") == false) {
								suggestions.css("top",""+ (pos.top + 20) +"px");
								suggestions.show("fast");
							}
						} else {
							var regExp = new RegExp("^(" + rhs + ")", "");
							var suggest = "";
							var count = 0;
							var last = "";
							for (var s in eden.root.symbols) {
								if (regExp.test(s)) {
									count++;
									last = s;
									//console.log("SUGGEST: " + s);
									suggest += s + "<br/>";
								}
							}
							if (count > 1 || (count == 1 && rhs.length < last.length)) {
								suggestions.html(suggest);
								if (suggestions.is(":visible") == false) {
									suggestions.css("top",""+ (pos.top + 20) +"px");
									suggestions.show("fast");
								}
							} else {
								suggestions.hide("fast");
							}
						}
					} else {
						suggestions.hide("fast");
					}
				} else {
					suggestions.hide("fast");
				}*/
		}



		/**
		 * Various keys have special actions that require intercepting. Tab key
		 * must insert a tab, shift arrows etc cause selection and require a
		 * focus shift, and adding or deleting lines need to force a full
		 * rehighlight.
		 */
		function onTextKeyDown(e) {
			// If not Ctrl or Shift key then
			if (!e.ctrlKey && e.keyCode != 17 && e.keyCode != 16) {
				// Make TAB key insert TABs instead of changing focus
				if (e.keyCode == 9) {
					e.preventDefault();
					var start = intextarea.selectionStart;
					var end = intextarea.selectionEnd;

					// set textarea value to: text before caret + tab + text after caret
					intextarea.value = intextarea.value.substring(0, start)
								+ "\t"
								+ intextarea.value.substring(end);

					// put caret at right position again
					intextarea.selectionStart =
					intextarea.selectionEnd = start + 1;
					//updateLineHighlight();
					rebuild();
				} else if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
					// Shift arrow selection, move to editable div.
					if (e.shiftKey) {
						outdiv.focus();
						setCaretToFakeCaret();
						return;
					}
					
					// Update fake caret position at key repeat rate
					updateLineCachedHighlight();
				} else if (e.keyCode == 13 || (e.keyCode == 8 && intextarea.value.charCodeAt(intextarea.selectionStart-1) == 10)) {
					// Adding or removing lines requires a full re-highlight at present
					refreshentire = true;
				}

			} else if (e.ctrlKey) {
				if (e.shiftKey) {
					if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
						// Ctrl+Shift arrow selection, move to editable div.
						outdiv.focus();
						setCaretToFakeCaret();
						return;
					}
				} else if (e.keyCode === 38) {
					// up
					onPrevious();
				} else if (e.keyCode === 40) {
					// down
					onNext();
				} else if (e.keyCode === 86) {
					// Pasting so disable live code
					powerOff();
				} else if (e.keyCode === 65) {
					// Ctrl+A to select all.
					e.preventDefault();
					outdiv.focus();
					selectAll();
				}
			}
		}



		/**
		 * Some keys don't change content but still need a rehighlight. And,
		 * in case the input change event is skipped (Chrome!!), make sure a
		 * rebuild does happen.
		 */
		function onTextKeyUp(e) {
			if (!e.ctrlKey && (	e.keyCode == 37 ||	//Arrow keys
								e.keyCode == 38 ||
								e.keyCode == 39 ||
								e.keyCode == 40 ||
								e.keyCode == 36 ||	// Home key
								e.keyCode == 35)) {	// End key
				//var scrollpos = $codearea.get(0).scrollTop;
				updateLineCachedHighlight();
				//$codearea.scrollTop(scrollpos);
			} else if (e.ctrlKey && (e.keyCode == 86 || e.keyCode == 90)) {
				// Paste and undo/redo need to update content
				updateEntireHighlight();
			} else {
				rebuild();
			}
		}



		/**
		 * When focus is on the output and a key is pressed. This occurs when
		 * text is selected that needs replacing.
		 */
		function onOutputKeyDown(e) {
			if (e.keyCode == 16 || e.keyCode == 17 || (e.ctrlKey && e.keyCode == 67)) {
				// Ignore Ctrl and Ctrl+C.
			// If not shift selecting...
			} else if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36))) {
				var end = getCaretCharacterOffsetWithin(outdiv);
				var start = getStartCaretCharacterOffsetWithin(outdiv);

				intextarea.focus();
				intextarea.selectionEnd = end;
				intextarea.selectionStart = start;
			}
		}



		/**
		 * Make the caret look invisible. It must still exist to keep record
		 * of current location for selection purposes.
		 */
		function onTextBlur(e) {
			$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			hideInfoBox();
		}



		/**
		 * Make the caret visible.
		 */
		function onTextFocus(e) {
			$(outdiv).find(".fake-caret").removeClass("fake-blur-caret");
		}



		/**
		 * Clicking on the highlighted script needs to move the cursor position.
		 * Unless a selection is being made, in which case keep the focus on
		 * the highlighted output instead.
		 */
		function onOutputMouseUp(e) {
			hideInfoBox();

			// To prevent false cursor movement when dragging numbers...
			if (document.activeElement === outdiv) {
				var end = getCaretCharacterOffsetWithin(outdiv);
				var start = getStartCaretCharacterOffsetWithin(outdiv);
				if (start != end) {
					// Fix to overcome current line highlight bug on mouse select.
					refreshentire = true;
				} else {
					// Move caret to clicked location
					var curline = currentlineno;
					intextarea.focus();
					intextarea.selectionEnd = end;
					intextarea.selectionStart = end;		
					highlighter.highlight(highlighter.ast, curline, end);
					updateLineCachedHighlight();
					checkScroll();
				}
			}
		}



		function onGutterClick(e) {
			//console.log(e);
			var lineno = -1;

			for (var i=0; i<gutter.gutter.childNodes.length; i++) {
				if (e.target === gutter.gutter.childNodes[i]) {
					lineno = i+1;
					break;
				}
			}

			if (highlighter.ast.lines[lineno-1]) {
				if (highlighter.ast.lines[lineno-1].errors.length > 0) {
					if (highlighter.ast.lines[lineno-1].errors[0].line == lineno) {
						showInfoBox(e.target.offsetLeft+20, e.target.offsetTop-$codearea.get(0).scrollTop+25, "error", highlighter.ast.lines[lineno-1].errors[0].messageText());
					}
				} else {
					clearExecutedState();
					submitLine(highlighter.ast, lineno-1);
					gutter.generate(highlighter.ast, lineno);
				}
			}
		}



		/**
		 * Move script to previous in history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onPrevious() {
			if (agent[obs_override] == true) {
				agent[obs_prev] = true;
				agent[obs_prev] = false;
			} else {
				if (inputchanged && intextarea.value != "") me.updateHistory(intextarea.value);
				powerOff();
				intextarea.value = edenUI.plugins.ScriptInput.previousHistory();
				updateEntireHighlight();
				inputchanged = false;
			}
		}



		/**
		 * Move script to next in history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onNext() {
			if (agent[obs_override] == true) {
				agent[obs_next] = true;
				agent[obs_next] = false;
			} else {
				if (inputchanged && intextarea.value != "") me.updateHistory(intextarea.value);
				powerOff();
				intextarea.value = edenUI.plugins.ScriptInput.nextHistory();
				updateEntireHighlight();
				inputchanged = false;
			}
		}



		// Set the event handlers
		$dialogContents
		.on('input', '.hidden-textarea', onInputChanged)
		.on('keydown', '.hidden-textarea', onTextKeyDown)
		.on('keyup', '.hidden-textarea', onTextKeyUp)
		.on('keydown', '.outputcontent', onOutputKeyDown)
		.on('blur', '.hidden-textarea', onTextBlur)
		.on('focus', '.hidden-textarea', onTextFocus)
		.on('mouseup', '.outputcontent', onOutputMouseUp)
		.on('click', '.previous-input', onPrevious)
		.on('click', '.next-input', onNext)
		.on('click', '.eden-gutter-item', onGutterClick);

		// Create power button
		var $powerbutton = $('<div class="scriptswitch power-off" title="Live Making">&#xF011;</div>');
		$dialogContents.append($powerbutton);
		var powerbutton = $powerbutton.get(0);
		if (power) powerOn();

		$powerbutton.click(function (e) {
			autoexec = !autoexec;

			if (autoexec) {
				powerOn();
				updateEntireHighlight(true);
				//me.submit(highlighter.ast.script, highlighter.ast);
			} else {
				powerOff();
			}
		});

		// Initialise contents if given some code
		if (code) {
			inputchanged = true;	// To make sure it goes into history.
			intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(code);
			updateEntireHighlight();
		}

		var viewdata = {
			contents: $dialogContents,
			update: function(data) {
				if (edited == false) {
					if (data instanceof Symbol) {
						agent.setScope(data.getValueScope(eden.root.scope));
						inputchanged = true;	// To make sure it goes into history.
						intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(agent.code);
						updateEntireHighlight();
					} else if (data instanceof Array) {
						inputchanged = true;	// To make sure it goes into history.
						intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(data);
						updateEntireHighlight();
					}
				}
			},
			setValue: function (value) { intextarea.value = value; }
		}

		// Initialise highlight content
		updateEntireHighlight();

		return viewdata;
	};



	this.createDialog = function(name, mtitle, code) {
		var simpleName = name.slice(0, -7);
		var viewdata = me.createCommon(simpleName, mtitle, code, false, false);

		var idealheight = 224;
		if (code) {
			var linecount = viewdata.contents.find("textarea").val().split("\n").length;
			idealheight = EdenUI.plugins.ScriptInput.getRequiredHeight(linecount + 1);
		}

		var buttonbar = $('<div class="control-bar"><div class="buttonsDiv"><button class="previous-input">&#xf112;</button><button class="next-input">&#xf064;</button><button class="observe-input">&#xf142;</button></div>');
		buttonbar.appendTo(viewdata.contents);

		$dialog = $('<div id="'+name+'"></div>')
			.html(viewdata.contents)
			.dialog({
				title: mtitle,
				width: 500,
				height: idealheight,
				minHeight: 203,
				minWidth: 300,
				dialogClass: "input-dialog"
			});

		viewdata.confirmClose = !("MenuBar" in edenUI.plugins);

		return viewdata;
	};

	this.createEmbedded = function(name, mtitle, code, power) {
		var viewdata = me.createCommon(name, mtitle, code, power, true);
		viewdata.contents.find('.inputCodeArea').css("bottom","0px");
		//var undockbutton = $('<div class="buttonsLeftDiv"><button class="clone-input">&#xf24d;</button></div>');
		//undockbutton.appendTo(viewdata.contents);
		return viewdata;
	}



	this.submit = function (statement, base) {
		//console.time("EdenASTToJS");
		try {
			statement.execute(eden.root,undefined, base);
		} catch (e) {
			eden.error(e);
		}
		//console.timeEnd("EdenASTToJS");
	};



	edenUI.views.ScriptInput = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: Language.ui.input_window.title,
		category: edenUI.viewCategories.interpretation,
		menuPriority: 0
	};

	edenUI.views.History = {
		dialog: this.createHistory,
		title: "Input History",
		category: edenUI.viewCategories.history
	};
	
	edenUI.history = this.history;
	
	success();
};

EdenUI.plugins.ScriptInput.buildScriptFromList = function(value) {
	var res = "";
	if (value instanceof Array) {
		for (var i=0; i < value.length; i++) {
			if (typeof value[i] == "string") {
				res += value[i] + "\n";
			} else if (typeof value[i] == "object") {
				if (value[i].definition !== undefined) {
					res += value[i].eden_definition+"\n";
				} else {
					var name = value[i].name.slice(1);
					res += name + " = " + Eden.edenCodeForValue(value[i].value()) + ";\n";
				}
			}
		}
	}
	return res;
};

/**
 * Returns the required height in pixels to display the specified number
 * of lines. Used for embedding an input window.
 */
EdenUI.plugins.ScriptInput.getRequiredHeight = function(lines, embed) {
	if (embed) {
		return 15 + 20 * lines;
	} else {
		return 15 + 30 + 20 * lines + 20;
	}
};


