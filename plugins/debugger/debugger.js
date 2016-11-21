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

		var controlsLeft = $('<div class="debugger-controls"><button class="debugger-button debug">&#xf188;</button><button class="debugger-button play">&#xf04b;</button><button class="debugger-button stepforward">&#xf051;</button><button class="debugger-button autostep">&#xf050;</button></div>');
		controls.append(controlsLeft);
		var controlsRight = $('<div class="debugger-controls" style="float: right"></div>');
		controls.append(controlsRight);

		var script = $('<div class="debugger-agents"></div>');
		content.append(script);

		/*script.on("click",".scriptgen-importex",function(e) {
			var agent = e.currentTarget.getAttribute("data-agent");
			if (forcedinclude[agent]) forcedinclude[agent] = false;
			else forcedinclude[agent] = true;
			updateScript();
		});*/

		var agentcapture = {};
		var agentid = 1;

		function generateSource(agent) {
			var statement = "";
			if (agent.type == "when" && agent.base && agent.base.origin) {
				statement += "## " + agent.base.origin.name;
				if (agent.line) {
					statement += ":" + agent.line;
				}
				statement += "\n";
			} else if (agent.name) {
				statement += "## " + agent.name;
			}
			statement += agent.getSource();
			return statement;
		}

		//Add events

		var debugStepFn = function (data) {
			//script.html("");
			var agent = data.agent;

			var statement = generateSource(agent);
			var output = agentcapture[agent.id];

			if (output) {
				var ast = new Eden.AST(statement);
				var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
				hl.highlight(ast, -1, -1);

				// Now highlight correct line number...
				var line = data.statement.line - agent.getLine();
				var lineele = output.get(0).childNodes[1].childNodes[line+1];
				if (lineele) {
					//lineele.style.background = "#c67f6c";
					lineele.className = "eden-line debugger-line";
				} else {
					console.error("Missing line: " + line);
				}
			} else {
				console.error("Missing output");
			}
		};
		Eden.AST.debugstep_cb = debugStepFn;

		var debugBeginFn = function(data) {
			var agent = data.agent;

			if (agent.id !== undefined) {
				debugEndFn(data);
				console.log("WHEN ALREADY LOGGED");
			}
			agent.id = agentid;
			agentid++;
			var output = $('<div class="debugger-agent"><div class="debugger-agent-controls"></div><div class="debugger-code"></div><div class="debugger-inspector"></div></div>');
			script.append(output);
			agentcapture[agent.id] = output;

			var statement = generateSource(agent);

			var ast = new Eden.AST(statement);
			var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
			hl.highlight(ast, -1, -1);
		}
		Eden.AST.debug_begin_cb = debugBeginFn;

		var debugEndFn = function(data) {
			var agent = data.agent;
			if (agent.id === undefined) return;
			if (agentcapture[agent.id] === undefined) return;

			console.log("Finish agent");
			agentcapture[agent.id].remove();
			delete agentcapture[agent.id];
			agent.id = undefined;
		}
		Eden.AST.debug_end_cb = debugEndFn;

		Eden.AST.debug = true;


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

		return {destroy: function() {
			Eden.AST.debug = false;
		}};
	};

	edenUI.views["Debugger"] = {dialog: this.createDialog, title: "Debugger", category: edenUI.viewCategories.history};
	success();
};

/* Plugin meta information */
EdenUI.plugins.Debugger.title = "Debugger";
EdenUI.plugins.Debugger.description = "";
EdenUI.plugins.Debugger.originalAuthor = "Nicolas Pope";

