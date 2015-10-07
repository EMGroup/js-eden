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
	EdenUI.plugins.ScriptInput.title = Language.ui.input_window.title;
	EdenUI.plugins.ScriptInput.description = Language.ui.input_window.description;

	function makeRepresentative(value, scale, sym) {
		var type = typeof value;

		switch (type) {
		case "number": return makeNumberRepresentative(value, scale, sym);
		case "string": return makeStringRepresentative(value, scale, sym);
		case "object": return makeObjectRepresentative(value, scale, sym);
		case "function": return makeFunctionRepresentative(value, scale, sym);
		}
	}

	function makeFunctionRepresentative(value, scale, sym) {
		var name = sym.name.substr(1);
		if (edenfunctions.functions[name]) {
			var params = Object.keys(edenfunctions.functions[name].parameters || {});
			name += "(" + params.join(", ") + ")";
			var $div = $("<div class='eden-representative'></div>");
			$div.css("font-size",""+Math.round(scale * 0.2)+"px");
			$div.text(name);
			return $div;
		}
	}

	function makeNumberRepresentative(value, scale, sym) {
		var $div = $("<span class='eden-representative'></span>");
		//$div.css("font-size",""+Math.round(scale * 0.4)+"px");
		if (value % 1 === 0) {
			$div.text(""+value);
		} else {
			$div.text(""+value.toFixed(2));
		}
		return $div;
	}

	var colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

	function makeStringRepresentative(value, scale, sym) {
		if (colours[value]) return makeColourRepresentative(value, scale, sym);
		var iscolor  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
		if (iscolor) return makeColourRepresentative(value, scale, sym);
		iscolor = /^rgb\(.*/i.test(value);
		if (iscolor) return makeColourRepresentative(value, scale, sym);

		var $div = $("<span class='eden-representative'></span>");
		$div.css("font-weight","normal");
		$div.css("color","red");
		$div.text("\""+value+"\"");
		return $div;
	}

	function makeColourRepresentative(value, scale, sym) {
		var $div = $("<span class='eden-representative'></span>");
		$div.css("width",""+Math.round(scale));
		$div.css("height",""+Math.round(scale));
		$div.css("background-color",value);
		return $div;
	}

	function makeObjectRepresentative(value, scale, sym) {
		if (value instanceof Rectangle) {
			var $canvas = $("<canvas width='"+scale+"' height='"+scale+"'></canvas>");
			var canvas = $canvas.get(0);
			var ctx = canvas.getContext("2d");
			//ctx.fillStyle = "white";
			//ctx.rect(0,0,Math.round(scale),Math.round(scale));
			//ctx.fill();
			var largest = Math.max(value.width,value.height);
			var factor = scale / largest;
			ctx.scale(factor,factor);
			var tx = value.x;
			var ty = value.y;
			value.x = 0; value.y = 0;
			//ctx.translate(value.x,0-value.y);
			value.draw(ctx);
			value.x = tx; value.y = ty;
			return $canvas;
		} else if (value instanceof Line) {
			var $canvas = $("<canvas width='"+scale+"' height='"+scale+"'></canvas>");
			var canvas = $canvas.get(0);
			var ctx = canvas.getContext("2d");
			//ctx.fillStyle = "white";
			//ctx.rect(0,0,Math.round(scale),Math.round(scale));
			//ctx.fill();
			var dx = value.x2 - value.x1;
			var dy = value.y2 - value.y1;

			if (dx < dy) {
				var factor = scale / dy;
				dy = scale;
				dx *= factor;
			} else {
				var factor = scale / dx;
				dx = scale;
				dy *= factor;
			}

			var tx = value.x1;
			var ty = value.y1;
			var tx2 = value.x2;
			var ty2 = value.y2;

			value.x1 = (scale/2) - (dx/2);
			value.y1 = (scale/2) - (dy/2);
			value.x2 = (scale/2) + (dx/2);
			value.y2 = (scale/2) + (dy/2);
			//ctx.translate(value.x,0-value.y);
			value.draw(ctx);
			value.x1 = tx; value.y1 = ty;
			value.x2 = tx2; value.y2 = ty2;
			return $canvas;
		} else if (value instanceof HTMLImage) {
			var largest = Math.max(value.width,value.height);
			var factor = scale / largest;
			var $img = $("<img src='"+value.url+"' width='"+Math.round(value.width*factor)+"' height='"+Math.round(value.height*factor)+"'></img>");
			//console.log($img);			
			return $img;
		} else if (value instanceof Array) {
			var $div = $("<span class='eden-representative'><span>[</span></span>");
			//$div.css("font-size",""+Math.round(scale * 0.4)+"px");
			var len = value.length;

			if (len > 10) len = 10;
			for (var i = 0; i < len; i++) {
				var rep = makeRepresentative(value[i], scale, sym);
				if (rep) rep.appendTo($div);
				if (i < value.length - 1) {
					$("<span>,</span>").appendTo($div);
				}
			}
			if (len < value.length) {
				$("<span>...</span>").appendTo($div);
			}
			//console.log(value);
			$("<span>]</span>").appendTo($div);
			return $div;
		}
	}

	var me = this;
	var inputAgent = {name: Symbol.getInputAgentName()};
	this.history = [];
	this.index = 0;
	//this.autoexec = true;

	this.history = JSON.parse(edenUI.getOptionValue('history')) || [];
	this.index = this.history.length;

	this.addHistory = function(text) {
		this.history.push(text);
		this.index = this.history.length;
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

	this.submitEdenCode = function (text) {
		this.addHistory(text);
		//var edenast = new EdenAST(text);
		//if (edenast.script.errors.length > 0) {
		//	edenUI.showErrorWindow().prepend("<div class='error-item'>"+edenast.script.errors[0].prettyPrint()+"</div>\n\n");
		//} else {
			console.time("submitEdenCode");
			edenUI.eden.execute(text, 'input', '', inputAgent);
			console.timeEnd("submitEdenCode");
		//}
		
		if (historydialog !== undefined) {
			historydialog.html(this.generateHistory());
		}
	}

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

	this.createCommon = function (name, mtitle, code, power, embedded) {
		var $dialogContents = $('<div class="inputdialogcontent"><div class="inputCodeArea"><div class="eden_suggestions"></div><div spellcheck="false" contenteditable tabindex="1" class="outputcontent"></div></div><textarea class="hidden-textarea"></textarea><div class="info-bar"></div><div class="control-bar"><div class="buttonsLeftDiv"><button class="clone-input">&#xf24d;</button></div><div class="buttonsDiv"><button class="observe-input">&#xf0c9;</button><button class="previous-input">&#xf112;</button><button class="next-input">&#xf064;</button></div><div class="outputbox"></div></div></div>')
		var text = "";	
		var position = 0;
		var $codearea = $dialogContents.find('.inputCodeArea');
		var intextarea = $dialogContents.find('.hidden-textarea').get(0);
		var outdiv = $dialogContents.find('.outputcontent').get(0);
		var infobox = $dialogContents.find('.info-bar').get(0);
		var outputbox = $dialogContents.find('.outputbox').get(0);
		var suggestions = $dialogContents.find('.eden_suggestions');
		suggestions.hide();
		$(infobox).hide();

		var dragstart = 0;
		var dragvalue = 0;
		var draglast = 0;
		var dragline = -1;
		var typingtimer;
		var amtyping = false;
		var typinginterval = 2000;
		var currentlineno = 0;
		var highlighter = new EdenHighlight(outdiv);
		var autoexec = power;
		var inputchanged = false;

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

		eden.root.lookup("_view_"+name+"_script").addJSObserver("setScript", preloadScript);

		function updateLineHighlight() {
			var ast = new EdenAST(intextarea.value);
			var lineno = -1;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			highlightContent(ast, lineno, pos);
			rebuildNotifications();
		}

		function updateLineCachedHighlight() {
			var lineno = -1;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			highlightContent(highlighter.ast, lineno, pos);
		}

		function updateEntireHighlight() {
			var ast = new EdenAST(intextarea.value);
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
			}

			highlightContent(ast, -1, pos);
			rebuildNotifications();
		}

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
			while ((line > 0) && (ast.lines[line] === undefined)) {
				line--;
			}

			var statement = ast.lines[line];
			if (!statement) return;

			// Find root statement and execute that one
			while (statement.parent !== undefined) statement = statement.parent;

			// Execute only the currently changed root statement
			me.submit(statement, highlighter.ast);
		}

		function showInfoBox(type, message) {
			if (type == "warning") {
				infobox.innerHTML = "<div class='info-warnitem'><span>"+message+"</span></div>";
			} else if (type == "error") {
				infobox.innerHTML = "<div class='info-erroritem'><span>"+message+"</span></div>";
			}
			$(infobox).show("fast");
		}

		function hideInfoBox() {
			$(infobox).hide("fast");
		}

		function rebuildNotifications() {
			for (var i=0; i<highlighter.ast.lines.length; i++) {
				if (highlighter.ast.lines[i] &&
						highlighter.ast.lines[i].lvalue) {
					eden.root.lookup(highlighter.ast.lines[i].lvalue.observable).addJSObserver(name+"_scriptLines", notifyOutOfDate);
				}
			}
		}

		function addWarningLine(lineno, msg) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-warnline");
			if (msg) {
				outdiv.childNodes[lineno-1].title = msg;
			}
		}

		function addExtendedLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-extendedline");
		}

		function addParentLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-parentline");
		}

		function addErrorLine(lineno, msg) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-actual-errorline");
		}

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

		function doneTyping() {
			amtyping = false;
			// Clear the typing animation
			outputbox.innerHTML = "";

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
									showInfoBox("warning", "<b>" + observable + "</b> "+ Language.ui.input_window.is_undef_because +" "+undefstr+" " + Language.ui.input_window.is_undef);
								} else {
									addWarningLine(currentlineno);
									showInfoBox("warning", "<b>" + observable + "</b> "+ Language.ui.input_window.is_undef_because +" "+undefstr+" " + Language.ui.input_window.are_undef);
								}
							// Its undefined but we don't know why
							} else {
								addWarningLine(currentlineno);
								showInfoBox("warning", observable + " " + Language.ui.input_window.is_undef);
							}
						// Not undefined but still check if a dependency is undefined.
						} else {
							var undef = checkUndefined(ast.dependencies);
							if (undef.length > 0) {
								var undefstr = "";
								for (var i=0; i<undef.length; i++) {
									undefstr += undef[i];
									if (i != undef.length - 1) undefstr += ",";
								}
								if (undef.length == 1) {
									addWarningLine(currentlineno);
									showInfoBox("warning", "<b>" + observable + "</b> "+Language.ui.input_window.uses+" "+undefstr+" "+Language.ui.input_window.which_undef);
									
								} else {
									addWarningLine(currentlineno);
									showInfoBox("warning", "<b>" + observable + "</b> "+Language.ui.input_window.uses_undef+" "+undefstr);
								}
							// Not undefined and no undefined dependencies so show value :)
							} else {
								//var rep = makeRepresentative(val,15,sym);
								hideInfoBox();
								//outputbox.innerHTML = "<div class='info-validitem'><span>"+observable + "<span class='valueof'>&#xf178;</span></span></div>";
								//rep.appendTo($(outputbox).find("div"));
							}
						}
					} else {
						hideInfoBox();
					}
				} else {
					hideInfoBox();
				}
			} else if (highlighter.ast.script.errors.length != 0) {
				showInfoBox("error", highlighter.ast.script.errors[0].messageText());
				addErrorLine(highlighter.ast.script.errors[0].line, highlighter.ast.script.errors[0].messageText());
			} else {
				hideInfoBox();
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

		function insertLines(lineno, newlines) {
			var lines = intextarea.value.split("\n");
			for (var i=0; i<newlines.length; i++) {
				lines.splice(lineno, 0, newlines[i]);
			}
			intextarea.value = lines.join("\n");
		}

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

		function highlightContent(ast, lineno, position) {
			highlighter.highlight(ast, lineno, position);

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

			$(outdiv).on('mouseup', '.eden-extendedline', function(e) {
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
			});

			/* Number dragging code, but only if live */
			if (autoexec) {
				$(outdiv).find('.eden-number').draggable({
					helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
					axis: 'x',
					drag: function(e,u) {
						var newval = Math.round(dragvalue + ((u.position.left - dragstart) / 2));
						if (newval != draglast) {
							draglast = newval;
							e.target.innerHTML = "" + newval;

							replaceLine(dragline, e.target.parentNode.textContent);

							var ast = new EdenAST(intextarea.value);

							// Execute if no errors!
							if (autoexec && ast.script.errors.length == 0) {
								submitLine(ast, dragline);
							}
						}
					},
					start: function(e,u) {
						// Calculate the line we are on
						dragline = findElementLineNumber(e.target);
						dragstart = u.position.left;
						dragvalue = parseInt(e.target.textContent);
						draglast = dragvalue;
						// TODO: detect floats and also detect increment scale.
						$(e.target).addClass("eden-select");
						$(outdiv).css("cursor","ew-resize");
					},
					stop: function(e,u) {
						$(e.target).removeClass("eden-select");
						$(outdiv).css("cursor","text");
						updateEntireHighlight();
						dragline = -1;
						inputchanged = true;
					},
					cursor: 'move',
					cursorAt: {top: -5, left: -5}
				});
			}
		}

		/**
		 * Return the current line.
		 */
		function getLineNumber(textarea) {
			currentlineno = textarea.value.substr(0, textarea.selectionStart).split("\n").length;
			return currentlineno;
		}

		function powerOff() {
			powerOk();
			$powerbutton.removeClass("power-on").addClass("power-off");
			autoexec = false;
		}

		function powerOn() {
			$powerbutton.removeClass("power-off").addClass("power-on");
			autoexec = true;
		}

		function powerError() {
			if (autoexec) {
				$powerbutton.addClass("power-error");
			}
		}

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

		function setCaretToFakeCaret() {
			var el = $(outdiv).find(".fake-caret").get(0);
			var range = document.createRange();
			var sel = window.getSelection();
			range.setStart(el, 0);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		}

		function selectAll() {
			var range = document.createRange();
			range.selectNodeContents(outdiv);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}

		function previous() {
			if (inputchanged && intextarea.value != "") me.addHistory(intextarea.value);
			powerOff();
			intextarea.value = edenUI.plugins.ScriptInput.previousHistory();
			updateEntireHighlight();
			inputchanged = false;
		}

		function next() {
			if (inputchanged && intextarea.value != "") me.addHistory(intextarea.value);
			powerOff();
			intextarea.value = edenUI.plugins.ScriptInput.nextHistory();
			updateEntireHighlight();
			inputchanged = false;
		}

		$dialogContents.on('input', '.hidden-textarea', function (e) {
			inputchanged = true;

			// Typing status, error messages and result value are delayed
			// by "typinginterval", so restart timeout.
			clearTimeout(typingtimer);
			if (amtyping == false) {
				hideInfoBox();
				//outputbox.innerHTML = "<div class='loader'></div>";
				amtyping = true;
			}
			typingtimer = setTimeout(doneTyping, typinginterval);

			// Regenerate the AST and highlight the code.
			var scrollpos = $codearea.get(0).scrollTop;
			updateLineHighlight();
			$codearea.scrollTop(scrollpos);


			// If we should run the statement (there are no errors)
			if (autoexec && highlighter.ast.script.errors.length == 0) {
				powerOk();
				submitLine(highlighter.ast, currentlineno-1);
			} else if (autoexec) {
				powerError();
			}

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
		}).on('keydown', '.hidden-textarea', function(e) {
			if (!e.ctrlKey && e.keyCode != 17) {
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
					updateLineHighlight();
				} else if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) {
					// Shift arrow selection, move to editable div.
					if (e.shiftKey) {
						setCaretToFakeCaret();
						outdiv.focus();
						return;
					}
					var scrollpos = $codearea.get(0).scrollTop;
					updateLineCachedHighlight();
					$codearea.scrollTop(scrollpos);
				}

			} else if (e.ctrlKey) {
				if (e.keyCode === 38) {
					// up
					previous();
				} else if (e.keyCode === 40) {
					// down
					next();
				} else if (e.keyCode === 86) {
					// Pasting so disable live code
					powerOff();
				} else if (e.keyCode === 65) {
					// Ctrl+A to select all.
					selectAll();
					outdiv.focus();
				}
			}
		}).on('keyup', '.hidden-textarea', function(e) {
			if (!e.ctrlKey && (	e.keyCode == 37 ||	//Arrow keys
								e.keyCode == 38 ||
								e.keyCode == 39 ||
								e.keyCode == 40 ||
								e.keyCode == 36 ||	// Home key
								e.keyCode == 35)) {	// End key
				var scrollpos = $codearea.get(0).scrollTop;
				updateLineCachedHighlight();
				$codearea.scrollTop(scrollpos);
			}
		}).on('keydown', '.outputcontent', function(e) {
			if (e.ctrlKey) {

			} else if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40))) {
				var end = getCaretCharacterOffsetWithin(outdiv);
				var start = getStartCaretCharacterOffsetWithin(outdiv);

				if (e.keyCode == 8) {
					// Remove selected text and move cursor to start of it.
					intextarea.value = intextarea.value.slice(0,start) + intextarea.value.slice(end);
					$(intextarea).focus();
					intextarea.selectionEnd = start;
					intextarea.selectionStart = start;					
					updateEntireHighlight();
				} else {
					intextarea.focus();
					intextarea.selectionEnd = end;
					intextarea.selectionStart = start;
				}
			}
		}).on('blur', '.hidden-textarea', function(e) {
			$(outdiv).find(".fake-caret").remove();
		}).on('mouseup', '.outputcontent', function(e) {
			var end = getCaretCharacterOffsetWithin(outdiv);
			var start = getStartCaretCharacterOffsetWithin(outdiv);
			if (start != end) {
			
				//$(intextarea).focus();
			} else {
				// Move caret to clicked location
				intextarea.selectionEnd = end;
				intextarea.selectionStart = end;
				var scrollpos = $codearea.get(0).scrollTop;
				intextarea.focus();		
				updateEntireHighlight();
				$codearea.scrollTop(scrollpos);
			}
		}).on('click', '.previous-input', function(e) {
			previous();
		}).on('click', '.next-input', function(e) {
			next();
		});

		// Create power button
		var $powerbutton = $('<div class="scriptswitch power-off" title="Live Coding">&#xF011;</div>');
		$dialogContents.append($powerbutton);
		var powerbutton = $powerbutton.get(0);
		if (power) powerOn();

		$powerbutton.click(function (e) {
			autoexec = !autoexec;

			if (autoexec) {
				powerOn();
				updateEntireHighlight();
				me.submit(highlighter.ast.script, highlighter.ast);
			} else {
				powerOff();
			}
		});

		if (code) {
			inputchanged = true;	// To make sure it goes into history.
			intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(code);
			updateEntireHighlight();
		}

		return $dialogContents;
	};

	this.createDialog = function(name, mtitle, code) {
		var simpleName = name.slice(0, -7);
		$dialogContents = me.createCommon(simpleName, mtitle, code, false, false);

		var idealheight = 224;
		if (code) {
			var linecount = $dialogContents.find("textarea").val().split("\n").length;
			idealheight = EdenUI.plugins.ScriptInput.getRequiredHeight(linecount + 1);
		}

		$dialog = $('<div id="'+name+'"></div>')
			.html($dialogContents)
			.dialog({
				title: mtitle,
				width: 500,
				height: idealheight,
				minHeight: 203,
				minWidth: 500,
				dialogClass: "input-dialog"
			});

		var confirmClose = !("MenuBar" in edenUI.plugins);

		return {confirmClose: confirmClose, setValue: function (value) { intextarea.value = value; }};
	};

	this.createEmbedded = function(name, mtitle, code, power) {
		return me.createCommon(name, mtitle, code, power, true);
	}

	/*this.next = function (el) {
		el.value = edenUI.plugins.ScriptInput.nextHistory();
	};

	this.prev = function (el) {
		el.value = edenUI.plugins.ScriptInput.previousHistory();
	};*/

	this.submit = function (statement, base) {
		statement.execute(eden.root,undefined, base);
	};

	this.getRidOfInstructions = function () {
		var x = el.innerText;

		if (x === "Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next") {
			el.innerText = "";
		}
	};

	this.putBackInstructions = function () {
		var x = document.getElementById("inputCodeArea").value;
		if (x === "") {
			el.innerText = "Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next";
		}
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
EdenUI.plugins.ScriptInput.getRequiredHeight = function(lines) {
	return 15 + 30 + 20 * lines + 20;
};


