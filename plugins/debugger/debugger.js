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

		var debug_play = false;
		var active_agent = undefined;
		var docapture = false;
		var debug_speed = 500;

		//Create elements
		var label;
		var content = $('<div class="debugger"></div>');
		//var controls = $('<div></div>');

		var controls = $('<div class="debugger-controls"><button title="Toggle capture all agents" style="margin-left: 20px; margin-right: 20px;" class="debugger-button debug">&#xf188;</button><button class="debugger-button play" title="Auto Play">&#xf04b;</button><button class="debugger-button stepforward">&#xf051;</button><button class="debugger-button autostep">&#xf050;</button><input type="range" class="debugger-speed" value="500" max="1000" min="50"></input></div>');
		//controls.append(controlsLeft);
		//var controlsRight = $('<div class="debugger-controls" style="float: right"></div>');
		//controls.append(controlsRight);
		content.append(controls);

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

		// Watch for state changes
		/*eden.root.addGlobal(function(sym, create) {
			if (!debug_play && docapture && active_agent) {
				if (sym.eden_definition === undefined || sym.eden_definition.startsWith("proc") == false) {
					var inspect = active_agent.html.find(".debugger-inspector");
					var val = Eden.edenCodeForValue(sym.value()).split("\n")[0];
					inspect.append('<div>'+sym.name.slice(1)+' = '+val+'</div>');
				}
			}
		});*/

		function generateSource(agent) {
			var statement = "";
			if (agent.type == "when" && agent.base && agent.base.origin) {
				statement += "## " + agent.base.origin.name;
				if (agent.line) {
					statement += ":" + (agent.line+1);
				}
				statement += "\n";
			} else if (agent.name) {
				statement += "## " + agent.name + "\n";
			}

			if (agent.getSource) statement += agent.getSource();
			return statement;
		}

		//Add events

		var debugStepFn = function (data) {
			var agent = data.agent;

			var statement = generateSource(agent);

			if (agentcapture[agent.id]) {
				var output = agentcapture[agent.id].html;
				agentcapture[agent.id].data = data;

				//if (agentcapture[agent.id] === active_agent) 
				docapture = false;

				if (output) {
					var ast = new Eden.AST(statement, undefined, agent);
					var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
					hl.highlight(ast, -1, -1);

					if (data.statement) {
						// Now highlight correct line number...
						var line = data.statement.line - agent.getLine();
						var lineele = output.get(0).childNodes[1].childNodes[line+1];
						if (lineele) {
							//lineele.style.background = "#c67f6c";
							lineele.className = "eden-line debugger-line";
						} else {
							console.error("Missing line: " + line);
						}
					}
				} else {
					console.error("Missing output");
				}
			}

			if (debug_play) {
				setTimeout(data.next, debug_speed);
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
			var output = $('<div class="debugger-agent" data-agent="'+agent.id+'"><div class="debugger-agent-controls"></div><div class="debugger-code"></div></div>');
			script.append(output);
			agentcapture[agent.id] = {html: output, data: data};

			if (active_agent === undefined) {
				active_agent = agentcapture[agent.id];
				output.get(0).className = "debugger-agent active";
			}

			var statement = generateSource(agent);

			var ast = new Eden.AST(statement, undefined, agent);
			var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
			hl.highlight(ast, -1, -1);
		}
		Eden.AST.debug_begin_cb = debugBeginFn;

		var debugEndFn = function(data) {
			var agent = data.agent;
			if (agent.id === undefined) return;
			if (agentcapture[agent.id] === undefined) return;

			if (active_agent === agentcapture[agent.id]) {
				docapture = false;
				active_agent = undefined;
			}

			var statement = generateSource(agent);
			var output = agentcapture[agent.id].html;

			var ast = new Eden.AST(statement, undefined, agent);
			var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
			hl.highlight(ast, -1, -1);


			//setTimeout(function() {
				agentcapture[agent.id].html.remove();
				delete agentcapture[agent.id];
				agent.id = undefined;
			//}, 2000);
		}
		Eden.AST.debug_end_cb = debugEndFn;

		Eden.AST.debug = true;
		Eden.AST.debugstep = false;


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
			appendTo: "#jseden-views",
			title: mtitle,
			width: 590,
			height: 500,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "debugger-dialog"
		});

		controls.on("click", ".play", function(e) {
			debug_play = !debug_play;
			if (debug_play) {
				e.currentTarget.innerHTML = "&#xf04c;";
				e.currentTarget.className = "debugger-button play active";
			} else {
				e.currentTarget.innerHTML = "&#xf04b;";
				e.currentTarget.className = "debugger-button play";
			}
		}).on("click",".stepforward", function(e) {
			if (active_agent && active_agent.data.next) {
				//active_agent.html.find(".debugger-inspector").html("");
				//docapture = true;
				active_agent.data.next();
				// Prevent it being done more than once.
				if (active_agent) active_agent.data.next = undefined;
			}
		}).on("click", ".debug", function(e) {
			Eden.AST.debugstep = !Eden.AST.debugstep;
			if (Eden.AST.debugstep) e.currentTarget.className = "debugger-button debug active";
			else e.currentTarget.className = "debugger-button debug";
		}).on("change", ".debugger-speed", function(e) {
			debug_speed = e.currentTarget.value;
			console.log("Change speed: " + debug_speed);
		});
		script.on("click",".debugger-agent", function(e) {
			if (active_agent) active_agent.html.get(0).className = "debugger-agent";
			active_agent = agentcapture[e.currentTarget.getAttribute("data-agent")];
			active_agent.html.get(0).className = "debugger-agent active";
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

