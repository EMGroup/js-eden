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
 * @author Nicolas Pope and Elizabeth Hudnott
 * @constructor
 * @param context The eden context this plugin is being loaded in to.
 */

EdenUI.plugins.SymbolViewer = function (edenUI, success) {
	var me = this;

	/**
	 * Array of symbol list instances
	 * @see SymbolList
	 */
	this.instances = [];
	var numInstances = 0;

	var generateHTML = function (viewName, viewType) {
		var html = "\
			<div class=\"symbollist-search-box-outer\"> \
				<input type=\"text\" class=\"symbollist-search symbollist-control\" /> \
				<a class=\"symbollist-edit symbollist-control symbollist-rightmost-control\">Edit Listed</a><br/> \
				";

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
		var agent = root.lookup("createView");
		var content = $('<div class="symbollist-outer"></div>');
		content.html(generateHTML(name, type));

		var symbollist = new EdenUI.plugins.SymbolViewer.SymbolList(
			edenUI.eden.root, content.find(".symbollist-results")[0], type
		);

		$dialog = $('<div id="' + name + '"></div>')
			.append(content)
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
				classes: {"ui-dialog": "symbollist-dialog ui-front"}
			});

		me.instances.push(symbollist);
		numInstances++;
		if (numInstances == 1) {
			// Register event handler for symbol changes.
			edenUI.eden.root.addGlobal(symbolChanged);
		}

		content.find(".symbollist-search-box-outer > .symbollist-edit").click(function(){
			var editorViewName = "edit_" + edenName;
			var allVals = ["## Selection: " + searchBoxElem.value];
			var symbol;
			for(var symbolname in symbollist.symbols){
				symbol = edenUI.eden.root.lookup(symbolname);
				allVals.push(symbol);
				allVals.push("");
			}
			edenUI.createView(editorViewName, "ScriptInput", undefined).update(allVals);
			edenUI.eden.root.lookup("view_" + editorViewName + "_title").assign("Script for " + edenName, eden.root.scope, Symbol.hciAgent);
		});

		//Show different placeholder text to indicate the search syntax being used.
		var searchBox = content.find(".symbollist-search-box-outer > .symbollist-search");
		var searchBoxElem = searchBox[0];
		var searchLangSym = root.lookup("view_" + edenName + "_search_language");

		function makeRegExp() {
			var searchLang = searchLangSym.value();
			if(searchBox.val().startsWith("select: "))
				return edenUI.regExpFromStr("","",false,searchLang);
			return edenUI.regExpFromStr(searchBox, "", false, searchLang);
		}

		function setSearchLanguage(sym, language) {
			symbollist.search(searchBoxElem.value, makeRegExp());

			if (language == "regexp") {
				searchBox.attr("placeholder", "search regular expression");
			} else if (language == "simple") {
				searchBox.attr("placeholder", "simple search");				
			} else {
				searchBox.attr("placeholder", "search");
			}
		};
		setSearchLanguage(searchLangSym, searchLangSym.value());
		searchLangSym.addJSObserver("refreshView", setSearchLanguage);
		
		var searchStrSym = root.lookup("view_" + edenName + "_search_string");
		var performSearch = function (sym, searchStr) {
			if(searchStr === undefined )
				return;
			if (searchStr !== searchBoxElem.value) {
				searchBoxElem.value = searchStr;
			}
			symbollist.search(searchStr, makeRegExp());
		}
		var initialSearchStr = searchStrSym.value();
		if (initialSearchStr === undefined) {
			searchStrSym.assign("", root.scope, agent);
			symbollist.search("", new RegExp(""));
		} else {
			performSearch(searchStrSym, initialSearchStr);
		}
		searchStrSym.addJSObserver("refreshView", performSearch);

		// Make changes in search box update the list.
		searchBox.keyup(function() {
			searchStrSym.assign(searchBoxElem.value, root.scope, Symbol.hciAgent);
		});

		//document.getElementById(name + "-category-filter").addEventListener("change", function (event) {
		//	symbollist.search(searchBoxElem.value, makeRegExp(), event.target.value);
		//});

		//if (type == "obs") {
		//	document.getElementById(name + "-type-filter").addEventListener("change", function (event) {
		//		symbollist.search(searchBoxElem.value, makeRegExp(), undefined, event.target.value);
		//	});
		//}

		var viewData = {
			destroy: function () {
				var index = me.instances.indexOf(symbollist);
				me.instances.splice(index, 1);
				numInstances--;
				if (numInstances == 0) {
					// Register event handler for symbol changes.
					edenUI.eden.root.removeGlobal(symbolChanged);
				}
			}
		};
		return viewData;
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
	var symbol_lists_updating = false;

	this.isCreationPending = function (name) {
		return name in symbol_create_queue;
	}

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
			// (but only if the inline editor isn't open, otherwise we'd lose focus and terminate editing prematurely.)
			var symresults, parent, scrollPosition;
			if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol === undefined) {
				symresults = $(instance.symresults);
				parent = symresults.parent();
				scrollPosition = symresults.scrollTop();
				symresults.detach();
			}

			// For every recently created symbol
			for (var name in symbol_create_queue) {
				var sym = symbol_create_queue[name];
				if (instance.filter) {
					if (instance.filter.indexOf(name) >= 0) {
						instance.addSymbol(sym, name);
					}
				} else {
					instance.addSymbol(sym, name);
				}
			}

			// For every recently updated symbol
			for (var name in symbol_update_queue) {			
				instance.updateSymbol(name);
			}

			// Add symbol list back into the DOM for display.
			if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol === undefined) {
				symresults.appendTo(parent);
				symresults.scrollTop(scrollPosition);
			}
		}

		symbol_update_queue = {};
		symbol_create_queue = {};
		symbol_lists_updating = false;
	};

	/**
	 * Called every time a symbol is changed or created. Then proceeds to
	 * update all visible symbol lists.
	 */
	var symbolChanged = function (sym, kind) {
		var name = sym.name;

		if (kind == 1) {
			symbol_create_queue[name] = sym;
		} else if (name in symbol_create_queue) {
			return;
		} else {
			symbol_update_queue[name] = sym;
		}

		if (!symbol_lists_updating) {
			symbol_lists_updating = true;
			setTimeout(sym_changed_to,me.delay);
		}
	};

	// Add views supported by this plugin.
	edenUI.views["ObservableList"] = {dialog: this.createObservableDialog, title: "Observable List", category: edenUI.viewCategories.comprehension, menuPriority: 0};
	edenUI.views["FunctionList"] = {dialog: this.createFunctionDialog, title: "Function List", category: edenUI.viewCategories.comprehension, menuPriority: 0};
	edenUI.views["AgentList"] = {dialog: this.createAgentDialog, title: "Agent List", category: edenUI.viewCategories.comprehension, menuPriority: 0};
	edenUI.views["SymbolList"] = {dialog: this.createSymbolDialog, title: "Symbol List", category: edenUI.viewCategories.comprehension, menuPriority: 1};

	//$(document).tooltip();
	eden.root.lookup("plugins_symbolviewer_loaded").assign(true, eden.root.scope);
	success();
};

