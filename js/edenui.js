function observable_dialog(symbol) {
	var myeditor;

	$code_html = '<div id="obs_inspector_' + symbol.name.substr(1) + '" class="obs_inspector"><div></div><pre class="eden exec">';
	if (symbol.definition === undefined) {
		$code_html = $code_html + symbol.name.substr(1) + " = " + symbol.value() + ';';
	} else {
		$code_html = $code_html + symbol.eden_definition + ';';
	}
	$code_html = $code_html + "</pre></div>";

	$dialog = $('<div></div>');
	$dialog.html($code_html);
	$dialog.dialog({
		title: 'Observable: ' + symbol.name.substr(1),
		width: 350,
		height: 150,
		minWidth: 250,
		minHeight: 150,
		buttons: {
				Save: function() {
					try {
						eden.addHistory(myeditor.getValue());
						eval(Eden.translateToJavaScript(myeditor.getValue()));
						//myeditor.setValue("");
						//printSymbolTable();
						//printAllUpdates();
						//eden.saveLocalModelState();
					} catch(e) {
						$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>\n" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
						eden.errornumber = eden.errornumber + 1;
					}
				}
			}
	});

	myeditor = convertToEdenPageNew('#obs_inspector_'+symbol.name.substr(1),'defedit');
};

function function_dialog(symbol) {
	var myeditor;

	$code_html = '<div id="obs_inspector_' + symbol.name.substr(1) + '" class="obs_inspector"><div></div><pre class="eden exec">';
	if (symbol.definition === undefined) {
		$code_html = $code_html + symbol.name.substr(1) + " = " + symbol.value() + ';';
	} else {
		$code_html = $code_html + symbol.eden_definition + ';';
	}
	$code_html = $code_html + "</pre></div>";

	$dialog = $('<div></div>');
	$dialog.html($code_html);
	$dialog.dialog({
		title: 'Function: ' + symbol.name.substr(1),
		width: 350,
		height: 150,
		minWidth: 250,
		minHeight: 150,
		buttons: {
				Save: function() {
					try {
						eden.addHistory(myeditor.getValue());
						eval(Eden.translateToJavaScript(myeditor.getValue()));
						//myeditor.setValue("");
						//printSymbolTable();
						//printAllUpdates();
						//eden.saveLocalModelState();
					} catch(e) {
						$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>\n" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
						eden.errornumber = eden.errornumber + 1;
					}
				}
			}
	});

	myeditor = convertToEdenPageNew('#obs_inspector_'+symbol.name.substr(1),'defedit');
};
