
// XXX: need to get rid of this function, much more sensible to have observation of the symbol table
// and add entries as they are added
function printSymbolTable() {
	$('#symbol-table').html('');
	$.each(root.symbols, function(name,symbol) { 
		if (symbol.definition !== undefined) {
			$('<li></li>').text(symbol.eden_definition + '; = ' + symbol.value()).appendTo($('#symbol-table')).click(function() { $('#source').text(symbol.eden_definition + ';'); });
		} else {
			$('<li></li>').text(name + ' = ').append(
				$('<input type="text" />').val(symbol.value()).change(function(e) {
					var $input = $(this);
					symbol.assign(Number($input.val()));
					setTimeout(printSymbolTable);
				})
			).appendTo($('#symbol-table'));
		}
	});
}

var selected_observable = null;
var selected_function = null;

function printObservables(pattern) {
	obspos = 0;

	$('#observable-results').html('');
	var reg = new RegExp("^"+pattern+".*");
	var myeditor;
	$.each(root.symbols, function(name,symbol) { 
		if (name.search(reg) == -1) { return; }
		if (symbol.definition !== undefined) {
			var subs = symbol.eden_definition.substring(0,4);
			if (subs == "proc" || subs == "func") { return; }
		}

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

		var ele = $('<div id="sbobs_' + name + '" class="result-element"></div>');
		ele.html(namehtml + "<span class='result_value'> = " + valhtml + "</span>").appendTo($('#observable-results'));
		ele.get(0).symbol = symbol;
	});

	$("#observable-results > div").hover(
		function() {
			if (this != selected_observable) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			}
			var info = $('#observable-info');

			if (this.symbol.definition !== undefined) {
				var iname = info.find('#observable-info-name');
				iname.text(this.symbol.eden_definition);
				info.css("left", "" + (this.offsetLeft + this.offsetWidth) + "px");
				info.css("top", "" + (this.offsetTop + 125 - 8 - ((info[0].offsetHeight / 2))) + "px");
				info.show();
			} else {
				info.hide();
			}
		}, function() {
			$('#observable-info').hide();
			if (this != selected_observable) {
				$(this).animate({backgroundColor: "white"}, 100);
			}
		}	
	).click(function() {
		if (selected_observable != null) {
			$(selected_observable).animate({backgroundColor: "white"}, 100);
		}
		selected_observable = this;
		$(this).animate({backgroundColor: "#ffebc9"}, 100);

		this.dialog = observable_dialog(this.symbol, this.dialog);
	});

	if ($('#observable-results')[0].offsetHeight > (14*16)) {
		$('#observable-scrollup').show();
		$('#observable-scrolldown').show();
	} else {
		$('#observable-scrollup').hide();
		$('#observable-scrolldown').hide();
	}
}

function printFunctions(pattern) {
	funcspos = 0;

	$('#function-results').html('');
	var reg = new RegExp(pattern+".*");
	$.each(root.symbols, function(name,symbol) { 
		if (name.search(reg) == -1) { return; }
		if (symbol.definition === undefined) { return; }
		if (symbol.eden_definition === undefined) { return; }

		var subs = symbol.eden_definition.substring(0,4);
		if (subs != "func") { return; }

		var funchtml = name;
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

		var resel = $('<div class="result-element"></div>');
		resel.html(funchtml).appendTo($('#function-results'));
		resel.get(0).details = details;
		resel.get(0).symbol = symbol;
	});

	$("#function-results > div").hover(
		function() {
			if (this != selected_function) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			}

			var info = $('#observable-info');

			if (this.details !== undefined) {
				var iname = info.find('#observable-info-name');
				iname.text(this.details.description);
				info.css("left", "" + (this.offsetLeft + this.offsetWidth) + "px");
				info.css("top", "" + (this.offsetTop + 125 - 8 - ((info[0].offsetHeight / 2))) + "px");
				info.show();
			} else {
				info.hide();
			}
		}, function() {
			$('#observable-info').hide();
			if (this != selected_function) {
				$(this).animate({backgroundColor: "white"}, 100);
			}
		}	
		).click(function() {
		if (selected_function != null) {
			$(selected_function).animate({backgroundColor: "white"}, 100);
		}
		selected_function = this;
		$(this).animate({backgroundColor: "#ffebc9"}, 100);

		this.dialog = function_dialog(this.symbol, this.dialog);
	});

	if ($('#function-results')[0].offsetHeight > (14*16)) {
		$('#function-scrollup').show();
		$('#function-scrolldown').show();
	} else {
		$('#function-scrollup').hide();
		$('#function-scrolldown').hide();
	}
}

