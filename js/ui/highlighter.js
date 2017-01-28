/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function (global) {
	var edenFunctions = {
	"apply": true,
	"array": true,
	"canvasURL": true,
	"centroid": true,
	"char": true,
	"charCode": true,
	"choose": true,
	"compose": true,
	"concat": true,
	"curry": true,
	"decodeHTML": true,
	"definitionOf": true,
	"definitionRHS": true,
	"doDefault": true,
	"edenCode": true,
	"escapeRE": true,
	"foldl": true,
	"foldr": true,
	"hasProperty": true,
	"hslColour": true,
	"htmlBulletList": true,
	"htmlNumberedList": true,
	"positionInList": true,
	"positionOfRE": true,
	"substringPosition": true,
	"int": true,
	"isBoolean": true,
	"isCallable": true,
	"isChar": true,
	"isDefined": true,
	"isDependency": true,
	"isDependent": true,
	"isFunc": true,
	"isInt": true,
	"isList": true,
	"isNaN": true,
	"isNumber": true,
	"isObject": true,
	"isPoint": true,
	"isPointer": true,
	"isProc": true,
	"isString": true,
	"isValue": true,
	"distanceMoved": true,
	"angleTurned": true,
	"List": true,
	"listcat": true,
	"lookup": true,
	"lowercase": true,
	"map": true,
	"mapPartial": true,
	"max": true,
	"Menu": true,
	"MenuItem": true,
	"min": true,
	"mod": true,
	"nameof": true,
	"partApply": true,
	"Point": true,
	"pow": true,
	"properties": true,
	"randomBoolean": true,
	"randomFloat": true,
	"randomInteger": true,
	"RE": true,
	"replaceFirst": true,
	"reverse": true,
	"rgbColour": true,
	"rotatePoint": true,
	"round": true,
	"roundMultiple": true,
	"scalePoint": true,
	"search": true,
	"sequenceItoJ": true,
	"sequenceN": true,
	"sequenceArithmeticN": true,
	"sequenceList": true,
	"sequencePrevious": true,
	"sort": true,
	"str": true,
	"sqrt": true,
	"strcat": true,
	"sublist": true,
	"substitute": true,
	"substr": true,
	"sum": true,
	"tail": true,
	"trim": true,
	"type": true,
	"uppercase": true,
	"include_css": true,
	"html": true,
	"time": true,
	"execute": true,
	"Text": true,
	"textWidth": true,
	"textHeight": true,
	"Arc": true,
	"Curve": true,
	"FillPattern": true,
	"Ellipse": true,
	"Line": true,
	"LinearGradient": true,
	"LineSequence": true,
	"PixelList": true,
	"GreyPixelList": true,
	"Rectangle": true,
	"RotateAboutCentre": true,
	"RotateAboutPoint": true,
	"CombinedRotation": true,
	"Scale": true,
	"Translate": true,
	"RoundedRectangle": true,
	"Polygon": true,
	"RegularPolygon": true,
	"Sector": true,
	"Shadow": true,
	"Circle": true,
	"Button": true,
	"Checkbox": true,
	"Div": true,
	"Image": true,
	"imageWithZones": true,
	"HTMLImage": true,
	"RadioButtons": true,
	"Slider": true,
	"Textbox": true,
	"DropDownList": true,
	"Combobox": true,
	"BulletSlide": true,
	"Video": true,
	"Audio": true,
	"Slide": true,
	"TitledSlide": true,
	"TitleSlide": true,
	"cos": true,
	"sin": true,
	"tan": true,
	"abs": true,
	"acos": true,
	"asin": true,
	"atan": true,
	"ceil": true,
	"roundUp": true,
	"exp": true,
	"floor": true,
	"roundDown": true,
	"log": true,
	"random": true,
	"forget": true,
	"forgetAll": true,
	"shapeOnTopAt": true,
	"zoneOnTopAt": true,
	"observableOnTopAt": true,
	"shapeOnBottomAt": true,
	"zoneOnBottomAt": true,
	"observableOnBottomAt": true,
	"shapesAt": true,
	"zonesAt": true,
	"observablesAt": true,
	"observableForShape": true,
	"alias": true,
	"arrangeWindows": true,
	"attemptMouseCapture": true,
	"bindCSSNumericProperty": true,
	"bindCSSProperty": true,
	"bindCSSRule": true,
	"createCanvas": true,
	"createHTMLView": true,
	"createProjectList": true,
	"createView": true,
	"destroyView": true,
	"eager": true,
	"error": true,
	"hideView": true,
	"highlightView": true,
	"moveView": true,
	"patch": true,
	"removeedenclock": true,
	"resizeView": true,
	"setedenclock": true,
	"showObservables": true,
	"showView": true,
	"stopHighlightingView": true,
	"todo": true,
	"touch": true,
	"unbind": true,
	"withAppendedItem": true,
	"writeln": true
	};

	var edenSpecials = {
	"autocalc": true,
	"mouseX": true,
	"mouseY": true,
	"mousePosition": true,
	"screenHeight": true,
	"screenWidth": true,
	"PI": true
	};

	var edenValues = {
	"true": true,
	"false": true,
	"green": true
	};

	var jskeywords = {
	"var": true,
	"if": true,
	"while": true,
	"typeof": true,
	"this": true,
	"function": true,
	"return": true,
	"else": true,
	"break": true,
	"continue": true,
	"switch": true,
	"for": true,
	"prototype": true
	}



	/**
	 * Support function to detach and reattach a DOM node. Alternative to using
	 * jQuery.
	 */
	function detach(obj, node, async, fn) {
		var parent = node.parentNode;
		var next = node.nextSibling;
		// No parent node? Abort!
		if (!parent) { fn.call(obj,node); return; }
		// Detach node from DOM.
		parent.removeChild(node);
		// Handle case where optional `async` argument is omitted.
		if (typeof async !== "boolean") {
		fn = async;
		async = false;
		}
		// Note that if a function wasn't passed, the node won't be re-attached!
		if (fn && async) {
		// If async == true, reattach must be called manually.
		fn.call(obj,node, reattach);
		} else if (fn) {
		// If async != true, reattach will happen automatically.
		fn.call(obj,node);
		reattach();
		}
		// Re-attach node to DOM.
		function reattach() {
		parent.insertBefore(node, next);
		}
	}



	/**
	 * Syntax highlighting class. Make an instance of this, giving a DIV
	 * element for the generated output.
	 */
	EdenUI.Highlight = function(output, options) {
		this.ast = undefined;
		this.outelement = output;
		this.line = 1;
		this.currentline = -1;
		this.mode_at_line = {};
		this.heredocend = undefined;
		//this.lastmode = 0;
		this.scrolltop = -1;

		this.token = undefined;
		this.prevtoken = undefined;
		this.modestack = [];
		this.linestack = undefined;
		this.outerline = undefined;
		this.lineelement = undefined;
		this.startmode = (options && options.start) ? options.start : "START";
		this.styles = (options && options.styles) ? options.styles : EdenUI.Highlight.defaultStyles;
		this.clearmodes = (options && options.clearmodes) ? options.clearmodes : EdenUI.Highlight.lineclearmode;
		this.mode = this.startmode;

		this.metrics = {};
	}

	EdenUI.Highlight.defaultStyles = {
		"comment": "eden-comment",
		"hidden-comment": "eden-comment-hidden",
		"operator": "eden-operator",
		"observable": "eden-observable",
		"storage": "eden-storage",
		"number": "eden-number",
		"string": "eden-string",
		"constant": "eden-constant",
		"string": "eden-string",
		"keyword": "eden-keyword",
		"javascript": "eden-javascript",
		"selector": "eden-selector",
		"selector2": "eden-selector2",
		"selector3": "eden-selector3",
		"function": "eden-function",
		"type": "eden-type",
		"special": "eden-special",
		"backticks": "eden-backticks",
		"doxycomment": "eden-doxycomment",
		"pathblock": "eden-pathblock",
		"comment-h1": "eden-comment-h1",
		"comment-h2": "eden-comment-h2",
		"comment-h3": "eden-comment-h3",
		"horizontal-line": "eden-section-line",
		"comment-line": "eden-comment-line",
		"comment-emph": "eden-comment-emph",
		"comment-bold": "eden-comment-bold",
		"script-line": "eden-line-script",
		"doxytag": "eden-doxytag",
		"comment-query": "eden-comment-query",
		"block-comment": "eden-blockcomment",
		"comment-ul": "eden-comment-ul",
		"comment-blockquote": "eden-comment-blockquote"
	}

	EdenUI.Highlight.prototype.START = function() {
		switch(this.token) {
		case "##"		:	if (this.prevtoken == "INVALID") {
								this.classes += this.styles["hidden-comment"];
								//this.lineelement.className = "eden-comment-line";
								this.mode = "SECTION_TITLE";
								this.lineelement.className = this.styles["comment-line"];
							} else {
								this.classes += this.styles["comment"];
								this.mode = "COMMENT";
							}
							break;
		case "#"		:	if (this.prevtoken == "INVALID" || this.prevtoken == ";") {
								this.classes += this.styles["hidden-comment"];
								this.mode = "COMMENT";
								if (this.prevtoken == "INVALID") this.lineelement.className = this.styles["comment-line"];
								else {
									var nline = document.createElement("span");
									nline.className = this.styles["comment-line"];
									this.pushLine();
									this.lineelement.appendChild(nline);
									this.lineelement = nline;
								}
							} else {
								this.classes += this.styles["operator"];
							}
							break;
		case "local"	:
		case "para"		:
		case "handle"	:
		case "oracle"	:
		case "auto"		:	this.classes += this.styles["storage"]; break;
		case "NUMBER"	:	this.classes += this.styles["number"]; break;
		case "STRING"	:	this.classes += this.styles["string"]; break;
		case "BOOLEAN"	:	this.classes += this.styles["constant"]; break;
		case "CHARACTER":	this.classes += this.styles["string"]; break;
		case "import"	:
		case "do"		:	this.classes += this.styles["keyword"];
							this.mode = "SELECTOR";
							break;
		case "${{"		:	this.classes += this.styles["javascript"];
							this.mode = "JAVASCRIPT";
							break;
		case "?"		:	this.classes += this.styles["selector"];
							this.mode = "SELECTOR";
							break;
		case "<<"		:	var t = this.stream.readToken();
							var obs = this.stream.tokenText();
							this.tokentext += obs;
							this.heredocend = obs;
							this.classes += this.styles["storage"];
							this.mode = "HEREDOC";
							break;
		case "OBSERVABLE":	if (edenFunctions[this.stream.data.value]) {
								this.classes += this.styles["function"];
							} else if (EdenUI.Highlight.isType(this.stream.data.value)) {
								this.classes += this.styles["type"];
							} else if (edenValues[this.stream.data.value]) {
								this.classes += this.styles["constant"];
							} else if (edenSpecials[this.stream.data.value]) {
								this.classes += this.styles["special"];
							} else {
								this.classes += this.styles["observable"];
							}
							break;

		case "`"		:	this.pushMode();
							this.mode = "BACKTICK";
							this.pushLine();
							var nline = document.createElement("span");
							nline.className = this.styles["backticks"];
							this.lineelement.appendChild(nline);
							this.lineelement = nline;
							break;

		default			:	if (this.type == "keyword") {
								this.classes += this.styles["keyword"];
							} else {
								// Bind negative to number if no whitespace.
								if (this.token == "-" && this.stream.isNumeric(this.stream.peek())) {
									this.token = this.stream.readToken();
									this.tokentext = "-" + this.stream.tokenText();
									this.classes += this.styles["number"];
								} else if (this.token == "/*") {
									if (this.stream.peek() == 42) {
										this.mode = "DOXY_COMMENT";
										this.classes += this.styles["block-comment"];
									} else {
										this.mode = "BLOCK_COMMENT";
										this.classes += this.styles["block-comment"];
									}
								} else {
									this.classes += this.styles["operator"];
								}
							}
		}
	}

	EdenUI.Highlight.prototype.BACKTICK = function() {
		if (this.token == "`") this.mode = "ENDBACKTICK";
		else if (this.token == "}") {
			this.popMode();
			this.classes += this.styles["operator"];
		} else {
			this.START();
		}
	}

	EdenUI.Highlight.prototype.ENDBACKTICK = function() {
		this.popLine();
		this.popMode();
		this.START();
	}

	EdenUI.Highlight.prototype.SELECTOR = function() {
		this.pushLine();
		var nline = document.createElement("span");
		nline.className = this.styles["pathblock"];
		this.lineelement.appendChild(nline);
		this.lineelement = nline;
		this.mode = "SELECTOR2";
		this.SELECTOR2();
	}

	EdenUI.Highlight.prototype.SELECTOR2 = function() {
		if (this.token == "{") {
			this.classes += this.styles["operator"];
			this.pushMode();
			this.mode = this.startmode;
		} else if (this.token == "[") {
			this.classes += this.styles["selector"];
			this.mode = "SELECTOR_TYPES";
		} else if (this.token == ";" || this.token == "=") {
			this.popLine();
			this.classes += this.styles["operator"];
			this.mode = this.startmode;
		} else if (this.token == "::" || this.token == "with") {
			this.popLine();
			this.classes += this.styles["keyword"];
			this.mode = this.startmode;
		} else if (this.token == "OBSERVABLE" && (this.prevtoken == "." || this.prevtoken == ":") && (Eden.Selectors.PropertyNode.attributes[this.tokentext] || Eden.Selectors.PropertyNode.pseudo[this.tokentext])) {
			this.classes += this.styles["selector2"];
		} else {
			this.classes += this.styles["selector"];
		}
	}

	EdenUI.Highlight.prototype.SELECTOR_TYPES = function() {
		if (this.token == "OBSERVABLE" && Eden.Selectors.resultTypes[this.tokentext]) {
			this.classes += "eden-selector3";
		} else if (this.token == "]") {
			this.classes += "eden-selector";
			this.mode = "SELECTOR2";
		} else {
			this.classes += "eden-selector";
		}
	}

	EdenUI.Highlight.prototype.SECTION_TITLE = function() {
		if (this.token == "#") {
			this.classes += this.styles["hidden-comment"];
			this.lineelement.className += " " + this.styles["comment-h2"];
			//this.mode = "SECTION_TITLE_H2";
			this.mode = "COMMENT";
		} else if (this.token == "##") {
			this.classes += this.styles["hidden-comment"];
			this.mode = "SECTION_TITLE3";
		} else {
			//this.classes += this.styles["comment-h1"];
			this.lineelement.className += " " + this.styles["comment-h1"];
			//this.mode = "SECTION_TITLE_H1";
			this.mode = "COMMENT";
			this.COMMENT();
		}
	}

	EdenUI.Highlight.prototype.SECTION_TITLE2 = function() {
		if (this.token == "#") {
			this.classes += this.styles["hidden-comment"];
			this.mode = "SECTION_TITLE3";
		} else {
			this.classes += this.styles["comment-h2"];
			this.mode = "SECTION_TITLE_H2";
		}
	}

	EdenUI.Highlight.prototype.SECTION_TITLE3 = function() {
		if (this.token == "#") {
			this.classes += this.styles["hidden-comment"];
			this.mode = "SECTION_TITLE4";
		} else {
			this.classes += this.styles["comment-h3"];
			this.mode = "SECTION_TITLE_H3";
		}
	}

	EdenUI.Highlight.prototype.SECTION_TITLE4 = function() {
			this.classes += this.styles["comment-h4"];
			this.mode = "SECTION_TITLE_H4";
	}

	EdenUI.Highlight.prototype.SECTION_TITLE_H1 = function() {
		this.classes += this.styles["comment-h1"];
	}

	EdenUI.Highlight.prototype.SECTION_TITLE_H2 = function() {
		this.classes += this.styles["comment-h2"];
	}

	EdenUI.Highlight.prototype.SECTION_TITLE_H3 = function() {
		this.classes += this.styles["comment-h3"];
	}

	EdenUI.Highlight.prototype.SECTION_TITLE_H4 = function() {
		this.classes += this.styles["comment-h4"];
	}

	EdenUI.Highlight.prototype.BLOCK_COMMENT = function() {
		switch(this.token) {
		case "*/"		:	this.mode = this.startmode;
							this.classes += this.styles["block-comment"];
							break;
		default			:	this.classes += this.styles["block-comment"];
		}
	}

	EdenUI.Highlight.prototype.COMMENT = function() {
		switch(this.token) {
		//case "*/"		:	this.mode = this.startmode;
		//					this.classes += "eden-comment";
		//					break;
		case "@"		:
		case "#"		:	this.mode = "COMMENT_TAG";
							this.pushLine();
							var nline = document.createElement("span");
							nline.className = this.styles["doxytag"];
							this.lineelement.appendChild(nline);
							this.lineelement = nline;
							break;
		case "-"		:
		case "*"		:	if ((this.prevtoken == "##" || this.prevtoken == "#" || this.prevtoken == "INVALID") && (this.stream.peek() == 32 || this.stream.peek() == 9)) {
								this.pushLine();
								var nline = document.createElement("span");
								nline.className = this.styles["comment-ul"];
								this.lineelement.appendChild(nline);
								this.lineelement = nline;
								this.classes += this.styles["hidden-comment"];
							} else if (this.token != "-") {
								this.pushMode();
								this.mode = "COMMENT_EMPH";
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							}
							break;
							
		case "--"		:	if (this.stream.peek() == 45) {
								this.outerline = "eden-line eden-section-line";
								this.tokentext += "-";
								this.stream.position++;
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							} break;

		case "["		:	if (this.stream.peek() != 32) {
								this.mode = "COMMENT_LINK";
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							}
							break;

		case "!"		:	if (this.stream.peek() == 91) {
								this.mode = "COMMENT_IMAGE";
								this.tokentext += "[";
								this.stream.position++;
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							}
							break;

		case ">"		:	if ((this.prevtoken == "##" || this.prevtoken == "#" || this.prevtoken == "INVALID") && (this.stream.peek() == 32 || this.stream.peek() == 9)) {
								this.outerline += " " + this.styles["comment-blockquote"];
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							}
							break;
						
							
		case "`"		:	this.pushMode();
							this.mode = "COMMENT_CODE";
							this.classes += this.styles["hidden-comment"];
							break;
		case ":"		:	if (this.stream.peek() != 32) {
								this.mode = "COMMENT_ICON";
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							} break;
		case "<"		:	if (this.stream.peek() != 32) {
								this.mode = "COMMENT_HTML";
								this.classes += this.styles["hidden-comment"];
							} else {
								this.classes += this.styles["comment"];
							}
							break;
		case "\""		:	this.pushMode();
							this.mode = "COMMENT_ESCAPE";
							this.classes += this.styles["hidden-comment"];
							break;
		case "?"		:	this.pushMode();
							this.mode = "COMMENT_QUERY";
							if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
							this.metrics[this.line].query = true;
							this.classes += this.styles["hidden-comment"];
							break;
		default			:	this.classes += this.styles["comment"];
		}
	}

	EdenUI.Highlight.prototype.COMMENT_QUERY = function() {
		if (this.token == "(") {
			var linestr = this.stream.peekLine();
			var count = 0;
			var endix = -1;
			for (var i=0; i<linestr.length; i++) {
				if (linestr.charAt(i) == "(") count++;
				else if (linestr.charAt(i) == ")") {
					count--;
					if (count < 0) {
						endix = i;
						break;
					}
				}
			}

			if (endix == -1) {
				this.popMode();
				this.classes += this.styles["hidden-comment"];
			} else {
				var qstr = linestr.substring(0,endix);
				this.tokentext += qstr + ")";
				this.stream.position += qstr.length+1;
				this.popMode();
				this.classes += this.styles["hidden-comment"];

				var ele = document.createElement("span");
				ele.className += this.styles["comment-query"]; // + " " + this.styles["comment"];
				this.lineelement.appendChild(ele);
				var res = Eden.Selectors.query(qstr,"value");
				if (res.length == 1) res = res[0];
				else if (res.length > 1) res = res.join(", ");
				else res = "";
				ele.setAttribute("data-result", res);
			}
		} else {
			this.popMode();
			this.classes += this.styles["hidden-comment"];
		}
	}

	EdenUI.Highlight.prototype.COMMENT_LINK = function() {
		var linestr = this.stream.peekLine();
		var endix = linestr.indexOf("]");
		if (endix == -1) {
			this.classes += this.styles["comment"];
			this.mode = "COMMENT";
		} else {
			var remaining = linestr.substring(0, endix);
			this.tokentext += remaining;
			console.log("LINK",this.tokentext);
			this.stream.position += endix;
			this.classes += this.styles["comment"];
			this.mode = "COMMENT_LINK_END";

			// Detect kind of link
			var urlstart = linestr.substring(endix+2);
			if (urlstart.startsWith("http://")) {
				console.log("EXTERNAL URL");
			} else {
				console.log("INTERNAL GOTO");
			}

			this.pushLine();
			var nline = document.createElement("a");
			nline.setAttribute("target","_blank");
			nline.contentEditable = false;
			this.lineelement.appendChild(nline);
			this.lineelement = nline;
		}
	}

	EdenUI.Highlight.prototype.COMMENT_LINK_END = function() {
		var linestr = this.stream.peekLine();
		var endix = linestr.indexOf(")");
		if (endix == -1) {
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
			this.popLine();
		} else {
			var remaining = linestr.substring(0,endix);
			this.tokentext += remaining+")";
			console.log("LINK LINK", remaining);
			this.stream.position += endix+1;
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
			this.lineelement.setAttribute("href", remaining.substring(1));
			this.popLine();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_IMAGE = function() {
		var linestr = this.stream.peekLine();
		var endix = linestr.indexOf("]");
		if (endix == -1) {
			this.classes += this.styles["comment"];
			this.mode = "COMMENT";
		} else {
			var remaining = linestr.substring(0, endix);
			//this.tokentext += remaining;
			console.log("IMG",this.tokentext);
			//this.stream.position += endix;
			this.classes += this.styles["comment"];
			this.mode = "COMMENT_IMAGE_END";

			this.pushLine();
			var nline = document.createElement("img");
			nline.title = remaining;
			nline.style.verticalAlign = "top";
			this.lineelement.appendChild(nline);
			this.lineelement = nline;
		}
	}

	EdenUI.Highlight.prototype.COMMENT_IMAGE_END = function() {
		var linestr = this.stream.peekLine();
		var endix = linestr.indexOf(")");
		if (endix == -1) {
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
			this.popLine();
		} else {
			var remaining = linestr.substring(0,endix);
			this.tokentext += remaining+")";
			//console.log("LINK LINK", remaining);
			this.stream.position += endix+1;
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
			this.lineelement.setAttribute("src", remaining.substring(1));
			this.popLine();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_ESCAPE = function() {
		this.popMode();
		this.classes += this.styles["comment"];
	}

	EdenUI.Highlight.prototype.COMMENT_HTML = function() {
		var tagname = this.tokentext;
		var linestr = this.stream.peekLine();
		var endopen = linestr.indexOf(">");
		if (endopen >= 0) {
			var opentag = "<"+tagname+linestr.substring(0,endopen+1);
			this.tokentext = opentag.substring(1);
			this.cacheddata = {opentag: opentag, tagname: tagname};
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT_HTML_START";
			this.stream.position += endopen+1;
			//this.COMMENT();
		} else {
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
		}
	}

	EdenUI.Highlight.prototype.COMMENT_HTML_CONTENT = function() {
		if (this.token != "<") {
			this.COMMENT();
		} else {
			var linestr = this.stream.peekLine();
			var endtag = "/"+this.cacheddata.tagname+">";
			var endix = linestr.indexOf(endtag);
			if (endix == -1) {
				this.classes += this.styles["hidden-comment"];
			} else {
				if (this.cacheddata) this.popLine();
				this.tokentext += endtag;
				this.stream.position += endix+endtag.length;
				this.classes += this.styles["hidden-comment"];
			}
			this.mode = "COMMENT";
		}
	}

	EdenUI.Highlight.prototype.COMMENT_HTML_START = function() {
		if (this.token != "<") {
			//var linestr = this.stream.peekLine();
			//var endtag = "</"+this.cacheddata.tagname+">";
			//var endix = linestr.indexOf(endtag);
			//if (endix == -1) {
			//	this.classes += this.styles["hidden-comment"];
			//	this.mode = "COMMENT";
			//	this.cacheddata = false;
			//} else {
				//var content = this.tokentext+linestr.substring(0,endix);
				//this.stream.position += endix;
				//this.tokentext += opentag+endtag
				//this.classes += "eden-comment-hidden";
				var html = this.cacheddata.opentag+endtag;
				this.mode = "COMMENT_HTML_CONTENT";
				//var textelement = document.createTextNode(opentag);
				//var openspan = document.createElement("span");
				//openspan.className = "eden-comment-hidden";
				//openspan.appendChild(textelement);
				//this.lineelement.appendChild(openspan.substring(1));
				this.pushLine();
				var nline = $(html).get(0);
				nline.contentEditable = false;
				this.lineelement.appendChild(nline);
				this.lineelement = nline;
				//this.tokentext = content;
				//this.cacheddata = true;
				this.COMMENT();
			//}
		} else {
			var linestr = this.stream.peekLine();
			var endtag = "/"+this.cacheddata.tagname+">";
			var endix = linestr.indexOf(endtag);
			if (endix == -1) {
				this.classes += this.styles["hidden-comment"];
			} else {
				if (this.cacheddata) this.popLine();
				this.tokentext += endtag;
				this.stream.position += endix+endtag.length;
				this.classes += this.styles["hidden-comment"];
			}
			this.mode = "COMMENT";
		}
	}

	EdenUI.Highlight.prototype.COMMENT_CODE = function() {
		if (this.token == "`") {
			this.classes += this.styles["hidden-comment"];
			//this.mode = "COMMENT";
			this.popMode();
		} else {
			this.classes += "eden-script ";
			this.START();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_ICON = function() {
		if (this.token == "OBSERVABLE") {
			if (this.stream.code.charAt(this.stream.position) == "-") {
				var linestr = this.stream.peekLine();
				var endix = linestr.indexOf(":");
				if (endix == -1) {
					this.classes += this.styles["comment"];
					this.mode = "COMMENT";
					return;
				}
				var remain = linestr.substring(0,endix);
				this.tokentext += remain;
				this.stream.position += remain.length;
			}
			var icon = document.createElement("span");
			icon.className = "eden-comment-icon fa fa-"+this.tokentext;
			this.lineelement.appendChild(icon);
			this.classes += this.styles["hidden-comment"];
		} else if (this.token == ":") {
			this.classes += this.styles["hidden-comment"];
			this.mode = "COMMENT";
		} else {
			// Some kind of highlight error.
		}
	}

	EdenUI.Highlight.prototype.COMMENT_EMPH = function() {
		if (this.token == "*") {
			this.mode = "COMMENT_BOLD";
			this.classes += this.styles["hidden-comment"];
		} else {
			//this.lineelement.className = this.styles["comment-emph"];
			var nline = document.createElement("span");
			nline.className = this.styles["comment-emph"];
			this.lineelement.appendChild(nline);
			this.pushLine();
			this.lineelement = nline;
			//this.classes += this.styles["comment-emph"];
			this.mode = "COMMENT_ITALIC";
			this.COMMENT();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_ITALIC = function() {
		if (this.token == "*") {
			this.classes += this.styles["hidden-comment"];
			//this.mode = "COMMENT";
			this.popLine();
			this.popMode();
		} else {
			//this.classes += this.styles["comment-emph"];
			this.COMMENT();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_BOLD = function() {
		if (this.token == "*") {
			this.classes += this.styles["hidden-comment"];
			this.popLine();
			this.mode = "COMMENT_BOLD_END";
		} else {
			//this.classes += this.styles["comment-bold"];
			var nline = document.createElement("span");
			nline.className = this.styles["comment-bold"];
			this.lineelement.appendChild(nline);
			this.pushLine();
			this.lineelement = nline;
			//this.classes += this.styles["comment-emph"];
			this.mode = "COMMENT_BOLD_END";
			this.COMMENT();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_BOLD_END = function() {
		if (this.token == "*") {
			if (this.stream.code.charAt(this.stream.position) == "*") {
				this.classes += this.styles["hidden-comment"];
				this.stream.position++;
				this.tokentext += "*";
			}
			this.popLine();
			this.popMode();
		} else {
			this.COMMENT();
		}
	}

	EdenUI.Highlight.prototype.COMMENT_TAG = function() {
		//this.classes += "eden-doxytag";
		this.mode = "END_COMMENT_TAG";
	}

	EdenUI.Highlight.prototype.END_COMMENT_TAG = function() {
		this.popLine();
		this.mode = "COMMENT";
		this.COMMENT();
	}

	EdenUI.Highlight.prototype.DOXY_COMMENT = function() {
		this.BLOCK_COMMENT();
	}

	EdenUI.Highlight.prototype.JAVASCRIPT = function() {
		this.classes += this.styles["javascript"];
		if (this.token == "}}$") {
			this.mode = this.startmode;
		}
	}

	EdenUI.Highlight.prototype.HEREDOC = function() {
		if (this.prevtoken == "INVALID" && this.tokentext == this.heredocend) {
			this.classes += this.styles["storage"];
			this.mode = this.startmode;
		} else {
			this.classes += this.styles["string"];
		}
	}




	EdenUI.Highlight.prototype.pushLine = function() {
		this.linestack.push(this.lineelement);
	}

	EdenUI.Highlight.prototype.pushMode = function() {
		this.modestack.push(this.mode);
	}

	EdenUI.Highlight.prototype.popLine = function() {
		if (this.linestack.length > 0) {
			this.lineelement = this.linestack.pop();
		}
	}

	EdenUI.Highlight.prototype.popMode = function() {
		if (this.modestack.length > 0) {
			this.mode = this.modestack.pop();
		}
	}



	EdenUI.Highlight.prototype.setScrollTop = function(stop) {
		this.scrolltop = stop;
	}



	EdenUI.Highlight.isType = function(str) {
		return false;
		//return (str.charCodeAt(0) >= 65 && str.charCodeAt(0) <= 90);
	}



	/**
	 * Choose what kind of line this should be, current line, an error, a comment
	 * or just a plain line. Returns the CSS class(es) needed.
	 */
	function generateLineClass(source, stream, linestart, lineerror, position) {
		var className = "";
		if (position >= linestart && position <= stream.position) {
			if (lineerror) {
				className = "eden-currentline eden-errorline";
			} else {
				className = "eden-currentline";
			}
		} else {
			if (lineerror) {
				className = "eden-line eden-errorline";
			} else {
				if (stream.code.charAt(linestart) == "#") {
					className = "eden-commentline";
				} else {
					className = "eden-line";
				}
			}
		}
		//console.log(source.ast.lines[source.line-1]);
		if (source.ast.lines[source.line-1]) {
			if (source.ast.lines[source.line-1].executed == 1) {
				className += " eden-executedline";
			} else if (source.ast.lines[source.line-1].executed == 2) {
				className += " eden-guardedline";
			}
		} else if (source.ast.lines[source.line-1] === undefined && source.line-1 > 0 && source.ast.lines[source.line-1-1] && source.ast.lines[source.line-1-1].parent) {
			if (source.ast.lines[source.line-1-1].executed == 1) {
				className += " eden-executedline";
			} else if (source.ast.lines[source.line-1-1].executed == 2) {
				className += " eden-guardedline";
			}
		}
		return className;
	}



	EdenUI.Highlight.lineclearmode = {
		"COMMENT": true,
		"SECTION_TITLE": true,
		"SECTION_TITLE2": true,
		"SECTION_TITLE3": true,
		"SECTION_TITLE4": true,
		"SECTION_TITLE_H1": true,
		"SECTION_TITLE_H2": true,
		"SECTION_TITLE_H3": true,
		"SECTION_TITLE_H4": true,
		"COMMENT_BOLD": true,
		"COMMENT_CODE": true,
		"COMMENT_ICON":	true,
		"COMMENT_EMPH": true,
		"COMMENT_ITALIC": true,
		"COMMENT_BOLD_END": true,
		"COMMENT_QUERY": true,
		"END_COMMENT_TAG": true,
		"COMMENT_TAG": true,
		"COMMENT_LINK": true,
		"COMMENT_LINK_END": true,
		"COMMENT_HTML": true,
		"COMMENT_HTML_START": true,
		"COMMENT_HTML_CONTENT": true
	}

	/**
	 * Highlight a single line but not including the containing line div.
	 */
	EdenUI.Highlight.prototype.highlightLine = function(ast, position) {
		var errstart = -1;
		var errend = -1;
		var errmsg = "";
		var inerror = false;
		var stream = ast.stream;
		this.stream = stream;
		var lineerror = false;
		var linestart = 0;
		var token = "INVALID";
		var prevtoken = "INVALID";
		//var commentmode = 0;

		//Reset line class
		this.outerline = "eden-line";

		this.linestack = [];

		// Set the mode for this line based upon mode at end of previous line
		if (this.mode_at_line[this.line-1]) this.mode = this.mode_at_line[this.line-1];
		else this.mode = this.startmode;

		// Reset line comments
		if (EdenUI.Highlight.lineclearmode[this.mode]) this.mode = this.startmode;

		// Get error position information
		if (ast.script && ast.script.errors.length > 0) {
			errstart = ast.script.errors[0].prevposition;
			errend = ast.script.errors[0].position;
			errmsg = ast.script.errors[0].messageText();
		}

		var wsline = "";

		var line = document.createElement('span');
		line.className = this.styles["script-line"];

		while (true) {
			//if (this.mode == 6) {
			//	this.mode = this.lastmode;
			//	line = linestack.pop();
			//}

			// Do we need to insert a caret between tokens?
			if (stream.position == position) {
				if (wsline != "") {
					// Insert any whitespace before the caret
					var textnode = document.createTextNode(wsline);
					line.appendChild(textnode);
					wsline = "";
				}
				// Caret!
				var caret = document.createElement('span');
				caret.className = "fake-caret";
				line.appendChild(caret);
				//if (this.linestack.length > 0) this.linestack[0].className += " current";
				//else line.className += " current";

				var p = line;
				while (p && p.nodeName != "DIV") {
					if (p.className == this.styles["comment-line"]) {
						p.className += " current";
						break;
					}
					p = p.parentNode;
				}

				//if (this.metrics[this.line-1] == undefined) this.metrics[this.line-1] = {};
				//this.metrics[this.line-1].current = true;
			}

			// Skip but preserve white space
			var ch= stream.peek();
			if (ch == 10 || ch == 13) {
				if (wsline != "") {
					if (line.lastChild && line.lastChild.className != this.styles["hidden-comment"] && line.lastChild.className != "fake-caret") {
						//line.lastChild.appendChild(textnode);
						if (line.lastChild.lastChild && line.lastChild.lastChild.nodeName == "#text") line.lastChild.lastChild.textContent += wsline;
						else {
							var textnode = document.createTextNode(wsline);
							line.lastChild.appendChild(textnode);
						}
					} else {
						var textnode = document.createTextNode(wsline);
						line.appendChild(textnode);
					}
					wsline = "";
				}
				break;
			} else if (ch == 9 || ch == 13 || ch == 32 || ch == 160) {
				stream.skip();
				if (ch == 32 || ch == 160) {
					wsline += " ";
				} else if (ch != 13) {
					wsline += String.fromCharCode(ch);
				}
				continue;
			}

			// End of whitespace, so add it to the line
			if (wsline != "") {
				// Import path group mode needs ending
				//if (this.mode == 8) {
				//	line = linestack.pop();
				//	this.mode = 1;
				//}
				if (line.lastChild && line.lastChild.className != this.styles["hidden-comment"] && line.lastChild.className != "fake-caret") {
					//line.lastChild.appendChild(textnode);
					if (line.lastChild.lastChild && line.lastChild.lastChild.nodeName == "#text") line.lastChild.lastChild.textContent += wsline;
					else {
						var textnode = document.createTextNode(wsline);
						line.lastChild.appendChild(textnode);
					}
				} else {
					var textnode = document.createTextNode(wsline);
					line.appendChild(textnode);
				}
				wsline = "";
			}

			prevtoken = token;
			token = stream.readToken();

			if (typeof token != "string") {
				console.error("Token error: line = " + this.line + " position = " + stream.position);
			}

			if (token == "EOF") {
				if (wsline != "") {
					// Add any trailing whitespace
					if (line.lastChild && line.lastChild.className != this.styles["hidden-comment"] && line.lastChild.className != "fake-caret") {
						//line.lastChild.appendChild(textnode);
						if (line.lastChild.lastChild && line.lastChild.lastChild.nodeName == "#text") line.lastChild.lastChild.textContent += wsline;
						else {
							var textnode = document.createTextNode(wsline);
							line.lastChild.appendChild(textnode);
						}
					} else {
						var textnode = document.createTextNode(wsline);
						line.appendChild(textnode);
					}
					wsline = "";
				}
				break;
			}
			if (token == "INVALID") {
				console.log("INVALID: " + stream.peek());
				stream.skip();
				continue;
			}


			this.token = token;
			this.prevtoken = prevtoken;
			this.type = stream.tokenType(token);
			this.classes = "";
			this.tokentext = stream.tokenText();
			this.lineelement = line;

			// Is this token inside the error if there is one?
			if (errstart != -1) {
				if (errstart <= stream.prevposition && !inerror) {
					inerror = true;
				}
				if (errend <= stream.prevposition && inerror) {
					inerror = false;
				}
				if( inerror) lineerror = true;
			}
			if (inerror && ast.script.errors[0].token != "EOF") {
				this.classes += "eden-error ";
			}


			if (this[this.mode] === undefined) console.error("No Mode",this.mode);
			this[this.mode].call(this);

			line = this.lineelement;


			// Insert caret in middle of token if needed
			if (stream.prevposition < position && stream.position > position) {
				var caret = position - stream.prevposition;
				var textleft = this.tokentext.slice(0,caret);
				var textright = this.tokentext.slice(caret);

				// Left text
				var parentspan = document.createElement('span');
				parentspan.className = this.classes;
				if (this.classes == "eden-observable") {
					parentspan.setAttribute("data-observable", this.tokentext);
				}

				var tokenspan = document.createElement('span');
				//tokenspan.className = classes;
				//tokenspan.setAttribute("data-split", "true");
				/*if (classes == "eden-observable") {
					tokenspan.setAttribute("data-observable", tokentext);
				}*/
				tokenspan.appendChild(document.createTextNode(textleft));
				parentspan.appendChild(tokenspan);

				// Caret!
				var caret = document.createElement('span');
				caret.className = "fake-caret";
				parentspan.appendChild(caret);

				// Right text
				tokenspan = document.createElement('span');
				/*tokenspan.className = classes;
				tokenspan.setAttribute("data-split", "true");
				if (classes == "eden-observable") {
					tokenspan.setAttribute("data-observable", tokentext);
				}*/
				tokenspan.appendChild(document.createTextNode(textright));
				parentspan.appendChild(tokenspan);

				line.appendChild(parentspan);
				//if (this.linestack.length > 0) this.linestack[0].className += " current";
				//else line.className += " current";
				var p = line;
				while (p && p.nodeName != "DIV") {
					if (p.className == this.styles["comment-line"]) {
						p.className += " current";
						break;
					}
					p = p.parentNode;
				}

				//if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
				//this.metrics[this.line].current = true;
			} else {
				if (line.lastChild && line.lastChild.className == this.classes) {
					var tokenspan = line.lastChild;
					if (tokenspan.lastChild && tokenspan.lastChild.nodeName == "#text") {
						tokenspan.lastChild.textContent += this.tokentext;
					} else {
						tokenspan.appendChild(document.createTextNode(this.tokentext));
					}
				} else {
					var tokenspan = document.createElement('span');
					tokenspan.className = this.classes;
					if (this.classes == "eden-observable") {
						tokenspan.setAttribute("data-observable", this.tokentext);
					}
					tokenspan.appendChild(document.createTextNode(this.tokentext));
					line.appendChild(tokenspan);
				}
			}
		}

		// Just in case of error
		if (this.linestack.length > 0) {
			line = this.linestack[0];
			//this.mode = (this.mode == 78) ? 77 : 0;
		}

		this.mode_at_line[this.line] = this.mode;
		return line;
	}



	/**
	 * Generate a syntax highlighted version of the stream. Call this with
	 * an abstract syntax tree of the code, the line to highlight (or -1 for
	 * all) and the current cursor position.
	 */
	EdenUI.Highlight.prototype.highlight = function(ast, hline, position, options) {
		this.ast = ast;
		this.line = 1;

		var errstart = -1;
		var errend = -1;
		var errmsg = "";
		var inerror = false;
		var stream = ast.stream;
		var title = "";

		if (this.outelement === undefined) return;

		if (ast.stream.code.length == 0) {
			if (this.outelement) {
				this.outelement.innerHTML = "<div class='eden-line'><span class='fake-caret'></span></div>";
			}
			return;
		}

		if (ast.script && ast.script.errors.length > 0) {
			errstart = ast.script.errors[0].prevposition;
			errend = ast.script.errors[0].position;
			errmsg = ast.script.errors[0].messageText();
		}

		stream.reset();

		var line = undefined;
		var lineerror = false;
		var linestart = 0;
		var token = "INVALID";
		var prevtoken = "INVALID";

		//var curtop = (options && options.spacing && options.spacing[0]) ? options.spacing[0] : 20;

		// Highlight all if -1
		if (hline == -1 ) {
			this.metrics = {};
			detach(this, this.outelement, false, function() {

			// Clear!
			//this.outelement.innerHTML = "";
			while (this.outelement.lastChild) this.outelement.removeChild(this.outelement.lastChild);
			this.mode_at_line = {};

			while (stream.valid()) {
				var ch= stream.peek();
				var lineclass = "";
				if (ch == 10 || ch == 13) {
					lineerror = (linestart <= errstart) && (stream.position >= errend);

					var lineelement = document.createElement('div');
					lineelement.className = this.outerline; //"eden-line";
					if (options && options.spacing && options.spacing[this.line]) lineelement.height = "" + options.spacing[this.line] + "px";
					//lineelement.style.height = "" + ((options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20) + "px";
					lineelement.setAttribute("data-line",this.line-1);
					//lineelement.className = generateLineClass(this, stream, linestart,lineerror,position);
					//curtop += (options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20;
					this.line++;
					if (line !== undefined) {
						lineelement.appendChild(line);
						//if (line.className == " eden-section-line") lineelement.className += " eden-section-line";
					} else {
						this.mode_at_line[this.line-1] = this.mode;
					}
					var blank = document.createTextNode((ch == 13)? "\n" : "\n");
					lineelement.appendChild(blank);

					this.outelement.appendChild(lineelement);

					linestart = stream.position+1;
					line = undefined;
					stream.skip();
					if (ch == 13) stream.skip();
					this.outerline = "eden-line";
					continue;
				}

				if (this.scrolltop >= 0 && (this.line < this.scrolltop-105 || this.line > this.scrolltop+105)) {
					// Extract unhighlighted line
					var eolix = stream.code.indexOf("\n",stream.position);
					var ltext;
					if (eolix == -1) {
						ltext = stream.code.substring(stream.position);
						stream.position = stream.code.length;
					} else {
						ltext = stream.code.substring(stream.position, eolix);
						stream.position = eolix;
					}
					line = document.createTextNode(ltext);
				} else {
					//this.outerline = lineelement;
					line = this.highlightLine(ast, position);
				}
			}

			lineerror = (linestart <= errstart) && (stream.position >= errend);

			if (line !== undefined) {
				var lineelement = document.createElement('div');
				lineelement.className = "eden-line";
				//lineelement.style.top = "" + curtop + "px";
				lineelement.style.height = "" + ((options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20) + "px";
				lineelement.setAttribute("data-line",this.line-1);
				//lineelement.className = generateLineClass(this, stream, linestart,lineerror,position);
				lineelement.appendChild(line);
				this.outelement.appendChild(lineelement);
			} else {
				var lineelement = document.createElement('div');
				if (position >= stream.position) {
					lineelement.className = "eden-line";
					lineelement.style.height = "" + ((options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20) + "px";
					lineelement.setAttribute("data-line",this.line-1);
					var caret = document.createElement('span');
					caret.className = "fake-caret";
					lineelement.appendChild(caret);
				} else {
					lineelement.className = "eden-line";
					//lineelement.style.top = "" + curtop + "px";
				}
				this.outelement.appendChild(lineelement);
			}

			});  // End detach
		} else {
			//detach(this, this.outelement, false, function() {

			// Skip until the lines we are looking for
			while (stream.valid() && (this.line < (hline-1))) {
				var ch = stream.peek();
				if (ch == 10 || ch == 13) {
					this.line++;
				}
				stream.skip();
				if (ch == 13) stream.skip();
			}

			// Highlight 3 lines, 1 before and after what we want
			for (var i=2; i>=0; i--) {
				this.line = hline-i+1;
				if (this.metrics[this.line]) delete this.metrics[this.line];
				var node = this.outelement.childNodes[hline-i];
				if (node !== undefined) {
					//Remove existing content
					while (node.lastChild) node.removeChild(node.lastChild);

					linestart = stream.position;
					//this.outerline = node;
					line = this.highlightLine(ast, position);
					lineerror = (linestart <= errstart) && (stream.position >= errend);
					//node.className = generateLineClass(this, stream, linestart,lineerror,position);
					node.appendChild(line);
					node.className = this.outerline;
					var ch = stream.peek();
					var blank = document.createTextNode((ch == 13) ? "\n" : "\n");
					node.appendChild(blank);
					stream.skip();
					if (ch == 13) stream.skip();
				}
			}

			// Highlight lines if mode changed
			while (this.mode_at_line[this.line+1] !== undefined && this.mode_at_line[this.line] != this.mode_at_line[this.line+1]) {
				this.line++;
				if (this.metrics[this.line]) delete this.metrics[this.line];
				var node = this.outelement.childNodes[this.line-1];
				if (node !== undefined) {
					//Remove existing content
					while (node.lastChild) node.removeChild(node.lastChild);

					linestart = stream.position;
					//this.outerline = node;
					line = this.highlightLine(ast, position);
					lineerror = (linestart <= errstart) && (stream.position >= errend);
					//node.className = generateLineClass(this, stream, linestart,lineerror,position);
					node.appendChild(line);
					node.className = this.outerline;
					var ch = stream.peek();
					var blank = document.createTextNode((ch == 13) ? "\n" : "\n");
					node.appendChild(blank);
					stream.skip();
					if (ch == 13) stream.skip();
				}
			}

			// Now check for dirty lines to change line class
			/*console.log(ast.lines);
			for (var i=0; i<this.outelement.childNodes.length; i++) {
				if (ast.lines[i]) {
					if (ast.lines[i].executed == 1) {
						this.outelement.childNodes[i].className = "eden-line eden-executedline";
					} else if (ast.lines[i].executed == 2) {
						this.outelement.childNodes[i].className = "eden-line eden-guardedline";
					} else if (ast.lines[i].errors.length > 0) {
						this.outelement.childNodes[i].className += " eden-errorblock";
					}
				} else if (ast.lines[i] === undefined && i > 0 && ast.lines[i-1] && ast.lines[i-1].parent) {
					if (ast.lines[i-1].executed == 1) {
						this.outelement.childNodes[i].className = "eden-line eden-executedline";
					} else if (ast.lines[i-1].executed == 2) {
						this.outelement.childNodes[i].className = "eden-line eden-guardedline";
					} else if (ast.lines[i-1].errors.length > 0) {
						this.outelement.childNodes[i].className += " eden-errorblock";
					}
				}
			}*/

			//});
		}
	};

	EdenUI.Highlight.html = function(str, single) {
		var dummy = document.createElement("div");
		var hlighter = new EdenUI.Highlight(dummy);
		hlighter.ast = {stream: new EdenStream(str)};
		hlighter.highlight(hlighter.ast,-1,-1,undefined);
		if (single) {
			return dummy.childNodes[0].innerHTML;
		} else {
			var res = "";
			for (var i=0; i<dummy.childNodes.length; i++) {
				res += dummy.childNodes[i].innerHTML;
			}
			return res;
		}
	}
}(typeof window !== 'undefined' ? window : global));
