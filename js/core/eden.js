/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function (global) {
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

		/**
		 * @type {Object.<string,*>}
		 */
		this.activeDialogs = {};

		/**
		 * @type {Object.<string,*>}
		 */
		this.plugins = {};

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

		this.eden.listenTo('executeEnd', this, function () {
			if (this.plugins.MenuBar) {
				this.plugins.MenuBar.appendStatus(" [complete]");
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

			$('#error-window')
				.addClass('ui-state-error')
				.prepend(formattedError)
				.dialog({title: "EDEN Errors"});
			// leaving this alert here because the error window can sometimes be
			// hidden. this can go away if we can raise the eden error window to the
			// top.
			alert(e);
		});
	}

	/**
	 * @constructor
	 * @struct
	 */
	function Eden() {
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
	}

	/**
	 * @param {string} eventName
	 * @param {*} target
	 * @param {function(...[*])} callback
	 */
	Eden.prototype.listenTo = function (eventName, target, callback) {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push({target: target, callback: callback})
	};

	/**
	 * @param {string} eventName
	 * @param {Array.<*>} eventArgs
	 */
	Eden.prototype.emit = function (eventName, eventArgs) {
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
	};

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
	
	/**
	 * @param {string} code
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 * @param {function(*)} success
	 */
	Eden.prototype.execute = function (code, origin, success) {
		if (arguments.length == 2) {
			success = origin;
			origin = "unknown";
		}
		var result;
		this.emit('executeBegin', [origin]);
		try {
			eval(this.translateToJavaScript(code))(function () {
				success && success();
			});
		} catch (e) {
			this.error(e);
			success && success();
		}
	};

	Eden.prototype.include = function (url, success) {
		this.emit('executeFileLoad', [url]);

		if (url.match(/.js$/)) {
			$.getScript(url, success);
		} else if (url.match(/.(?:js)?-?e$/)) {
			if (url.match(/^http/)) {
				// cross host
				$.ajax({
					url: rt.config.jseProxyBaseUrl,
					jsonp: "successCallback",
					dataType: "jsonp",
					data: {
						url: url,
					},
					success: function (data) {
						eden.execute(data, success);
					}
				});
			} else {
				// same host, no need to use JSONP proxy
				$.get(url, function (data) {
					eden.execute(data, success);
				});
			}
		}
	};

	/**
	 * This function sets up a bunch of state/functions used in the generated parser. The
	 * `parser.yy` object is exposed as `yy` by jison. (See grammar.jison for usage)
	 *
	 * @param {string} source EDEN code to translate into JavaScript.
	 * @returns {string} JavaScript code as a string.
	 */
	Eden.prototype.translateToJavaScript = function (source) {
		/** @type {Object.<string,*>} */
		parser.yy;

		source = source.replace(/\r\n/g, '\n');

		var asyncs = 0;
		parser.yy.async = function (asyncFuncName, expression) {
			asyncs++;
			return asyncFuncName + '(' + expression + ', function () {'; 
		};

		parser.yy.withIncludes = function (statementList, callbackName) {
			var closer = '' + callbackName + '();';
			var i;
			for (i = 0; i < asyncs; ++i) {
				closer += '});';
			}
			asyncs = 0;
			return statementList + closer;
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
		var dependencies = {};

		/**
		 * Called in the parser when entering a definition.
		 */
		parser.yy.enterDefinition = function () {
			dependencies = {};
			inDefinition = true;
		};

		/**
		 * Called in the parser when exiting a definition.
		 */
		parser.yy.leaveDefinition = function () {
			inDefinition = false;
		};

		/**
		 * Used by the parser to test whether currently parsing a definition.
		 *
		 * @returns {boolean}
		 */
		parser.yy.inDefinition = function () {
			return inDefinition;
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

		/** @type {number} */
		var varNum = 0;

		parser.yy.dobservable = function (name) {
			varNum = varNum + 1;
			return "var d_" + varNum + " = context.lookup(" + name + "); d_" + varNum;
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
}(typeof window !== 'undefined' ? window : global));
