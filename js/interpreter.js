function loadPreviousEdenCode(options) {
	options.editor.setValue(eden.previousHistory());
}

function loadNextEdenCode(options) {
	options.editor.setValue(eden.nextHistory());
}

function submitEdenCode(options) {
	var editor = options.editor;
	var edenparser = options.edenparser;
	try {
		var myvalue;
		eden.addHistory(editor.getValue());
		
		if (edenparser !== undefined) {
			//Parse special notation to eden
		} else {
			myvalue = editor.getValue();
		}
		
		eval(Eden.translateToJavaScript(myvalue));
		editor.setValue("");
		printAllUpdates();
	} catch(e) {
		$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
		eden.errornumber = eden.errornumber + 1;
	}
}

function closeInput(options) {
	var $dialog = options.$dialog;
	$dialog.dialog('close');
}

function openInput(options) {
	var $dialog = options.$dialog;

	$dialog.dialog('open');
	$(options.editor.getInputField()).focus();
}

function openObservablesAndAgents(options) {
	$('#symbol-search > .side-bar-topic-title').click();
	$('#observable-search').focus();
}

var KEYBINDINGS = {
	'alt+shift+i': closeInput,
	'alt+i': openInput,
	'alt+a': submitEdenCode,
	'alt+o': openObservablesAndAgents,
	'alt+p': loadPreviousEdenCode,
	'alt+n': loadNextEdenCode
};

function setupKeyBind(options, keyCombo, callback) {
	$(document).bind('keydown', keyCombo, function () {
		callback && callback(options);
	});
}

function setupAllKeyBinds(options) {
	for (var keyCombo in KEYBINDINGS) {
		setupKeyBind(options, keyCombo, KEYBINDINGS[keyCombo]);
	}
}

function make_interpreter(name, mtitle, edenparser) {

	var myeditor;

	$code_entry = $('<div id="'+name+'-input"><div></div><pre class="eden exec"></pre></div>');
	$dialog = $('<div id="'+name+'interpreter-window"></div>')
		.html($code_entry)
		.dialog({
			title: mtitle,
			width: 450,
			height: 240,
			minHeight: 120,
			minWidth: 230,
			position: ['right','bottom'],
			buttons: [
				{
					id: "btn-submit",
					text: "Submit",
					click: function() {
						submitEdenCode({editor: myeditor});
					}
				},
				{
					text: "Previous",
					click: function() {
						loadPreviousEdenCode({editor: myeditor});
					}
				},
				{
					text: "Next",
					click: function() {
						loadNextEdenCode({editor: myeditor});
					}
				}
			]
		});
	input_dialog = $dialog;

	$("#btn-submit").css("margin-right", "30px");

	myeditor = convertToEdenPageNew('#'+name+'-input','code');

	setupAllKeyBinds({
		$dialog: $dialog,
		editor: myeditor,
		edenparser: edenparser
	});
}