/**
 * XXX: currently this is used as a constructor
 * possibly just want a namespace for EDEN related functions
 */
function Eden(context) {
	this.context = context || new Folder();
	this.storage_script_key = "script";
}

/*
 * asynchronously loads an EDEN file from the server,
 * translates it to JavaScript then evals it when it's done
 */
Eden.executeFile = function (path) {
	$.get(path, function(data) {
		eval(Eden.translateToJavaScript(data));
	});
};

/*
 * This is the entry point for eden to JS translation, which attaches some of the
 * necessary functions/initial state to the translator before running it
 */
Eden.translateToJavaScript = function translateToJavaScript(source) {
	var in_definition = false;
	var dependencies = {};

	var original_input = source;

	parser.yy.extractEdenDefinition = function(first_line, first_column, last_line, last_column) {
		var definition_lines = original_input.split('\n').slice(first_line - 1, last_line);
		var definition = "";

		for (var i = 0; i < definition_lines.length; ++i) {
			var line = definition_lines[i];

			if (i === 0) {
				var start = first_column;
			} else {
				var start = 0;
			}

			if (i === definition_lines.length - 1) {
				var end = last_column;
			} else {
				var end = line.length;
			}

			definition += line.slice(start, end);

			if (i < definition_lines.length - 1) {
				definition += "\n";
			}
		}

		return definition;
	}

	parser.yy.enterDefinition = function() {
		dependencies = {};
		in_definition = true;
	};

	parser.yy.leaveDefinition = function() {
		in_definition = false;
	};

	parser.yy.inDefinition = function() {
		return in_definition;
	};

	parser.yy.addDependency = function(name) {
		dependencies[name] = 1;
	};

	parser.yy.getDependencies = function() {
		var dependency_list = [];
		for (p in dependencies) {
			dependency_list.push(p);
		}
		return dependency_list;
	};

	parser.yy.locals = [];
	parser.yy.paras = [];

	return parser.parse(source);
};

Eden.prototype.getDefinition = function(name, symbol) {
	if (symbol.eden_definition) {
		return symbol.eden_definition + ";";
	} else {
		return name + " = " + symbol.cached_value + ";";
	}
};

/*
 * XXX: all this stuff currently isn't used, just represents
 * some hacking for persisting model state I did. monk
 */
Eden.prototype.getSerializedState = function() {
	var script = "";
	for (var name in this.context.symbols) {
		script += this.getDefinition(name, this.context.symbols[name]) + "\n";
	}
	return script;
};

Eden.prototype.saveLocalModelState = function() {
	var state_string = this.getSerializedState(this.context);
	localStorage[this.storage_script_key] = state_string;
};

Eden.prototype.loadLocalModelState = function() {
	var stored_script = localStorage[this.storage_script_key];
	if (stored_script != undefined) {
		eval(Eden.translateToJavaScript(stored_script));
	} else {
		console.log("tried to load local model state but there was nothing stored!");
	}
};

Eden.prototype.pushModelState = function() {
	var uploader_url = 'push-state.php';
	var state_string = this.getSerializedState(this.context);
	$.ajax(uploader_url, {
		type: 'POST',
		data: {
			state: state_string
		},
		timeout: 2000,
		success: function(data) {
			console.log("SUCCESSFULLY PUSHED MODEL", data);
		},
		error: function(request, status, error) {
			if (status === "timeout") {
				console.log("whoops, POST timed out");
			} else {
				console.log("something went wrong submitting a question (other than timeout): status " + status);
			}
		}
	});
};
