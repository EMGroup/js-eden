EdenUI.plugins.ScriptGenerator = function (edenUI, success) {
	var me = this;

	this.createDialog = function (name, mtitle) {

		code_entry = $('<div id=\"' + name + '-content\" class=\"script-generator-content\">' + generateAllHTML() + '</div>');

		$dialog = $('<div class=\"script-generator\" id="' + name + '"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 735,
				height: 600,
				minHeight: 120,
				minWidth: 230
			});
	}

	this.update = function () {
		//Update All views with their respective regexs
		var views = document.getElementsByClassName("script-generator");
		for (var j=0; j<views.length; j++) {
			var regex = views[j].children[0].children[0].value;
			if (regex==undefined) {
				continue;
			}
			views[j].children[0].children[2].innerHTML = generateInnerHTML(regex);
		}
	}
	
	var generateAllHTML = function() {
		//generates the regex
		var indiv = '<input onkeyup="edenUI.plugins.ScriptGenerator.update()" type="select" placeholder="Regex to not display"/><button style="float: right;" onclick="edenUI.plugins.ScriptGenerator.update()">Re-generate script</button><div style=\" display:block; \">' + generateInnerHTML() + '</div>';
		return indiv;
	}
	
	
	var generateInnerHTML = function (excludeStr) {
		var lines = me.generateScript(excludeStr);
		var html = "<div style='position: absolute; top: 30px; bottom: 10px; left: 0; right: 10px;'>" +
			"<textarea readonly=true spellcheck=false style='font-family: monospace; background-color: white; color: black; resize: none; width: 100%; height: 100%;'>";
		for (var i = 0; i < lines.length; i++) {
			html = html + Eden.htmlEscape(lines[i], true) + "\n";
		}
		html = html + "</textarea></div>";
		return html;
	}

	function pad(str, minChars) {
		for (var i = str.length; i < minChars; i++) {
			str = str + " ";
		}
		return str;
	}

	/**
	 * @return {Array} An array where each item is a string representing a piece of EDEN code and
	 * of the items together represent a complete script capable of rebuilding the current state.
	 */
	this.generateScript = function (excludeStr) {

		var definitions = [];
		var assignments = [];
		var procedures = [];
		var functions = [];
		var execute = [];
		var implicit = [];
			
		var autocalcOn = "autocalc = 1;"
		var autocalcOff = "autocalc = 0;"
		var commentColumn = 32;

		var picture = root.lookup("picture").eden_definition;
		if (picture === undefined) {
			picture = "picture is [];"
		} else {
			picture = picture + ";";
		}

		var comments = [
			"## This is a JS-EDEN script automatically generated using the environment's script generator feature.",
			"## JS-EDEN is an open source empirical modelling environment based on research, principles and work",
			"## conducted at University of Warwick.",
			"## Web site: https://github.com/EMGroup/js-eden",
			"##   ---- END OF THE ORIGINAL CONSTRUAL.  SUBSEQUENT MODIFICATIONS FOLLOW. ----",
			"## Include Files:",
			"## Turn off automatic calculation until the construal is fully loaded.",
			"## Observable Assignments:",
			"## Observable Definitions:",
			"## Action Definitions:",
			"## Function Definitions:",
			"## Picture Definition:",
			"## Turn on automatic calculation and execute any triggered actions pending.",
			"## Definitions implied by loading the original script (execute procedure):",
			"## Definitions implied by loading the original script (other):",
			"## End of automatically generated script."
		];

		var excludeRE;
		if (excludeStr !== undefined && excludeStr != "") {
			excludeRE = new RegExp(excludeStr);
		}

		for (var name in root.symbols) {

			if (excludeRE !== undefined && excludeRE.test(name)) {
				continue;
			}
		
			var symbol = root.symbols[name];

			if (symbol.last_modified_by == "include") {
				continue;
			}
			if (/^(autocalc|picture|randomIndex|randomGeneratorState)$/.test(name)) {
				continue;
			}
			if (/^(mouse|touch)[A-Z]/.test(name) && Eden.isitSystemObservable(name)) {
				continue;
			}
			if (/_click$/.test(name) && symbol.cached_value === false && symbol.last_modified_by == "HTMLImage") {
				continue;
			}
			if (/_clicked$/.test(name) && symbol.cached_value === false && symbol.last_modified_by == "Button") {
				continue;
			}
			if (/^_[vV]iew_/.test(name)) {
				continue;
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
							implicitDef = "  " + implicitDef.replace(/\n/g, "\n  ");
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
			if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
				
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
				if (typeof(value) == "string" && /[^ -~\t\n]/.test(value)) {
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

		}
		
		//Script Generation
		var lines = [];
			
		lines.push(comments[0]);
		lines.push("");
		lines.push(comments[1]);
		lines.push(comments[2]);
		lines.push(comments[3]);
		lines.push("");		
		if (EdenUI.plugins.ScriptGenerator.baseConstrual != "") {
			lines.push(EdenUI.plugins.ScriptGenerator.baseConstrual);
			lines.push("");
			lines.push(comments[4]);
			lines.push("");
		}
		var includeFiles = eden.getIncludedURLs();
		if (includeFiles.length > 0) {
			lines.push(comments[5]);
			for (var i = 0; i < includeFiles.length; i++) {
				lines.push("include(\"" + includeFiles[i] + "\");");
			}
			lines.push("");
		}
		lines.push(comments[6]);
		lines.push(autocalcOff);
		lines.push("");
		lines.push(comments[7]);
		for (var i = 0; i < assignments.length; i++) {
			lines.push(assignments[i]);
		}
		lines.push("");
		lines.push(comments[8]);
		for (var i = 0; i < definitions.length; i++) {
			lines.push(definitions[i]);
		}
		lines.push("");
		lines.push(comments[9]);
		for (var i = 0; i < procedures.length; i++) {
			lines.push(procedures[i]);
			if (i !== procedures.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		lines.push(comments[10]);
		for (var i = 0; i < functions.length; i++) {
			lines.push(functions[i]);
			if (i !== functions.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		lines.push(comments[11]);
		lines.push(picture);
		lines.push("");
		lines.push(comments[12]);
		lines.push(autocalcOn);
		lines.push("");
		if (execute.length > 0 || implicit.length > 0) {
			lines.push(comments[13]);
			if (execute.length > 0) {
				lines.push("/*");
				for (var i = 0; i < execute.length; i++) {
					lines.push(execute[i]);
				}
				lines.push("*/");
			}
			lines.push("");
			if (implicit.length > 0) {
				lines.push(comments[14]);
				lines.push("/*");
				for (var i = 0; i < implicit.length; i++) {
					lines.push(implicit[i]);
				}
				lines.push("*/");
				lines.push("");
			}
		}
		lines.push(comments[15]);
		return lines;
	}

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

	edenUI.views["ScriptGenerator"] = {dialog: this.createDialog, title: "Script Generator", category: edenUI.viewCategories.history};
	success();
};

/* Plugin meta information */
EdenUI.plugins.ScriptGenerator.title = "Script Generator";
EdenUI.plugins.ScriptGenerator.description = "Generates a definitional script that can be used to recreate the current state of the environment at a later time.";
EdenUI.plugins.ScriptGenerator.originalAuthor = "Joe Butler";

/**Code loaded from a source other than input window, such as from a project file or a database. */
EdenUI.plugins.ScriptGenerator.baseConstrual = "";

/**Executes a string and stores the script for display in the script generator later.
 * @param {String} source A textual description of where the source code came from, e.g. a URL.
 * @param {String} code The code to execute and retain as initial starting source code for the
 * construal.
 */
EdenUI.plugins.ScriptGenerator.loadBaseConstrual = function (source, code) {
	if ("ScriptGenerator" in edenUI.plugins) {
		root.addGlobal(edenUI.plugins.ScriptGenerator.changeListener);
	}
	eden.execute(code, "construal load", "", {name: "include"}, function () {
		if ("ScriptGenerator" in edenUI.plugins) {
			root.removeGlobal(edenUI.plugins.ScriptGenerator.changeListener);
		}
		EdenUI.plugins.ScriptGenerator.baseConstrual = EdenUI.plugins.ScriptGenerator.baseConstrual +
			"##   ---- CONSTRUAL INITIALLY LOADED FROM " + source + " ----\n\n" + code;
	});
}
