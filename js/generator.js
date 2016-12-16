Eden.Generator = {};

Eden.Generator.symbolScript = function(forced) {
	var result = "";
	var functions = "## Functions\n";
	var definitions = "\n## Definitions\n";
	var restdefs = "\n## Restored Definition\n";
	var agentdefs = "\n## Agent Definitions\n";
	var assignments = "\n## Assignments\n";
	var agentassigns = "\n## Agent Assignments\n";
	var ioassigns = "\n## Input Device Assignments\n";
	var restassign = "\n## Restored Assignments\n";
	var procs = "\n## Procedures\n";

	for (var x in eden.root.symbols) {
		var sym = eden.root.symbols[x];
		var agent = sym.last_modified_by;
		if (agent === undefined) console.log(sym);
		if (typeof agent.name != "string") console.log(agent);
		if (agent.name != "*Default"
				&& ((agent.canUndo && agent.canUndo())
					|| (forced && forced[agent.name])
					|| (agent.meta && (agent.last_exec_version != agent.meta.saveID))
					|| agent.name.charAt(0) == "*"
					|| agent.name.charAt(0) == "/")) {
			if (sym.eden_definition) {
				if (sym.eden_definition.startsWith("func")) {
					functions += sym.eden_definition + "\n";
				} else {
					if (agent.name == "*Restore") {
						restdefs += sym.eden_definition + "\n";
					} else if (agent.name == "*When") {
						agentdefs += sym.eden_definition + "\n";
					} else {
						definitions += sym.eden_definition + "\n";
					}
				}
			} else {
				if (sym.cache.value !== undefined) {
					var str = x + " = " + Eden.edenCodeForValue(sym.cache.value) + ";\n";

					if ((agent instanceof Symbol && agent.eden_definition && agent.eden_definition.startsWith("proc")) || agent.name == "*JavaScript" || agent.name == "*When") {
						agentassigns += str;
					} else if (agent.name == "*Input Device") {
						ioassigns += str;
					} else if (agent.name == "*Restore") {
						restassign += str;
					} else {
						assignments += str;
					}
				}
			}
		}
	}
	return functions + definitions + restdefs + agentdefs + assignments + restassign + agentassigns + ioassigns + procs;
};

Eden.Generator.importsScript = function() {
	var result = "";
	for (var x in Eden.Agent.agents) {
		var ag = Eden.Agent.agents[x];
		var docreate = "";
		if (ag.meta.saveID == -1 && !ag.meta.file) docreate = " create";
		// First import and exec last executed version
		if (ag.last_exec_version) {
			var tag = (ag.last_exec_version == -1) ? "origin" : ag.last_exec_version;
			result += "import " + x + "@" + tag + docreate + ";\n";
		}

		// Now make sure actual imported version is brought in (but not executed)
		if (ag.last_exec_version != ag.meta.saveID) {
			var tag = (ag.meta.saveID == -1) ? "origin" : ag.meta.saveID;
			result += "import " + x + "@" + tag + docreate + " noexec;\n";
		}
	}
	return result;
}

Eden.Generator.getScript = function() {
	return Eden.Generator.importsScript() + "\n" + Eden.Generator.symbolScript();
}