function printProcedures(pattern) {
	procspos = 0;

	$('#procedure-results').html('');
	var reg = new RegExp(pattern+".*");
	$.each(root.symbols, function(name,symbol) { 
		if (name.search(reg) == -1) { return; }
		if (symbol.definition === undefined) { return; }
		if (symbol.eden_definition === undefined) { return; }

		var subs = symbol.eden_definition.substring(0,4);
		if (subs != "proc") { return; }

		var proc = $('<div class="result-element"></div>');
		proc.text(name).appendTo($('#procedure-results'));

		proc.get(0).symbol = symbol;
	});

	$("#procedure-results > div").hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
		).click(function() {
		
		this.dialog = procedure_dialog(this.symbol, this.dialog);
	});

	if ($('#procedure-results')[0].offsetHeight > (14*16)) {
		$('#procedure-scrollup').show();
		$('#procedure-scrolldown').show();
	} else {
		$('#procedure-scrollup').hide();
		$('#procedure-scrolldown').hide();
	}
}

var selected_project = null;

function printProjects(pattern) {
	procspos = 0;

	$('#project-results').html('');
	var reg = new RegExp("^"+pattern+".*");
	var i = 0;
	while (projects.projects[i] !== undefined) {
		if (projects.projects[i].name.search(reg) == -1) { i = i + 1; continue; }

		var proj = $('<div class="result-element"></div>');
		proj[0].project = projects.projects[i];
		proj.html(projects.projects[i].name  + "<span class='result_value'> by " + projects.projects[i].author + " (" + projects.projects[i].year + ")</span>").appendTo($('#project-results'));

		i = i + 1;
	}

	$("#project-results > div").hover(
		function() {
			if (this != selected_project) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			}
		}, function() {
			if (this != selected_project) {
				$(this).animate({backgroundColor: "white"}, 100);
			}
		}	
	).click(function () {
		if (selected_project != null) {
			$(selected_project).animate({backgroundColor: "white"}, 100);
		}
		selected_project = this;
		$(this).animate({backgroundColor: "#ffebc9"}, 100);
		Eden.executeFile(this.project.runfile);
		printAllUpdates();
	});

	if ($('#project-results')[0].offsetHeight > (14*16)) {
		$('#project-scrollup').show();
		$('#project-scrolldown').show();
	} else {
		$('#project-scrollup').hide();
		$('#project-scrolldown').hide();
	}
}

function printAllUpdates() {
	//printObservables($('#observable-search')[0].value);
	printFunctions($('#function-search')[0].value);
	printProcedures($('#procedure-search')[0].value);
}

var $dialog;
var root;
var eden;
var stored_script;
var obspos = 0;
var procspos = 0;
var funcspos = 0;
var projects;
var edenfunctions = {};

