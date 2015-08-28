/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
var edenfunctions = {};

SymbolMeta = function(sym) {
	this.symbol = sym;
	this.interestingness = 0.0;
	this.significance = 1.0;
};

SymbolMeta.prototype.update = function() {
	this.interestingness = 1.0;
	// Number of dependencies
	// Number of subscribers
	// Last changed, and by whome
	// Current value of interestingness
	// Decay rate of interestingness
	// Long term significance
	// Short term significance
};

/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 *
 * @author Nicolas Pope
 * @constructor
 * @param context The eden context this plugin is being loaded in to.
 */

EdenUI.plugins.SymbolFramer = function (edenUI, success) {
	var me = this;

	/* Symbol meta data */
	this.meta = {};
	this.interesting = [];

	this.maxInteresting = 10;

	this.symresults = undefined;

	var generateHTML = function (viewName) {
		var html = "<div class=\"symbollist-results\"></div>";
		return html;
	};

	this.minInteresting = function() {
		if (me.interesting.length > 0) {
			return me.interesting[me.interesting.length - 1].interestingness;
		} else {
			return 0.0;
		}
	}

	/**
	 * Construct a jQuery dialog wrapper for a symbol list instance. Also
	 * constructs the symbol list instance and embeds it into the dialog.
	 *
	 * @param {string} name Identifier for the dialog. Must be globally unique.
	 * @param {string} mtitle Title string for the dialog.
	 * @param {string} Type of symbols to show: obs,agent,func,all.
	 */
	this.createDialog = function (name, mtitle) {
		var edenName = name.slice(0, -7);
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML(name));
		me.symresults = code_entry.find(".symbollist-results")[0];

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
			});

		/*code_entry.find(".symbollist-search-box-outer > .symbollist-edit").click(function(){
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
		});*/
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
			var parent = me.symresults.parent();
			me.symresults.detach();

			// For every recently created symbol
			for (var i = 0; i < me.interesting.length; i++) {
				var sym = me.interesting[i];
				var symele = new EdenUI.plugins.SymbolViewer.Symbol(sym, name);
				symele.element.appendTo(me.symresults);
				this.symbolsui[name] = symele;
			}

			// For every recently updated symbol
			for (var name in symbol_update_queue) {			
				instance.updateSymbol(name);
			}

			// Add symbol list back into the DOM for display.
			me.symresults.appendTo(parent);

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

		if (create || me.meta[name] === undefined) {
			me.meta[name] = new SymbolMeta(sym);
		}
		me.meta[name].update();

		if (me.meta[name].interestingness >= me.minInteresting()) {
			if (me.interesting.length == me.maxInteresting) {
				me.interesting.pop();
			}
			me.interesting.push(me.meta[name]);
		}
	};

	// Register event handler for symbol changes.
	edenUI.eden.root.addGlobal(symbolChanged);

	// Add views supported by this plugin.
	edenUI.views["FramedSymbols"] = {dialog: this.createDialog, title: "Framed Symbols", category: edenUI.viewCategories.comprehension, menuPriority: 1};

	$(document).tooltip();
	success();
};

/* Plugin meta information */
EdenUI.plugins.SymbolFramer.title = "Symbol Framer";
EdenUI.plugins.SymbolFramer.description = "Automatically generate a list of interesting symbols";

/**
 * A class for an individual symbol result which deals with HTML formatting.
 *
 * @author Nicolas Pope
 * @constructor
 * @param symbol Internal EDEN symbol object.
 * @param name Name of the symbol.
 * @param Already detected type of the symbol: procedure,function,observable.
 */
EdenUI.plugins.SymbolFramer.Symbol = function (symbol, name, type) {
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
