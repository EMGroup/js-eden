/*
 * Copyright (c) 2020, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */


(function (global) {

	/**
	 * @constructor
	 * @struct
	 */
	function Eden(root) {
		this.root = (!root) ? new Eden.Folder(null, this) : root;
		this.root.base = this;
		this.dictionary = {};	// Used to store doxy comments for symbols.

		/**
		 * @type {number}
		 * @public (Inspected and reset by the framework for testing EDEN code.)
		 */
		this.errorNumber = 0;

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		/**
		 * Setting this to false temporarily prevents the error method from
		 * producing any output.  This is used by the framework for testing EDEN
		 * code in the scenario when an error is the intended outcome of a test case.
		 *
		 * @see library/assertions.js-e
		 * @type {boolean}
		 * @public
		*/
		this.reportErrors = true;

		this.ready = Eden.Project.init(this);
	}



	global.Eden = Eden;

	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		global.rt = require('./runtime').rt;
		require('./symbol');
		require('./context');
		require('./scope');
		require('./warnings');
		require('../language/lang');
		require('../language/en');
		require('../selectors/selector')
		require('../ast/ast');
		require('../lex');
		require('./engine');
		require('./errors');
		require('../index');
		let Utils = require('../util/misc');
		global.listenTo = Utils.listenTo;
		global.emit = Utils.emit;
		global.unListen = Utils.unListen;
		Eden.Utils = Utils;
		require('../project');
	} else {
		Eden.Utils = Utils;
	}

	Eden.prototype.updateDictionary = function(name, comment, net) {
		this.dictionary[name] = comment;
		// Extract tags...
		/*if (comment) {
			var tags = comment.getHashTags();
			for (var i=0; i<tags.length; i++) {
				if (this.tags[tags[i]] === undefined) this.tags[tags[i]] = [];
				this.tags[tags[i]].push(name);
			}
		}*/
		//if (eden.peer && !net) eden.peer.doxy(name, comment);
	}

	Eden.isValidIdentifier = function (name) {
		return Boolean(name && /^[_a-zA-Z$]\w*$/.test(name));
	};


	/**
	 * Load a project from a project manager path.
	 * @param {String} path Agent path in project manager.
	 * @param {*} tag Version number or name to load.
	 * @param {Function} Callback function when completed.
	 * @param {boolean} Prevent generation of new URL and history entry.
	 * @public
	 */
	Eden.load = function(path, tag, cb, nohistory) {
		console.log("Loading project: " + path + "@" + tag);

		Eden.DB.load(path,tag, undefined, function(status) {
			if (typeof status == "object") EdenUI.MenuBar.saveTitle(status.title);
			eden.root.lookup("_jseden_loaded").assign(true, eden.root.scope);

			if (!nohistory) {
				// Process existing URL
				var master = URLUtil.getParameterByName("master");
				var id = URLUtil.getParameterByName("id");
				var newurl = "?load="+path+"&tag="+tag;
				if (id != "") newurl += "&id="+id;
				if (master != "") newurl += "&master="+master;
				window.history.pushState({project: path, tag: tag},"",newurl);
			}

			if (cb) cb();
		});
	}


	/**
	 * Reset the entire environment, including the UI, symbol table and agents.
	 * This should be used when going back in the browser and loading a new
	 * project.
	 * TODO Currently does not work, plugin JS observers are lost.
	 * @public
	 */
	Eden.reset = function() {
		edenUI.destroyAllViews();
		eden.reset();
		// Reset plugins!
	}


	/**
	 * Reset the symbol table.
	 */
	Eden.prototype.reset = function () {
		this.root.forgetAll("", true, false);
		this.root.collectGarbage();
		this.errorNumber = 0;
		this.reportErrors = true;
	}

	/**
	 * @param {string} eventName
	 * @param {*} target
	 * @param {function(...[*])} callback
	 */
	Eden.prototype.listenTo = listenTo;

	/**
	 * @param {string} eventName
	 * @param {Array.<*>} eventArgs
	 */
	Eden.prototype.emit = emit;

	/**
	 * @param {*} error
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 */
	Eden.prototype.error = function (error, origin) {
		eden.emit("error", [EdenSymbol.jsAgent, new Eden.RuntimeError(this.root, 0, undefined, error)]);
		return;
	};

	Eden.prototype.assign = function(name,value,scope) {
		this.root.lookup(name).assign(value, (scope) ? scope : this.root.scope, EdenSymbol.hciAgent);
	}

	Eden.prototype.get = function(name, scope) {
		return this.root.lookup(name).value(scope);
	}

	Eden.prototype.getAttribute = function(node, name) {
		var sym = (typeof node == "string") ? this.root.lookup(node) : node;
		return Eden.Selectors.processResults([sym],name)[0];
	}

	/**
	 * @param {string} code
	 * @param {String?} agent The name of the agent to use/
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	Eden.prototype.execute2 = function (code, agent, success) {
		var agobj = agent;

		if (agent === undefined || typeof agent == "string") {
			agobj = {name: '*execute'};
			if (agent) agobj.name = agent;
		}

		//if (agobj.getSource === undefined) agobj.getSource = function() { return code; };
		//if (agobj.getLine === undefined) agobj.getLine = function() { return 0; };

		var ast = new Eden.AST(code, undefined, agobj, {noindex: true});
		if (ast.script.errors.length == 0) {
			ast.execute(agobj, this.root.scope, success);
		} else {
			console.error(ast.script.errors[0].prettyPrint());
			success && success(false);
		}
	};
	Eden.prototype.execute = Eden.prototype.execute2;

	Eden.prototype.exec = function(code) {
		return new Promise((resolve, reject) => {
			let agobj = {name: '*execute'};

			var ast = new Eden.AST(code, undefined, agobj, {noindex: true});
			if (ast.script.errors.length == 0) {
				ast.execute(agobj, this.root.scope, () => { resolve(ast.lastresult); });
			} else {
				reject(ast.script.errors[0].messageText());
			}
		});
	}

	/**
	 * Parse and evaluate an eden expression from a string, returning the value.
	 * The symbol and scope parameters are optional, the global scope will be
	 * used.
	 * 
	 * @param {String} expr 
	 * @param {EdenSymbol} symbol 
	 * @param {Scope} scope 
	 * @return value of expression
	 */
	Eden.prototype.evalEden = function(expr, symbol, scope) {
		var e = Eden.AST.parseExpression(expr);
		if (e.errors.length > 0) {
			this.emit("error", [{name: (symbol)?symbol.name : "Inline"},e.errors[0]]);
			return undefined;
		}

		if (!scope) scope = this.root.scope;

		var state = {
			symbol: symbol,
			isconstant: true,
			statement: (symbol)?symbol.origin:null
		}
		var r = Eden.AST.executeExpressionNode(e, scope, state);
		return r;
	}

	Eden.prototype.transpileExpression = function(expr, symbol, scope) {
		var e = Eden.AST.parseExpression(expr);
		if (e.errors.length > 0) {
			this.emit("error", [{name: (symbol)?symbol.name : "Inline"},e.errors[0]]);
			return undefined;
		}

		if (!scope) scope = this.root.scope;

		var state = {
			symbol: symbol,
			isconstant: true,
			statement: (symbol)?symbol.origin:null
		}
		var r = Eden.AST.transpileExpressionNode(e, scope, state);
		return r;
	}

	Eden.prototype.parseExpression = function(expr, symbol) {
		if (typeof expr != "string") {
			err = new Eden.RuntimeError(this.root, Eden.RuntimeError.ARGUMENTS, null, "`parse()` requires a string");
			this.emit("error", [{name: (symbol)?symbol.name : "Inline"},err]);
			return undefined;
		}
		var e = Eden.AST.parseExpression(expr);
		if (e.errors.length > 0) {
			console.error(e.errors[0]);
			this.emit("error", [{name: (symbol)?symbol.name : "Inline"},e.errors[0]]);
			return undefined;
		}
		return e;
	}

	/**Given any JavaScript value returns a string representing the EDEN code that would be required
	 * to obtain the same value when interpreted.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value.
	 */
	Eden.edenCodeForValue = function (value, refStack, precision) {
		var type = typeof(value);
		var code = "";
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			if (value.indexOf("\n") >= 0) {
				code = "<<END\n" + value.replace(/\n/g,"\\n") + "\nEND";
			} else {
				code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
			}
			// NOTE: For the new parser...
			//code = code.replace(/\n/g,"\"\n\"");
		} else if (Array.isArray(value)) {
			if (refStack === undefined) {
				refStack = [];
			}
			if (refStack.indexOf(value) != -1) {
				//Array contains a reference to itself.
				code = code + "<<circular reference>>";
			} else {
				refStack.push(value);
				code = "[";
				for (var i = 0; i < value.length - 1; i++) {
					code = code + Eden.edenCodeForValue(value[i], refStack, precision) + ", ";
				}
				if (value.length > 0) {
					code = code + Eden.edenCodeForValue(value[value.length - 1], refStack, precision);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if ("getEdenCode" in value) {
				code = value.getEdenCode(precision);
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				"parent" in value &&
				value.parent instanceof Symbol
			) {
				code = "&" + value.parent.name.slice(1) + "[" + value.keys[0] + "]";
			} else if (typeof(window) == "object" && typeof(document) == "object" && typeof(Element) == "function") {
				//Web browser runtime environment
				if (value == window) {
					code = "${{ window }}$";
				} else if (value == document) {
					code = "${{ document }}$";
				} else if (value == document.documentElement) {
					code = "${{ document.documentElement }}$";
				} else if (value == document.body) {
					code = "${{ document.body }}$";
				} else if (value instanceof Element && value.id) {
					code = "${{ document.getElementById(\"" + value.id + "\") }}$";
				}
			}
			if (code == "") {
				if (refStack === undefined) {
					refStack = [];
				}
				if (refStack.indexOf(value) != -1) {
					//Object contains a reference to itself.
					code = code + "<<circular reference>>";
				} else {
					refStack.push(value);
					code = "Object(";
					for (var key in value) {
						if (!(key in Object.prototype)) {
							code = code + key + ", " + Eden.edenCodeForValue(value[key], refStack, precision) + ", ";
						}
					}
					if (code != "Object(") {
						code = code.slice(0, -2);
					}
					code = code + ")";
					refStack.pop();
				}
			}
		} else if (type == "function") {
			code = "$"+"{{\n\t" +
					value.toString().replace(/\n/g, "\n\t") +
				"\n}}"+"$";
		} else if (type == "number" && precision) {
			code = value.toFixed(precision);
		} else {
			code = String(value);
		}
		return code;
	}

	Eden.edenCodeForValues = function () {
		var s = "";
		for (var i = 0; i < arguments.length - 1; i++) {
			s = s + Eden.edenCodeForValue(arguments[i]) + ", ";
		}
		s = s + Eden.edenCodeForValue(arguments[arguments.length - 1]);
		return s;
	}

	Eden.edenCodeForValuesP = function (p) {
		var s = "";
		for (var i = 1; i < arguments.length - 1; i++) {
			s = s + Eden.edenCodeForValue(arguments[i], undefined, p) + ", ";
		}
		s = s + Eden.edenCodeForValue(arguments[arguments.length - 1], undefined, p);
		return s;
	}

	Eden.intersection = function(o1, o2) {
		return Object.keys(o1).filter({}.hasOwnProperty.bind(o2));
	}

	/**Given any JavaScript value returns a string that can be displayed to users in an EDEN
	 * friendly way, possibly truncated to reasonable length to fit in with the UI's requirements.
	 * @param {string} prefix A prefix to prepend to the string representation of the value.  Any HTML
	 * 	mark-up characters present in the prefix will be preserved.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {number} maxChars The character limit for the result (optional).  The returned string will not
	 * 	have significantly more characters than this number.
	 * @param {boolean} showJSFuncs Whether or not to include code that defines a JavaScript function.  If false
	 *	then functions will shortened to the word func.
	 * @param {boolean} multiline True if the result is allowed to span multiple lines, or false if it must
	 * 	fit into a single line display (e.g. for the symbol viewer)
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value, with HTML mark-up characters
	 *	escaped.
	 */
	Eden.prettyPrintValue = function (prefix, value, maxChars, showJSFuncs, multiline, refStack) {
		if (multiline === undefined) {
			multiline = true;
		}
		var type = typeof(value);
		var code = "";
		var truncated = false;
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
			if (maxChars !== undefined && code.length > maxChars + 1) {
				code = code.slice(0, maxChars) + "...";
				truncated = true;
			}
		} else if (Array.isArray(value)) {
			if (refStack === undefined) {
				refStack = [];
			}
			if (refStack.indexOf(value) != -1) {
				//Array contains a reference to itself.
				code = code + "...";
			} else {
				refStack.push(value);
				code = "[";
				for (var i = 0; i < value.length - 1; i++) {
					code = Eden.prettyPrintValue(code, value[i], maxChars, showJSFuncs, multiline, refStack) + ",";
					if (maxChars !== undefined && code.length >= maxChars - 1) {
						if (code.slice(-3) != "...") {
							code = code + "...";
						}
						truncated = true;
						break;
					} else {
						code = code + " ";
					}
				}
				if (value.length > 0 && !truncated) {
					code = Eden.prettyPrintValue(code, value[value.length - 1], maxChars, showJSFuncs, multiline, refStack);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if (value instanceof Symbol) {
				code = value.getEdenCode();
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				"parent" in value &&
				value.parent instanceof Symbol
			) {
				code = "&" + value.parent.name.slice(1) + "[" + value.keys[0] + "]";
			} else if (typeof(window) == "object" && typeof(document) == "object" && typeof(Element) == "function") {
				//Web browser runtime environment
				if (value == window) {
					code = "${{ window }}$";
				} else if (value == document) {
					code = "${{ document }}$";
				} else if (value == document.documentElement) {
					code = "${{ document.documentElement }}$";
				} else if (value == document.body) {
					code = "${{ document.body }}$";
				} else if (value instanceof Element && value.id) {
					code = "${{ document.getElementById(\"" + value.id + "\") }}$";
				}
			}
			if (code == "") {
				if (value.toString != Object.prototype.toString) {
					code = value.toString();
					//If you've written a badly behaved toString() method somewhere that fails to
					//actually return a string then the next statement will cause an error.
					if (maxChars !== undefined && code.length > maxChars) {
						code = code.slice(0, maxChars) + "...";
						truncated = true;
					}
				} else {
					if (refStack === undefined) {
						refStack = [];
					}
					if (refStack.indexOf(value) != -1) {
						//Object contains a reference to itself.
						code = code + "...";
					} else {
						refStack.push(value);
						code = "{";
						var maybeTruncate = false;
						for (var key in value) {
							if (!(key in Object.prototype)) {
								if (maybeTruncate) {
									code = code.slice(0, -1) + "...";
									truncated = true;
									break;
								}
								code = code + key + ": ";
								code = Eden.prettyPrintValue(code, value[key], maxChars, showJSFuncs, multiline, refStack);
								if (code.slice(-3) == "...") {
									truncated = true;
									break;
								}
								if (maxChars !== undefined && code.length >= maxChars) {
									maybeTruncate = true;
								}
								code = code + ", ";
							}
						}
						if (code != "{" && !truncated) {
							code = code.slice(0, -2);
						}
						code = code + "}";
						refStack.pop();
					}
				}
			}
		} else if (type == "function") {
			if (showJSFuncs) {
				code = "$"+"{{\n\t" +
						value.toString().replace(/\n/g, "\n\t") +
					"\n}}"+"$";
				if (maxChars !== undefined && code.length > maxChars) {
					code = code.slice(0, maxChars) + "...";
					truncated = true;
				}
			} else {
				code = "func";
			}
		} else {
			code = String(value);
		}
		if (!prefix) {
			var pretty = Eden.htmlEscape(code, !multiline);
			pretty = pretty.replace(/\.\.\./g, "&hellip;");
			if (!multiline) {
				pretty = pretty.replace(/\n/g, "\\n");
			}
			return pretty;
		} else {
			return prefix + code;
		}
	}

	/**
	 * Converts plain text to HTML, by default preserving line breaks (though all other forms of
	 * white space are collapsed).  HTML mark-up characters are escaped.
	 * @param {string} text The string to escape.
	 * @param {boolean} nobr If true then line breaks won't be converted to <br/>.  (E.g. useful for
	 * 	content of <pre> or <textarea> tags.
	 * @param {boolean} removeLineBreaks If true then the result will not contain line breaks (though it may contain <br/> tags).
	 * @return {string} The escaped string.
	 */
	Eden.htmlEscape = function (text, nobr, removeLineBreaks) {
		if (text === undefined) {
			return "";
		}
		text = String(text);
		text = text.replace(/&/g, "&amp;");
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
		text = text.replace(/"/g, "&quot;");
		text = text.replace(/'/g, "&#39;");
		
		if (removeLineBreaks) {
			if (nobr) {
				text = text.replace(/\n/g, " ");
			} else {
				text = text.replace(/\n/g, "<br/>");
			}
		} else if (!nobr) {
			text = text.replace(/\n/g, "<br/>\n");
		}

		return text;
	}
	
	/** An identifier used to locate the result of the next call to eval(). */
	Eden.prototype.nextEvalID = 0;

	Eden.prototype.initialDefinition = function() {
		console.error("INIT DEF DEP");
	}

	// expose API
	//global.EdenUI = EdenUI;
	//global.Eden = Eden;

	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Eden = Eden;
	}
}(typeof window !== 'undefined' ? window : global));
