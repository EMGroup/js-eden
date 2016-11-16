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

		var script = $('<div class="script-generator-code" spellcheck="false"></div>');
		content.append(script);

		var fileChooser = $('<select></select>');
		controlsLeft.append(fileChooser);

		var excludeRegEx = $('<input placeholder="excluded symbols"/>');
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
			var excludeRE;
			if (excludeRegEx[0].value != "") {
				excludeRE = edenUI.regExpFromStr(excludeRegEx);
			}
			var result = generateScriptHTML(excludeRE, unicodeElem.checked, includeViewsElem.checked, viewName);	

			var ast = new Eden.AST(result);
			var hl = new EdenUI.Highlight(script.get(0));
			hl.highlight(ast, -1, -1);

			//script.get(0).scrollTop = output.scrollHeight;		
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
			minWidth: 230,
			dialogClass: "scriptgen-dialog"
		});
	};

	var generateScriptHTML = function (excludeRE, unicode, includeViews, viewToExclude) {
		var lines = me.generateScriptLines(excludeRE, unicode, includeViews, viewToExclude);
		var html = "";
		for (var i = 0; i < lines.length; i++) {
			//html = html + Eden.htmlEscape(lines[i], true) + "\n";
			html += lines[i] + "\n";
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
		imports: "## Imported Agents:",
		changes: "## Other changes in following order: funcs, procs, definitions, assignments:",
		end: "## End of automatically generated script.",
	};

	/**
	 * @return {Array} An array where each item is a string representing a piece of EDEN code and
	 * of the items together represent a complete script capable of rebuilding the current state.
	 */
	this.generateScriptLines = function (excludeRE, unicode, includeViews, viewToExclude) {
		var lines = [comments.header1, comments.header2, comments.header3, "", comments.homePage, "", comments.imports];
		var imports = Eden.Agent.save().split("\n");
		lines.push.apply(lines, imports);
		lines.push("");
		lines.push(comments.changes);
		var changes = eden.root.save().split("\n");
		lines.push.apply(lines, changes);
		lines.push("");
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
