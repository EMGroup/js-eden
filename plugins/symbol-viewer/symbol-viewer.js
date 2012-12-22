/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 * @class SymbolViewer Plugin
 */
Eden.plugins.SymbolViewer = function(context) {
	var me = this;

	/** @private */
	var edenfunctions = {};

	//Obtain function meta data from server
	$.ajax({
		url: "library/functions.json",
		dataType: 'json',
		success: function(data) {
			edenfunctions = data;
			//initialiseAllViewers("");
		},
		cache: false,
		async: true
	});

	/** @public */
	this.instances = new Array();

	var add_function = function(symresults, symbol, name) {
		var funchtml = "<li class=\"type-function\"><span class=\"result_name\">" + name + "</span>";
		var details;
		if (edenfunctions.functions != undefined && edenfunctions.functions[name] !== undefined) {
			details = edenfunctions.functions[name];
			funchtml = funchtml + "<span class='result_value'> ( ";
			if (edenfunctions.functions[name].parameters !== undefined) {
				for (x in edenfunctions.functions[name].parameters) {
					funchtml = funchtml + x + ", ";
				}
				funchtml = funchtml.substr(0,funchtml.length-2) + " )</span>";
			} else {
				funchtml = funchtml + " )</span>";
			}
		}
		funchtml = funchtml + "</li>";
		var resel = $('<div class="symbollist-result-element"></div>');
	
		// Bit of a hack, need to check if the function actually has a draw() method instead of just checking that the function starts with a capital letter
		(/^[A-Z]/.test(name)) ? resel.html(funchtml).appendTo($('#drawable-results')) : resel.html(funchtml).appendTo(symresults);
	//	resel.html(funchtml).appendTo($('#function-results'));
		resel.get(0).details = details;
		resel.get(0).symbol = symbol;

		resel.hover(
			function() {
				//if (this != selected_function) {
				//	$(this).animate({backgroundColor: "#eaeaea"}, 100);
				//}

				//var info = $('#functions-info');

				//if (this.details !== undefined) {
				//	var iname = info.find('#functions-info-name');
				//	iname.text(this.details.description);
				//	info.css("left", "" + (this.offsetLeft + this.offsetWidth) + "px");
				//	info.css("top", "" + (this.offsetTop + 125 - 8 - 16 - ((info[0].offsetHeight / 2))) + "px");
				//	info.show();
				//} else {
				//	info.hide();
				//}
			}, function() {
				//$('#functions-info').hide();
				//if (this != selected_function) {
				//	$(this).animate({backgroundColor: "white"}, 100);
				//}
			}	
			).click(function() {
				//if (selected_function != null) {
				//	$(selected_function).animate({backgroundColor: "white"}, 100);
				//}
				//selected_function = this;
				//$(this).animate({backgroundColor: "#ffebc9"}, 100);

				//this.dialog = function_dialog(this.symbol, this.dialog);
			}
		);
	}

	var add_observable = function(symresults, symbol, name) {
		var val = symbol.value();
		var valhtml;
		if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
		else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
		else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
		else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
		else { valhtml = val; }

		var namehtml;
		if (symbol.definition !== undefined) {
			namehtml = "<span class=\"hasdef_text\">"+name+"</span>";
		} else {
			namehtml = name;
		}

		var ele = $('<div id="sbobs_' + name + '" class="symbollist-result-element"></div>');
		ele.html("<li class=\"type-observable\"><span class=\"result_name\">" + namehtml + "</span><span class='result_value'> = " + valhtml + "</span></li>").appendTo(symresults);
		ele.get(0).symbol = symbol;

		ele.hover(
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
			//if (selected_observable != null) {
			//	$(selected_observable).animate({backgroundColor: "white"}, 100);
			//}
			//selected_observable = this;
			//$(this).animate({backgroundColor: "#ffebc9"}, 100);

			//this.dialog = observable_dialog(this.symbol, this.dialog);
		});
	};

	var add_procedure = function(symresults, symbol, name) {
		var proc = $('<div class="symbollist-result-element"></div>');
		proc.html("<li class=\"type-procedure\"><span class=\"result_name\">" + name + "</span></li>").appendTo(symresults);

		proc.get(0).symbol = symbol;

		proc.hover(
			function() {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			}, function() {
				$(this).animate({backgroundColor: "white"}, 100);
			}	
			).click(function() {
		
			//this.dialog = procedure_dialog(this.symbol, this.dialog);
			}
		);
	};

	var shouldAdd = function(maybeRegex, name) {
		return !maybeRegex || name.search(maybeRegex) != -1;
	}

	/** @private */
	var initialiseAllViewers = function(pattern) {
		for (x in me.instances) {
			initialiseViewer(me.instances[x],pattern);
		}
	}

	/** @private */
	var initialiseViewer = function(element,pattern) {
		//Clear existing results and start again
		var symresults = $(element).find(".symbollist-results");
		symresults.html('');

		var type = element.symboltype;
		var reg = new RegExp("^"+pattern+".*");

		//For every js-eden symbol
		$.each(root.symbols, function (name, symbol) {
			if (shouldAdd(reg,name)) {
				//Does the symbol have a definition
				if (!symbol.definition || !symbol.eden_definition) {
					if ((type == "obs") || (type == "all")) {
						add_observable(symresults,symbol, name);
						//return;
					}
				} else {
					//Find out what kind of definition it is (proc, func or plain)
					var subs = symbol.eden_definition.substring(0,4);
			
					if (subs == "proc" && ((type == "agent") || (type == "all"))) {
						add_procedure(symresults,symbol, name);
					} else if (subs == "func" && ((type == "func") || (type == "all"))) {
						add_function(symresults,symbol, name);
					} else if (subs != "proc" && subs != "func" && (type == "obs") || (type == "all")) {
						console.log(subs);
						add_observable(symresults,symbol, name);
					}
				}
			}
		});
	}

	/** @private */
	var generateHTML = function() {
		return "<div class=\"search-box-outer\">\
			<input type=\"text\" class=\"symbollist-search search-box\"></input>\
		</div>\
		<div class=\"symbollist-results\"></div>";
	};

	/** @public */
	this.createDialog = function(name,mtitle,type) {
		code_entry = $('<div></div>');
		code_entry.html(generateHTML());

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 280,
				height: 400,
				minHeight: 120,
				minWidth: 230,
				//position: ['right','bottom'],
			});

		me.instances.push(code_entry[0]);
		code_entry[0].symboltype = type;
		initialiseViewer(code_entry[0],"");
		code_entry.find(".search-box-outer > .symbollist-search").keyup(function() {
			initialiseViewer($(this).parent().parent()[0],this.value);
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

	var symbolChanged = function(sym, create) {

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