/* Plugin meta information */
EdenUI.plugins.SymbolViewer.title = "Symbol Viewer";
EdenUI.plugins.SymbolViewer.description = "Provide various views of the symbol table.";

EdenUI.plugins.SymbolViewer.inlineEditorSymbol = undefined;

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
	this.category = "all"; // Show "user" defined, "system" defined, a custom category name or "all"
	this.customCategory = false;
	this.subtypes = "all";   // Show "formulas", "vars" or "all"
	this.symresults = element;
	this.symbols = {};
	this.filter = undefined;
};

/**
 * Update the symbol list to match the given regular expression string.
 *
 * @param pattern A regular expression for symbol names.
 */
EdenUI.plugins.SymbolViewer.SymbolList.prototype.search = function (searchStr, regExp, category, subtypes) {
	if(typeof searchStr === "undefined")
		return;
	if(searchStr.startsWith("select: ")){
		var listMatching = Eden.Selectors.query(searchStr.substr(8), "symbol");
		console.log(listMatching);
		this.filter = listMatching;
		this.regExp = regExp;

		this.regExp = regExp;
		//if (category !== undefined) {
		//	this.category = category;
		//	this.customCategory = (category != "user" && category != "system" && category != "all");
		//}
		if (subtypes !== undefined) {
			this.subtypes = subtypes;
		}
		
		// Clear existing results and start again
		EdenUI.closeTooltip();
		this.symresults.innerHTML = "";
		this.symbols = {};
		
		for(var i = 0; i < listMatching.length; i++){
			var symName = listMatching[i];
			var sym = this.root.symbols[symName];
			if (sym) this.addSymbol(sym,symName);
		}
	}else{
		this.searchStr = searchStr;
		this.searchStrLowerCase = searchStr.toLowerCase();
		this.regExp = regExp;
		//if (category !== undefined) {
		//	this.category = category;
		//	this.customCategory = (category != "user" && category != "system" && category != "all");
		//}
		if (subtypes !== undefined) {
			this.subtypes = subtypes;
		}
		
		// Clear existing results and start again
		EdenUI.closeTooltip();
		this.symresults.innerHTML = "";
		this.symbols = {};
		
		// For every js-eden symbol
		var name, symbol;
		for (name in this.root.symbols) {
			if (!edenUI.plugins.SymbolViewer.isCreationPending(name)) {
				symbol = this.root.symbols[name];
				this.addSymbol(symbol, name);
			}
		}
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
	/*If forceDisplay is true then continue processing even if the symbol fails to match an active
	 *search filter.  Also prioritizes the symbol by placing it at the top of the results. */
	var forceDisplay = false;
	//Style differently for an exact match or a dirty match (i.e. wouldn't be shown if wasn't forced).
	var accentuation;

	if (name.toLowerCase() == this.searchStrLowerCase) {
		forceDisplay = true;
		accentuation = "exact-match";
	} else if (!this.regExp.test(name)) {
		return;
	}

	var matches = true;

	if (this.customCategory) {
		if (!Eden.isitCategory(name, this.category, this.type)) {
			matches = false;
		}
	} else if (Eden.isitSystemSymbol(name)) {
		if (this.category == "user") {
			matches = false;
		}
	} else if (this.category == "system") {
		matches = false;
	}
	if (symbol.definition !== undefined) {
		if (this.subtypes == "vars") {
			matches = false;
		}
	} else {
		if (this.subtypes == "formulas") {
			matches = false;
		}
	}

	if (!matches) {
		if (forceDisplay) {
			accentuation = "dirty-match";
		} else {
			return;
		}
	}

	var symbolType = "obs";

	// Does the symbol have a definition
	if (!symbol.definition) {
		if (typeof(symbol.cache.value) == "function") {
			if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cache.value.toString())) {
				symbolType = "func";
			} else {
				symbolType = "agent";
			}
		} else {
			symbolType = "obs";
		}
	} else {
		// Find out what kind of definition it is (proc, func or plain)
		var definition = symbol.getSource();
	
		if (/^proc\s/.test(definition)) {
			symbolType = "agent";
		} else if (/^func\s/.test(definition)) {
			symbolType = "func";
		} else {
			//Dependency
			if (typeof(symbol.cache.value) == "function") {
				if (/\breturn\s+([^\/;]|(\/[^*\/]))/.test(symbol.cache.value.toString())) {
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
		var symele = new EdenUI.plugins.SymbolViewer.Symbol(symbol, name, symbolType, accentuation);
		if (forceDisplay) {
			symele.element.prependTo(this.symresults);
		} else {
			symele.element.appendTo(this.symresults);
		}
		this.symbols[name] = symele;
	}
};

/**
 * A class for an individual symbol result which deals with HTML formatting.
 *
 * @author Nicolas Pope et al.
 * @constructor
 * @param symbol Internal EDEN symbol object.
 * @param name Name of the symbol.
 * @param Already detected type of the symbol: procedure,function,observable.
 * @param accentuation undefined, "exact-match" or "dirty-match" (doesn't match drop-down list filters)
 */
EdenUI.plugins.SymbolViewer.Symbol = function (symbol, name, type, accentuation) {
	this.symbol = symbol;
	this.name = name;
	this.type = type;
	this.details = undefined;
	this.update = undefined;

	this.element = $('<div class="symbollist-result-element"></div>');
	if (accentuation) {
		this.element.addClass("symbollist-" + accentuation + "-result");
	}

	// Select update method based upon symbol type.
	switch (type) {
		case 'func': this.update = this.updateFunction; break;
		case 'agent': this.update = this.updateProcedure; break;
		case 'obs': this.update = this.updateObservable; break;
	};

	var me = this;
	var singleClickPerformed = false;
	function closeEditor() {
		me.element.removeClass("symbollist-inline-editor");
		me.update();
		me.element.scrollLeft(0);
	}

	this.element.click(function () {
		if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol || singleClickPerformed) {
			return;
		}
		singleClickPerformed = true;
		setTimeout(function () {
			if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol || !singleClickPerformed) {
				return;
			}
			singleClickPerformed = false;
			var editorViewName = "edit_" + me.name;
			Eden.Selectors.goto("> :not(ACTIVE) >> "+symbol.name);
			//edenUI.createView(editorViewName, "ScriptInput", undefined).update([symbol]);
			//edenUI.eden.root.lookup("view_" + editorViewName + "_title").assign("Script for " + me.name, edenUI.eden.root.scope, Symbol.hciAgent);
			/*var val;
			if (typeof symbol.value() === 'function' && symbol.eden_definition !== undefined) {
				val = symbol.eden_definition;
			} else {
				if (symbol.definition) {
					val = symbol.eden_definition + ";";
				} else {
					val = me.name + " = " + Eden.edenCodeForValue(symbol.value()) + ";";
				}
			}

			$('#' + editorViewName + '-dialog').find('textarea').val(
				val
			);*/
		}, 350);
	});
	if (type == "obs") {
		this.element.dblclick(function () {
			singleClickPerformed = false;
			if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol === me) {
				return;
			}
			var value = me.symbol.cache.value;

			if (me.symbol.definition !== undefined || typeof(value) != "boolean") {
				EdenUI.plugins.SymbolViewer.inlineEditorSymbol = me;
				me.element.addClass("symbollist-inline-editor");
				var valueElement = me.element.find(".result_value");
				var operationElement = me.element.find(".result_separator");
				valueElement.html('');
				var currentEden, operation;
				if (me.symbol.definition !== undefined) {
					currentEden = me.symbol.getSource().replace(new RegExp("^\\s*" + name + "\\s+is\\s+"), "");
					operation = "is";
				} else {
					currentEden = Eden.edenCodeForValue(value);
					operation = "=";
				}
				var operationSelect = $('<select></select>');
				if (operation == "=") {
					operationSelect.append('<option value="is">is</option>');
					operationSelect.append('<option value="=" selected="selected">=</option>');
				} else {
					operationSelect.append('<option value="is" selected="selected">is</option>');
					operationSelect.append('<option value="=">=</option>');
				}
				operationElement.html(' ');
				operationElement.append(operationSelect);

				var currentEdenEscaped = Eden.htmlEscape(currentEden, true);
				var inputBox = $('<input type="text" value="' + currentEdenEscaped + '" spellcheck="false" style="width: 100%"/>');
				var inputBoxElem = inputBox.get(0);
				function submitInlineEdit () {
						var operation = operationSelect.get(0).value;
						var script = inputBoxElem.value;
						if (script.slice(-1) != ";") {
							script = script + ";";
						}
						eden.execute2(me.name + " " + operation + " " + script);
						closeEditor();
						EdenUI.plugins.SymbolViewer.inlineEditorSymbol = undefined;
				}
				function keyboardShortcuts(event) {
					var keyCode = event.which;
					if (keyCode == 13) {
						//Return key.  Submit code.
						submitInlineEdit();
					} else if (keyCode == 27) {
						//Escape key.  Abandon edits.
						closeEditor();
						EdenUI.plugins.SymbolViewer.inlineEditorSymbol = undefined;
					}
				}
				inputBox.on("keyup", keyboardShortcuts);
				inputBox.on("blur", function () {
					setTimeout(function () {
						if (!operationSelect.is(document.activeElement)) {
							closeEditor();
							setTimeout(function () {
								if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol === me) {
									EdenUI.plugins.SymbolViewer.inlineEditorSymbol = undefined;
								}
							}, 500);
						}
					}, 0);
				});
				operationSelect.on("keydown", keyboardShortcuts);
				operationSelect.on("blur", function () {
					setTimeout(function () {
						if (!inputBox.is(document.activeElement)) {
							closeEditor();
							setTimeout(function () {
								if (EdenUI.plugins.SymbolViewer.inlineEditorSymbol === me) {
									EdenUI.plugins.SymbolViewer.inlineEditorSymbol = undefined;
								}
							}, 500);
						}
					}, 0);
				});
				valueElement.append(inputBox);
				//Remove tooltip
				var tooltips = me.element.find(".symbollist-result-inner");
				if (tooltips.length > 0) {
					tooltips.get(0).onmouseenter = undefined;
				}
				EdenUI.closeTooltip();
				//Select the most likely part of the value or definition to replace.
				inputBoxElem.focus();
				inputBoxElem.select();
				var firstChar = currentEden.slice(0, 1);
				if (firstChar == '"' || firstChar == "'" || firstChar == "[" || firstChar == "{") {
					inputBoxElem.selectionStart = 1;
					inputBoxElem.selectionEnd = currentEden.length - 1;
				}
			} else if (value === true) {
				me.symbol.assign(false, eden.root.scope, Symbol.hciAgent, true);
			} else {
				me.symbol.assign(true, eden.root.scope, Symbol.hciAgent, true);
			}
		});
	}

	this.update();
};

