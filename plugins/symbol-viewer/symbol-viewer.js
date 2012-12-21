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

	/** @private */
	var generateHTML = function() {
		return "<div class=\"search-box-outer\">\
			<input type=\"text\" class=\"symbollist-search search-box\"></input>\
		</div>\
		<div class=\"symbollist-scrollup scrollup\"></div>\
		<div class=\"results-lim\"><div class=\"symbollist-results\"></div></div>\
		<div class=\"scrolldown symbollist-scrolldown\"</div>";
	}

	/** @public */
	this.createDialog = function(name,mtitle,type) {
		code_entry = $('<div></div>');
		code_entry.html(generateHTML());

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 350,
				height: 400,
				minHeight: 120,
				minWidth: 230,
				//position: ['right','bottom'],
			});

		me.instances.push(code_entry[0]);
		code_entry[0].symboltype = type;
		updateViewer(code_entry[0],"");
		code_entry.find(".search-box-outer > .symbollist-search").keyup(function() {
			updateViewer(code_entry[0],this.value);
		});
	}

	this.createObservableDialog = function(name,mtitle) {
		return me.createDialog(name,mtitle,"obs");
	}

	this.createFunctionDialog = function(name,mtitle) {
		return me.createDialog(name,mtitle,"func");
	}

	this.createAgentDialog = function(name,mtitle) {
		return me.createDialog(name,mtitle,"agent");
	}

	this.createSymbolDialog = function(name,mtitle) {
		return me.createDialog(name,mtitle,"all");
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
