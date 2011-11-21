function convertToEdenPage(page) {
	$('.exec', page).each(function() {
		var $area = $('<div class="code"></div>');
		var $previous = $(this).prev();
		var $code = $(this).clone();

		$(this).remove();
		$area.insertAfter($previous);
		var editor;
		if ($code.hasClass('eden')) {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "eden"
			});
		} else {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "javascript"
			});
		}
	});
}


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

function printObservables(pattern) {
	obspos = 0;

	$('#observable-results').html('');
	var reg = new RegExp("^"+pattern+".*");
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

		var ele = $('<div class="result-element"></div>');
		ele.html(name + "<span class='result_value'> = " + valhtml + "</span>").appendTo($('#observable-results'));
		ele.get(0).symbol = symbol;
	});

	$("#observable-results > div").hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);

			/*var info = $('#observable-info');
			var iname = info.find('#observable-info-name');
			var val = this.symbol.value();
			iname.removeClass();
			if (val === undefined) {
				iname.addClass("error_text");
				iname.text("undefined");
			} else {
				if (typeof val == "boolean") { iname.addClass("special_text"); }
				else if (typeof val == "number") { iname.addClass("numeric_text"); }
				else if (typeof val == "string") { iname.addClass("string_text"); }
				iname.text(val);
			}
			info.css("left", "" + (this.offsetLeft + this.offsetWidth - 50) + "px");
			info.css("top", "" + (this.offsetTop + 125 - ((info[0].offsetHeight / 2) - 8)) + "px");
			info.show();*/
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
		).click(function() {
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

		var subs = symbol.eden_definition.substring(0,4);
		if (subs != "func") { return; }

		$('<div class="result-element"></div>').text(name).appendTo($('#function-results'));
	});

	$("#function-results > div").hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
		);

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

		var subs = symbol.eden_definition.substring(0,4);
		if (subs != "proc") { return; }

		$('<div class="result-element"></div>').text(name).appendTo($('#procedure-results'));
	});

	$("#procedure-results > div").hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
		);

	if ($('#procedure-results')[0].offsetHeight > (14*16)) {
		$('#procedure-scrollup').show();
		$('#procedure-scrolldown').show();
	} else {
		$('#procedure-scrollup').hide();
		$('#procedure-scrolldown').hide();
	}
}

function printAllUpdates() {
	printObservables($('#observable-search')[0].value);
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

function js_eden_init() {

	$(document).ready(function() {
		//runTests(all_the_tests);
		root = new Folder();
		eden = new Eden(root);

		modelbase = "";

		Eden.executeFile("library/eden.eden");

		$("#observable-info").hide();

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




		/*$(root).bind('symbolCreate', function(event, symbol, name) { 
			$(symbol).bind('symbolMutate', function(event, name) { printSymbolTable(); });
			$(symbol).bind('symbolDefine', function(event, name) { printSymbolTable(); });
			$(symbol).bind('symbolAssign', function(event, name) { printSymbolTable(); });
			printSymbolTable(); 
		});*/

		$code_entry = $('<textarea spellcheck="false" rows="10" class="code-entry"></textarea>');
		$dialog = $('<div id="interpreter-window"></div>')
			.html($code_entry)
			.dialog({
				title: "EDEN Interpreter Window", 
				width: "400px",
				buttons: {
					Previous: function() {
						$code_entry.val(eden.previousHistory());
					},
					Next: function() {
						$code_entry.val(eden.nextHistory());
					},
					Submit: function() {
						try {
							eden.addHistory($code_entry.val());
							eval(Eden.translateToJavaScript($code_entry.val()));
							$code_entry.val('');
							//printSymbolTable();
							printAllUpdates();
							//eden.saveLocalModelState();
						} catch(e) {
							$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>\n" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
							eden.errornumber = eden.errornumber + 1;
						}
					}
				}
			});

		//convertToEdenPage('#interpreter-window');

		/*$donald_entry = $('<canvas id="d1canvas" width=500 height=500 style="border-color: black; border-width: 1px; border-style: solid;"></canvas>');
		$donald = $('<div id="donald-window"></div>')
			.html($donald_entry)
			.dialog({
				width: "530px",
				title: "DONALD", 
			});*/
		
		$('.ui-dialog-titlebar a', $dialog.parent()).remove();
		$('<pre id="error-window" style="font-family:monospace;"></pre>').appendTo($('body'));
	});
}
