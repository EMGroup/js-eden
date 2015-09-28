/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Page Plugin.
 * Plugin for generating web-page content from scripts
 * @class Page Plug-in
 */

EdenUI.plugins.Page = function(edenUI, success) {
	var me = this;
	var thispage = edenUI.eden.root.lookup("page");
	var pagestruct = thispage.value();
	var pagediv = $("<div class='main-page'></div>");
	var theme;
	$("body").append(pagediv).addClass("page-body");

	var canvastodo = [];
	var canvasdestroy = [];
	var canvases = {};

	function generateTitle(title) {
		if (!title) return "";
		if (title[0] != "title") return "";
		return "<div class='page-title "+theme+"'><div class='page-title-block'><span class='page-title-text "+theme+"'>"+title[1]+"</span><br/><span class='page-subtitle-text "+theme+"'>"+title[2]+"</span></div></div>";
	}

	function generateHeader(header) {
		if (!header) return "";
		if (header[0] != "header") return "";
		console.log("HEADER");
		return $("<h1 class='page-header'>"+header[1]+"</h1>");
	}

	function generateParagraph(p) {
		if (!p) return "";
		if (p[0] != "p") return "";

		var text;
		if (p[1] instanceof Array) {
			text = p[1].join("&nbsp;");
		} else {
			text = p[1];
		}

		return $("<p class='page-paragraph'>"+text+"</p>");
	}

	function generateScript(script) {
		if (!script) return;
		if (script[0] != "script") return;

		if (script[1] == false) {

		} else {
			var hl = new EdenHighlight();
			var text;
			if (script[2] instanceof Array) {
				text = EdenUI.plugins.ScriptInput.buildScriptFromList(script[2]);
				console.log("SCRIPT: " + text);
			} else {
				text = script[2];
			}
			var ast = new EdenAST(text);
			var hs = hl.highlight(ast,-1,-1);

			return $("<div class='page-script-static'>"+hs+"</div>");
		}
	}

	function generateCanvas(content) {
		var container = $("<div class='page-canvas'></div>");
		if (canvases[content[1]] === undefined) {
			var embedded = edenUI.views["Canvas2D"].embedded(content[1],content[1],content[2]);
			canvases[content[1]] = embedded;
			container.append(embedded.code_entry);
			canvastodo.push(function() { embedded.resize(content[3],content[4]); });
			//canvasdestroy.push(embedded.destroy);
		} else {
			container.append(canvases[content[1]].code_entry);
		}
		return container;
	}

	function generateContent(content, level) {
		if (!content) return "";
		if (!(content instanceof Array)) return "";

		var res = $("<div class='page-content "+theme+"'></div>");

		console.log("CONTENT");

		for (var i=0; i<content.length; i++) {
			switch(content[i][0]) {
			case "header"	: res.append(generateHeader(content[i])); break;
			case "p"		: res.append(generateParagraph(content[i])); break;
			case "script"	: res.append(generateScript(content[i])); break;
			case "canvas"	: res.append(generateCanvas(content[i])); break;
			}
		}
		return res;
	}

	function generatePage(symbol, value) {
		if (!(value instanceof Array)) return;

		// Now destroy the canvases
		for (var i=0; i<canvasdestroy.length; i++) {
			canvasdestroy[i]();
		}
		canvasdestroy = [];

		console.log("GENERATE PAGE");
		theme = value[2];
		if (theme == "default") theme = "page-theme-default";
		var html = "";
		html += generateTitle(value[1]);
		pagediv.html(html);
		pagediv.append(generateContent(value[3],0));

		// Now resize the canvases
		for (var i=0; i<canvastodo.length; i++) {
			canvastodo[i]();
		}
		canvastodo = [];
	}

	generatePage(thispage, pagestruct);

	thispage.addJSObserver("pageGenerator", generatePage);

	//Note this plugin does not have a view

	//Load the Eden wrapper functions (new syntax).
	edenUI.eden.include2("plugins/page/page.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.Page.title = "Page";
EdenUI.plugins.Page.description = "Generate web content from scripts.";
