/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
var edenfunctions = {};

/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 *
 * @author Nicolas Pope
 * @constructor
 * @param context The eden context this plugin is being loaded in to.
 */

EdenUI.plugins.SymbolViewer = function (edenUI, success) {
	var me = this;

	// Obtain function meta data from server
	$.ajax({
		url: "library/functions.json",
		dataType: 'json',
		success: function (data) {
			edenfunctions = data;
		},
		cache: false,
		async: true
	});

	/**
	 * Array of symbol list instances
	 * @see SymbolList
	 */
	this.instances = [];

	var generateHTML = function (viewName, viewType) {
		var html = "\
			<div class=\"symbollist-search-box-outer\"> \
				<input type=\"text\" class=\"symbollist-search symbollist-control\" placeholder=\"search\" /> \
				<a class=\"symbollist-edit symbollist-control symbollist-rightmost-control\">Edit Listed</a><br/> \
				<select id=\"" + viewName + "-system-filter\" class=\"symbollist-control\"> \
					<option value=\"user\">Construal</option> \
					<option value=\"system\">System Library</option> \
					<option value=\"both\">All Sources</option> \
				</select>";
		if (viewType == "obs") {
			html = html + "\
				<select id=\"" + viewName + "-type-filter\" class=\"symbollist-control symbollist-rightmost-control\"> \
					<option value=\"formulas\">Dependencies</option>\
					<option value=\"vars\">Base Observables</option>\
					<option value=\"both\" selected=\"selected\">All Kinds</option>\
				</select>";
		}
		html = html + "\
			</div> \
			<div class=\"symbollist-results\"></div>";
		return html;
	};

	/**
	 * Construct a jQuery dialog wrapper for a symbol list instance. Also
	 * constructs the symbol list instance and embeds it into the dialog.
	 *
	 * @param {string} name Identifier for the dialog. Must be globally unique.
	 * @param {string} mtitle Title string for the dialog.
	 * @param {string} Type of symbols to show: obs,agent,func,all.
	 */
	this.createDialog = function (name, mtitle, type) {
		var edenName = name.slice(0, -7);
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML(name, type));
		var symbollist = new EdenUI.plugins.SymbolViewer.SymbolList(
			edenUI.eden.root, code_entry.find(".symbollist-results")[0], type
		);

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
			});

		me.instances.push(symbollist);
		symbollist.search("");

		code_entry.find(".symbollist-search-box-outer > .symbollist-edit").click(function(){
			console.log(name);
			edenUI.createView("edit_" + edenName, "ScriptInput");
			var allVals = "";
			var symbol;
			for(var symbolname in symbollist.symbols){
				symbol = edenUI.eden.root.lookup(symbolname);
				var val;
				if (typeof symbol.value() === 'function' && symbol.eden_definition !== undefined) {
					val = symbol.eden_definition;
				} else {
					if (symbol.definition) {
						val = symbol.eden_definition + ";";
					} else {
						val = symbolname + " = " + Eden.edenCodeForValue(symbol.value()) + ";";
					}
				}
				allVals += val + "\n";
			}
				$('#edit_' + edenName + '-dialog').find('textarea').val(allVals);
		});


		// Make changes in search box update the list.
		var searchBox = code_entry.find(".symbollist-search-box-outer > .symbollist-search");
		searchBox.keyup(function() {
			symbollist.search(this.value);
		});
		var searchBoxElem = searchBox.get(0);

		document.getElementById(name + "-system-filter").addEventListener("change", function (event) {
			symbollist.search(searchBoxElem.value, event.target.value);
		});

		if (type == "obs") {
			document.getElementById(name + "-type-filter").addEventListener("change", function (event) {
				symbollist.search(searchBoxElem.value, undefined, event.target.value);
			});
		}

	};

	/**
	 * Construct a dialog showing only plain observables.
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createObservableDialog = function (name, mtitle) {
		return me.createDialog(name, mtitle, "obs");
	};

	/**
	 * Construct a dialog showing only functions.
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createFunctionDialog = function (name, mtitle) {
		return me.createDialog(name,mtitle,"func");
	};

	/**
	 * Construct a dialog showing only agents (procedures).
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createAgentDialog = function (name, mtitle) {
		return me.createDialog(name,mtitle,"agent");
	};

	/**
	 * Construct a dialog showing all symbols.
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createSymbolDialog = function (name, mtitle) {
		return me.createDialog(name,mtitle,"all");
	};

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
	var sym_changed_to = function () {
		// For every viewer
		for (x in me.instances) {
			var instance = me.instances[x];
			
			// Remove symbol list from DOM to speed up manipulations
			var symresults = $(instance.symresults);
			var parent = symresults.parent();
			symresults.detach();

			// For every recently created symbol
			for (var name in symbol_create_queue) {
				var sym = symbol_create_queue[name];
				instance.addSymbol(sym, name);
			}

			// For every recently updated symbol
			for (var name in symbol_update_queue) {			
				instance.updateSymbol(name);
			}

			// Add symbol list back into the DOM for display.
			symresults.appendTo(parent);
		}

		symbol_update_queue = {};
		symbol_create_queue = {};
		sym_update_to = false;
	};

	/**
	 * Called every time a symbol is changed or created. Then proceeds to
	 * update all visible symbol lists.
	 */
	var symbolChanged = function (sym, create) {
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
	};

	// Register event handler for symbol changes.
	edenUI.eden.root.addGlobal(symbolChanged);

	// Add views supported by this plugin.
	edenUI.views["ObservableList"] = {dialog: this.createObservableDialog, title: "Observable List", category: edenUI.viewCategories.comprehension, menuPriority: 1};
	edenUI.views["FunctionList"] = {dialog: this.createFunctionDialog, title: "Function List", category: edenUI.viewCategories.comprehension, menuPriority: 1};
	edenUI.views["AgentList"] = {dialog: this.createAgentDialog, title: "Agent List", category: edenUI.viewCategories.comprehension, menuPriority: 1};
	edenUI.views["SymbolList"] = {dialog: this.createSymbolDialog, title: "Symbol List", category: edenUI.viewCategories.comprehension, menuPriority: 2};

	$(document).tooltip();
	success();
};

