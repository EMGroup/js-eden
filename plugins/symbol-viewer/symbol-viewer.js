var edenfunctions = {};

/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 * @class SymbolViewer Plugin
 */
Eden.plugins.SymbolViewer = function(context) {
	var me = this;

	/** @private */
	//var edenfunctions = {};

	//Obtain function meta data from server
	$.ajax({
		url: "library/functions.json",
		dataType: 'json',
		success: function(data) {
			edenfunctions = data;
			//NOTE: Line below shouldn't be needed unless views are created
			//before this callback has been called.
			//initialiseAllViewers("");
		},
		cache: false,
		async: true
	});

	/** @public */
	this.instances = new Array();

	/** @private */
	var generateHTML = function() {
		return "<div class=\"search-box-outer\">\
			<div class=\"symbollist-search-icon\"></div>\
			<input type=\"text\" class=\"symbollist-search\"></input>\
			<div class=\"symbollist-config-icon\"></div>\
		</div>\
		<div class=\"symbollist-results\"></div>";
	};

	/** @public */
	this.createDialog = function(name,mtitle,type) {
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML());
		var symbollist = new Eden.plugins.SymbolViewer.SymbolList(code_entry.find(".symbollist-results")[0],type);

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 350,
				height: 400,
				minHeight: 200,
				minWidth: 350,
				//position: ['right','bottom'],
			});

		me.instances.push(symbollist);

		code_entry.find(".search-box-outer > .symbollist-search").keyup(function() {
			symbollist.search(this.value);
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

	var symbol_update_queue = {};
	var symbol_create_queue = {};
	var sym_update_to = false;

	/**
	 * The delay between updates of all the symbol viewers. A higher value
	 * reduces the update frequency which improves performance but gives a
	 * sluggish look to the symbol lists.
	 */
	this.delay = 40;

	/**
	 * Timeout function for updating symbol lists with any recently changed
	 * or created symbols.
	 * @private
	 */
	var sym_changed_to = function() {

		//For every viewer
		for (x in me.instances) {
			var instance = me.instances[x];
			
			//Remove symbol list from DOM to speed up manipulations
			var parent = instance.symresults.parent();
			$(instance.symresults).detach();

			//For every recently created symbol
			for (var name in symbol_create_queue) {
				var sym = symbol_create_queue[name];
				instance.addSymbol(sym, name);
			}

			//For every recently updated symbol
			for (var name in symbol_update_queue) {			
				instance.updateSymbol(name);
			}

			//Add symbol list back into the DOM for display.
			$(instance.symresults).appendTo(parent);
		}

		symbol_update_queue = {};
		symbol_create_queue = {};
		sym_update_to = false;
	}

	/**
	 * Called every time a symbol is changed or created. Then proceeds to
	 * update all visible symbol lists.
	 */
	var symbolChanged = function(sym, create) {
		var name = sym.name.substr(1);

		if (create) {
			symbol_create_queue[name] = sym;
		} else {
			symbol_update_queue[name] = sym;
		}

		if (!sym_update_to) {
			sym_update_to = true;
			setTimeout(sym_changed_to,me.delay);
		}
	}

	//Register event handler for symbol changes.
	context.context.addGlobal(symbolChanged);


	//Add views supported by this plugin.
	context.views["ObservableList"] = {dialog: this.createObservableDialog, title: "Observable List"};
	context.views["FunctionList"] = {dialog: this.createFunctionDialog, title: "Function List"};
	context.views["AgentList"] = {dialog: this.createAgentDialog, title: "Agent List"};
	context.views["SymbolList"] = {dialog: this.createSymbolDialog, title: "Symbol List"};
};

/* Plugin meta information */
Eden.plugins.SymbolViewer.title = "Symbol Viewer";
Eden.plugins.SymbolViewer.description = "Provide various views of the symbol table";
Eden.plugins.SymbolViewer.author = "Nicolas Pope and Tim Monks";

Eden.plugins.SymbolViewer.SymbolList = function(element,type) {
	this.pattern = "";
	this.type = type;
	this.symresults = element;
	this.symbols = {};
}

Eden.plugins.SymbolViewer.SymbolList.prototype.search = function(pattern) {
	var me = this;
	this.pattern = pattern;

	//Clear existing results and start again
	this.symresults.innerHTML = "";
	this.symbols = {};

	//For every js-eden symbol
	//TODO: Sort the symbols by name?
	$.each(root.symbols, function (name, symbol) {
		me.addSymbol(symbol, name);
	});
}

Eden.plugins.SymbolViewer.SymbolList.prototype.updateSymbol = function(name) {
	if (this.symbols[name] !== undefined) {
		this.symbols[name].update();
	}
}

/**
 * Detect what kind of symbol it is and then add the symbol if it is of a type
 * that we are wanting to show.
 */
Eden.plugins.SymbolViewer.SymbolList.prototype.addSymbol = function(symbol, name) {
	var reg = new RegExp("^"+this.pattern+".*");

	if (name.search(reg) == -1) {
		return;
	}

	var type = "observable";

	//Does the symbol have a definition
	if (!symbol.definition || !symbol.eden_definition) {
		type = "observable";
	} else {
		//Find out what kind of definition it is (proc, func or plain)
		var subs = symbol.eden_definition.substring(0,4);
	
		if (subs == "proc") {
			type = "procedure";
		} else if (subs == "func") {
			type = "function";
		} else {
			type = "observable;
		}
	}

	//Do we need to display this type of observable.
	var show = false;
	if (this.type == "all") {
		show = true;
	} else if (this.type == "agent" && type == "procedure") {
		show = true;
	} else if (this.type == "func" && type == "function") {
		show = true;
	} else if (this.type == "obs" && type == "observable") {
		show = true;
	}

	if (show) {
		var symele = new Eden.plugins.SymbolViewer.Symbol(symbol,name,type);
		symele.element.appendTo(this.symresults);
		this.symbols[name] = symele;
	}
}

Eden.plugins.SymbolViewer.Symbol = function(symbol,name,type) {
	this.symbol = symbol;
	this.name = name;
	this.type = type;
	this.element = $('<div class="symbollist-result-element"></div>');
	this.details = undefined;
	this.update = undefined;

	//Select update method based upon symbol type.
	switch(type) {
	case 'function': this.update = this.updateFunction; break;
	case 'procedure': this.update = this.updateProcedure; break;
	case 'observable': this.update = this.updateObservable; break;
	};

	this.element.hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
			//if (this != selected_observable) {
			//	$(this).animate({backgroundColor: "#eaeaea"}, 100);
			//}
			//var info = $('#observable-info');
				//if (this.symbol.definition !== undefined) {
			//	var iname = info.find('#observable-info-name');
			//	iname.text(this.symbol.eden_definition);
			//	info.css("left", "" + (this.offsetLeft + this.offsetWidth) + "px");
			//	info.css("top", "" + (this.offsetTop + 125 - 8 - ((info[0].offsetHeight / 2))) + "px");
			//	info.show();
			//} else {
			//	info.hide();
			//}
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
			//$('#observable-info').hide();
			//if (this != selected_observable) {
			//	$(this).animate({backgroundColor: "white"}, 100);
			//}
		}	
	).click(function() {
		//Show symbol details dialog
	});

	this.update();
}

