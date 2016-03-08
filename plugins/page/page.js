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
	var thisnpage = edenUI.eden.root.lookup("document");
	var pagestruct = thispage.value();
	var pagediv = $("<div class='main-page page'></div>");
	var theme;
	$("body").append(pagediv).addClass("page-body");

	var canvastodo = [];
	var canvasdestroy = [];
	var canvases = {};
	var scripts = {};
	var vedens = {};

	var scriptnum = 0;

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
		var tit = $("<div class='page-title "+theme+"'></div>");
		var titblock = $("<div class='page-title-block'></div>");
		var titmain;

		if (title[6]) {
			tit.css("height", ""+title[6]+"px");
		}

		if (title[1]) {
			titmain = $("<span class='page-title-text "+theme+"'>"+title[1]+"</span>");
		} else {
			titmain = $("<img border=0 src=\""+title[5]+"\"></img>");
		}

		var titsub = $("<br/><span class='page-subtitle-text "+theme+"'>"+title[2]+"</span>");

		titblock.append(titmain);
		titblock.append(titsub);
		tit.append(titblock);

		if (title[3] !== undefined) {
			/*var logo = $("<div class='page-title-logo'></div>");
			switch(title[3][0]) {
			case "icon"		: generateIcon(title[3]).appendTo(logo);
			}
			logo.appendTo(tit);*/
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



	var stylemapping = [
		"top",
		"bottom",
		"left",
		"right",
		"width",
		"height",
		"background",
		"position",
		"color",
		"border",
		"font",
		"fontSize",
		"fontFamily",
		"fontWeight",
		"borderBottom",
		"borderLeft",
		"borderRight",
		"borderTop",
		"overflow",
		"padding",
		"paddingTop",
		"paddingLeft",
		"paddingRight",
		"paddingBottom",
		"margin",
		"marginLeft",
		"marginRight",
		"marginTop",
		"marginBottom",
		"textShadow"
	];



	function cssValue(value) {
		var type = typeof value;

		switch(type) {
		case "string"		: return value;
		case "number"		: return ""+value+"px";
		default				: return "";
		}
	}



	function generateStyle(e, s) {
		for (var i=0; i<s.length; i++) {
			if (s[i] !== undefined && stylemapping[i]) {
				//console.log("Styling: " + stylemapping[i] + " = " + cssValue(s[i]));
				e.style[stylemapping[i]] = cssValue(s[i]);
			}
		}
	}


	function parseAttributes(text) {
		var attribs = {};
		if (text === undefined || text == "") return attribs;

		var components = text.split(" ");
		var start = 0;
		if (components[0].charAt(0) == "-") {
			start = 1;
			attribs.tagType = components[0].substr(1);
		}

		for (var i=start; i<components.length; i++) {
			var parts = components[i].split("=");
			if (parts.length > 1) {
				if (parts[1].charAt(0) == "\"") {
					parts[1] = parts[1].slice(1,-1);
				} else {
					parts[1] = parseInt(parts[1]);
				}
				attribs[parts[0]] = parts[1];
			} else {
				attribs[parts[0]] = true;
			}
		}

		return attribs;
	}



	function processHTML(text) {
		var scripts = [];
		var attribs = [];

		// Replace jseden scripts in event attributes
		text = text.replace(/\"jseden:([\s\S]*?)\"/g, function(match, code) {
			return "\"javascript: eden.execute2('"+code+"');\"";
		});

		// Do a find replace for the jseden tag
		text = text.replace(/<jseden([\s\S]*?)>([\s\S]*?)<\/jseden[\S]*>/g,
		function (match, attributes, code, offset, string) {
			//console.log("ATTRIBS: " + attributes);
			scripts.push(code);
			attribs.push(parseAttributes(attributes));
			//console.log(parseAttributes(attributes));
			return "$$$$";
		});

		var splittext = text.split("$$$$");

		if (splittext.length == 1) {
			return text;
		} else {
			var outer = $("<div></div>");
			for (var i=0; i<splittext.length-1; i++) {
				outer.append($("<div class='page-paragraph'>"+splittext[i]+"</div>"));

				// Plain jseden tag, backwards compat with JSPE
				if (attribs[i] === undefined || attribs[i].tagType === undefined) {
					var linecount = scripts[i].split("\n").length;
					//var script = generateScript(["script", false, [scripts[i]], undefined, true, linecount, false, false, "50%"]);
					if (attribs[i].lines === undefined) attribs[i].lines = linecount;
					if (attribs[i].width === undefined) attribs[i].width = "50%";
					if (attribs[i].box === undefined) attribs[i].box = true;
					var script = generateScript(["script", attribs[i]["static"],[scripts[i]],attribs[i].name,attribs[i].box,attribs[i].lines,false,attribs[i].float,attribs[i].width]);
					outer.append(script);
				} else if (attribs[i]) {
					console.log("Some other view: " + attribs[i].tagType);
					if (attribs[i].tagType == "canvas") {
						var can = generateCanvas(["canvas", attribs[i].name,attribs[i].source,attribs[i].width,attribs[i].height,attribs[i].float,attribs[i].box])
						outer.append(can);
					} else if (attribs[i].tagType == "veden") {
						var ve = generateVeden(["veden", attribs[i].name, attribs[i].width, attribs[i].height, attribs[i].float]);
						outer.append(ve);
					}
				}
			}
			outer.append($("<div class='page-paragraph'>"+splittext[splittext.length-1]+"</div>"));
			return outer.get(0);
		}
	}



	function generateElement(p) {
		if (!p) return;
		if (p[0] != "element") return;

		var type = p[1];
		var id = p[2];
		var classname = p[3];
		var content = p[4];
		var style = p[5];
		var clickable = p[6];
		var mouseenter = p[7];
		var mouseleave = p[8];
		var mousedown = p[9];
		var mouseup = p[10];
		var mousemove = p[11];
		var src = p[12];
		var href = p[13];

		console.log("Element: " + type);

		var ele;
		switch (type) {
		case "div":
		case "span":
		case "button":
		case "img":
		case "p":
		case "ul":
		case "ol":
		case "li":
		case "br":
		case "pre":
		case "h1":
		case "h2":
		case "h3":
		case "a":
		case "input":	ele = document.createElement(type); break;
		default: 	console.error("Invalid element type: " + type);
					return;
		}

		if (id) ele.id = id;
		if (classname) ele.className = classname;
		if (content && typeof content == "string") {
			var processed = processHTML(content);
			if (typeof processed == "string") {
				ele.innerHTML = processed;
			} else {
				ele.appendChild(processed);
			}
		}
		if (content && content instanceof Array) generateContentList(ele, content);
		if (style && typeof style == "string") ele.cssText = style;
		if (style && style instanceof Array) generateStyle(ele, style);
		if (clickable && id) ele.onclick = function(e) {
			var sym = eden.root.lookup(id+"_click");
			console.log("ELEMENT CLICK");
			sym.assign(true, eden.root.scope);
			//sym.assign(false, eden.root.scope);
		}
		if (type == "img" && src) ele.src = src;
		if (type == "a" && href) ele.href = href;

		return ele;
	}



	function generateContentList(ele, content) {
		if (typeof content[0] == "string") {
			var child = generateElement(content);
			if (child) {
				ele.appendChild(child);
			}
			return;
		}
		for (var i=0; i<content.length; i++) {
			var child = generateElement(content[i]);
			if (child) {
				ele.appendChild(child);
			}
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

		var scripts = [];

		// Do a find replace for the jseden tag
		text = text.replace(/<jseden([\s\S]*?)>([\s\S]*?)<\/jseden>/g,
		function (match, attributes, code, offset, string) {
			console.log("ATTRIBS: " + attributes);
			scripts.push(code);
			return "$$$$";
		});

		var splittext = text.split("$$$$");

		if (splittext.length == 1) {
			return $("<div class='page-paragraph'>"+text+"</div>");
		} else {
			var outer = $("<div></div");
			for (var i=0; i<splittext.length-1; i++) {
				outer.append($("<div class='page-paragraph'>"+splittext[i]+"</div>"));
				var linecount = scripts[i].split("\n").length;
				var script = generateScript(["script", false, [scripts[i]], undefined, true, linecount, false, false, "50%"]);
				outer.append(script);
			}
			outer.append($("<div class='page-paragraph'>"+splittext[splittext.length-1]+"</div>"));
			return outer;
		}
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

		if (name === undefined) {
			name = "embedded"+scriptnum;
			scriptnum++;
		}

		if (!isStatic) {
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
				container = $("<div id='"+name+"-dialog' class='page-script-live page-script-live-box'></div>");
			} else {
				container = $("<div class='page-script-live'></div>");
			}
			var height = EdenUI.plugins.ScriptInput.getRequiredHeight(lines, true);
			container.height(height);

			if (float && float != "none") {
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
			container.resizable();
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

			if (float && float != "none") {
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

	function generateVeden(script) {
		if (!script) return;
		if (script[0] != "veden") return;

		var name = script[1];
		var width = script[2];
		var height = script[3];
		var float = script[4];

		var embedded;
		if (vedens[name]) {
			embedded = vedens[name];
			// Make sure code is up-to-date
			//embedded.update(code);
		} else {
			embedded = edenUI.views.Veden.embed(name, name);
			vedens[name] = embedded;
		}
		var container;
		//if (box) {
			container = $("<div id='"+name+"-dialog' class='page-script-live page-script-live-box'></div>");
		//} else {
		//	container = $("<div class='page-script-live'></div>");
		//}
		//var height = EdenUI.plugins.ScriptInput.getRequiredHeight(lines, true);
		container.height(height);

		if (float && float != "none") {
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
		container.resizable();
		return container;
	
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

		console.log("CREATE CANVAS: " + content[1] + " width=" + content[3] + ", height=" + content[4]);

		if (width) container.css("width", cssValue(width));
		if (height) container.css("height", cssValue(height));

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



	function generateDOM(symbol, value) {
		if (value === undefined) return;
		if (!(value instanceof Array)) return;

		for (var ci in canvases) {
			canvases[ci].code_entry.detach();
		}

		// Detach all scripts
		for (var si in scripts) {
			scripts[si].contents.detach();
		}

		pagediv.html("");
		generateContentList(pagediv.get(0), value);

		// Now resize the canvases
		for (var i=0; i<canvastodo.length; i++) {
			canvastodo[i]();
		}
		canvastodo = [];
	}



	function generatePage(symbol, value) {
		if (value === undefined) return;
		if (!(value instanceof Array)) return;

		scriptnum = 0;

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
	thisnpage.addJSObserver("pageGenerator", generateDOM);

	//Note this plugin does not have a view

	//Load the Eden wrapper functions (new syntax).
	//edenUI.eden.include2("plugins/page/page.js-e", success);
	Eden.Agent.importAgent("plugins/page", "default", ["enabled"], function() {
		eden.root.lookup("plugins_page_loaded").assign(true, eden.root.scope);
		if (success) success();
	});
};

/* Plugin meta information */
EdenUI.plugins.Page.title = "Page";
EdenUI.plugins.Page.description = "Generate web content from scripts.";
