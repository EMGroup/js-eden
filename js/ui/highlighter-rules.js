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

EdenUI.Highlight.prototype.START = function() {
	switch(this.token) {
	case "##"		:	if (this.prevtoken == "INVALID") {
							this.classes += this.styles["hidden-comment"];
							//this.lineelement.className = "eden-comment-line";
							this.mode = "SECTION_TITLE";
							this.lineelement.className = this.styles["comment-line"];
							// Remove a single space if it exists.
							if (this.stream.peek() == 32) {
								this.tokentext += " ";
								this.stream.position++;
							}
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
							// Remove a single space if it exists.
							if (this.stream.peek() == 32) {
								this.tokentext += " ";
								this.stream.position++;
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
