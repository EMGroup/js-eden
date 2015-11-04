/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.ScriptGenerator = function (edenUI, success) {
	var me = this;

	this.createDialog = function (name, mtitle) {
		var viewName = name.slice(0,-7); //remove -dialog suffix

		//Create elements
		var label;
		var content = $('<div class="script-generator"></div>');
		var controls = $('<div></div>');
		content.append(controls);

		var controlsLeft = $('<div class="script-generator-controls"></div>');
		controls.append(controlsLeft);
		var controlsRight = $('<div class="script-generator-controls" style="float: right"></div>');
		controls.append(controlsRight);

		var script = $('<textarea class="script-generator-code" readonly="readonly" spellcheck="false"></textarea>');
		content.append(script);

		var fileChooser = $('<select></select>');
		controlsLeft.append(fileChooser);

		var excludeRegEx = $('<input placeholder="excluded symbols"/>');
		var excludeRegExElem = excludeRegEx.get(0);
		controlsLeft.append(excludeRegEx);

		var unicode = $('<input type="checkbox" />');
		label = $('<label>Unicode strings</label>');
		label.prepend(unicode);
		controlsRight.append(label);
		var unicodeElem = unicode.get(0);
		unicodeElem.checked = edenUI.getOptionValue("optUnicode") !== "false";

		var includeViews = $('<input type="checkbox" />');
		label = $('<label>Preserve screen layout</label>');
		label.prepend(includeViews);
		controlsRight.append(label);
		var includeViewsElem = includeViews.get(0);

		var regenerate = $('<button>Regenerate Script</button>');
		controlsRight.append(regenerate);

		//Add events
		var updateFileChooser = function () {
			fileChooser.html('<option value="">Working Script</option>');
			var includedURLs = edenUI.eden.getAllIncludedURLs();
			for (var i = 0; i < includedURLs.length; i++) {
				var url = includedURLs[i];
				var matcher = /([^/]+)\.(js)?(-?e)?$/.exec(url);
				var name;
				if (matcher === null) {
					matcher = /([^/]*)\/?$/.exec(url);
				}
				name = matcher[1];
				if (name == "run") {
					matcher = /(^|\/)([^/]*)\/[^/]*$/.exec(url);
					if (matcher !== null) {
						name = matcher[2] + "/run";
					}
				}
				var option = $('<option value="' + url + '">' + name + '</option>');
				fileChooser.append(option);
			}			
		};

		var updateScript = function () {
			script.html(generateScriptHTML(excludeRegExElem.value, unicodeElem.checked, includeViewsElem.checked, viewName));			
		};

		fileChooser.on("change", function (event) {
			var url = event.target.value;
			if (url == "") {
				updateScript();
				return;
			}
			$.ajax({
				url: url,
				dataType: "text",
				success: function (data) {
					script.html(data);
				}
			});
		});

		excludeRegEx.on("keyup", updateScript);
		unicode.on("change", function (event) {
			edenUI.setOptionValue("optUnicode", event.target.checked)
			updateScript(event);
		});
		includeViews.on("change", updateScript);
		regenerate.click(function () {
			updateFileChooser();
			updateScript();
		});

		//Initialize
		updateFileChooser();
		updateScript();

		$('<div id="' + name + '"></div>')
		.html(content)
		.dialog({
			title: mtitle,
			width: 790,
			height: 700,
			minHeight: 120,
			minWidth: 230
		});
	};

	var generateScriptHTML = function (excludeStr, unicode, includeViews, viewToExclude) {
		var lines = me.generateScriptLines(excludeStr, unicode, includeViews, viewToExclude);
		var html = "";
		for (var i = 0; i < lines.length; i++) {
			html = html + Eden.htmlEscape(lines[i], true) + "\n";
		}
		return html;
	};

	function pad(str, minChars) {
		for (var i = str.length; i < minChars; i++) {
			str = str + " ";
		}
		return str;
	};

	var comments = {
		header1: "## This is a JS-EDEN script automatically generated using the environment's script generator feature.",
		header2: "## JS-EDEN is an open source environment for making construuals based on research, principles and",
		header3: "## work conducted at University of Warwick.",
		homePage: "## Web site: https://github.com/EMGroup/js-eden",
		include: "## Include Files:",
		autocalcOff: "## Turn off automatic calculation until the construal is fully loaded.",
		assignments: "## Observable Assignments:",
		definitions: "## Observable Definitions:",
		procedures: "## Action Definitions:",
		functions: "## Function Definitions:",
		picture: "## Picture Definition:",
		views: "## View Configuration:",
		autocalcOn: "## Turn on automatic calculation and execute any triggered actions pending.",
		impliedByExecute: "## Definitions implied by loading the original script (execute procedure):",
		impliedOther: "## Definitions implied by loading the original script (other):",
		end: "## End of automatically generated script.",
	};

	/**
	 * @return {Array} An array where each item is a string representing a piece of EDEN code and
	 * of the items together represent a complete script capable of rebuilding the current state.
	 */
	this.generateScriptLines = function (excludeStr, unicode, includeViews, viewToExclude) {

		var viewObsPrefixToExclude = new RegExp("^_view_" + viewToExclude + "_");
		var defaultViewNames = ["input", "picture", "projects"];
		var definitions = [];
		var assignments = [];
		var procedures = [];
		var functions = [];
		var execute = [];
		var implicit = [];
		var views = [];

		var autocalcOn = "autocalc = 1;"
		var autocalcOff = "autocalc = 0;"
		var commentColumn = 32;
		var hciAgentName = Symbol.hciAgent.name;

		var picture = root.lookup("picture").eden_definition;
		if (picture === undefined) {
			picture = "picture is [];"
		} else {
			picture = picture + ";";
		}

		var excludeRE;
		if (excludeStr !== undefined && excludeStr != "") {
			excludeRE = EdenUI.regExpFromStr(excludeStr);
		}

		if ((excludeRE === undefined || !excludeRE.test("_views_list"))) {
			var viewsToInclude = [];
			if (includeViews) {
				for (var viewName in edenUI.activeDialogs) {
					if (viewName != viewToExclude) {
						viewsToInclude.push(viewName);
					}
				}
			} else {
				for (var viewName in edenUI.activeDialogs) {
					if (edenUI.views[edenUI.activeDialogs[viewName]].holdsContent) {
						viewsToInclude.push(viewName);
					}
				}
			}
			for (var i = 0; i < defaultViewNames.length; i++) {
				var viewName = defaultViewNames[i];
				if (viewsToInclude.indexOf(viewName) === -1) {
					viewsToInclude.push(viewName);
				}
			}
			if (viewsToInclude.length != defaultViewNames.length) {
				views.push('_views_list = ["' + viewsToInclude.join('", "') + '"];');
			}
		}

		for (var name in root.symbols) {
			var exclude = false;

			if (excludeRE !== undefined && excludeRE.test(name)) {
				continue;
			}
		
			var symbol = root.symbols[name];
			var isView = false;

			if (symbol.last_modified_by == "include" || symbol.last_modified_by == "system" || symbol.last_modified_by == "createView") {
				continue;
			}
			if (/^(autocalc|picture|randomIndex|randomGeneratorState|screenWidth|screenHeight)$/.test(name)) {
				continue;
			}
			if (/^(mouse|touch)[A-Z]/.test(name) && symbol.last_modified_by === hciAgentName ) {
				continue;
			}
			if (/_click(ed)?$/.test(name) && symbol.eden_definition === undefined) {
				continue;
			}
			if (/^_(View|views)_/.test(name)) {
			  continue;
			}
			if (/^_view_/.test(name)) {
				if (viewObsPrefixToExclude.test(name)) {
					//Exclude the script generator view
					continue;
				}
				if (!includeViews) {
					if (/_(x|y|width|height|title|zoom)$/.test(name)) {
						//Exclude positioning information (unless defined by dependency)
						continue;
					}
					exclude = true;
					for (var i = 0; i < viewsToInclude.length; i++) {
						var viewName = viewsToInclude[i];
						if ((new RegExp("^_view_" + viewName + "_")).test(name)) {
							exclude = false;
							break;
						}
					}
					if (exclude) {
						continue;
					}
				}
				isView = true;
			}

			/* Deal with symbols that are set implicitly when the construal is loaded from file.
			 * This occurs when an execute statement is used, a triggered procedure is fired
			 * immediately upon the construal being loaded, or if an observable is referenced but
			 * not defined. */
			if (name in this.baseConstrualSymbols) {
				var asInitialized = this.baseConstrualSymbols[name];
				if (symbol.last_modified_by == asInitialized.last_modified_by) {
					var implicitDef = undefined;
					if (asInitialized.eden_definition !== undefined) {
						if (symbol.eden_definition == asInitialized.eden_definition && symbol.definition !== undefined) {
							implicitDef = symbol.eden_definition + ";";
						}
					} else {
						if (symbol.cached_value === asInitialized.cached_value) {
							implicitDef = name + " = " + Eden.edenCodeForValue(symbol.cached_value) + ";";						
						}
					}
					if (implicitDef !== undefined) {
						if (symbol.last_modified_by == "execute") {
							implicitDef = "  " + implicitDef.replace(/\n/g, "\n");
							execute.push(implicitDef);
						} else {
							implicitDef = pad("  " + implicitDef.replace(/\n/g, "\n  "), commentColumn) + "  ## Set by " + symbol.last_modified_by + ".";
							implicit.push(implicitDef);
						}
						continue;
					}
				}
			}
			
			if (symbol.last_modified_by === undefined) {
				implicit.push(pad("  " + name + " = @;", commentColumn) + "  ## Referenced but not defined.");
				continue;
			}

			//Reasoning to push to the appropriate array.
			if (isView) {

				if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
					views.push(symbol.eden_definition + ";");
				} else {
					views.push(name + " = " + Eden.edenCodeForValue(symbol.cached_value) + ";");
				}

			} else if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
				
				if (/^func\s/.test(symbol.eden_definition)) {
					functions.push(symbol.eden_definition);
				} else if (/^proc\s/.test(symbol.eden_definition)) {
					procedures.push(symbol.eden_definition);
				} else {
					definitions.push(symbol.eden_definition + ";");
				}

			} else {

				var value = symbol.cached_value;
				var edenForValue;
				if (!unicode && typeof(value) == "string" && /[^ -~\t\n]/.test(value)) {
					/* Ensure that strings don't contain any special characters that might get mangled
					 * by mistaken character set auto-recognition performed by browsers or code editors.
					 * Stick to ASCII printable only and use XML/HTML entity syntax for the rest. */
					var encoded = value.replace(/[^ -~\t\n]/g, function (str) {
						return '&#' + str.charCodeAt(0) + ';';
					});
					edenForValue = "decodeHTML(" + Eden.edenCodeForValue(encoded) + ")";
				} else {
					edenForValue = Eden.edenCodeForValue(value);
				}
				assignments.push(name + " = " + edenForValue + ";");

			}

		} // end for each symbol
		
		if (root.lookup("randomSeed").value() !== undefined && (excludeRE === undefined || !excludeRE.test("randomIndex"))) {
			assignments.push("randomIndex = " + root.lookup("randomIndex").value() + ";");
		}

		//Script Generation
		var lines = [];
			
		lines.push(comments.header1);
		lines.push("");
		lines.push(comments.header2);
		lines.push(comments.header3);
		lines.push(comments.homePage);
		lines.push("");		
		var includeFiles = eden.getIncludedURLs();
		if (includeFiles.length > 0) {
			lines.push(comments.include);
			for (var i = 0; i < includeFiles.length; i++) {
				lines.push("include(\"" + includeFiles[i] + "\");");
			}
			lines.push("");
		}
		lines.push(comments.autocalcOff);
		lines.push(autocalcOff);
		lines.push("");
		lines.push(comments.functions);
		for (var i = 0; i < functions.length; i++) {
			lines.push(functions[i]);
			if (i !== functions.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		lines.push(comments.assignments);
		for (var i = 0; i < assignments.length; i++) {
			lines.push(assignments[i]);
		}
		lines.push("");
		lines.push(comments.definitions);
		for (var i = 0; i < definitions.length; i++) {
			lines.push(definitions[i]);
		}
		lines.push("");
		lines.push(comments.procedures);
		for (var i = 0; i < procedures.length; i++) {
			lines.push(procedures[i]);
			if (i !== procedures.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		if (excludeRE === undefined || !excludeRE.test("picture")) {
			lines.push(comments.picture);
			lines.push(picture);
			lines.push("");
		}
		if (views.length > 0) {
			lines.push(comments.views);
			for (var i = 0; i < views.length; i++) {
				lines.push(views[i]);
			}
			lines.push("");
		}
		lines.push(comments.autocalcOn);
		lines.push(autocalcOn);
		lines.push("");
		if (execute.length > 0 || implicit.length > 0) {
			lines.push(comments.impliedByExecute);
			if (execute.length > 0) {
				lines.push("/*");
				for (var i = 0; i < execute.length; i++) {
					lines.push(execute[i]);
				}
				lines.push("*/");
			}
			lines.push("");
			if (implicit.length > 0) {
				lines.push(comments.impliedOther);
				lines.push("/*");
				for (var i = 0; i < implicit.length; i++) {
					lines.push(implicit[i]);
				}
				lines.push("*/");
				lines.push("");
			}
		}
		lines.push(comments.end);
		return lines;
	};

	/**Holds information about symbols implicitly defined upon loading a construal via execute
	 * statements, procedures triggered upon loading and things referenced but not defined. */
	this.baseConstrualSymbols = {};

	/**Listens while a construal is being loaded to find the implicitly defined symbols. */
	this.changeListener = function (symbol, create) {
		var last_modified_by = symbol.last_modified_by;
		if (!create && last_modified_by != "include") {
			var name = symbol.name.slice(1);
			if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
				me.baseConstrualSymbols[name] = {eden_definition: symbol.eden_definition, last_modified_by: last_modified_by};
			} else {
				me.baseConstrualSymbols[name] = {cached_value: symbol.cached_value, last_modified_by: last_modified_by};
			}
		}
	};

	edenUI.eden.listenTo("executeError", EdenUI.plugins.ScriptGenerator, function (error, options) {
		root.removeGlobal(me.changeListener);	
	});

	/**Records which file was the one most recently loaded from the project list. */
	this.baseConstrualURL = "";

	edenUI.views["ScriptGenerator"] = {dialog: this.createDialog, title: "Script Generator", category: edenUI.viewCategories.history};
	success();
};

/* Plugin meta information */
EdenUI.plugins.ScriptGenerator.title = "Script Generator";
EdenUI.plugins.ScriptGenerator.description = "Generates a definitional script that can be used to recreate the current state of the environment at a later time.";
EdenUI.plugins.ScriptGenerator.originalAuthor = "Joe Butler";

/**Executes a string and stores the script for display in the script generator later.
 * @param {String} source A textual description of where the source code came from, e.g. a URL.
 * @param {String} code The code to execute and retain as initial starting source code for the
 * construal.
 */
EdenUI.plugins.ScriptGenerator.loadBaseConstrual = function (url) {
	if ("ScriptGenerator" in edenUI.plugins) {
		root.addGlobal(edenUI.plugins.ScriptGenerator.changeListener);
	}
	eden.include(url, "", {name: Symbol.getInputAgentName()}, function () {
		if ("ScriptGenerator" in edenUI.plugins) {
			root.removeGlobal(edenUI.plugins.ScriptGenerator.changeListener);
			edenUI.plugins.ScriptGenerator.baseConstrualURL = url;
		}
	});
}