Eden.plugins.SymbolViewer.Symbol.prototype.updateFunction = function() {
	var funchtml = "<li class=\"type-function\"><span class=\"result_name\">" + this.name + "</span>";

	//If there are details for this function in the function meta data
	if (edenfunctions.functions != undefined && edenfunctions.functions[this.name] !== undefined) {
		this.details = edenfunctions.functions[this.name];
		//Extract parameters for display.
		funchtml = funchtml + "<span class='result_value'> ( ";
		if (this.details.parameters !== undefined) {
			for (x in this.details.parameters) {
				funchtml = funchtml + x + ", ";
			}
			funchtml = funchtml.substr(0,funchtml.length-2) + " )</span>";
		} else {
			funchtml = funchtml + " )</span>";
		}
	}

	funchtml = funchtml + "</li>";
	this.element.html(funchtml);
}

Eden.plugins.SymbolViewer.Symbol.prototype.updateObservable = function() {
	/* XXX Does cause all dependencies to be evaluated which removes any
	   performance gains of eval-on-use-when-out-of-date. */
	var val = this.symbol.value();
	var valhtml;

	if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
	else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
	else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
	else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
	else { valhtml = val; }

	var namehtml;
	if (this.symbol.definition !== undefined) {
		namehtml = "<span class=\"hasdef_text\">"+this.name+"</span>";
	} else {
		namehtml = this.name;
	}

	this.element.html("<li class=\"type-observable\"><span class=\"result_name\">"
		+ namehtml
		+ "</span><span class='result_value'> = "
		+ valhtml
		+ "</span></li>"
	);
}

Eden.plugins.SymbolViewer.Symbol.prototype.updateProcedure = function() {
	this.element.html("<li class=\"type-procedure\"><span class=\"result_name\">" + this.name + "</span></li>");
}
