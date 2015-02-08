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
		this.views.ErrorWindow = {
			dialog: function () { me.showErrorWindow(); },
			title: "Error Window"
		};

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
			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.updateStatus("Error: "+e.message);
			}

			var formattedError = "<div class=\"error-item\">"+
				"## ERROR number " + options.errorNumber + ":<br>"+
				(options.path ? "## " + options.path + "<br>" : "")+
				e.message+
				"</div>\r\n\r\n";

			this.showErrorWindow().prepend(formattedError)
			this.showErrorWindow().prop('scrollTop', 0);
		});

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		this.windowHighlighter = new WindowHighlighter(this);

		this.errorWindow = null;
	}

	EdenUI.prototype.highlight = function (dialogName) { this.windowHighlighter.highlight(dialogName); };
	EdenUI.prototype.stopHighlight = function (dialogName) { this.windowHighlighter.stopHighlight(dialogName); };

	EdenUI.prototype.showErrorWindow = function () {
		if (!this.errorWindow) {
			this.errorWindow = $(
				'<pre id="error-window" style="font-family:monospace; display: none;"></pre>'
			).appendTo('body');
		}

		return this.errorWindow
			.addClass('ui-state-error')
			.dialog({title: "EDEN Errors", width: 500})
			.dialog('moveToTop');
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
			eval(this.translateToJavaScript(code)).call(agent, this.root, this, prefix, function () {
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
						return deferred.promise;
					});
				} else {
					eden.execute(data, url, newPrefix, agent, deferred.resolve);
					return deferred.promise;
				}
			});
		});
		promise.then(function () {
			success && success.call(agent);
		});
	};

	Eden.prototype.edenCodeForValue = function (value) {
		var type = typeof(value);
		var code = "";
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
		} else if (Array.isArray(value)) {
			code = "[";
			for (var i = 0; i < value.length - 1; i++) {
				code = code + this.edenCodeForValue(value[i]) + ", ";
			}
			if (value.length > 0) {
				code = code + this.edenCodeForValue(value[value.length - 1]);
			}
			code = code + "]";
		} else if (type == "object") {
			if (value instanceof Point) {
				code = "{" + value.x + ", " + value.y + "}";
			} else if (value instanceof Symbol) {	
				code = "&" + value.name.slice(1);
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				typeof(value.keys[0]) == "number" &&
				"parent" in value &&
				value.parent instanceof Symbol
			) {
				code = "&" + value.parent.name.slice(1) + "[" + value.keys[0] + "]";
			} else {
				code = "{";
				for (var key in value) {
					if (!(key in Object.prototype)) {
						code = code + key + ": " + this.edenCodeForValue(value[key]) + ", ";
					}
				}
				if (code != "{") {
					code = code.slice(0, -2);
				}
				code = code + "}";
			}
		} else if (type == "function") {
			code = "$" +"{{ " + value + " }}" + "$";
		} else {
			code = String(value);
		}
		return code;	
	}
	
	/** An identifier used to locate the result of the next call to eval(). */
	Eden.prototype.nextEvalID = 0;
	
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
			var jsVar = parser.yy.observable(obsName) + ".evalIDs";
			var str = jsVar + " = {}; ";
			var hasEval = false;
			for (exp in evalIDs) {
				if (evalIDs.hasOwnProperty(exp)) {
					str = str + jsVar + "[\"" + exp + "\"] = " + evalIDs[exp] + "; ";
					hasEval = true;
				}
			}
			if (hasEval) {
				return str;
			} else {
				return "";
			}
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
		
		/** @type {Array.<string>} */

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
