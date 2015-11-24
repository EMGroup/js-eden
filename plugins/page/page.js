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
	var scripts = {};

	function generateIcon(icon) {
		if (!icon) return "";
		if (icon[0] != "icon") return "";
		var res = $("<div class='page-icon'>"+icon[1]+"</div>");
		res.css("font-size", icon[2]+"px");
		res.css("color", icon[3]);
		return res;
	}

	function generateTitle(title) {
		if (!title) return "";
		if (title[0] != "title") return "";
		var tit = $("<div class='page-title "+theme+"'><div class='page-title-block'><span class='page-title-text "+theme+"'>"+title[1]+"</span><br/><span class='page-subtitle-text "+theme+"'>"+title[2]+"</span></div></div>");
		if (title[3] !== undefined) {
			var logo = $("<div class='page-title-logo'></div>");
			switch(title[3][0]) {
			case "icon"		: generateIcon(title[3]).appendTo(logo);
			}
			logo.appendTo(tit);
		}
		return tit;
	}

	function generateHeader(header) {
		if (!header) return "";
		if (header[0] != "header") return "";

		switch(header[3]) {
		case 0	: return $("<div class='clear'/><h1 class='page-header'>"+header[1]+"</h1>");
		case 1	: return $("<h2 class='page-header'>"+header[1]+"</h2>");
		}
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

		return $("<div class='page-paragraph'>"+text+"</div>");
	}

	function generateScript(script) {
		if (!script) return;
		if (script[0] != "script") return;

		var isStatic = script[1];
		var code = script[2];
		var name = script[3];
		var box = script[4];
		var lines = script[5];
		var power = script[6];
		var float = script[7];
		var width = script[8];

		if (isStatic == false) {
			var embedded;
			if (scripts[name]) {
				embedded = scripts[name];
				// Make sure code is up-to-date
				embedded.update(code);
			} else {
				embedded = edenUI.views.ScriptInput.embed(name, name, code, power);
				scripts[name] = embedded;
			}
			var container;
			if (box) {
				container = $("<div class='page-script-live page-script-live-box'></div>");
			} else {
				container = $("<div class='page-script-live'></div>");
			}
			var height = EdenUI.plugins.ScriptInput.getRequiredHeight(lines, true);
			container.height(height);

			if (float != "none") {
				container.css("float",float);
			}
			if (width != "50%") {
				if (typeof width == "number") {
					container.width(width);
				} else {
					container.css("width", width);
				}
			}

			embedded.contents.appendTo(container);
			return container;
		} else {
			var res;
			if (box) {
				res = $("<div class='page-script-static page-script-live-box'></div>");
			} else {
				res = $("<div class='page-script-static'></div>");
			}

			var hl = new EdenUI.Highlight(res.get(0));
			var text;
			if (code instanceof Array) {
				text = EdenUI.plugins.ScriptInput.buildScriptFromList(code);
			} else {
				text = code;
			}
			var ast = new Eden.AST(text);
			hl.highlight(ast,-1,-1);

			if (float != "none") {
				res.css("float",float);
			}
			if (width != "50%") {
				if (typeof width == "number") {
					res.width(width);
				} else {
					res.css("width", width);
				}
			}
			var height = EdenUI.plugins.ScriptInput.getRequiredHeight(lines, true);
			res.height(height);

			return res;
		}
	}

	function generateCanvas(content) {
		var box = content[6];
		var width = content[3];
		var height = content[4];

		var container; // = $("<div class='page-canvas'></div>");

		if (box) {
			container = $("<div class='page-canvas page-script-live-box'></div>");
		} else {
			container = $("<div class='page-canvas'></div>");
		}

		if (canvases[content[1]] === undefined) {
			var embedded = edenUI.views["Canvas2D"].embedded(content[1],content[1],content[2]);
			canvases[content[1]] = embedded;
			container.append(embedded.code_entry);
			canvastodo.push(function() { embedded.resize(content[3],content[4]); });
			//canvasdestroy.push(embedded.destroy);
		} else {
			canvases[content[1]].code_entry.appendTo(container);
			canvastodo.push(function() { canvases[content[1]].resize(content[3],content[4]); });
		}

		if (content[5] != "none") {
			container.css("float",content[5]);
		}

		return container;
	}

	function generateList(content) {
		var list;
		if (content[1]) {
			list = $("<ul></ul>");
		} else {
			list = $("<ol></ol>");
		}

		if (content[2] && content[2] instanceof Array) {
			for (var i=0; i<content[2].length; i++) {
				var item = $("<li>"+content[2][i]+"</li>");
				list.append(item);
			}
		}

		return list;
	}

	function generateContent(content, level) {
		if (!content) return "";
		if (!(content instanceof Array)) return "";

		var res = $("<div class='page-content "+theme+"'></div>");

		for (var i=0; i<content.length; i++) {
			if (content[i] === undefined) continue;
			switch(content[i][0]) {
			case "header"	: res.append(generateHeader(content[i])); break;
			case "p"		: res.append(generateParagraph(content[i])); break;
			case "script"	: res.append(generateScript(content[i])); break;
			case "canvas"	: res.append(generateCanvas(content[i])); break;
			case "break"	: res.append($("<div class='clear'></div>")); break;
			case "list"		: res.append(generateList(content[i])); break;
			}
		}
		return res;
	}

	function generatePage(symbol, value) {
		if (!(value instanceof Array)) return;

		// Now destroy the canvases
		/*for (var i=0; i<canvasdestroy.length; i++) {
			canvasdestroy[i]();
		}
		canvasdestroy = [];*/
		for (var ci in canvases) {
			canvases[ci].code_entry.detach();
		}

		// Detach all scripts
		for (var si in scripts) {
			scripts[si].contents.detach();
		}

		theme = value[2];
		if (theme == "default") theme = "page-theme-default";

		pagediv.html("");
		pagediv.append(generateTitle(value[1]));
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
	//edenUI.eden.include2("plugins/page/page.js-e", success);
	Eden.Agent.importAgent("plugins/page", ["enabled"], success);
};

/* Plugin meta information */
EdenUI.plugins.Page.title = "Page";
EdenUI.plugins.Page.description = "Generate web content from scripts.";
