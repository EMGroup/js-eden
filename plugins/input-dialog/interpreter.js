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
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */
EdenUI.plugins.ScriptInput = function(edenUI, success) {
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
		$div.css("font-size",""+Math.round(scale * 0.4)+"px");
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

		var $div = $("<div class='eden-representative'></div>");
		$div.css("font-size",""+Math.round(scale * 0.4)+"px");
		$div.text("\""+value+"\"");
		return $div;
	}

	function makeColourRepresentative(value, scale, sym) {
		var $div = $("<div class='eden-representative'></div>");
		$div.css("width",""+Math.round(scale * 0.6));
		$div.css("height",""+Math.round(scale * 0.6));
		$div.css("background-color",value);
		return $div;
	}

	function makeObjectRepresentative(value, scale, sym) {
		if (value instanceof Rectangle) {
			var $canvas = $("<canvas width='"+scale+"' height='"+scale+"'></canvas>");
			var canvas = $canvas.get(0);
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "white";
			ctx.rect(0,0,Math.round(scale),Math.round(scale));
			ctx.fill();
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
			ctx.fillStyle = "white";
			ctx.rect(0,0,Math.round(scale),Math.round(scale));
			ctx.fill();
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
			var $div = $("<div class='eden-representative'></div>");
			$div.css("font-size",""+Math.round(scale * 0.4)+"px");
			var len = value.length;

			if (len > 4*4-1) len = 4*4-1;
			for (var i = 0; i < len; i++) {
				makeRepresentative(value[i], Math.round(scale*0.6), sym).appendTo($div);
				if (i < value.length - 1) {
					$("<span>,</span>").appendTo($div);
				}
				if ((((i+1) % 4) == 0)) {
					$("<br/>").appendTo($div);
				}
			}
			if (len < value.length) {
				$("<span>...</span>").appendTo($div);
			}
			//console.log(value);
			return $div;
		}
	}

	var me = this;
	var inputAgent = {name: Symbol.getInputAgentName()};
	this.history = [];
	this.index = 0;
	this.autoexec = true;

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

	function getTextNodesIn(node) {
		var textNodes = [];
		if (node.nodeType == 3) {
		    textNodes.push(node);
		} else {
		    var children = node.childNodes;
		    for (var i = 0, len = children.length; i < len; ++i) {
		        textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
		    }
		}
		return textNodes;
	}

	function setSelectionRange(el, start, end) {
		if (document.createRange && window.getSelection) {
		    var range = document.createRange();
		    range.selectNodeContents(el);
		    var textNodes = getTextNodesIn(el);
		    var foundStart = false;
		    var charCount = 0, endCharCount;

		    for (var i = 0, textNode; textNode = textNodes[i++]; ) {
		        endCharCount = charCount + textNode.length;
		        if (!foundStart && start >= charCount
		                && (start < endCharCount ||
		                (start == endCharCount && i <= textNodes.length))) {
		            range.setStart(textNode, start - charCount);
		            foundStart = true;
		        }
		        if (foundStart && end <= endCharCount) {
		            range.setEnd(textNode, end - charCount);
		            break;
		        }
		        charCount = endCharCount;
		    }

		    var sel = window.getSelection();
		    sel.removeAllRanges();
		    sel.addRange(range);
		} else if (document.selection && document.body.createTextRange) {
		    var textRange = document.body.createTextRange();
		    textRange.moveToElementText(el);
		    textRange.collapse(true);
		    textRange.moveEnd("character", end);
		    textRange.moveStart("character", start);
		    textRange.select();
		}
	}

	this.createDialog = function (name, mtitle) {
		var $dialogContents = $('<div class="inputCodeArea"><div class="eden_suggestions"></div><code spellcheck="false" contenteditable tabindex="1" class="inputcontent"></code></div><div class="subButtonsDiv"><div class="switch"><input id="cmn-toggle-1" checked="true" class="cmn-toggle cmn-toggle-round submitButton" type="checkbox"><label for="cmn-toggle-1"></label></div></div><div class="buttonsDiv"><button class="previousButton"></button><button class="nextButton"></button></div>')
		var text = "";	
		var textarea = $dialogContents.find('.inputcontent').get(0);
		var suggestions = $dialogContents.find('.eden_suggestions');
		suggestions.hide();

		var dragstart = 0;
		var dragvalue = 0;
		var draglast = 0;
		var dragline = 0;

		$( textarea ).tooltip({
			position: {
				my: "center bottom-15",
				at: "center top",
				using: function( position, feedback ) {
					$( this ).css( position );
					$( "<div>" )
					.addClass( "arrow" )
					.addClass( feedback.vertical )
					.addClass( feedback.horizontal )
					.appendTo( this );
				}
			},
			items: "span",
			content: function() {
				var element = $(this);
				if (element.hasClass("eden-error")) {
					return element.attr( "title" );
				}
				var text = this.textContent;
				if (eden.root.symbols[text] !== undefined) {
					var sym = eden.root.lookup(text);
					return makeRepresentative(sym.value(),60,sym);
				}
			}
				/*var element = $(this);
				if (element.hasClass("eden-error")) {
					return element.attr( "title" );
				} else if (element.hasClass("eden-observable")) {
					var text = this.textContent;
					if (eden.root.symbols[text] !== undefined) {
						var sym = eden.root.lookup(text);
						var val = sym.value();
						var type = typeof val;
						var result = "";
						if (type == "string") result += "String ";
						else if (type == "number") result += "Number ";
						else if (type == "object") {
							if (val instanceof Rectangle) {
									result += "Shape ";
							} else if (val instanceof Array) {
									result += "List ";
							}
						} else if (val === undefined) return "Undefined";
						return result + Eden.prettyPrintValue("", val, 20);
					}
				} else if (element.hasClass("eden-type")) {
					var text = this.textContent;
					if (eden.root.symbols[text] !== undefined) {
						var sym = eden.root.lookup(text);
						if (sym.eden_definition.slice(0,4) == "func") {
							if (edenfunctions.functions[text]) {
								var params = Object.keys(edenfunctions.functions[text].parameters || {});
								return text + "(" + params.join(", ") + ")";
							}
						}
					}
				}
			}*/
		});

		function highlightContent(text, position, run, all) {
			var stream = new EdenHighlight(text);
			var high = stream.highlight(position);
			textarea.innerHTML = high;
			setSelectionRange(textarea, position, position);

			/*if (stream.ast.lines[stream.currentline-1]) {
				console.log("SRC: " + stream.ast.getSource(stream.ast.lines[stream.currentline-1]));
			}*/

			$(textarea).find('.eden-number').draggable({
				helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
				axis: 'x',
				drag: function(e,u) {
					var newval = Math.round(dragvalue + ((u.position.left - dragstart) / 2));
					if (newval != draglast) {
						draglast = newval;
						e.target.innerHTML = "" + newval;

						var ast = new EdenAST(textarea.textContent);
						// Execute if no errors!
						/*if (me.autoexec && ast.script.errors.length == 0) {
							me.submit(textarea);
						}*/
						// Execute if no errors!
						if (me.autoexec && ast.script.errors.length == 0) {
							if (ast.lines[dragline]) {
								//console.log("EXEC: " + ast.getSource(ast.lines[dragline]));
								edenUI.plugins.ScriptInput.submitEdenCode(ast.getSource(ast.lines[dragline]));
							}
						}
					}
				},
				start: function(e,u) {
					dragline = Math.floor(e.offsetY / 20);
					dragstart = u.position.left;
					dragvalue = parseInt(e.target.textContent);
					draglast = dragvalue;
					$(e.target).addClass("eden-select");
					$(textarea).css("cursor","ew-resize");
				},
				stop: function(e,u) {
					$(e.target).removeClass("eden-select");
					$(textarea).css("cursor","text");
				},
				cursor: 'move',
				cursorAt: {top: -5, left: -5}
			});

			/*$(textarea).find('.eden-observable').draggable({
				helper: function(e) { return $("<span class='eden-drag-observable'>"+e.target.textContent+"</span>"); },
				cursor: "move",
				appendTo: "body",
				zIndex: 10000,
				start: function(e,u) {
					$(e.target).addClass("eden-select");
				},
				stop: function(e,u) {
					$(e.target).removeClass("eden-select");
					console.log(e);
				},
			});*/

			// Execute if no errors!
			if (run && stream.ast.script.errors.length == 0) {
				//me.submit(textarea);
				$dialogContents.find(".submitButton").removeClass("submitError");
				if (all) {
					edenUI.plugins.ScriptInput.submitEdenCode(text);
				} else if (stream.ast.lines[stream.currentline-1]) {
					var curline = $dialogContents.find(".eden-currentline");
					//curline.css("backgroundColor","#f4fff0");
					curline.addClass("eden-greenline");
					//curline.toggleClass("eden-greenline",250);
					//curline.animate({backgroundColor: "#f0f0ff"}, "slow");
					//console.log("EXEC: " + stream.ast.getSource(stream.ast.lines[stream.currentline-1]));
					edenUI.plugins.ScriptInput.submitEdenCode(stream.ast.getSource(stream.ast.lines[stream.currentline-1]));
				}
			} else if (run) {
				$dialogContents.find(".submitButton").addClass("submitError");
			}

			return stream;
		}

		$dialogContents.on('keyup', '.inputcontent', function (e) {
			if (!e.ctrlKey && (e.keyCode < 37 || e.keyCode > 40) && e.keyCode != 17) {
				text = textarea.textContent;
				var position = getCaretCharacterOffsetWithin(textarea);
				var stream = highlightContent(text,position,me.autoexec, false);

				//console.log("Line: " + stream.currentline);
				var curast = stream.ast.lines[stream.currentline-1];
				if (curast) {
					var pattern = stream.ast.getSource(curast).split("\n")[0];
					//console.log("Fill: " + pattern);

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
						//console.log("FILL IN FOR: " + curast.lvalue.observable);
						/*var curlineele = $(textarea).find(".eden-currentline");
						var pos = curlineele.position();
						if (pos === undefined) pos = $(textarea).position();
						var sym = eden.root.lookup(curast.lvalue.observable);
						if (sym && sym.eden_definition) suggestions.text(sym.eden_definition);
						suggestions.css("top",""+ (pos.top) +"px");
						suggestions.show("slow");*/
					//}
				} else {
					suggestions.hide("fast");
				}

			} else if (e.ctrlKey) {
				console.log(e);

				if (e.keyCode === 38) {
					// up
					me.prev(textarea);
				} else if (e.keyCode === 40) {
					// down
					me.next(textarea);
				}
			}
			//textarea.innerHTML += String.fromCharCode(e.keyCode);
		}).on('keydown', '.inputcontent', function(e) {
				if (e.keyCode == 8) {
					var position = getCaretCharacterOffsetWithin(textarea);
					text = textarea.textContent;
					text = text.slice(0, position-1) + text.slice(position);
					position--;
					highlightContent(text,position,false,false);
				}
		}).on('click', '.inputcontent', function(e) {
			var start = getStartCaretCharacterOffsetWithin(textarea);
			var pos = getCaretCharacterOffsetWithin(textarea);
			suggestions.hide("fast");
			if ((pos - start) == 0) {
				highlightContent(textarea.textContent, pos,false,false);
			}
		}).on('change', '.submitButton', function (e) {
			if ($(this).is(':checked')) {
				me.autoexec = true;
				var pos = getCaretCharacterOffsetWithin(textarea);
				highlightContent(textarea.textContent, pos, true,true);
			} else {
				me.autoexec = false;
			}
		}).on('click', '.previousButton', function (e) {
			suggestions.hide("fast");
			$dialogContents.find(".submitButton").get(0).checked = false;
			me.autoexec = false;
			highlightContent(me.prev(), 0, false,false);
		}).on('click', '.nextButton', function (e) {
			suggestions.hide("fast");
			$dialogContents.find(".submitButton").get(0).checked = false;
			me.autoexec = false;
			highlightContent(me.next(), 0, false,false);
		});
		
		$dialog = $('<div id="'+name+'" class="input-dialog"></div>')
			.html($dialogContents)
			.dialog({
				title: mtitle,
				width: 500,
				height: 224,
				minHeight: 203,
				minWidth: 500,
				dialogClass: "input-dialog"
			});
			input_dialog = $dialog;

		var confirmClose = !("MenuBar" in edenUI.plugins);

		return {confirmClose: confirmClose, setValue: function (value) { textarea.textContent = value; }};
	};

	this.next = function (el) {
		return edenUI.plugins.ScriptInput.nextHistory();
	};

	this.prev = function (el) {
		return edenUI.plugins.ScriptInput.previousHistory();
	};

	this.submit = function (el) {
		edenUI.plugins.ScriptInput.submitEdenCode(el.innerText);
		//el.innerText = "";
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
		title: "Script Input Window",
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

/* Plugin meta information */
EdenUI.plugins.ScriptInput.title = "Script Input";
EdenUI.plugins.ScriptInput.description = "Provides the ability to type in definitional scripts using the keyboard, submit them for interpretation and recall the input history.";

//Make tab do spaces instead of selecting the next element
$(document).delegate('.inputCodeArea textarea', 'keydown', function(e) {
  var keyCode = e.keyCode || e.which;

  if (keyCode == 9) {
    e.preventDefault();
    var start = $(this).get(0).selectionStart;
    var end = $(this).get(0).selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    $(this).val($(this).val().substring(0, start)
                + "\t"
                + $(this).val().substring(end));

    // put caret at right position again
    $(this).get(0).selectionStart =
    $(this).get(0).selectionEnd = start + 1;
  }
});

