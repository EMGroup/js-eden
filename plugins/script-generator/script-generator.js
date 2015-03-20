EdenUI.plugins.ScriptGenerator = function (edenUI, success) {
	var me = this;
	var defaultview = "";

	this.html = function (name, content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"ScriptGenerator");
			}
			$("#" + defaultview + "-content").html(content).onclick;
		} else {
			$("#" + name + "-dialog-content").html(content).onclick;
		}
	}

	this.createDialog = function (name, mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}
		
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

	//Register the HTML view options:
	edenUI.views["ScriptGenerator"] = {dialog: this.createDialog, title: "Script Generator", category: edenUI.viewCategories.history};
	
	ScriptGenerator = {};
	ScriptGenerator.update = function (event) {
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
		var indiv = '<input onkeyup="ScriptGenerator.update()" type="select" placeholder="Regex to not display"/><button style="float: right;" onclick="ScriptGenerator.update()">Re-generate script</button><div style=\" display:block; \">' + generateInnerHTML() + '</div>';
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

	/**
	 * @return {Array} An array where each item is a string representing a piece of EDEN code and
	 * of the items together represent a complete script capable of rebuilding the current state.
	 */
	this.generateScript = function (excludeStr) {

		var definitions = [];
		var assignments = [];
		var procedures = [];
		var functions = [];
			
		var autocalcOn = "autocalc = 1;"
		var autocalcOff = "autocalc = 0;"

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
			"## Firstly, turn off automatic calculation until the construal is fully loaded.",
			"## Include Files:",
			"## Observable Assignments:",
			"## Observable Definitions:",
			"## Action Definitions:",
			"## Function Definitions:",
			"## Picture Definition:",
			"## Turn on automatic calculation and execute any triggered actions pending.",
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
			if (/^_([vV]iew|update)_/.test(name)) {
				continue;
			}

			//Reasoning /push to appropriate array
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
		lines.push(comments[4]);
		lines.push(autocalcOff);
		lines.push("");
		lines.push(comments[5]);
		var includeFiles = eden.getIncludedURLs();
		for (var i = 0; i < includeFiles.length; i++) {
			lines.push("include(\"" + includeFiles[i] + "\");");
		}
		lines.push("");
		lines.push(comments[6]);
		for (var i = 0; i < assignments.length; i++) {
			lines.push(assignments[i]);
		}
		lines.push("");
		lines.push(comments[7]);
		for (var i = 0; i < definitions.length; i++) {
			lines.push(definitions[i]);
		}
		lines.push("");
		lines.push(comments[8]);
		for (var i = 0; i < procedures.length; i++) {
			lines.push(procedures[i]);
			if (i !== procedures.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		lines.push(comments[9]);
		for (var i = 0; i < functions.length; i++) {
			lines.push(functions[i]);
			if (i !== functions.length - 1) {
				lines.push("");
			}
		}
		lines.push("");
		lines.push(comments[10]);
		lines.push(picture);
		lines.push("");
		lines.push(comments[11]);
		lines.push(autocalcOn);
		lines.push("");
		lines.push(comments[12]);
		return lines;
	}
	
	success();
};

/* Plugin meta information */
EdenUI.plugins.ScriptGenerator.title = "Script Generator";
EdenUI.plugins.ScriptGenerator.description = "Generates a definitional script that can be used to recreate the current state of the environment at a later time.";
EdenUI.plugins.ScriptGenerator.originalAuthor = "Joe Butler";
