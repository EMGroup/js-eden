/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 * @class SymbolViewer Plugin
 */
Eden.plugins.SymbolViewer = function(context) {
	var me = this;

	/** @public */
	this.instances = new Array();

	/** @private */
	var updateAllViewers = function(pattern) {
		for (x in me.instances) {
			updateViewer(me.instances[x],pattern);
		}
	}

	/** @private */
	var updateViewer = function(element,pattern) {
		
	}

	/** @public */
	this.createDialog = function(name,mtitle,type) {
		
	}

	this.createObservableDialog = function(name,mtitle) {

	}

	this.createFunctionDialog = function(name,mtitle) {

	}

	this.createAgentDialog = function(name,mtitle) {

	}

	this.createSymbolDialog = function(name,mtitle) {

	}


	//Add views supported by this plugin.
	context.views["ObservableList"] = {dialog: this.createObservableDialog, title: "Observable List"};
	context.views["FunctionList"] = {dialog: this.createFunctionDialog, title: "Function List"};
	context.views["AgentList"] = {dialog: this.createAgentDialog, title: "Agent List"};
	context.views["SymbolList"] = {dialog: this.createSymbolDialog, title: "Symbol List"};
};

/* Plugin meta information */
Eden.plugins.SymbolViewer.title = "Symbol Viewer";
Eden.plugins.SymbolViewer.description = "Provide various views of the symbol table";
Eden.plugins.SymbolViewer.author = "Nicolas Pope";