/* Plugin meta information */
EdenUI.plugins.SymbolViewer.title = "Symbol Viewer";
EdenUI.plugins.SymbolViewer.description = "Provide various views of the symbol table.";

/**
 * Class to represent symbol lists. Displays a list of symbol information
 * based upon a given search pattern and type of symbol.
 *
 * @author Nicolas Pope
 * @constructor
 * @param element An HTML element to put the symbol list into.
 * @param type The type of symbols to include: obs,agent,func,all.
 */
EdenUI.plugins.SymbolViewer.SymbolList = function (root, element, type) {
	this.root = root;
	this.regExp = new RegExp("");
	this.type = type;
	this.showSystem = "user"; // Show "user" defined, "system" defined or "both"
	this.subtypes = "both";   // Show "formulas", "vars" or "both"
	this.symresults = element;
	this.symbols = {};
};

/**
 * Update the symbol list to match the given regular expression string.
 *
 * @param pattern A regular expression for symbol names.
 */
EdenUI.plugins.SymbolViewer.SymbolList.prototype.search = function (pattern, showSystem, subtypes) {
	this.regExp = new RegExp("^(" + pattern + ")", "i");
	if (showSystem !== undefined) {
		this.showSystem = showSystem;
	}
	if (subtypes !== undefined) {
		this.subtypes = subtypes;;
	}

	// Clear existing results and start again
	EdenUI.closeTooltip();
	this.symresults.innerHTML = "";
	this.symbols = {};

	// For every js-eden symbol
	var name, symbol;
	for (name in this.root.symbols) {
		symbol = this.root.symbols[name];
		this.addSymbol(symbol, name);
	}
};

/**
 * Regenerate the displayed HTML for the given symbol. Usually called
 * automatically when a symbol has changed.
 *
 * @param name Name of the symbol to update.
 */
EdenUI.plugins.SymbolViewer.SymbolList.prototype.updateSymbol = function (name) {
	if (this.symbols[name] !== undefined) {
		this.symbols[name].update();
	}
};

/**
 * Detect what kind of symbol it is and then add the symbol if it is of a type
 * that we are wanting to show.
 *
 * @param symbol A symbol object for the maintainer.
 * @param name The name of the given symbol object.
 */
EdenUI.plugins.SymbolViewer.SymbolList.prototype.addSymbol = function (symbol, name) {

	if (!this.regExp.test(name)) {
		return;
	}
	if (Eden.isitSystemSymbol(name)) {
		if (this.showSystem == "user") {
			return;
		}
	} else if (this.showSystem == "system") {
		return;
	}
	if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
		if (this.subtypes == "vars") {
			return;
		}
	} else {
		if (this.subtypes == "formulas") {
			return;
		}
	}

	var symbolType = "obs";

	// Does the symbol have a definition
	if (!symbol.definition || !symbol.eden_definition) {
		if (typeof(symbol.cached_value) == "function") {
			if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cached_value.toString())) {
				symbolType = "func";
			} else {
				symbolType = "agent";
			}
		} else {
			symbolType = "obs";
		}
	} else {
		// Find out what kind of definition it is (proc, func or plain)
		var definition = symbol.eden_definition;
	
		if (/^proc\s/.test(definition)) {
			symbolType = "agent";
		} else if (/^func\s/.test(definition)) {
			symbolType = "func";
		} else {
			//Dependency
			if (typeof(symbol.cached_value) == "function") {
				if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cached_value.toString())) {
					symbolType = "func";
				} else {
					symbolType = "agent";
				}
			} else {
				symbolType = "obs";
			}
		}
	}

	// Do we need to display this type of observable.
	var show = this.type == "all" || this.type == symbolType;

	if (show) {
		var symele = new EdenUI.plugins.SymbolViewer.Symbol(symbol, name, symbolType);
		symele.element.appendTo(this.symresults);
		this.symbols[name] = symele;
	}
};

