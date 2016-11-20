/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.Debugger = function (edenUI, success) {
	var me = this;

	this.createDialog = function (name, mtitle) {
		var viewName = name.slice(0,-7); //remove -dialog suffix

		//Create elements
		var label;
		var content = $('<div class="debugger"></div>');
		var controls = $('<div></div>');
		content.append(controls);

		var controlsLeft = $('<div class="debugger-controls"></div>');
		controls.append(controlsLeft);
		var controlsRight = $('<div class="debugger-controls" style="float: right"></div>');
		controls.append(controlsRight);

		var script = $('<div class="debugger-code readonly" spellcheck="false"></div>');
		content.append(script);

		/*script.on("click",".scriptgen-importex",function(e) {
			var agent = e.currentTarget.getAttribute("data-agent");
			if (forcedinclude[agent]) forcedinclude[agent] = false;
			else forcedinclude[agent] = true;
			updateScript();
		});*/

		var agentcapture = {};
		var agentid = 1;

		//Add events

		var debugStepFn = function (data) {
			//script.html("");
			var statement = data.base.getSource(data.agent);
			var output = agentcapture[data.agent.id];

			if (output) {
				var ast = new Eden.AST(statement);
				var hl = new EdenUI.Highlight(output.get(0));
				hl.highlight(ast, -1, -1);

				// Now highlight correct line number...
				var line = data.statement.line - data.agent.line;
				var lineele = output.get(0).childNodes[line];
				if (lineele) {
					lineele.style.background = "#c67f6c";
				} else {
					console.error("Missing line: " + line);
				}
			}
		};
		Eden.AST.debugstep_cb = debugStepFn;

		var debugBeginWhenFn = function(data) {
			if (data.when.id !== undefined) {
				debugEndWhenFn(data);
				console.log("WHEN ALREADY LOGGED");
			}
			data.when.id = agentid;
			agentid++;
			var output = $('<div></div>');
			script.append(output);
			agentcapture[data.when.id] = output;

			var statement = data.base.getSource(data.when);
			var ast = new Eden.AST(statement);
			var hl = new EdenUI.Highlight(output.get(0));
			hl.highlight(ast, -1, -1);
		}
		Eden.AST.debug_beginwhen_cb = debugBeginWhenFn;

		var debugEndWhenFn = function(data) {
			console.log("Finish agent");
			agentcapture[data.when.id].remove();
			delete agentcapture[data.when.id];
			data.when.id = undefined;
		}
		Eden.AST.debug_endwhen_cb = debugEndWhenFn;


		//regenerate.click(function () {
			//updateFileChooser();
		//	updateScript();
		//});

		//Initialize
		//updateFileChooser();
		//updateScript();

		$('<div id="' + name + '"></div>')
		.html(content)
		.dialog({
			title: mtitle,
			width: 790,
			height: 700,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "debugger-dialog"
		});
	};

	edenUI.views["Debugger"] = {dialog: this.createDialog, title: "Debugger", category: edenUI.viewCategories.history};
	success();
};

/* Plugin meta information */
EdenUI.plugins.Debugger.title = "Debugger";
EdenUI.plugins.Debugger.description = "";
EdenUI.plugins.Debugger.originalAuthor = "Nicolas Pope";

