
EdenUI.Highlight.prototype.HTML = function() {
	if (this.token == "OBSERVABLE") {
		this.classes.push("htmltag");
		this.mode = "HTML_ATTRIBUTES";
	}
}

EdenUI.Highlight.prototype.HTML_CLOSE = function() {
	if (this.token == "OBSERVABLE") {
		this.classes.push("htmltag");
		this.mode = "HTML_CLOSE";
	} else if (this.token == ">") {
		this.classes.push("htmltag");
		this.popMode();
	}
}

EdenUI.Highlight.prototype.HTML_ATTRIBUTES = function() {
	if (this.token == ">") {
		this.classes.push("htmltag");
		this.mode = "START";
	} else {
		this.classes.push("htmlattribute");
		this.mode = "HTML_ATTRIBVALUE";
	}
}

EdenUI.Highlight.prototype.HTML_ATTRIBVALUE = function() {
	if (this.token == "=") {
		this.classes.push("operator");
	} else if (this.token == "{") {
		this.pushMode();
		this.mode = "START";
	} else if (this.token == ">") {
		this.classes.push("htmltag");
		this.mode = "START";
	} else if (this.token == "STRING") {
		this.classes.push("string");
		this.mode = "HTML_ATTRIBUTES";
	} else {
		this.classes.push("htmlattribute");
	}
}

