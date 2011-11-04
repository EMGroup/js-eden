function Eden(context) {
	this.context = context || new Folder();
	this.storage_script_key = "script";
}

Eden.prototype.getDefinition = function(name, symbol) {
	if (symbol.eden_definition) {
		return symbol.eden_definition + ";";
	} else {
		return name + " = " + symbol.cached_value + ";"; 
	}
};

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
		eval(translateEdenToJavaScript(stored_script));
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
