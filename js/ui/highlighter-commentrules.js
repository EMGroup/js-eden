EdenUI.Highlight.prototype.SECTION_TITLE = function() {
	if (this.token == "#") {
		this.classes.push("hidden-comment");
		//this.lineelement.className += " " + this.styles["comment-h2"];
		this.applyClasses(this.lineelement, ["comment-line", "comment-h2"]);
		//this.mode = "SECTION_TITLE_H2";
		this.mode = "COMMENT";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else if (this.token == "##") {
		this.classes.push("hidden-comment");
		this.mode = "SECTION_TITLE3";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else {
		//this.classes.push("comment-h1"];
		//this.lineelement.className += " " + this.styles["comment-h1"];
		this.applyClasses(this.lineelement, ["comment-line", "comment-h1"]);
		//this.mode = "SECTION_TITLE_H1";
		this.mode = "COMMENT";
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.SECTION_TITLE2 = function() {
	if (this.token == "#") {
		this.classes.push("hidden-comment");
		this.mode = "SECTION_TITLE3";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else {
		this.classes.push("comment-h2");
		this.mode = "SECTION_TITLE_H2";
	}
}

EdenUI.Highlight.prototype.SECTION_TITLE3 = function() {
	if (this.token == "#") {
		this.classes.push("hidden-comment");
		//this.lineelement.className += " " + this.styles["comment-h4"];
		this.applyClasses(this.lineelement, ["comment-line", "comment-h4"]);
		this.mode = "COMMENT";
		//this.mode = "SECTION_TITLE4";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else {
		//this.classes.push("comment-h3"];
		//this.lineelement.className += " " + this.styles["comment-h3"];
		this.applyClasses(this.lineelement, ["comment-line", "comment-h3"]);
		//this.mode = "SECTION_TITLE_H3";
		this.mode = "COMMENT";
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.SECTION_TITLE4 = function() {
		this.classes.push("comment-h4");
		this.mode = "SECTION_TITLE_H4";
}

EdenUI.Highlight.prototype.SECTION_TITLE_H1 = function() {
	this.classes.push("comment-h1");
}

EdenUI.Highlight.prototype.SECTION_TITLE_H2 = function() {
	this.classes.push("comment-h2");
}

EdenUI.Highlight.prototype.SECTION_TITLE_H3 = function() {
	this.classes.push("comment-h3");
}

EdenUI.Highlight.prototype.SECTION_TITLE_H4 = function() {
	this.classes.push("comment-h4");
}

EdenUI.Highlight.prototype.BLOCK_COMMENT = function() {

	switch(this.token) {
	case "*/"		:	this.mode = this.startmode;
						this.classes.push("block-comment");
						break;
	default			:	this.classes.push("block-comment");
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
						//nline.className = this.styles["doxytag"];
						this.applyClasses(nline, ["doxytag"]);
						this.lineelement.appendChild(nline);
						this.lineelement = nline;
						break;
	case "-"		:
	case "*"		:	if ((this.prevtoken == "##" || this.prevtoken == "#" || this.prevtoken == "INVALID") && (this.stream.peek() == 32 || this.stream.peek() == 9)) {
							this.pushLine();
							var nline = document.createElement("span");
							//nline.className = this.styles["comment-ul"];
							this.applyClasses(nline, ["comment-ul"]);
							this.lineelement.appendChild(nline);
							this.lineelement = nline;
							this.classes.push("hidden-comment");
						} else if (this.token != "-") {
							this.pushMode();
							this.mode = "COMMENT_EMPH";
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;
						
	case "--"		:	if (this.stream.peek() == 45) {
							this.outerline = "eden-line eden-section-line";
							while (this.stream.peek() == 45) {
								this.tokentext += "-";
								this.stream.position++;
							}
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						} break;

	case "["		:	if (this.stream.peek() != 32) {
							this.pushMode();
							this.mode = "COMMENT_LINK";
							this.pushLine();
							var nline = document.createElement("span");
							this.lineelement.appendChild(nline);
							this.lineelement = nline;
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;

	case "!"		:	if (this.stream.peek() == 91) {
							this.mode = "COMMENT_IMAGE";
							this.tokentext += "[";
							this.stream.position++;
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;
	case "$"		:	if (this.stream.peek() == 91) {
							this.pushMode();
							this.mode = "COMMENT_BUTTON";
							this.tokentext += "[";
							this.stream.position++;
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;

	case ">"		:	if ((this.prevtoken == "##" || this.prevtoken == "#" || this.prevtoken == "INVALID") && (this.stream.peek() == 32 || this.stream.peek() == 9)) {
							this.outerline += " " + this.styles["comment-blockquote"];
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;
					
						
	case "`"		:	this.pushMode();
						this.mode = "COMMENT_CODE";
						this.classes.push("hidden-comment");
						break;
	case ":"		:	if (this.stream.peek() != 32) {
							this.pushMode();
							this.mode = "COMMENT_ICON";
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						} break;
	case "<"		:	if (this.stream.peek() != 32) {
							this.mode = "COMMENT_HTML";
							this.classes.push("hidden-comment");
						} else {
							this.classes.push("comment");
						}
						break;
	case "\""		:	this.pushMode();
						this.mode = "COMMENT_ESCAPE";
						this.classes.push("hidden-comment");
						break;
	case "?"		:	this.pushMode();
						this.mode = "COMMENT_QUERY";
						this.cacheddata = undefined;
						// Record the fact that this is a query line
						if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
						this.metrics[this.line].query = true;
						// And record the exact elements that need updating.
						if (this.metrics[this.line].qelements === undefined) this.metrics[this.line].qelements = [];
						this.classes.push("hidden-comment");
						break;
	case "{"		:	this.pushMode();
						this.mode = "COMMENT_ATTRS";
						this.classes.push("hidden-comment");
						break;
	default			:	this.classes.push("comment");
	}
}

var css_color_names = {"aliceblue": true,
"antiquewhite": true,
"aqua": true,
"aquamarine": true,
"azure": true,
"beige": true,
"bisque": true,
"black": true,
"blanchedalmond": true,
"blue": true,
"blueviolet": true,
"brown": true,
"burlywood": true,
"cadetblue": true,
"chartreuse": true,
"chocolate": true,
"coral": true,
"cornflowerblue": true,
"cornsilk": true,
"crimson": true,
"cyan": true,
"darkblue": true,
"darkcyan": true,
"darkgoldenrod": true,
"darkgray": true,
"darkgrey": true,
"darkgreen": true,
"darkkhaki": true,
"darkmagenta": true,
"darkolivegreen": true,
"darkorange": true,
"darkorchid": true,
"darkred": true,
"darksalmon": true,
"darkseagreen": true,
"darkslateblue": true,
"darkslategray": true,
"darkslategrey": true,
"darkturquoise": true,
"darkviolet": true,
"deeppink": true,
"deepskyblue": true,
"dimgray": true,
"dimgrey": true,
"dodgerblue": true,
"firebrick": true,
"floralwhite": true,
"forestgreen": true,
"fuchsia": true,
"gainsboro": true,
"ghostwhite": true,
"gold": true,
"goldenrod": true,
"gray": true,
"grey": true,
"green": true,
"greenyellow": true,
"honeydew": true,
"hotpink": true,
"indianred": true,
"indigo": true,
"ivory": true,
"khaki": true,
"lavender": true,
"lavenderblush": true,
"lawngreen": true,
"lemonchiffon": true,
"lightblue": true,
"lightcoral": true,
"lightcyan": true,
"lightgoldenrodyellow": true,
"lightgray": true,
"lightgrey": true,
"lightgreen": true,
"lightpink": true,
"lightsalmon": true,
"lightseagreen": true,
"lightskyblue": true,
"lightslategray": true,
"lightslategrey": true,
"lightsteelblue": true,
"lightyellow": true,
"lime": true,
"limegreen": true,
"linen": true,
"magenta": true,
"maroon": true,
"mediumaquamarine": true,
"mediumblue": true,
"mediumorchid": true,
"mediumpurple": true,
"mediumseagreen": true,
"mediumslateblue": true,
"mediumspringgreen": true,
"mediumturquoise": true,
"mediumvioletred": true,
"midnightblue": true,
"mintcream": true,
"mistyrose": true,
"moccasin": true,
"navajowhite": true,
"navy": true,
"oldlace": true,
"olive": true,
"olivedrab": true,
"orange": true,
"orangered": true,
"orchid": true,
"palegoldenrod": true,
"palegreen": true,
"paleturquoise": true,
"palevioletred": true,
"papayawhip": true,
"peachpuff": true,
"peru": true,
"pink": true,
"plum": true,
"powderblue": true,
"purple": true,
"red": true,
"rosybrown": true,
"royalblue": true,
"saddlebrown": true,
"salmon": true,
"sandybrown": true,
"seagreen": true,
"seashell": true,
"sienna": true,
"silver": true,
"skyblue": true,
"slateblue": true,
"slategray": true,
"slategrey": true,
"snow": true,
"springgreen": true,
"steelblue": true,
"tan": true,
"teal": true,
"thistle": true,
"tomato": true,
"turquoise": true,
"violet": true,
"wheat": true,
"white": true,
"whitesmoke": true,
"yellow": true,
"yellowgreen": true};

EdenUI.Highlight.prototype.applyAttribute = function(ele, name, val) {
	if (!ele.style) return;

	switch(name) {
	case "color":
	case "font-size":
	case "font-family":
	case "font-weight":
	case "font-style":
	case "text-decoration":
	case "margin-left":
	case "margin-right":	ele.style[name] = val;
							break;
	case "editable":		if (val == "true" || val == "false") {
								ele.contentEditable = val;
							}
							break;
	case "script":			ele.setAttribute("data-jseden", val);
							ele.contentEditable = false;
							ele.style.cursor = "pointer";
							changeClass(ele, "executable", true);
							break;
	case "width":
	case "height":			ele.setAttribute(name,val);
							break;

	case "background":		ele.style.background = val;
							break;
	case "title":			ele.title = val;
							break;
	case "cursor":			ele.style.cursor = val;
							break;
	case "class":			this.applyClasses(ele, val.split(" "));
							break;
	default:				ele.style[name] = val;
	}
}

EdenUI.Highlight.prototype.parseAttrs = function(attrs, ele) {
	if (!ele) ele = this.lineelement.lastChild;
	if (!ele) ele = this.lineelement;
	else ele = ele.previousSibling;
	if (!ele) ele = this.lineelement;

	var extension;
	attrs = attrs.trim();
	if (attrs.charAt(0) == ".") {
		var m = attrs.substring(1).match(/[a-z0-9\-]+/);
		if (m === null) return;
		extension = m[0];
		attrs = attrs.substring(extension.length+1).trim();
		if (this.styleExtensions[extension] === undefined) this.styleExtensions[extension] = {};
	}
	
	// Process attributes...
	while (attrs && attrs.length > 0) {
		//console.log("ATTRS",attrs);
		var endix = attrs.indexOf("=");
		var name;

		if (endix == -1) {
			name = attrs;
			attrs = "";
		} else {
			name = attrs.substring(0,endix);
			attrs = attrs.substring(endix+1);
		}

		var val = "";

		if (attrs.charAt(0) == "?") {
			// Parse a query for the style value
		} else if (attrs.charAt(0) == "\"" || attrs.charAt(0) == "'") {
			endix = -1;
			var kind = attrs.charAt(0);
			for (var i=1; i<attrs.length; i++) {
				if (attrs.charAt(i) == kind) {
					endix = i; break;
				} else if (attrs.charAt(i) == "\\") i++;
			}

			if (endix == -1) break;
			val = attrs.substring(1,endix);
			attrs = attrs.substring(endix+1);
		} else if (attrs.length > 0) {
			endix = -1;
			for (var i=0; i<attrs.length; i++) {
				if (attrs.charAt(i) == " ") {
					endix = i; break;
				}
			}

			if (endix == -1) {
				val = attrs;
				attrs = "";
			} else {
				val = attrs.substring(0,endix);
				attrs = attrs.substring(endix+1);
			}
		}

		attrs = attrs.trim();

		switch(name) {
		case "colour": name = "color"; break;
		case "size": name = "font-size"; break;
		case "font":
		case "family": name = "font-family"; break;
		case "decoration": name = "text-decoration"; break;
		case "left": name = "margin-left"; break;
		case "right": name = "margin-right"; break;
		case "underline": name = "text-decoration"; val = "underline"; break;
		case "highlight": name = "background"; val = "yellow"; break;
		case "bold": name = "font-weight"; val = "bold"; break;
		case "italic": name = "font-style"; val = "italic"; break;
		}

		if (css_color_names[name] || name.charAt(0) == "#") {
			val = name;
			name = "color";
		} else if (name == "") {
			name = "class";
		}

		if (extension) {
			this.styleExtensions[extension][name] = val;
		} else {
			this.applyAttribute(ele, name, val);
		}
	}

	return ele;
}

EdenUI.Highlight.prototype.COMMENT_ATTRS = function() {
	var linestr = this.stream.peekLine();
	var count = 0;
	var endix = -1;
	for (var i=0; i<linestr.length; i++) {
		if (linestr.charAt(i) == "{") count++;
		else if (linestr.charAt(i) == "}") {
			count--;
			if (count < 0) {
				endix = i;
				break;
			}
		}
	}

	if (endix == -1) {
		this.classes.push("hidden-comment");
		this.popMode();
	} else {
		var remaining = linestr.substring(0,endix);
		var attrs = this.tokentext + remaining;
		this.tokentext += remaining+"}";
		this.stream.position += endix+1;
		this.classes.push("hidden-comment");
		
		if (attrs.charAt(0) == "?") {
			// Record the fact that this is a query line
			if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
			this.metrics[this.line].squery = true;

			var res = this.parseQuery(attrs);
			if (res) {
				res = res.join(" ");
				this.parseAttrs(res);
			}
		} else {
			this.parseAttrs(attrs);
		}

		//this.popLine();
		this.popMode();
	}
}

EdenUI.Highlight.prototype.parseQuery = function(q) {
	var linestr = q.substring(2);
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
		return undefined;
	} else {
		var qstr = linestr.substring(0,endix);
		var res = Eden.Selectors.query(qstr,"value");
		return res;
		//this.metrics[this.line].qelements.push(ele);
	}
}

EdenUI.Highlight.prototype.COMMENT_QUERY = function() {
	if (this.token == "[") {
		var linestr = this.stream.peekLine();
		var endix = -1;
		for (var i=0; i<linestr.length; i++) {
			if (linestr.charAt(i) == "]") {
				endix = i;
				break;
			}
		}

		if (endix == -1) {
			this.classes.push("hidden-comment");
			return;
		} else {
			this.classes.push("hidden-comment");
			this.cacheddata = linestr.substring(0,endix);
			console.log("Q RES TYPE",this.cacheddata);
			this.stream.position += endix+1;
			this.tokentext += this.cacheddata + "]";
		}
	} else if (this.token == "(") {
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
			this.classes.push("hidden-comment");
		} else {
			var qstr = linestr.substring(0,endix);
			this.tokentext += qstr + ")";
			this.stream.position += qstr.length+1;
			this.popMode();
			this.classes.push("hidden-comment");

			var ele = document.createElement("span");
			//ele.className += this.styles["comment-query"]; // + " " + this.styles["comment"];
			this.applyClasses(ele, ["comment-query"]);
			this.lineelement.appendChild(ele);
			Eden.Selectors.query(qstr,(this.cacheddata) ? this.cacheddata : "value", {minimum: 1}, (res) => {
				if (res.length == 1) res = res[0];
				else if (res.length > 1) res = res.join(", ");
				else res = "";
				ele.setAttribute("data-result", res);
			});
			if (this.cacheddata) ele.setAttribute("data-attribs", this.cacheddata);
			ele.setAttribute("data-query", qstr);
			this.metrics[this.line].qelements.push(ele);
		}
	} else {
		this.popMode();
		this.classes.push("hidden-comment");
	}
}

EdenUI.Highlight.prototype.COMMENT_LINK = function() {
	if (this.token != "]") {
		this.COMMENT();
	} else {
		this.classes.push("hidden-comment");

		if (this.stream.peek() == 40) {
			// Detect kind of link
			//var linestr = this.stream.peekLine();
			//var urlstart = linestr.substring(endix+2);
			//if (urlstart.startsWith("http://")) {
				//console.log("EXTERNAL URL");
			//} else {
				//console.log("INTERNAL GOTO");
			//}

			var curline = this.lineelement;
			var parent = curline.parentNode;
			//this.popLine();
			var nline = document.createElement("a");
			nline.setAttribute("target","_blank");
			nline.contentEditable = false;

			if (parent) {
				parent.removeChild(curline);
				nline.appendChild(curline);
				parent.appendChild(nline);
				this.lineelement = nline;
			}

			this.mode = "COMMENT_LINK_END";
		} else {
			this.popMode();
			this.popLine();
		}
	}
}

EdenUI.Highlight.prototype.COMMENT_LINK_END = function() {
	console.log("LINKEND",this.token);
	var linestr = this.stream.peekLine();
	if (this.token == "(") {
		var endix = linestr.indexOf(")");
		if (endix == -1) {
			this.classes.push("hidden-comment");
			this.popMode();
			this.popLine();
		} else {
			var remaining = linestr.substring(0,endix);
			this.tokentext += remaining+")";
			this.stream.position += endix+1;
			this.classes.push("hidden-comment");
			this.popMode();
			if (remaining.startsWith("http://") || remaining.startsWith("https://")) {
				this.lineelement.setAttribute("href", remaining);
			} else {
				this.lineelement.setAttribute("href", "javascript: Eden.Selectors.goto('"+remaining+"');");
			}
			this.popLine();
		}
	}
}

EdenUI.Highlight.prototype.COMMENT_IMAGE = function() {
	var linestr = this.stream.peekLine();
	var endix = linestr.indexOf("]");
	if (endix == -1) {
		this.classes.push("comment");
		this.mode = "COMMENT";
	} else {
		var remaining = linestr.substring(0, endix);
		//this.tokentext += remaining;
		console.log("IMG",this.tokentext);
		//this.stream.position += endix;
		this.classes.push("comment");
		this.mode = "COMMENT_IMAGE_END";

		this.pushLine();
		var nline = document.createElement("img");
		nline.title = remaining;
		nline.style.verticalAlign = "top";
		this.lineelement.appendChild(nline);
		this.lineelement = nline;
	}
}

EdenUI.Highlight.prototype.COMMENT_BUTTON = function() {
	this.pushLine();
	var nline = document.createElement("button");
	this.lineelement.appendChild(nline);
	this.lineelement = nline;
	nline.contentEditable = false;
	this.mode = "COMMENT_BUTTON_CONTENT";
}

EdenUI.Highlight.prototype.COMMENT_BUTTON_CONTENT = function() {
	if (this.token == "]") {
		this.classes.push("hidden-comment");
		this.popLine();
		this.popMode();
	} else {
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.COMMENT_IMAGE_END = function() {
	var linestr = this.stream.peekLine();
	var endix = linestr.indexOf(")");
	if (endix == -1) {
		this.classes.push("hidden-comment");
		this.mode = "COMMENT";
		this.popLine();
	} else {
		var remaining = linestr.substring(0,endix);
		this.tokentext += remaining+")";
		//console.log("LINK LINK", remaining);
		this.stream.position += endix+1;
		this.classes.push("hidden-comment");
		this.mode = "COMMENT";
		this.lineelement.setAttribute("src", remaining.substring(1));
		this.popLine();
	}
}

EdenUI.Highlight.prototype.COMMENT_ESCAPE = function() {
	this.popMode();
	this.classes.push("comment");
}

EdenUI.Highlight.prototype.validHTMLTags = {
	"button": true,
	"span": true,
	"a": true,
	"img": true,
	"input": true,
	"table": true,
	"textarea": true
}

EdenUI.Highlight.prototype.COMMENT_HTML = function() {
	var tagname = this.tokentext;

	if (!EdenUI.Highlight.prototype.validHTMLTags[tagname]) {
		this.mode = "COMMENT";
		this.COMMENT();
		return;
	}

	var linestr = this.stream.peekLine();
	var endopen = -1; //linestr.indexOf(">");
	//var endix = -1; //= linestr.indexOf(endtag);
	var quote = false;
	var kind = 0;
	for (var i=0; i<linestr.length; i++) {
		if (linestr.charCodeAt(i) == kind) {
			quote = !quote;
			kind = 0;
		} else if (kind == 0 && (linestr.charCodeAt(i) == 34 || linestr.charCodeAt(i) == 39)) {
			quote = !quote;
			kind = linestr.charCodeAt(i);
		} else if (quote && linestr.charAt(i) == "\\") i++;
		else if (!quote && linestr.charAt(i) == ">") {
			endopen = i;
			break;
		}
	}
	if (endopen >= 0) {
		var opentag = "<"+tagname+linestr.substring(0,endopen+1);
		this.tokentext = opentag.substring(1);
		this.cacheddata = {opentag: opentag, tagname: tagname};
		this.classes.push("hidden-comment");
		this.mode = "COMMENT_HTML_START";
		this.stream.position += endopen+1;
		//this.COMMENT();
	} else {
		this.classes.push("hidden-comment");
		this.tokentext += linestr.substring(0,linestr.length-1);
		this.stream.position += linestr.length-1;
		this.mode = "COMMENT";
	}
}

EdenUI.Highlight.prototype.COMMENT_HTML_CONTENT = function() {
	if (this.token != "</") {
		this.COMMENT();
	} else if (this.cacheddata) {
		var linestr = this.stream.peekLine();
		var endtag = this.cacheddata.tagname+">";
		var endix = linestr.indexOf(endtag);

		if (endix == -1) {
			this.classes.push("hidden-comment");
		} else {
			if (this.cacheddata) this.popLine();
			this.tokentext += endtag;
			this.stream.position += endix+endtag.length;
			this.classes.push("hidden-comment");
		}
		this.mode = "COMMENT";
	} else {
		this.mode = "COMMENT";
	}
}


EdenUI.Highlight.prototype.COMMENT_HTML_START = function() {
	if (this.token != "<") {
		var html = this.cacheddata.opentag+endtag;
		this.mode = "COMMENT_HTML_CONTENT";

		//if (EdenUI.Highlight.validHTMLTags[this.cacheddata.tagname]) {
			this.pushLine();
			var nline = $(html).get(0);
			if (this.cacheddata.tagname == "button" || this.cacheddata.tagname == "a") {
				nline.contentEditable = false;
			}
			this.lineelement.appendChild(nline);
			this.lineelement = nline;
			this.COMMENT();
		//} else {
		//	this.mode = "COMMENT";
		//}
		//}
	} else {
		var linestr = this.stream.peekLine();
		var endtag = "/"+this.cacheddata.tagname+">";
		var endix = linestr.indexOf(endtag);
		if (endix == -1) {
			this.classes.push("hidden-comment");
		} else {
			if (this.cacheddata) this.popLine();
			this.tokentext += endtag;
			this.stream.position += endix+endtag.length;
			this.classes.push("hidden-comment");
		}
		this.mode = "COMMENT";
	}
}

EdenUI.Highlight.prototype.COMMENT_CODE = function() {
	if (this.token == "`") {
		this.classes.push("hidden-comment");
		//this.mode = "COMMENT";
		this.popMode();
	} else {
		this.classes.push("script");
		this.START();
	}
}

EdenUI.Highlight.prototype.COMMENT_ICON = function() {
	if (this.token == "OBSERVABLE") {
		if (this.stream.code.charAt(this.stream.position) == "-") {
			var linestr = this.stream.peekLine();
			var endix = linestr.indexOf(":");
			if (endix == -1) {
				this.classes.push("comment");
				this.popMode();
				return;
			}
			var remain = linestr.substring(0,endix);
			this.tokentext += remain;
			this.stream.position += remain.length;
		}
		var icon = document.createElement("span");
		icon.className = "eden-comment-icon fa fa-"+this.tokentext;
		this.lineelement.appendChild(icon);
		this.classes.push("hidden-comment");
	} else if (this.token == ":") {
		this.classes.push("hidden-comment");
		this.popMode();
	} else {
		// Some kind of highlight error.
	}
}

EdenUI.Highlight.prototype.COMMENT_EMPH = function() {
	if (this.token == "*") {
		this.mode = "COMMENT_BOLD";
		this.classes.push("hidden-comment");
	} else {
		//this.lineelement.className = this.styles["comment-emph"];
		var nline = document.createElement("span");
		//nline.className = this.styles["comment-emph"];
		this.applyClasses(nline, ["comment-emph"]);
		this.lineelement.appendChild(nline);
		this.pushLine();
		this.lineelement = nline;
		//this.classes.push("comment-emph"];
		this.mode = "COMMENT_ITALIC";
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.COMMENT_ITALIC = function() {
	if (this.token == "*") {
		this.classes.push("hidden-comment");
		//this.mode = "COMMENT";
		this.popLine();
		this.popMode();
	} else {
		//this.classes.push("comment-emph"];
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.COMMENT_BOLD = function() {
	if (this.token == "*") {
		this.classes.push("hidden-comment");
		this.popLine();
		this.mode = "COMMENT_BOLD_END";
	} else {
		//this.classes.push("comment-bold"];
		var nline = document.createElement("span");
		//nline.className = this.styles["comment-bold"];
		this.applyClasses(nline, ["comment-bold"]);
		this.lineelement.appendChild(nline);
		this.pushLine();
		this.lineelement = nline;
		//this.classes.push("comment-emph"];
		this.mode = "COMMENT_BOLD_END";
		this.COMMENT();
	}
}

EdenUI.Highlight.prototype.COMMENT_BOLD_END = function() {
	if (this.token == "*") {
		if (this.stream.code.charAt(this.stream.position) == "*") {
			this.classes.push("hidden-comment");
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