/**
 * A class for an individual symbol result which deals with HTML formatting.
 *
 * @author Nicolas Pope
 * @constructor
 * @param symbol Internal EDEN symbol object.
 * @param name Name of the symbol.
 * @param Already detected type of the symbol: procedure,function,observable.
 */
EdenUI.plugins.SymbolViewer.Symbol = function (symbol, name, type) {
	this.symbol = symbol;
	this.name = name;
	this.type = type;
	this.element = $('<div class="symbollist-result-element"></div>');
	this.details = undefined;
	this.update = undefined;

	// Select update method based upon symbol type.
	switch (type) {
		case 'func': this.update = this.updateFunction; break;
		case 'agent': this.update = this.updateProcedure; break;
		case 'obs': this.update = this.updateObservable; break;
	};

	var me = this;
	this.element.hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "inherit"}, 100);
		}	
	).click(function () {
		edenUI.createView("edit_" + me.name, "ScriptInput");
		var val;
		if (typeof symbol.value() === 'function' && symbol.eden_definition !== undefined) {
			val = symbol.eden_definition;
		} else {
			if (symbol.definition) {
				val = symbol.eden_definition + ";";
			} else {
				val = me.name + " = " + Eden.edenCodeForValue(symbol.value()) + ";";
			}
		}

		$('#edit_' + me.name + '-dialog').find('textarea').val(
			val
		);
	});

	this.update();
};

/**
 * Update the HTML output of a function type symbol. Looks for any meta data
 * for this function, such as parameters and description.
 */
EdenUI.plugins.SymbolViewer.Symbol.prototype.updateFunction = function () {
	var eden_definition = this.symbol.eden_definition;
	var nameHTML;
	var detailsHTML;

	if (eden_definition !== undefined && !/^func\s/.test(eden_definition)) {
		nameHTML = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		nameHTML = this.name;
	}

	// If there are details for this function in the function meta data
	if (edenfunctions.functions != undefined && edenfunctions.functions[this.name] !== undefined) {
		this.details = edenfunctions.functions[this.name];
		// Extract parameters for display.
		var params = Object.keys(this.details.parameters || {});
		detailsHTML = "<span class='result_value'> ( " + params.join(", ") + " )</span>";
	} else {
		detailsHTML = "";
	}

	var html = "<span class='result_name'>" + nameHTML + "</span>" + detailsHTML;

	if (eden_definition !== undefined && !/^func\s/.test(this.symbol.eden_definition)) {
		var tooltip = Eden.htmlEscape(eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre>" + tooltip + ";</pre>");
		html = "<span onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	this.element.html(html);
};

function _formatVal(value) {
	var str = Eden.prettyPrintValue("", value, 200, false, false);
	switch (typeof(value)) {
	case "boolean":
		return "<span class='special_text'>" + str + "</span>";
	case "undefined":
		return "<span class='error_text'>@</span>";
	case "string":
		return "<span class='string_text'>" + str + "</span>";
	case "number":
		return "<span class='numeric_text'>" + str + "</span>";
	default:
		return str;
	}
};

/**
 * Update the HTML output of a plain observable symbol. Detects the data type
 * of the observable to display its current value correctly.
 */
EdenUI.plugins.SymbolViewer.Symbol.prototype.updateObservable = function () {
	var val = this.symbol.value();
	var valhtml = _formatVal(val);

	var namehtml;
	if (this.symbol.definition !== undefined) {
		namehtml = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		namehtml = this.name;
	}

	var html = "<span class='result_name'>" + namehtml + "</span><span class='result_separator'> = </span> " +
		"<span class='result_value'>" + valhtml + "</span>";

	if (this.symbol.definition !== undefined) {
		var tooltip = Eden.htmlEscape(this.symbol.eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre class='symbollist-tooltip'>" + tooltip + ";</pre>");
		html = "<span onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	this.element.html(html);
};

/**
 * Update the HTML output of a procedure symbol.
 */
EdenUI.plugins.SymbolViewer.Symbol.prototype.updateProcedure = function () {
	var eden_definition = this.symbol.eden_definition;
	var nameHTML;

	if (eden_definition !== undefined && !/^proc\s/.test(eden_definition)) {
		nameHTML = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		nameHTML = this.name;
	}

	var html = "<span class='result_name'>" + nameHTML + "</span>";

	if (eden_definition !== undefined && !/^proc\s/.test(this.symbol.eden_definition)) {
		var tooltip = Eden.htmlEscape(eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre>" + tooltip + ";</pre>");
		html = "<span onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	this.element.html(html);
};
