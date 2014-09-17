/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

function Eden() {
	this.index = 0;
	this.errornumber = 0;
	this.plugins = {};
	this.views = {};
	this.activeDialogs = {};
}

Eden.prototype.formatError = function (e, options) {
	options = options || {};
	return "<div class=\"error-item\">"+
		"## ERROR number " + this.errornumber + ":<br>"+
		(options.path ? "## " + options.path + "<br>" : "")+
		e.message+
		"</div>\r\n\r\n";
};

Eden.prototype.reportError = function (e, options) {
	if (this.plugins.MenuBar) {
		this.plugins.MenuBar.updateStatus("Error: "+e.message);
	}
	$('#error-window')
		.addClass('ui-state-error')
		.prepend(this.formatError(e, options))
		.dialog({title:"EDEN Errors"});
	++this.errornumber;
};

/**
 * synchronously loads an EDEN file from the server,
 * translates it to JavaScript then evals it when it's done
 */
Eden.prototype.executeFile = function (path) {
	var me = this;

	$.ajax({
		url: path,
		dataType: 'text',
		success: function(data) {
			me.execute(data, path);
		},
		cache: false,
		async: false
	});
};

/**
 * Async loads an EDEN file from the server,
 * translates it to JavaScript then evals it when it's done.
 * This variation performs a server side include of all sub-scripts. It is also
 * possible to use this version across domains to load scripts on other servers.
 */
Eden.prototype.executeFileSSI = function (path) {
	this.loadqueue = [];
	var me = this;

	var ajaxfunc = function (path2) {
		$.ajax({
			url: path2,
			dataType: 'text',
			type: 'GET',
			success: function (data) {
				if (me.plugins.MenuBar) {
					me.plugins.MenuBar.updateStatus("Parsing "+path2+"...");
				}
				me.execute(data, path2);
				if (me.plugins.MenuBar) {
					me.plugins.MenuBar.appendStatus(" [complete]");
				}

				if (me.loadqueue.length > 0) {
					var pathtoload = me.loadqueue.pop();
					if (me.plugins.MenuBar) {
						me.plugins.MenuBar.updateStatus("Loading "+pathtoload);
					}
					ajaxfunc(pathtoload);
				}
			},
			cache: false,
			async: true
		});
	};

	if (me.loadqueue.length == 0) {
		if (me.plugins.MenuBar) {
			me.plugins.MenuBar.updateStatus("Loading - "+path);
		}
		ajaxfunc(path);
	} else {
		me.loadqueue.unshift(path);
	}
};

Eden.prototype.execute = function (code, origin) {
	var result;
	try {
		result = eval(this.translateToJavaScript(code));
	} catch (e) {
		if (origin) {
			this.reportError(e, {path: origin});
		} else {
			this.reportError(e);
		}
		// leaving this alert here because the error window can sometimes be
		// hidden. this can go away if we can raise the eden error window to the
		// top.
		alert(e);
	}
	return result;
};

function _$() {
	var code = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		code = code.replace("$"+i, arguments[i]);
	}
	return eden.execute(code);
}

/**
 * This function sets up a bunch of state/functions used in the generated parser. The
 * `parser.yy` object is exposed as `yy` by jison. (See grammar.jison for usage)
 *
 * @param {string} source EDEN code to translate into JavaScript.
 * @returns {string} JavaScript code as a string.
 */
Eden.prototype.translateToJavaScript = function (source) {
	source = source.replace(/\r\n/g, '\n');

	var includes = 0;
	parser.yy.includeJS = function (expression) {
		includes++;
		return 'rt.includeJS(' + expression + ', function () {'; 
	};

	parser.yy.withIncludes = function (statementList) {
		var closer = "";
		var i;
		for (i = 0; i < includes; ++i) {
			closer += "});";
		}
		includes = 0;
		return statementList + closer;
	};

	/**
	 * Extract a string from original eden source being parsed.
	 *
	 * @param {number} firstLine Index of the line to start extracting.
	 * @param {number} firstColumn Position in the line to start extracting.
	 * @param {number} firstLine Index of the line to end extracting.
	 * @param {number} firstColumn Position in the line to end extracting.
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
	 * @returns {boolean}
	 */
	parser.yy.inDefinition = function () {
		return inDefinition;
	};

	/**
	 * Used by the parser to record dependencies when parsing a definition.
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

	var observables = {};

	/**
	 * Used by the parser to track observables used in a script.
	 * @param {String} name - Name of observable t
	 * @returns {String} Generated code that results in the Symbol for name.
	 */
	parser.yy.observable = function (name) {
		observables[name] = 1;
		return "o_" + name;
	};

	var dobservables = {};
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
	parser.yy.locals = [];
	parser.yy.paras = [];

	/**
	 * Used by the parser instead of Array.prototype.map which isn't
	 * available in some browsers.
	 *
	 * @param {Array.<?>}
	 * @returns {Array.<?>}
	 */
	parser.yy.map = function map(array, f) {
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

Eden.prototype.getDefinition = function (name, symbol) {
	if (symbol.eden_definition) {
		return symbol.eden_definition + ";";
	} else {
		return name + " = " + symbol.cached_value + ";";
	}
};

this.Eden = Eden;
