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

var edenBuiltin = {
	"exec": true,
	"execute": true,
	"parse": true,
	"eval": true,
	"compile": true
	};

var edenAttributes = {
	"atomic": true,
	"nonatomic": true,
	"fixed": true,
	"nodepend": true,
	"depend": true,
	"eager": true,
	"volatile": true,
	"static": true,
	"const": true,

	"number": true,
	"string": true,
	"list": true,
	"boolean": true,
	"undefined": true,
	"object": true
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

EdenUI.Highlight.prototype.START = function() {
	switch(this.token) {
	case "##"		:	if (this.stream.isBEOL()) {
							this.classes.push("hidden-comment");
							//this.lineelement.className = "eden-comment-line";
							this.mode = "SECTION_TITLE";
							//this.lineelement.className = this.styles["comment-line"];
							this.applyClasses(this.lineelement, ["comment-line"]);
							// Remove a single space if it exists.
							if (this.stream.peek() == 32) {
								this.tokentext += " ";
								this.stream.position++;
							}
						} else {
							this.classes.push("comment");
							this.mode = "COMMENT";
						}
						break;
	case "#"		:	if (this.stream.isBEOL()) {
							var isdoxy = this.stream.peek() == 33;
							if (isdoxy) {
								this.tokentext += "!";
								this.stream.position++;
							}
							this.classes.push("hidden-comment");
							this.mode = "COMMENT";
							this.incomment = true;

							if (this.prevtoken == "INVALID") this.lineelement.style.marginLeft = "0";
							//else {
								var nline = document.createElement("div");
								//nline.className = (isdoxy) ? this.styles["comment-line"]+ " " + this.styles["doxycomment"] : this.styles["comment-line"];
								this.applyClasses(nline, (isdoxy) ? ["comment-line","doxycomment"] : ["comment-line"]);
								this.pushLine();
								this.lineelement.appendChild(nline);
								this.lineelement = nline;
							//}
							// Remove a single space if it exists.
							if (this.stream.peek() == 32) {
								this.tokentext += " ";
								this.stream.position++;
							}
						} else {
							this.classes.push("operator");
						}
						break;
	case "local"	:
	case "para"		:
	case "handle"	:
	case "role"		:
	case "oracle"	:
	case "auto"		:	this.classes.push("storage"); break;
	case "NUMBER"	:	this.classes.push("number"); break;
	case "STRING"	:	this.classes.push("string"); break;
	case "BOOLEAN"	:	this.classes.push("constant"); break;
	case "CHARACTER":	this.classes.push("string"); break;
	case ":"		:	this.classes.push("operator");
						if (this.prevtoken == "is") {
							this.pushMode();
							this.mode = "ATTRIBUTES";
						}
						break;
	case "import"	:
	case "do"		:	this.classes.push("keyword");
						this.pushMode();
						this.mode = "SELECTOR";
						this.pushMode();
						this.mode = "ATTRIBUTES";
						break;
	case "${{"		:	this.classes.push("javascript");
						this.mode = "JAVASCRIPT";
						break;
	case "?"		:	this.classes.push("selector");
						this.pushMode();
						this.mode = "SELECTOR";
						break;
	case "<"		:	if (this.cs3 && this.prevtoken != "OBSERVABLE" && this.prevtoken != ")" && this.prevtoken != "]" && this.prevtoken != "}") {
							this.classes.push("htmltag");
							this.pushMode();
							this.mode = "HTML";
						} else {
							this.classes.push("operator");
						}
						break;
	case "</"		:	if (this.cs3) {
							this.pushMode();
							this.mode = "HTML_CLOSE";
							this.classes.push("htmltag");
						}
						break;
	case "<<"		:	var t = this.stream.readToken();
						var obs = this.stream.tokenText();
						this.tokentext += obs;
						this.heredocend = obs;
						this.classes.push("storage");
						this.mode = "HEREDOC";
						break;
	case "%"		:	if (this.stream.isBEOL()) {
							var p = this.stream.peek();
							if (p != 10 && p != 32) {
								var t = this.stream.readToken();
								var obs = this.stream.tokenText();
								
								if (!this.custom.hasOwnProperty(obs)) {

									var obj = {keywords:null,operators:null,specials:null,typenames:null};
									this.custom[obs] = obj;
								}
								this.current_custom = this.custom[obs];

								if (!this.current_custom.keywords) {
									var kwrds = eden.root.lookup("script_"+obs+"_keywords").value();
									if (Array.isArray(kwrds)) {
										this.current_custom.keywords = {};
										for (var i=0; i<kwrds.length; ++i) {
											this.current_custom.keywords[kwrds[i]] = true;
										}
									}
								}

								if (!this.current_custom.operators) {
									var kwrds = eden.root.lookup("script_"+obs+"_operators").value();
									if (Array.isArray(kwrds)) {
										this.current_custom.operators = {};
										for (var i=0; i<kwrds.length; ++i) {
											this.current_custom.operators[kwrds[i]] = true;
										}
									}
								}

								if (!this.current_custom.specials) {
									var kwrds = eden.root.lookup("script_"+obs+"_specials").value();
									if (Array.isArray(kwrds)) {
										this.current_custom.specials = {};
										for (var i=0; i<kwrds.length; ++i) {
											this.current_custom.specials[kwrds[i]] = true;
										}
									}
								}

								if (!this.current_custom.typenames) {
									var kwrds = eden.root.lookup("script_"+obs+"_types").value();
									if (Array.isArray(kwrds)) {
										this.current_custom.typenames = {};
										for (var i=0; i<kwrds.length; ++i) {
											this.current_custom.typenames[kwrds[i]] = true;
										}
									}
								}

								this.tokentext += obs;
								this.heredocend = "eden";
								this.classes.push("storage");
								this.mode = "CUSTOMBLOCK";
								//this.startmode = "CUSTOMBLOCK";
							}
						} break;
	case "OBSERVABLE":	if (edenFunctions[this.stream.data.value]) {
							this.classes.push("function");
						} else if (EdenUI.Highlight.isType(this.stream.data.value)) {
							this.classes.push("type");
						} else if (edenValues[this.stream.data.value]) {
							this.classes.push("constant");
						} else if (edenSpecials[this.stream.data.value]) {
							this.classes.push("special");
						} else if (this.stream.data.value.charAt(0) == "$") {
							this.classes.push("parameter");
						} else {
							this.classes.push("observable");
							if (!Eden.Index.name_index.hasOwnProperty(this.stream.data.value) && !eden.root.symbols[this.stream.data.value]) {
								this.classes.push("notexist");
							}
						}
						break;

	case "`"		:	this.pushMode();
						this.mode = "STARTBACKTICK";
						this.classes.push("builtin");
						break;

	case "${"		:	this.pushMode();
						this.mode = "STARTSUBEXPRESSION";
						this.classes.push("builtin");
						break;

	case "{"		:	if (this.prevtoken == "OBSERVABLE" && this.prevprevtoken != "action" && this.prevprevtoken != "func" && this.prevprevtoken != "proc" && this.prevprevtoken != "]") {
							this.pushMode();
							this.mode = "STARTBACKTICK";
							this.classes.push("builtin");
						} else {
							this.classes.push("operator");
						} break;
	default			:	if (this.type == "keyword") {
							if (edenBuiltin[this.token]) this.classes.push("builtin");
							else this.classes.push("keyword");
						} else {
							// Bind negative to number if no whitespace.
							if (this.token == "-" && this.stream.isNumeric(this.stream.peek())) {
								this.token = this.stream.readToken();
								this.tokentext = "-" + this.stream.tokenText();
								this.classes.push("number");
							} else if (this.token == "/*") {
								if (this.stream.peek() == 42) {
									this.pushMode();
									this.mode = "DOXY_COMMENT";
									this.classes.push("block-comment");
								} else {
									this.pushMode();
									this.mode = "BLOCK_COMMENT";
									this.classes.push("block-comment");
								}
							} else {
								this.classes.push("operator");
							}
						}
	}
}

EdenUI.Highlight.prototype.START_MINIMAL = function() {
	switch(this.token) {
	/*case "##"		:
	case "#"		:	if (this.prevtoken == "INVALID" || this.prevtoken == ";") {
							var isdoxy = this.stream.peek() == 33;
							if (isdoxy) {
								this.tokentext += "!";
								this.stream.position++;
							}
							this.classes.push("hidden-comment");
							this.mode = "COMMENT";
							this.incomment = true;

							if (this.prevtoken == "INVALID") this.lineelement.style.marginLeft = "0";
							//else {
								var nline = document.createElement("div");
								//nline.className = (isdoxy) ? this.styles["comment-line"]+ " " + this.styles["doxycomment"] : this.styles["comment-line"];
								this.applyClasses(nline, (isdoxy) ? ["comment-line","doxycomment"] : ["comment-line"]);
								this.pushLine();
								this.lineelement.appendChild(nline);
								this.lineelement = nline;
							//}
							// Remove a single space if it exists.
							if (this.stream.peek() == 32) {
								this.tokentext += " ";
								this.stream.position++;
							}
						} else {
							this.classes.push("operator");
						}
						break;*/

	case "NUMBER"	:	this.classes.push("number"); break;
	case "STRING"	:	this.classes.push("string"); break;
	case "BOOLEAN"	:	this.classes.push("constant"); break;
	case "CHARACTER":	this.classes.push("string"); break;

	case "OBSERVABLE":
	default			:	
						// Bind negative to number if no whitespace.
						if (this.token == "-" && this.stream.isNumeric(this.stream.peek())) {
							this.token = this.stream.readToken();
							this.tokentext = "-" + this.stream.tokenText();
							this.classes.push("number");
						} else if (this.token == "/*") {
							//if (this.stream.peek() == 42) {
							//	this.mode = "DOXY_COMMENT";
							//	this.classes.push("block-comment");
							//} else {
								this.pushMode();
								this.mode = "BLOCK_COMMENT";
								this.classes.push("block-comment");
							//}
						} else {
							var val = (this.type == "keyword" || this.type == "operator" || this.type == "separator") ? this.token : this.stream.data.value;

							if (this.current_custom.keywords && this.current_custom.keywords[val]) {
								this.classes.push("keyword");
							} else if (this.current_custom.operators && this.current_custom.operators[val]) {
								this.classes.push("operator");
							} else if (this.current_custom.specials && this.current_custom.specials[val]) {
								this.classes.push("special");
							} else if (this.current_custom.typenames && this.current_custom.typenames[val]) {
								console.log("highlight",val);
								this.classes.push("storage");	
							} else {
								this.classes.push("observable");
							}
						}
	}
}

EdenUI.Highlight.prototype.STARTBACKTICK = function() {
	this.pushLine();
	var nline = document.createElement("span");
	this.applyClasses(nline, ["backticks"]);
	this.lineelement.appendChild(nline);
	this.lineelement = nline;
	this.mode = "BACKTICK";
	this.START();
}

EdenUI.Highlight.prototype.BACKTICK = function() {
	if (this.token == "`") {
		this.classes.push("builtin");
		this.popMode();
		this.popLine();
	} else if (this.token == "}") {
		this.classes.push("builtin");
		this.popMode();
		this.popLine();
	} else {
		this.START();
	}
}

EdenUI.Highlight.prototype.STARTSUBEXPRESSION = function() {
	this.pushLine();
	var nline = document.createElement("span");
	//nline.className = this.styles["backticks"];
	this.applyClasses(nline, ["subexpr"]);
	this.lineelement.appendChild(nline);
	this.lineelement = nline;
	this.mode = "SUBEXPRESSION";
	this.START();
}

EdenUI.Highlight.prototype.SUBEXPRESSION = function() {
	//if (this.token == "}") this.mode = "ENDBACKTICK";
	if (this.token == "}") {
		this.classes.push("builtin");
		this.popMode();
		this.popLine();
		//this.START();
	} else {
		this.START();
	}
}

EdenUI.Highlight.prototype.ATTRIBUTES = function() {
	if (this.token == "[") {
		this.pushLine();
		var nline = document.createElement("span");
		//nline.className = this.styles["pathblock"];
		this.applyClasses(nline, ["pathblock"]);
		this.lineelement.appendChild(nline);
		this.lineelement = nline;
		this.mode = "ATTRIBS";
		this.ATTRIBS();
	} else {
		this.popMode();
		this[this.mode]();
	}
}

EdenUI.Highlight.prototype.ATTRIBS = function() {
	if (this.token == "OBSERVABLE" && edenAttributes[this.tokentext]) {
		this.classes.push("selector3");
	} else if (this.token == "]") {
		this.classes.push("selector");
		this.popMode();
		this.popLine();
	} else if (this.token == "[") {
		this.classes.push("selector");
	} else {
		this.classes.push("error");
	}
}

EdenUI.Highlight.prototype.SELECTOR = function() {
	if (this.token == "[") {
		this.pushLine();
		var nline = document.createElement("span");
		//nline.className = this.styles["pathblock"];
		this.applyClasses(nline, ["pathblock"]);
		this.lineelement.appendChild(nline);
		this.lineelement = nline;
		this.mode = "DO_ATTRIBS";
		this.DO_ATTRIBS();
	} else {
		this.pushLine();
		var nline = document.createElement("span");
		//nline.className = this.styles["pathblock"];
		this.applyClasses(nline, ["pathblock"]);
		this.lineelement.appendChild(nline);
		this.lineelement = nline;
		this.mode = "SELECTOR2";
		this.SELECTOR2();
	}
}

EdenUI.Highlight.prototype.DO_ATTRIBS = function() {
	if (this.token == "OBSERVABLE" && edenAttributes[this.tokentext]) {
		this.classes.push("selector3");
	} else if (this.token == "]") {
		this.classes.push("selector");
		this.mode = "SELECTOR";
	} else {
		this.classes.push("selector");
	}
}

EdenUI.Highlight.prototype.SUB_EXPRESSION = function() {
	if (this.token == "}") {
		this.popMode();
	} else {
		this[this.startmode]();
	}
}

EdenUI.Highlight.prototype.SELECTOR2 = function() {
	if (this.token == "{") {
		this.classes.push("operator");
		this.pushMode();
		this.mode = "SUB_EXPRESSION";
	} else if (this.token == "[") {
		this.classes.push("selector");
		this.mode = "SELECTOR_TYPES";
	} else if (this.token == ";" || this.token == "=" || this.token == "+=" || this.token == "//=") {
		this.popLine();
		this.classes.push("operator");
		//this.mode = this.startmode;
		this.popMode();
	} else if (this.token == "::" || this.token == "with") {
		this.popLine();
		this.classes.push("keyword");
		//this.mode = this.startmode;
		this.popMode();
	} else if (this.token == "OBSERVABLE" && this.prevtoken == "@" && (Eden.Selectors.PropertyNode.attributes[this.tokentext] || Eden.Selectors.allowedOptions[this.tokentext])) {
		this.classes.push("selector4");
	} else if (this.token == "OBSERVABLE" && (this.prevtoken == "." || this.prevtoken == ":") && (Eden.Selectors.PropertyNode.attributes[this.tokentext] || Eden.Selectors.PropertyNode.pseudo[this.tokentext])) {
		this.classes.push("selector2");
	} else {
		this.classes.push("selector");
	}
}

EdenUI.Highlight.prototype.SELECTOR_TYPES = function() {
	if (this.token == "OBSERVABLE" && Eden.Selectors.resultTypes[this.tokentext]) {
		this.classes.push("selector3");
	} else if (this.token == "]") {
		this.classes.push("selector");
		//this.mode = "SELECTOR2";
		this.popMode();
	} else {
		this.classes.push("selector");
	}
}

EdenUI.Highlight.prototype.JAVASCRIPT = function() {
	this.classes.push("javascript");
	if (this.token == "}}$") {
		this.mode = this.startmode;
	}
}

EdenUI.Highlight.prototype.HEREDOC = function() {
	if (this.prevtoken == "INVALID" && this.tokentext == this.heredocend) {
		this.classes.push("storage");
		this.mode = this.startmode;
	} else {
		this.classes.push("string");
	}
}

EdenUI.Highlight.prototype.CUSTOMBLOCK = function() {
	if (this.token == "%") {
		var p = this.stream.peek();
		if (p != 10 && p != 32) {
			var t = this.stream.readToken();
			var obs = this.stream.tokenText();
			this.tokentext += obs;
			if (this.tokentext == "%"+this.heredocend) {
				this.classes.push("storage");
				//this.startmode = "START";
				this.outerline = "eden-line";
				this.mode = this.startmode;
				return;
			}
		}
	}

	//this.outerline = "eden-line eden-customline";
	this.START_MINIMAL();
	this.classes.push("javascript");
}
