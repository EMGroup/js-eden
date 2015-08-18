/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

function noop() {}

function listenTo(eventName, target, callback) {
	if (!this.listeners[eventName]) {
		this.listeners[eventName] = [];
	}
	this.listeners[eventName].push({target: target, callback: callback});
}

function emit(eventName, eventArgs) {
	var listenersForEvent = this.listeners[eventName];
	if (!listenersForEvent) {
		return;
	}
	var i;
	for (i = 0; i < listenersForEvent.length; ++i) {
		var target = listenersForEvent[i].target;
		var callback = listenersForEvent[i].callback;
		callback.apply(target, eventArgs);
	}
}

// import node.js modules
function concatAndResolveUrl(url, concat) {
	var url1 = url.split('/');
	var url2 = concat.split('/');
	var url3 = [ ];
	for (var i = 0, l = url1.length; i < l; i ++) {
		if (url1[i] == '..') {
			url3.pop();
		} else if (url1[i] == '.') {
			continue;
		} else {
			url3.push(url1[i]);
		}
	}
	for (var i = 0, l = url2.length; i < l; i ++) {
		if (url2[i] == '..') {
			url3.pop();
		} else if (url2[i] == '.') {
			continue;
		} else {
			url3.push(url2[i]);
		}
	}
	return url3.join('/');
}

