EdenUI.Markdown = function(initial) {
	this.contents = document.createElement("div");
	this.contents.className = "markdown-inputhider";

	this.intextarea = document.createElement("textarea"); //$dialogContents.find('.hidden-textarea').get(0);
	this.intextarea.autofocus = true;
	this.intextarea.tabIndex = 1;
	this.intextarea.className = "hidden-textarea2";
	this.intextarea.value = initial;
	this.contents.appendChild(this.intextarea);

	this.codearea = document.createElement("div"); // $codearea.get(0);
	this.codearea.className = "markdown-inputCodeArea";
	this.contents.appendChild(this.codearea);

	this.outdiv = document.createElement("div"); //$dialogContents.find('.outputcontent').get(0);
	this.outdiv.contentEditable = true;
	this.outdiv.className = "markdown-outputcontent";
	this.outdiv.spellcheck = false;
	this.outdiv.tabIndex = 2;
	this.codearea.appendChild(this.outdiv);

	this.highlighter = new EdenUI.Highlight(this.outdiv, {
		start: "MARKDOWN",
		styles: EdenUI.Markdown.styles,
		clearmodes: {
			"SECTION_TITLE": true,
			"SECTION_TITLE2": true,
			"SECTION_TITLE_H1": true,
			"SECTION_TITLE_H2": true,
			"COMMENT_BOLD": true,
			"COMMENT_CODE": true,
			"COMMENT_ICON":	true,
			"COMMENT_EMPH": true,
			"COMMENT_ITALIC": true,
			"END_COMMENT_TAG": true,
			"COMMENT_TAG": true,
			"COMMENT_LINK": true,
			"COMMENT_LINK_END": true
		}
	});

	var keyboard = new EdenUI.ScriptArea.Keyboard(this);
	var mouse = new EdenUI.ScriptArea.Mouse(this);

	this.updateLineCachedHighlight();
}

EdenUI.Highlight.prototype.MARKDOWN = function() {
	if (this.token == "#" && (this.stream.position-2 <= 0 || this.stream.code.charAt(this.stream.position-2) == "\n"))	{
		//if (this.prevtoken == "INVALID") {
			this.classes.push("hidden-comment");
			//this.lineelement.className = "eden-comment-line";
			this.mode = "SECTION_TITLE";
			this.lineelement.className = this.styles["comment-line"];
		//} else {
		//	this.classes += this.styles["comment"];
		//	this.mode = "COMMENT";
		//}
	} else if (this.token == "##" && (this.stream.position-3 <= 0 || this.stream.code.charAt(this.stream.position-3) == "\n"))	{
		//if (this.prevtoken == "INVALID") {
			this.classes.push("hidden-comment");
			//this.lineelement.className = "eden-comment-line";
			this.mode = "SECTION_TITLE2";
			this.lineelement.className = this.styles["comment-line"];
		//} else {
		//	this.classes += this.styles["comment"];
		//	this.mode = "COMMENT";
		//}
	} else {
		this.COMMENT();
	}
}

EdenUI.Markdown.styles = {
		"comment": "",
		"hidden-comment": "markdown-comment-hidden",
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
		"comment-h1": "markdown-comment-h1",
		"comment-h2": "markdown-comment-h2",
		"comment-h3": "eden-comment-h3",
		"horizontal-line": "eden-section-line",
		"comment-line": "eden-comment-line",
		"comment-emph": "eden-comment-emph",
		"comment-bold": "eden-comment-bold",
		"script-line": "markdown-comment-line",
		"doxytag": "markdown-tag",
		"comment-query": "eden-comment-query",
		"block-comment": "eden-blockcomment",
		"comment-ul": "eden-comment-ul",
		"comment-blockquote": "eden-comment-blockquote",
		"script": "eden-script"
	}

EdenUI.Markdown.prototype.getLineNumber = function() {
	var lines = this.intextarea.value.substr(0, this.intextarea.selectionStart).split("\n");
	this.currentlineno = lines.length;
	this.currentcharno = lines[lines.length-1].length;
	return this.currentlineno;
}

EdenUI.Markdown.prototype.hideInfoBox = function() {
	//$(infobox).hide("fast");
}

EdenUI.Markdown.prototype.disableGotoMode = function() {}

EdenUI.Markdown.prototype.rebuild = function() {
	//var ast = new Eden.AST(this.intextarea.value, undefined, {}, {noparse: true, noindex: true});
	this.updateLineCachedHighlight();
}

EdenUI.Markdown.prototype.updateLineCachedHighlight = function() {
	var ast = new Eden.AST(this.intextarea.value, undefined, {}, {noparse: true, noindex: true});
	var lineno = -1;
	var pos = -1;
	if (document.activeElement === this.intextarea) {
		pos = this.intextarea.selectionEnd;
		lineno = this.getLineNumber(this.intextarea);
	}

	this.highlighter.highlight(ast, -1, pos);
}

EdenUI.Markdown.prototype.setValue = function(text) {
	this.intextarea.value = text;
	this.updateLineCachedHighlight();
}

EdenUI.Markdown.prototype.moveCaret = function() {
	this.updateLineCachedHighlight();
}

EdenUI.Markdown.prototype.checkScroll = function() {

}

EdenUI.Markdown.prototype.enableGotoMode = function() {

}

EdenUI.Markdown.prototype.focusText = function() {
	var end = getCaretCharacterOffsetWithin(this.outdiv);
	var start = getStartCaretCharacterOffsetWithin(this.outdiv);

	this.intextarea.focus();
	this.intextarea.selectionEnd = end;
	this.intextarea.selectionStart = start;
}

EdenUI.Markdown.prototype.focusOutput = function() {
	this.setCaretToFakeCaret();
	this.outdiv.focus();
}

EdenUI.Markdown.prototype.setCaretToFakeCaret = function() {
	var el = $(this.outdiv).find(".fake-caret").get(0);
	if (!el) return;
	var range = document.createRange();
	var sel = window.getSelection();
	if (el.nextSibling) el = el.nextSibling;
	range.setStart(el, 0);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
	// Finally, delete the fake caret
	$(this.outdiv).remove(".fake-caret");
}

EdenUI.Markdown.html = function(str, single, play) {
		var dummy = document.createElement("div");
		var hlighter = new EdenUI.Highlight(dummy, {
			start: "MARKDOWN",
			styles: EdenUI.Markdown.styles,
			clearmodes: {
				"SECTION_TITLE": true,
				"SECTION_TITLE2": true,
				"SECTION_TITLE_H1": true,
				"SECTION_TITLE_H2": true,
				"COMMENT_BOLD": true,
				"COMMENT_CODE": true,
				"COMMENT_ICON":	true,
				"COMMENT_EMPH": true,
				"COMMENT_ITALIC": true,
				"END_COMMENT_TAG": true,
				"COMMENT_TAG": true,
				"COMMENT_LINK": true,
				"COMMENT_LINK_END": true
			}
		});

		EdenUI.Markdown.styles["hidden-comment"] = "eden-comment-hidden";

		hlighter.ast = {stream: new EdenStream(str)};
		hlighter.highlight(hlighter.ast,-1,-1,undefined);

		EdenUI.Markdown.styles["hidden-comment"] = "markdown-comment-hidden";

		if (single) {
			return dummy.childNodes[0].innerHTML;
		} else {
			var res = "";
			for (var i=0; i<dummy.childNodes.length; i++) {
				res += dummy.childNodes[i].innerHTML;
			}

			if (play) return '<div style="display: flex; align-items: center;"><div class="eden-hl-play" data-src="'+str+'">&#xf04b;</div><div>'+res+"</div></div>";
			else return res;
		}
	}