function js_eden_init() {

	$.ajax({
		url: "models/projects.json",
		success: function(data) {
			projects = JSON.parse(data);
			printProjects("");
		},
		cache: false,
		async: true
	});

	$(window).resize(function() {
		$("#d1canvas").attr("width", $("#eden-content").width()-40);
		$("#d1canvas").attr("height", $("#tabs").height()-80);
	});

	$(document).ready(function() {
		//runTests(all_the_tests);
		root = new Folder();
		eden = new Eden(root);

		$("#d1canvas").attr("width", $("#eden-content").width()-40);
		$("#d1canvas").attr("height", $("#tabs").height()-80);

		modelbase = "";

		$("#tabs").tabs();

		$("#observable-info").hide();

		$.ajax({
			url: "version.php",
			success: function(data) {
				$('#version-number').html("js-eden "+data);
			},
			cache: false,
			async: true
		});

		$.ajax({
			url: "library/functions.json",
			success: function(data) {
				edenfunctions = JSON.parse(data);
				printFunctions("");
			},
			cache: false,
			async: true
		});

		$(".side-bar-topic-title").hover(function() {
			$(this).animate({backgroundColor: "#ab0000"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "#3f3f3f"}, 100);
		});

		$(".side-bar-topic").each(function() {
			var me = $(this).find(".side-bar-topic-content");

			$(this).find(".side-bar-topic-title").click( function() {
				me.animate({height: "300px"}, 100);
				$(".side-bar-topic-content").each(function() {
					if (this != me[0]) {
						$(this).animate({height: "0px"}, 100);
					}
				});
			});
		});

		//$("#observable-results").hover(null,function() {
		//	$("#observable-info").hide();
		//});

		$('#observable-scrollup').click(function() {
			obspos = obspos + (14*16);
			if (obspos > 0) { obspos = 0; }
			$('#observable-results > div').animate({top: ""+obspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
			$(this).css("backgroundImage", "url('images/scrollup-sel.png')");
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
			$(this).css("backgroundImage", "url('images/scrollup.png')");
		});

		$('#observable-scrolldown').click(function() {
			obspos = obspos - (14*16);
			if (obspos <= 0 - ($('#observable-results')[0].offsetHeight)) { obspos = obspos + (14*16); }
			$('#observable-results > div').animate({top: ""+obspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
			$(this).css("backgroundImage", "url('images/scrolldown-sel.png')");
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
			$(this).css("backgroundImage", "url('images/scrolldown.png')");
		});

		$("#observable-search").keyup(function() {
			printObservables(this.value);
		});
		printObservables("");

		$('#function-scrollup').click(function() {
			funcspos = funcspos + (14*16);
			if (funcspos > 0) { funcspos = 0; }
			$('#function-results > div').animate({top: ""+funcspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		});

		$('#function-scrolldown').click(function() {
			funcspos = funcspos - (14*16);
			if (funcspos <= 0 - ($('#function-results')[0].offsetHeight)) { funcspos = funcspos + (14*16); }
			$('#function-results > div').animate({top: ""+funcspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		});

		$("#function-search").keyup(function() {
			printFunctions(this.value);
		});
		printFunctions("");

		$('#procedure-scrollup').click(function() {
			procspos = procspos + (14*16);
			if (procspos > 0) { procspos = 0; }
			$('#procedure-results > div').animate({top: ""+procspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		});

		$('#procedure-scrolldown').click(function() {
			procspos = procspos - (14*16);
			if (procspos <= 0 - ($('#procedure-results')[0].offsetHeight)) { procspos = procspos + (14*16); }
			$('#procedure-results > div').animate({top: ""+procspos+"px"},300);
		}).hover(function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		});

		$("#procedure-search").keyup(function() {
			printProcedures(this.value);
		});
		printProcedures("");

		$("#project-search").keyup(function() {
			printProjects(this.value);
		});

		root.addGlobal(function (sym, create) {
			//console.log("Obs changed: " + sym.name.substr(1));

			if (create) {
				printObservables($('#observable-search')[0].value);
				return;
			}

			var me = $("#sbobs_"+sym.name.substr(1));
			if (me === undefined) { return; }
			
			var namehtml;
			if (sym.definition !== undefined) {
				namehtml = "<span class=\"hasdef_text\">"+sym.name.substr(1)+"</span>";
			} else {
				namehtml = sym.name.substr(1);
			}

			var val = sym.value();
			var valhtml;
			if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
			else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
			else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
			else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
			else { valhtml = val; }


			me.html(namehtml + "<span class='result_value'> = " + valhtml + "</span>");
		});


		/*$(root).bind('symbolCreate', function(event, symbol, name) { 
			$(symbol).bind('symbolMutate', function(event, name) { printSymbolTable(); });
			$(symbol).bind('symbolDefine', function(event, name) { printSymbolTable(); });
			$(symbol).bind('symbolAssign', function(event, name) { printSymbolTable(); });
			printSymbolTable(); 
		});*/

		var myeditor;

		$code_entry = $('<div id="eden-input"><div></div><pre class="eden exec"></pre></div>');
		$dialog = $('<div id="interpreter-window"></div>')
			.html($code_entry)
			.dialog({
				title: "EDEN Interpreter Window", 
				width: 450,
				height: 240,
				minHeight: 240,
				minWidth: 400,
				position: ['right','bottom'],
				buttons: {
					Submit: function() {
						try {
							eden.addHistory(myeditor.getValue());
							eval(Eden.translateToJavaScript(myeditor.getValue()));
							myeditor.setValue("");
							//printSymbolTable();
							printAllUpdates();
							//eden.saveLocalModelState();
						} catch(e) {
							$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
							eden.errornumber = eden.errornumber + 1;
						}
					},
					Previous: function() {
						myeditor.setValue(eden.previousHistory());
					},
					Next: function() {
						myeditor.setValue(eden.nextHistory());
					}
				}
			});

		myeditor = convertToEdenPageNew('#eden-input','code');

		//convertToEdenPage('#interpreter-window');

		/*$donald_entry = $('<canvas id="d1canvas" width=500 height=500 style="border-color: black; border-width: 1px; border-style: solid;"></canvas>');
		$donald = $('<div id="donald-window"></div>')
			.html($donald_entry)
			.dialog({
				width: "530px",
				title: "DONALD", 
			});*/
		
		//$('.ui-dialog-titlebar a', $dialog.parent()).remove();
		$('<pre id="error-window" style="font-family:monospace;"></pre>').appendTo($('body'));

		Eden.executeFile("library/eden.jse");
	});
}
