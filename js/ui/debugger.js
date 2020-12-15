/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.ExplorerDebug = function(element) {

		var debug_play = false;
		var active_agent = undefined;
		var docapture = false;
		var debug_speed = 500;

		//Create elements
		var label;
		var content = $('<div class="debugger"></div>');
		//var controls = $('<div></div>');

		var controls = $('<div class="debugger-controls"><button title="Toggle capture all agents" style="margin-left: 20px; margin-right: 20px;" class="debugger-button debug">&#xf188;</button><button class="debugger-button play" title="Auto Play">&#xf04b;</button><button class="debugger-button stepforward">&#xf051;</button><button class="debugger-button autostep">&#xf050;</button><input type="range" class="debugger-speed" value="500" max="1000" min="50"></input><button class="debugger-button record" title="Log all redefinitions">&#xf111;</button></div>');
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

		var data = {lasttime: 0};

		eden.listenTo("debug_log", null, (s) => {
			let ts = Date.now();
			if (ts > data.lasttime+2000) {
				let ele = document.createElement('DIV');
				EdenUI.Highlight.htmlElement("\n/* " + (new Date(ts)).toString() + " */\n", ele);
				script[0].appendChild(ele);
				data.lasttime = ts;
			}

			let pname = s.getLocationName();

			let ele = document.createElement('DIV');
			EdenUI.Highlight.htmlElement(s.getSource() + "  /* " + pname + " */", ele);
			script[0].appendChild(ele);
			script[0].scrollTop = script[0].scrollHeight;
		});

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
			/*if (agent.type == "when" && agent.base && agent.base.origin) {
				statement += "## " + agent.base.origin.name;
				if (agent.line) {
					statement += ":" + (agent.line+1);
				}
				statement += "\n";
			} else if (agent.name) {
				statement += "## " + agent.name + "\n";
			}*/

			if (agent.getSource) statement += agent.getSource();
			return statement;
		}

		//Add events

		var debugStepFn = function (data) {
			var agent = data.agent;
			console.log("DEBUG", data);

			if (data.statement && data.statement.type == "dummy") return data.next();

			//var statement = (agent === eden.project) ? data.statement.source : agent.source; //generateSource(data.statement);

			if (agentcapture[agent.id]) {
				var output = agentcapture[agent.id].html;
				agentcapture[agent.id].data = data;

				//if (agentcapture[agent.id] === active_agent) 
				docapture = false;

				if (output) {
					//var ast = new Eden.AST(statement, undefined, agent);
					//var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
					//hl.highlight(ast, -1, -1);

					if (agentcapture[agent.id].lastline) agentcapture[agent.id].lastline.className = "eden-line";

					if (data.statement !== agent) {
						// Now highlight correct line number...
						var line = data.statement.getStartLine(agent);
						var lineele = output.get(0).childNodes[1].childNodes[line];
						agentcapture[agent.id].lastline = lineele;
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


			console.log("BEGIN DEBUG", agent.id);
			//if (agent.id !== undefined) {
			//	debugEndFn(data);
			//	console.log("WHEN ALREADY LOGGED");
			//}
			//agent.id = agentid;
			//agentid++;

			var output;
			if (!agentcapture.hasOwnProperty(agent.id)) {
				output = $('<div class="debugger-agent" data-agent="'+agent.id+'"><div class="debugger-agent-controls"></div><div class="debugger-code"></div></div>');
				script.append(output);
				agentcapture[agent.id] = {html: output, data: data};
			} else {
				output = agentcapture[agent.id].html;
			}

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
			console.log("END DEBUG", agent.id);
			if (agent.id === undefined) return;
			if (agentcapture[agent.id] === undefined) return;

			if (active_agent === agentcapture[agent.id]) {
				docapture = false;
				active_agent = undefined;
			}

			//var statement = generateSource(agent);
			//var output = agentcapture[agent.id].html;

			//var ast = new Eden.AST(statement, undefined, agent);
			//var hl = new EdenUI.Highlight(output.get(0).childNodes[1]);
			//hl.highlight(ast, -1, -1);


			//setTimeout(function() {
				//agentcapture[agent.id].html.remove();
				//delete agentcapture[agent.id];
				//agent.id = undefined;
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

		/*$('<div id="' + name + '"></div>')
		.html(content)
		.dialog({
			appendTo: "#jseden-views",
			title: mtitle,
			width: 590,
			height: 500,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "debugger-dialog"
		});*/
		element[0].appendChild(content[0]);

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
		}).on("click", ".record", function(e) {
			Eden.AST.logging = !Eden.AST.logging;
			if (Eden.AST.logging) e.currentTarget.className = "debugger-button record active";
			else e.currentTarget.className = "debugger-button record";
		});
		script.on("click",".debugger-agent", function(e) {
			if (active_agent) active_agent.html.get(0).className = "debugger-agent";
			active_agent = agentcapture[e.currentTarget.getAttribute("data-agent")];
			active_agent.html.get(0).className = "debugger-agent active";
		});

};

