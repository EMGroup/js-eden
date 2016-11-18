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

		var regenerate = $('<button class="script-generator-menu refresh">&#xf021;</button>');
		controlsRight.append(regenerate);

		var forcedinclude = {};

		script.on("click",".scriptgen-importex",function(e) {
			var agent = e.currentTarget.getAttribute("data-agent");
			if (forcedinclude[agent]) forcedinclude[agent] = false;
			else forcedinclude[agent] = true;
			updateScript();
		});

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
			script.html("");
			var data = me.generateScriptLines(forcedinclude);

			for (var i=0; i<data.imports.length; i++) {
				if (data.imports[i] == "") continue;
				var agent = data.imports[i].split(" ")[1].split("@")[0];
				var isplit = data.imports[i].split(" ");
				var ihtml = '<span class="eden-keyword">'+isplit[0]+'</span> <span class="eden-path">'+isplit[1]+'</span>';
				var importele = $('<div class="eden-line"><span class="scriptgen-importex" data-agent="'+agent+'">'+((forcedinclude[agent])?'&#xf055;':'&#xf056;')+'</span><span>'+((forcedinclude[agent])?'<span class="eden-comment">## '+data.imports[i]+'</span>':ihtml)+'</span></div>');
				script.append(importele);
			}

			script.append($('<div class="eden-line"></div>'));
			var output = $('<div></div>');
			script.append(output);

			/*for (var i=0; i<data.definitions.length; i++) {
				var defele = $('<div class="eden-line"><span>'+data.definitions[i]+'</span></div>');
				script.append(defele);
			}*/
			var joined = data.definitions.join("\n") + "\n## When agents\n\n" + data.agents;
			var ast = new Eden.AST(joined);
			var hl = new EdenUI.Highlight(output.get(0));
			hl.highlight(ast, -1, -1);
		};


		regenerate.click(function () {
			//updateFileChooser();
			updateScript();
		});

		//Initialize
		//updateFileChooser();
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

	var generateScriptHTML = function (forced) {
		
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
		changes: "## The Model",
		end: "## End of automatically generated script.",
	};

	/**
	 * @return {Array} An array where each item is a string representing a piece of EDEN code and
	 * of the items together represent a complete script capable of rebuilding the current state.
	 */
	this.generateScriptLines = function (forced) {
		var result = {};
		//var lines = [comments.header1, comments.header2, comments.header3, "", comments.homePage, "", comments.imports];
		var imports = Eden.Agent.save().split("\n");
		result.imports = imports;
		var changes = eden.root.save(forced).split("\n");
		result.definitions = changes;
		var agents = Eden.Agent.getActiveAgents(forced,false);
		result.agents = agents;
		return result;
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
