EdenUI.Highlight.prototype.SECTION_TITLE = function() {
	if (this.token == "#") {
		this.classes += this.styles["hidden-comment"];
		this.lineelement.className += " " + this.styles["comment-h2"];
		//this.mode = "SECTION_TITLE_H2";
		this.mode = "COMMENT";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else if (this.token == "##") {
		this.classes += this.styles["hidden-comment"];
		this.mode = "SECTION_TITLE3";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
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
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
	} else {
		this.classes += this.styles["comment-h2"];
		this.mode = "SECTION_TITLE_H2";
	}
}

EdenUI.Highlight.prototype.SECTION_TITLE3 = function() {
	if (this.token == "#") {
		this.classes += this.styles["hidden-comment"];
		this.mode = "SECTION_TITLE4";
		// Remove a single space if it exists.
		if (this.stream.peek() == 32) {
			this.tokentext += " ";
			this.stream.position++;
		}
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
							while (this.stream.peek() == 45) {
								this.tokentext += "-";
								this.stream.position++;
							}
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
						// Record the fact that this is a query line
						if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
						this.metrics[this.line].query = true;
						// And record the exact elements that need updating.
						if (this.metrics[this.line].qelements === undefined) this.metrics[this.line].qelements = [];
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
			ele.setAttribute("data-query", qstr);
			this.metrics[this.line].qelements.push(ele);
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