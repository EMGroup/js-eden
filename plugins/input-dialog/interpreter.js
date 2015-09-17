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
			}
		});

		function highlightContent(text, position, run) {
			var stream = new EdenHighlight(text);
			var high = stream.highlight(position);
			textarea.innerHTML = high;
			setSelectionRange(textarea, position, position);

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
						if (me.autoexec && ast.script.errors.length == 0) {
							me.submit(textarea);
						}
					}
				},
				start: function(e,u) {
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

			$(textarea).find('.eden-observable').draggable({
				helper: function(e) { return $("<span class='eden-observable eden-select'>"+e.target.textContent+"</span>"); },
				cursor: "move",
				appendTo: "body",
				zIndex: 10000,
				start: function(e,u) {
					$(e.target).addClass("eden-select");
				},
				stop: function(e,u) {
					$(e.target).removeClass("eden-select");
				},
			});

			// Execute if no errors!
			if (run && stream.ast.script.errors.length == 0) {
				//me.submit(textarea);
				$dialogContents.find(".submitButton").removeClass("submitError");
				edenUI.plugins.ScriptInput.submitEdenCode(text);
			} else if (run) {
				$dialogContents.find(".submitButton").addClass("submitError");
			}

			return stream;
		}

		$dialogContents.on('keyup', '.inputcontent', function (e) {
			if (!e.ctrlKey && (e.keyCode < 37 || e.keyCode > 40) && e.keyCode != 17) {
				text = textarea.textContent;
				var position = getCaretCharacterOffsetWithin(textarea);
				var stream = highlightContent(text,position,me.autoexec);

				/*var curlineele = $(textarea).find(".eden-currentline");
				var pos = curlineele.position();
				if (pos === undefined) pos = $(textarea).position();
				//var sym = eden.root.lookup(curast.lvalue.observable);
				//if (sym && sym.eden_definition) suggestions.text(sym.eden_definition);
				suggestions.text(curlineele.get(0).textContent);
				suggestions.css("top",""+ (pos.top) +"px");
				suggestions.show("slow");
				//suggestions.hide("slow");*/

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
					highlightContent(text,position,false);
				}
		}).on('click', '.inputcontent', function(e) {
			var start = getStartCaretCharacterOffsetWithin(textarea);
			var pos = getCaretCharacterOffsetWithin(textarea);
			if ((pos - start) == 0) {
				highlightContent(textarea.textContent, pos,false);
			}
		}).on('change', '.submitButton', function (e) {
			if ($(this).is(':checked')) {
				me.autoexec = true;
				var pos = getCaretCharacterOffsetWithin(textarea);
				highlightContent(textarea.textContent, pos, true);
			} else {
				me.autoexec = false;
			}
		}).on('click', '.previousButton', function (e) {
			$dialogContents.find(".submitButton").get(0).checked = false;
			me.autoexec = false;
			highlightContent(me.prev(), 0, false);
		}).on('click', '.nextButton', function (e) {
			$dialogContents.find(".submitButton").get(0).checked = false;
			me.autoexec = false;
			highlightContent(me.next(), 0, false);
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