/**
 * Update the HTML output of a function type symbol. Looks for any meta data
 * for this function, such as parameters and description.
 */
EdenUI.plugins.SymbolViewer.Symbol.prototype.updateFunction = function () {
	var eden_definition = this.symbol.getSource();
	var nameHTML;
	var detailsHTML;

	if (this.symbol.definition !== undefined && !/^func\s/.test(eden_definition)) {
		nameHTML = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		nameHTML = this.name;
	}

	// If there are details for this function in the function meta data
	if (edenfunctions.functions != undefined && edenfunctions.functions[this.name] !== undefined) {
		this.details = edenfunctions.functions[this.name];
		// Extract parameters for display.
		var params = Object.keys(this.details.parameters || {});
		detailsHTML = "<span class='result_parameters'>( " + params.join(", ") + " )</span>";
	} else {
		detailsHTML = "";
	}

	var html = "<span class='result_name'>" + nameHTML + "</span>" + detailsHTML;

	if (this.symbol.definition !== undefined && !/^func\s/.test(this.symbol.eden_definition)) {
		var tooltip = Eden.htmlEscape(eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre>" + tooltip + ";</pre>");
		html = "<span class='symbollist-result-inner' onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
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
		var tooltip = Eden.htmlEscape(this.symbol.getSource(), false, true);
		tooltip = Eden.htmlEscape("<pre class='symbollist-tooltip'>" + tooltip + ";</pre>");
		html = "<span class='symbollist-result-inner' onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	this.element.html(html);
};

/**
 * Update the HTML output of a procedure symbol.
 */
EdenUI.plugins.SymbolViewer.Symbol.prototype.updateProcedure = function () {
	var eden_definition = this.symbol.getSource();
	var nameHTML, detailsHTML;

	if (this.symbol.definition !== undefined && !/^proc\s/.test(eden_definition)) {
		nameHTML = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		nameHTML = this.name;
	}

	// If there are details for this function in the function meta data
	if (edenfunctions.functions != undefined && edenfunctions.procedures[this.name] !== undefined) {
		this.details = edenfunctions.procedures[this.name];
		// Extract parameters for display.
		var params = Object.keys(this.details.parameters || {});
		detailsHTML = "<span class='result_parameters'>( " + params.join(", ") + " )</span>";
	} else {
		detailsHTML = "";
	}

	var html = "<span class='result_name'>" + nameHTML + "</span>" + detailsHTML;

	if (this.symbol.definition !== undefined && !/^proc\s/.test(eden_definition)) {
		var tooltip = Eden.htmlEscape(eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre>" + tooltip + ";</pre>");
		html = "<span class='symbollist-result-inner' onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	this.element.html(html);
};
