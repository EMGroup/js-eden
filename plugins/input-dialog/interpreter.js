/**
 * JS-Eden InputWindow Plugin.
 * This plugin provides createInputWindow and embedInputWindow methdods which
 * respectively create an input window dialog for entering JS-Eden code or
 * embed an input window into an existing div element. A history is also
 * kept of all inputs (in all input windows).
 * @class InputWindow Plugin
 */
Eden.plugins.InputWindow = function(context) {
	var me = this;
	/**
	 * Record of the input history for this window.
	 * @public
	 */
	this.history = new Array();

	/** @private */
	var index = 0;

	/** @private */
	var addHistory = function(text) {
		me.history.push({input: text, time: ((new Date()).getTime())});
		index = me.history.length;
	}

	/** @private */
	var getHistory = function(index) {
		if (me.history.length == 0) {
			return "";
		} else {
			return me.history[index].input;
		}
	}

	/** @private */
	var previousHistory = function() {
		if (index <= 0) {
			index = 1;
		}
		if (index > me.history.length) {
			index = me.history.length;
		}
		return getHistory(--index);
	}

	/** @private */
	var nextHistory = function() {
		if (index < 0) {
			index = 0;
		}
		if (index >= me.history.length-1) {
			index++;
			return "";
		}
		return getHistory(index);
	}

	/** @private */
	var loadPreviousEdenCode = function(options) {
		options.editor.setValue(previousHistory());
	}

	/** @private */
	var loadNextEdenCode = function(options) {
		options.editor.setValue(nextHistory());
	}

	/** @private */
	var submitEdenCode = function(options) {
		var editor = options.editor;
		var edenparser = options.edenparser;
		try {
			var myvalue;
			addHistory(editor.getValue());
		
			if (edenparser !== undefined) {
				//Parse special notation to eden
			} else {
				myvalue = editor.getValue();
			}
		
			eval(Eden.translateToJavaScript(myvalue));
			editor.setValue("");
		} catch (e) {
			//var contents = $('#history-'+this.history.length).html();
			//$('#history-'+eden.history.length).attr('class','history-error').html('## '+contents);
			//TODO: Add error to history entry
			Eden.reportError(e);
		}
	}

	/** @private */
	var closeInput = function(options) {
		var $dialog = options.$dialog;
		$dialog.dialog('close');
	}

	/** @private */
	var openInput = function(options) {
		var $dialog = options.$dialog;

		$dialog.dialog('open');
		$(options.editor.getInputField()).focus();
	}

	/** TODO: Move. This does not belong here */
	/** @private */
	//var openObservablesAndAgents = function(options) {
	//	$('#symbol-search > .side-bar-topic-title').click();
	//	$('#observable-search').focus();
	//}

	/** @private */
	var KEYBINDINGS = {
		'alt+shift+i': closeInput,
		'alt+i': openInput,
		'alt+a': submitEdenCode,
		//'alt+o': openObservablesAndAgents,
		'alt+p': loadPreviousEdenCode,
		'alt+n': loadNextEdenCode
	};

	/** @private */
	var setupKeyBind = function(options, keyCombo, callback) {
		$(document).bind('keydown', keyCombo, function () {
			callback && callback(options);
		});
	}

	/** @private */
	var setupAllKeyBinds = function(options) {
		for (var keyCombo in KEYBINDINGS) {
			setupKeyBind(options, keyCombo, KEYBINDINGS[keyCombo]);
		}
	}

	/** @public */
	this.createEmbedded = function(name, edenparser) {

	}

	var generateHistory = function() {
		result = "";
		for (var i=0; i<me.history.length; i++) {
			result = result + "<div class=\"inputwindow-history-line\">" + me.history[i].input + "</div>";
		}
		return result;
	}

	this.createHistory = function(name,mtitle) {
		$dialog = $('<div id="'+name+'"></div>')
			.html(generateHistory())
			.dialog({
				title: mtitle,
				width: 600,
				height: 400,
				minHeight: 200,
				minWidth: 400,
				//position: ['right','bottom'],

				buttons: [
					{
						text: "Save",
						click: function() {
							//loadNextEdenCode({editor: myeditor});
						}
					}
				]
			});
	}

	/** @public */
	this.createDialog = function(name, mtitle, edenparser) {
		var myeditor;

		$code_entry = $('<div id="'+name+'-input"><div></div><pre class="eden exec"></pre></div>');
		$dialog = $('<div id="'+name+'"></div>')
			.html($code_entry)
			.dialog({
				title: mtitle,
				width: 450,
				height: 240,
				minHeight: 120,
				minWidth: 230,
				//position: ['right','bottom'],

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

	//Add views.
	context.views.InputWindow = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "JS-Eden Input Window"
	};
	context.views.History = {
		dialog: this.createHistory,
		title: "Input History"
	};
	//Make history available in the main context.
	context.history = this.history;
};

/* Plugin meta information */
Eden.plugins.InputWindow.title = "Input Window";
Eden.plugins.InputWindow.description = "EDEN style script input window";
Eden.plugins.InputWindow.author = "Nicolas Pope and Tim Monks";