(function (global) {
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		Polyglot = require('./polyglot').Polyglot;
		parser = require('./translator').parser;
		rt = require('./runtime').rt;
	}

	/**Create a new category of plug-ins.  Plug-ins in the same category are displayed immediately
	 * above/below each other in the drop down menu. */
	function ViewCategory(label, menuPriority) {
		this.getLabel = function () {
			return label;
		}
		this.getMenuPriority = function () {
			return menuPriority;
		};
	}

	/**
	 * @constructor
	 * @struct
	 * @param {Eden} eden
	 */
	function EdenUI(eden) {
		/**
		 * @type {Eden}
		 * @public
		 */
		this.eden = eden;

		/**
		 * @type {Object.<string,*>}
		 */
		this.views = {};

		this.viewInstances = {};

		/**
		 * @type {Object.<string,*>}
		 */
		this.activeDialogs = {};

		/**
		 * @type {Object.<string,*>}
		 */
		this.plugins = {};

		var me = this;

		//Never called anymore.
		this.eden.listenTo('executeFileLoad', this, function (path) {
			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.updateStatus("Loading "+path);
			}
		});

		this.eden.listenTo('executeBegin', this, function (path) {
			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.updateStatus("Parsing "+path+"...");
			}
		});

		this.eden.listenTo('executeError', this, function (e, options) {
			var errorMessageHTML = Eden.htmlEscape(e.message);

			var formattedError = "<div class=\"error-item\">"+
				"## ERROR number " + options.errorNumber + ":<br>"+
				(options.path ? "## " + options.path + "<br>" : "")+
				errorMessageHTML +
				"</div>\n\n";

			this.showErrorWindow().prepend(formattedError)
			this.showErrorWindow().prop('scrollTop', 0);

			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.updateStatus("Error: " + e.message);
			}
		});

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		this.windowHighlighter = new WindowHighlighter(this);

		this.errorWindow = null;
		
		this.viewCategories = {};
		this.numberOfViewCategories = 0;
		/*Category of plug-ins for construal comprehension. */
		this.addViewCategory("comprehension", "Comprehension");
		/*Category of plug-ins for interacting with the interpreter to create new definitions. */
		this.addViewCategory("interpretation", "Making Definitions");
		/*Category of plug-ins for preserving the current state, revisiting prior states, etc. */
		this.addViewCategory("history", "History &amp; State");
		/*Category of plug-ins for construal visualizations, e.g. Canvas, Plain HTML, etc. */
		this.addViewCategory("visualization", "Visualization");
		/*Category of plug-ins that radically enhance what the environment can do in ways that don't
		 * fit into any of the other categories defined here and don't warrant a whole category of
		 * their own, e.g. State Listener. */
		this.addViewCategory("extension", "Extensions");
		/*Category of plug-ins that pertain to the management of the JS-EDEN environment itself, e.g. Plugin Listing. */
		this.addViewCategory("environment", "Management");		

		this.views.ErrorLog = {
			dialog: function () {
				if (!this.errorWindow) {
					this.errorWindow = $(
						'<pre id="errors-dialog"></pre>'
					);
				}

				this.errorWindow
					.addClass('ui-state-error')
					.dialog({width: 500, height: 250})
					.dialog('moveToTop');
			},
			title: "Error Log",
			name: "errors",
			category: this.viewCategories.interpretation
		};
	}
		
	EdenUI.prototype.addViewCategory = function (name, label) {
		this.viewCategories[name] = new ViewCategory(label, this.numberOfViewCategories);
		this.numberOfViewCategories++;
	};
	
	EdenUI.prototype.highlight = function (dialogName) { this.windowHighlighter.highlight(dialogName); };
	EdenUI.prototype.stopHighlight = function (dialogName) { this.windowHighlighter.stopHighlight(dialogName); };

	EdenUI.prototype.showErrorWindow = function () {
		this.createView("errors", "ErrorLog");
		return $("#errors-dialog");
	};

	/**
	 * @param {string} eventName
	 * @param {*} target
	 * @param {function(...[*])} callback
	 */
	EdenUI.prototype.listenTo = listenTo;

	/**
	 * @param {string} eventName
	 * @param {Array.<*>} eventArgs
	 */
	EdenUI.prototype.emit = emit;

	EdenUI.showTooltip = function (event, text) {
		var tooltip = document.getElementById("tooltip");
		var x = event.clientX + 2;
		var y = event.clientY + 20;
		var maxWidth = window.pageXOffset + window.innerWidth - x - 15;
		if (maxWidth < 200) {
			x = x - (200 - maxWidth);
			maxWidth = 200;
		}
		tooltip.style.left = x + "px";
		tooltip.style.maxWidth = maxWidth + "px";
		tooltip.style.top = y + "px";
		tooltip.innerHTML = text;
		tooltip.style.display = "block";
	}
	
	EdenUI.closeTooltip = function () {
		document.getElementById("tooltip").style.display = "none";
	}

  /**Cached copy of user preferences, etc. (needed for when local storage is disabled). */
  EdenUI.prototype.options = {};

	/**Retrieves a program option from local storage or the main memory cache.
	 * @param {String} optionName  The name of the option to set.
	 * @return {String} The option's value, or null if the requested program option has not been given a value yet.
	 */
	EdenUI.prototype.getOptionValue = function (optionName) {
    if (optionName in this.options) {
      return this.options[optionName];
    } else {
		  try {
			  if (window.localStorage) {
				  return window.localStorage.getItem(optionName);
			  }
		  } catch (e) {
			  //Cookies are blocked.
			  return null;
		  }
		}
	}
	
	/**Stores a program option in memory, and, if possible, local storage too.
	 * @param {String} optionName  The name of the option to set.
	 * @param {*} value The value to assign to the option.
	 * @returns {boolean} True if the option was saved in local storage, or false if it could not be saved.
	 */
	EdenUI.prototype.setOptionValue = function(optionName, value) {
		this.options[optionName] = String(value);
		try {
			if (window.localStorage) {
				window.localStorage.setItem(optionName, value);
				return true;
			}
		} catch (e) {
			//Cookies are blocked.
			return false;
		}
	}

	/**
	 * @constructor
	 * @struct
	 */
	function Eden(root) {
		this.root = root;

		/**
		 * @type {number}
		 * @public (Inspected and reset by the framework for testing EDEN code.)
		 */
		this.errorNumber = 0;

		this.polyglot = new Polyglot();

		var me = this;
		this.polyglot.setDefault('eden');
		this.polyglot.register('eden', {
			execute: function (code, origin, prefix, agent, success) {
				me.executeEden(code, origin, prefix, agent, success);
			}
		});
		this.polyglot.register('js', {
			execute: function (code, origin, prefix, agent, success) {
				var result = eval(code);
				success && success(result);
			}
		});

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		/**
		 * A record of the external files that have been loaded using the include statement.
		 * Plugins (such as the script generator) can request a copy of this information.
		 * @private
		 */
		this.includes = [];
		
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
		if (origin != "error") {
			//Errors that halt execution are always reported and cause error
			//handling to be restored to the default behaviour to avoid confusion.
			this.reportErrors = true;
		}
		if (this.reportErrors) {
			if (origin) {
				this.emit('executeError', [error, {path: origin, errorNumber: this.errorNumber}]);
			} else {
				this.emit('executeError', [error, {errorNumber: this.errorNumber}]);
			}
		}
		++this.errorNumber;
	};
	
	Eden.prototype.executeEden = function (code, origin, prefix, agent, success) {
		var result;
		var me = this;
		this.emit('executeBegin', [origin, code]);
		try {
			var js = this.translateToJavaScript(code);
			eval(js).call(agent, this.root, this, prefix, function () {
				success && success();
				me.emit('executeEnd', [origin]);
			});
		} catch (e) {
			this.error(e);
			success && success();
		}
	};

	/**
	 * @param {string} code
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	Eden.prototype.execute = function (code, origin, prefix, agent, success) {
		if (arguments.length == 1) {
			success = noop;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}
		if (arguments.length == 2) {
			success = origin;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}

		this.polyglot.execute(code, origin, prefix, agent, success);
	};

	/**
	 * @param {string} includePath
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function()} success Called when include has finished successfully.
	 */
	Eden.prototype.include = function (includePath, prefix, agent, success) {
		var me = this;
		var includePaths;
		if (includePath instanceof Array) {
			includePaths = includePath;
		} else {
			includePaths = [includePath];
		}

		if (arguments.length === 2) {
			// path and callback
			success = prefix;
			agent = {name: '/include'};
			prefix = '';
		} else if (arguments.length === 3) {
			success = agent;
			agent = prefix;
			prefix = '';
		}
		/* The include procedure is the agent that modifies the observables, not the agent passing
		 * the include agent a filename.  Interesting philosophically?  Plus a practical necessity,
		 * e.g. for the Script Generator plug-in to work properly.
		 */
		var originalAgent = agent;
		agent = {name: '/include'};		

		var addIncludeURL = function (url) {
			var index = me.includes.indexOf(url);
			if (index != -1) {
				me.includes.splice(index, 1);
			}
			me.includes.push(url);
		}
		
		var promise;
		includePaths.forEach(function (includePath) {
			var url;
			if (includePath.charAt(0) === '.') {
				url = concatAndResolveUrl(prefix, includePath);
			} else {
				url = includePath;
			}
			var match = url.match(/(.*)\/([^\/]*?)$/);
			var newPrefix = match ? match[1] : '';
			var previousPromise = promise;
			promise = $.ajax({
				url: url,
				dataType: "text"
			}).then(function (data) {
				var deferred = $.Deferred();
				if (previousPromise) {
					return previousPromise.then(function () {
						eden.execute(data, url, newPrefix, agent, deferred.resolve);
						if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
							addIncludeURL(url);
						}
						return deferred.promise;
					});
				} else {
					eden.execute(data, url, newPrefix, agent, deferred.resolve);
					if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
						addIncludeURL(url);
					}
					return deferred.promise;
				}
			});
		});
		promise.then(function () {
			success && success.call(agent);
		});
	};

	Eden.prototype.getIncludedURLs = function () {
		return this.includes.slice();
	}

	/**Given any JavaScript value returns a string representing the EDEN code that would be required
	 * to obtain the same value when interpreted.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value.
	 */
	Eden.edenCodeForValue = function (value, refStack) {
		var type = typeof(value);
		var code = "";
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
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
					code = code + Eden.edenCodeForValue(value[i], refStack) + ", ";
				}
				if (value.length > 0) {
					code = code + Eden.edenCodeForValue(value[value.length - 1], refStack);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if ("getEdenCode" in value) {
				code = value.getEdenCode();
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				typeof(value.keys[0]) == "number" &&
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
					code = "{";
					for (var key in value) {
						if (!(key in Object.prototype)) {
							code = code + key + ": " + Eden.edenCodeForValue(value[key], refStack) + ", ";
						}
					}
					if (code != "{") {
						code = code.slice(0, -2);
					}
					code = code + "}";
					refStack.pop();
				}
			}
		} else if (type == "function") {
			code = "$"+"{{\n\t" +
					value.toString().replace(/\n/g, "\n\t") +
				"\n}}"+"$";
		} else {
			code = String(value);
		}
		return code;
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
				typeof(value.keys[0]) == "number" &&
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

	/**Compile-time options that alter the way that EDEN code is translated to JavaScript. Like #pragma in C.
	 *The trackObservableRefsInFunc parsing option controls whether or not z is dependent on y for:
	 * func f  { para x; return x + y; }
	 * z is f(a);
	 */
	Eden.prototype.parsingOptions = {trackObservableRefsInFuncs: false};
	
	/**
	 * This function sets up a bunch of state/functions used in the generated parser. The
	 * `parser.yy` object is exposed as `yy` by jison. (See grammar.jison for usage)
	 *
	 * @param {string} source EDEN code to translate into JavaScript.
	 * @returns {string} JavaScript code as a string.
	 */
	Eden.prototype.translateToJavaScript = function (source) {
		var me = this;

		/** @type {Object.<string,*>} */
		parser.yy;

		source = source.replace(/\r\n/g, '\n');

		parser.yy.commentNesting = 0;
		
		parser.yy.async = function (asyncFuncExpression) {
			var args = Array.prototype.slice.call(arguments, 1);
			return new Code(1, asyncFuncExpression + '(' + args.concat('function () {')); 
		};

		function Code(cps, code) {
			this.cps = cps;
			this.code = code;
		}

		Code.prototype.valueOf = function () {
			throw new Error("Tried to valueOf Code " + this.code);
		};

		parser.yy.sync = function (code) {
			return new Code(0, code);
		};

		parser.yy.code = function (cps, code) {
			return new Code(cps, code);
		};

		parser.yy.withIncludes = function (code, callbackName) {
			var closer = '' + callbackName + '();';
			var i;
			for (i = 0; i < code.cps; ++i) {
				closer += '});';
			}
			return code.code + closer;
		};

		/**
		 * Extract a string from original eden source being parsed.
		 *
		 * @param {number} firstLine Index of the line to start extracting.
		 * @param {number} firstColumn Position in the line to start extracting.
		 * @param {number} lastLine Index of the line to end extracting.
		 * @param {number} lastColumn Position in the line to end extracting.
		 * @returns {string} Extracted source.
		 */
		parser.yy.extractEdenDefinition = function (firstLine, firstColumn, lastLine, lastColumn) {
			var definitionLines = source.split('\n').slice(firstLine - 1, lastLine);
			var definition = "";

			for (var i = 0; i < definitionLines.length; ++i) {
				var line = definitionLines[i];

				var start;
				if (i === 0) {
					start = firstColumn;
				} else {
					start = 0;
				}

				var end;
				if (i === definitionLines.length - 1) {
					end = lastColumn;
				} else {
					end = line.length;
				}

				definition += line.slice(start, end);

				if (i < definitionLines.length - 1) {
					definition += "\n";
				}
			}

			return definition;
		};

		var inDefinition = false;
		var inEval = false;
		var dependencies = {};

		/**
		 * Maps from EDEN code contained inside an eval() invocation to an ID number that is later
		 * used to find the result obtained from evaluating the expression written between the
		 * parentheses.
		 */
		var evalIDs = {};

		/**
		 * Called in the parser when entering a definition.
		 */
		parser.yy.enterDefinition = function () {
			dependencies = {};
			evalIDs = {};
			inDefinition = true;
		};

		/**
		 * Called in the parser when exiting a definition.
		 */
		parser.yy.leaveDefinition = function () {
			inDefinition = false;
		};

		/**
		 * Called in the parser when entering an eval expression.
		 */
		parser.yy.enterEval = function () {
			inEval = true;
		}
		
		/**
		 * Called in the parser when exiting an eval expression.
		 */
		parser.yy.leaveEval = function (eden_exp) {
			inEval = false;
			var id = me.nextEvalID;
			evalIDs[eden_exp] = id;
			me.nextEvalID++;
			return id;
		}
		
		/**
		 * Called in the parser to set a symbol's evalIDs property so that the eden_definition
		 * property can later be updated to replace eval() with the actual values once they are known.
		 */
		parser.yy.printEvalIDs = function (obsName) {
			var obsJS = parser.yy.observable(obsName);
			var str = obsJS + ".clearEvalIDs(); ";
			var evalIDsJS =  obsJS + ".evalIDs";
			for (exp in evalIDs) {
				if (evalIDs.hasOwnProperty(exp)) {
					str = str + evalIDsJS + "[\"" + exp + "\"] = " + evalIDs[exp] + "; ";
				}
			}
			return str;
		}
		
		/**
		 * Used by the parser to test whether currently parsing a definition.
		 *
		 * @returns {boolean}
		 */
		parser.yy.inDefinition = function () {
			return inDefinition;
		};

		/**
		 * Used by the parser to test whether currently parsing an eval expression.
		 *
		 * @returns {boolean}
		 */
		parser.yy.inEval = function () {
			return inEval;
		};

		/**
		 * Used by the parser to record dependencies when parsing a definition.
		 *
		 * @param {string} name
		 */
		parser.yy.addDependency = function (name) {
			dependencies[name] = 1;
		};

		/**
		 * Used by the parser to generate a list of observables to observe for changes.
		 *
		 * @returns {Array.<string>} Array of observable names used in the current definition.
		 */
		parser.yy.getDependencies = function () {
			var dependencyList = [];
			for (var p in dependencies) {
				dependencyList.push(p);
			}
			return dependencyList;
		};

		/** @type {Object.<string,number>} */
		var observables = {};

		/**
		 * Used by the parser to track observables used in a script.
		 *
		 * @param {string} name Name of observable.
		 * @returns {string} Generated code that results in the Symbol for name.
		 */
		parser.yy.observable = function (name) {
			observables[name] = 1;
			return "o_" + name;
		};

		/**
		 * Used by the parser to generate 'var' declarations for the whole script.
		 * These vars store `Symbols` for each observable.
		 *
		 * @returns {string} JavaScript statements defining vars for each observable.
		 */
		parser.yy.printObservableDeclarations = function () {
			var javascriptDeclarations = [];
			for (var observableName in observables) {
				javascriptDeclarations.push(
					"var o_" + observableName + " = context.lookup('" + observableName + "');"
				);
			}

			return javascriptDeclarations.join("\n");
		};

		/**
		 * Used by the parser to store the names of 'auto' and 'para' variables for
		 * a function. These lists are pushed onto each time the parser enters a
		 * function definition.
		 */

		/** @type {Array.<string>} */
		parser.yy.locals = [];

		/** @type {Array.<string>} */
		parser.yy.paras = [];
		
		/** Tracks which observables have been references inside a function body.
		  * E.g. for:
		  * func f  { para x; return x + y; }
		  * z is f(a);
		  * f references y, and z should be recomputed when either a or y changes if the
		  * trackObservableRefsInFunc parsing option is enabled when f is parsed.
		  * @type {Array.<string>}
		  */
		parser.yy.funcBodyDependencies = [];

		parser.yy.addFuncBodyDependency = function (name) {
			if (me.parsingOptions.trackObservableRefsInFuncs) {
				this.funcBodyDependencies[0][name] = 1;
			}
		}

		parser.yy.getFuncBodyDependencies = function () {
			var dependencyList = [];
			for (var p in this.funcBodyDependencies[this.funcBodyDependencies.length - 1]) {
				dependencyList.push(p);
			}
			return dependencyList;
		};

		parser.yy.setParsingOption = function (optionName, value) {
			me.parsingOptions[optionName] = value;
		}
		
		/**
		 * Used by the parser instead of Array.prototype.map which isn't
		 * available in some browsers.
		 *
		 * @param {Array.<?>} array
		 * @param {function(*, number)} f
		 * @returns {Array.<?>}
		 */
		parser.yy.map = function map (array, f) {
			if (array.map) {
				return array.map(function (x, i) { return f(x, i); });
			}

			var results = [];
			for (var i = 0; i < array.length; ++i) {
				results.push(f(array[i], i));
			}
			return results;
		};
		
		return parser.parse(source);
	};

	/**
	 * @param {string} name
	 * @param {Symbol} symbol
	 * @return {string}
	 */
	Eden.prototype.getDefinition = function (name, symbol) {
		if (symbol.eden_definition) {
			return symbol.eden_definition + ";";
		} else {
			return name + " = " + symbol.cached_value + ";";
		}
	};

	// expose API
	global.EdenUI = EdenUI;
	global.Eden = Eden;

	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Eden = Eden;
	}
}(typeof window !== 'undefined' ? window : global));
