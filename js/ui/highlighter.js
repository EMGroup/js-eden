/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function (global) {
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
		this.prevprevtoken = undefined;
		this.modestack = [];
		this.linestack = undefined;
		this.outerline = undefined;
		this.lineelement = undefined;
		this.startmode = (options && options.start) ? options.start : "START";
		this.styles = (options && options.styles) ? options.styles : EdenUI.Highlight.defaultStyles;
		this.clearmodes = (options && options.clearmodes) ? options.clearmodes : EdenUI.Highlight.lineclearmode;
		this.mode = this.startmode;
		this.incomment = false;
		this.brline = (options && options.brline);

		this.custom = {};
		this.current_custom = null;

		this.cs3 = eden.root.lookup("jseden_parser_cs3").value();

		this.styleExtensions = {};

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
		"parameter": "eden-parameter",
		"keyword": "eden-keyword",
		"builtin": "eden-builtin",
		"javascript": "eden-javascript",
		"selector": "eden-selector",
		"selector2": "eden-selector2",
		"selector3": "eden-selector3",
		"selector4": "eden-selector4",
		"error": "eden-selectorerror",
		"function": "eden-function",
		"type": "eden-type",
		"special": "eden-special",
		"backticks": "eden-backticks",
		"subexpr": "eden-subexpression",
		"doxycomment": "eden-doxycomment",
		"pathblock": "eden-pathblock",
		"comment-h1": "eden-comment-h1",
		"comment-h2": "eden-comment-h2",
		"comment-h3": "eden-comment-h3",
		"comment-h4": "eden-comment-h4",
		"horizontal-line": "eden-section-line",
		"comment-line": "eden-comment-line",
		"comment-emph": "eden-comment-emph",
		"comment-bold": "eden-comment-bold",
		"script-line": "eden-line-script",
		"doxytag": "eden-doxytag",
		"comment-query": "eden-comment-query",
		"block-comment": "eden-blockcomment",
		"comment-ul": "eden-comment-ul",
		"comment-blockquote": "eden-comment-blockquote",
		"script": "eden-script",
		"notexist": "eden-notexist",
		"htmltag": "html-tagname",
		"htmlattribute": "html-attributename"
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
		"COMMENT_HTML_CONTENT": true,
		"COMMENT_ATTRS": true
	}

	EdenUI.Highlight.prototype.applyClasses = function(node, classes) {
		var iclass = (classes) ? classes : this.classes;
		var className = "";
		for (var i=0; i<iclass.length; i++) {
			className += this.styles[iclass[i]] + " ";
			if (this.styleExtensions[iclass[i]]) {
				var sext = this.styleExtensions[iclass[i]];
				for (var x in sext) {
					this.applyAttribute(node, x, sext[x]);
					//node.style[x] = sext[x];
				}
			}
		}
		node.className = className.trim();
	}

	EdenUI.Highlight.prototype.generateClasses = function() {
		var className = "";
		for (var i=0; i<this.classes.length; i++) {
			className += this.styles[this.classes[i]] + " ";
		}
		return className.trim();
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
		var prevprevtoken = "INVALID";
		//var commentmode = 0;

		//Reset line class
		this.outerline = "eden-line";

		this.linestack = [];

		// Set the mode for this line based upon mode at end of previous line
		if (this.mode_at_line[this.line-1]) this.mode = this.mode_at_line[this.line-1];
		else this.mode = this.startmode;

		// Reset line comments
		if (this.clearmodes[this.mode]) {
			this.incomment = false;
			this.mode = this.startmode;
		}

		// Get error position information
		if (ast.script && ast.script.errors.length > 0) {
			errstart = ast.script.errors[0].prevposition;
			errend = ast.script.errors[0].position;
			errmsg = ast.script.errors[0].messageText();
		}

		var wsline = "";

		var line = document.createElement('div');
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
					p = p.parentNode;
				}
				if (p && p.className.startsWith(this.styles["comment-line"])) {
					p.className += " current";
				}

				//if (this.metrics[this.line-1] == undefined) this.metrics[this.line-1] = {};
				//this.metrics[this.line-1].current = true;
			}

			// Skip but preserve white space
			var ch= stream.peek();
			if (ch == 10 || ch == 13) {
				//if (this.incomment && stream.peek2() == 35) wsline += " ";

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

				/*if (this.incomment && stream.peek2() == 35) {
					var hiddenhash = document.createElement("span");
					hiddenhash.className = this.styles["hidden-comment"];
					line.appendChild(hiddenhash);
					stream.position += 2;
				} else {*/
					break;
				//}
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

			prevprevtoken = prevtoken;
			prevtoken = token;
			token = stream.readToken(this.incomment);

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
			this.prevprevtoken = prevprevtoken;
			this.type = stream.tokenType(token);
			this.classes = [];
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
				this.classes.push("error");
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
				//parentspan.className = this.classes;
				this.applyClasses(parentspan);
				//if (this.classes.indexOf("observable")) {
				//	parentspan.setAttribute("data-observable", this.tokentext);
				//}

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
					p = p.parentNode;
				}
				if (p && p.className.startsWith(this.styles["comment-line"])) {
					p.className += " current";
				}

				//if (this.metrics[this.line] == undefined) this.metrics[this.line] = {};
				//this.metrics[this.line].current = true;
			} else {
				if (line.lastChild && line.lastChild.className == this.generateClasses()) {
					var tokenspan = line.lastChild;
					if (tokenspan.lastChild && tokenspan.lastChild.nodeName == "#text") {
						tokenspan.lastChild.textContent += this.tokentext;
					} else {
						tokenspan.appendChild(document.createTextNode(this.tokentext));
					}
				} else {
					var tokenspan = document.createElement('span');
					//tokenspan.className = this.classes;
					this.applyClasses(tokenspan);
					//if (this.classes == "eden-observable") {
					//	tokenspan.setAttribute("data-observable", this.tokentext);
					//}
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


	EdenUI.Highlight.prototype.updateAST = function(ast) {
		this.ast = ast;
		this.errstart = -1;
		this.errend = -1;
		this.errmsg = "";
		this.inerror = false;
		this.stream = ast.stream;
		this.stream.reset();
		this.title = "";

		if (ast.script && ast.script.errors.length > 0) {
			this.errstart = ast.script.errors[0].prevposition;
			this.errend = ast.script.errors[0].position;
			this.errmsg = ast.script.errors[0].messageText();
		}
	}

	EdenUI.Highlight.prototype.highlightAll = function(position, options) {
		var line = undefined;
		var lineerror = false;
		var linestart = 0;
		var token = "INVALID";
		var prevtoken = "INVALID";
		var stream = this.stream;

		this.cs3 = eden.root.lookup("jseden_parser_cs3").value();

		//var curtop = (options && options.spacing && options.spacing[0]) ? options.spacing[0] : 20;

		this.metrics = {};
		this.styleExtensions = {};
		detach(this, this.outelement, false, function() {

		// Clear!
		//this.outelement.innerHTML = "";
		while (this.outelement.lastChild) this.outelement.removeChild(this.outelement.lastChild);
		this.mode_at_line = {};

		while (stream.valid()) {
			var ch= stream.peek();
			var lineclass = "";
			if (ch == 10 || ch == 13) {
				lineerror = (linestart <= this.errstart) && (stream.position >= this.errend);

				var lineelement = document.createElement('div');
				lineelement.className = this.outerline; //"eden-line";
				if (options && options.spacing && options.spacing[this.line]) lineelement.height = "" + options.spacing[this.line] + "px";
				//lineelement.style.height = "" + ((options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20) + "px";
				lineelement.setAttribute("data-line",this.line-1);
				//lineelement.className = generateLineClass(this, stream, linestart,lineerror,position);
				//curtop += (options && options.spacing && options.spacing[this.line]) ? options.spacing[this.line] : 20;
				this.line++;
				if (line === undefined && this.brline) {
					line = document.createElement("br");
				}
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

			if (this.disablehl || (this.scrolltop >= 0 && (this.line < this.scrolltop-105 || this.line > this.scrolltop+105))) {
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

				if (!this.disablehl && ltext.trim().charAt(0) == "#") this.outerline = "eden-line eden-wrapline";
			} else {
				//this.outerline = lineelement;
				line = this.highlightLine(this.ast, position);
			}
		}

		lineerror = (linestart <= this.errstart) && (stream.position >= this.errend);

		if (line === undefined && this.brline) line = document.createElement("br");
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
	}


	EdenUI.Highlight.prototype.highlightOpt = function(hline, position, options) {
		var line = undefined;
		var lineerror = false;
		var linestart = 0;
		var token = "INVALID";
		var prevtoken = "INVALID";
		var stream = this.stream;

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
				if (this.disablehl) {
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

				
					// Insert caret in middle of token if needed
					if (linestart < position && stream.position > position) {
						var caret = position - linestart;
						var textleft = ltext.slice(0,caret);
						var textright = ltext.slice(caret);
						var parentspan = document.createElement("span");

						var leftnode = document.createTextNode(textleft);
						parentspan.appendChild(leftnode);

						// Caret!
						var caret = document.createElement('span');
						caret.className = "fake-caret";
						parentspan.appendChild(caret);

						var rightnode = document.createTextNode(textright);
						parentspan.appendChild(rightnode);

						line = parentspan;
					} else {
						line = document.createTextNode(ltext);
					}
				} else {
					line = this.highlightLine(this.ast, position);
				}
				lineerror = (linestart <= this.errstart) && (stream.position >= this.errend);
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

		if (this.disablehl) return;

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
				line = this.highlightLine(this.ast, position);
				lineerror = (linestart <= this.errstart) && (stream.position >= this.errend);
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
	}


	/**
	 * Generate a syntax highlighted version of the stream. Call this with
	 * an abstract syntax tree of the code, the line to highlight (or -1 for
	 * all) and the current cursor position.
	 */
	EdenUI.Highlight.prototype.highlight = function(ast, hline, position, options) {
		this.ast = ast;
		this.updateAST(ast);
		this.line = 1;
		if (this.outelement === undefined) return;

		if (ast.stream.code.length == 0) {
			if (this.outelement) {
				this.outelement.innerHTML = "<div class='eden-line'><span class='fake-caret'></span></div>";
			}
			return;
		}

		this.disablehl = (options && options.disabled) ? true : false;

		if (hline == -1) return this.highlightAll(position, options);
		else return this.highlightOpt(hline, position, options); 
	};

	EdenUI.Highlight.html = function(str, single, play) {
		var dummy = document.createElement("div");
		var hlighter = new EdenUI.Highlight(dummy);
		hlighter.ast = {stream: new Eden.EdenStream(str)};
		hlighter.highlight(hlighter.ast,-1,-1,undefined);
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

	EdenUI.Highlight.htmlElement = function(str, ele) {
		var hlighter = new EdenUI.Highlight(ele);
		hlighter.ast = {stream: new Eden.EdenStream(str)};
		hlighter.highlight(hlighter.ast,-1,-1,undefined);
	}
}(typeof window !== 'undefined' ? window : global));
