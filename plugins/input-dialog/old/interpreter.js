/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden InputWindow Plugin.
 * This plugin provides createInputWindow and embedInputWindow methdods which
 * respectively create an input window dialog for entering JS-Eden code or
 * embed an input window into an existing div element. A history is also
 * kept of all inputs (in all input windows).
 * @class InputWindow Plugin
 */

 joe.log("interpreter.js: READING SCRIPT");
 
Eden.deHTML = function(text){
//a function to allow the display of HTML in pages directly without the HTML being interpreted

	if(text==undefined){
		return undefined;
	}

	var build = [];

	for(var i=0; i<text.length; i++) {
	
		if(text[i] == "<")		{
			if(text[i+1]!="="){
				build.push("&#60;");
			}
		}
		else if(text[i] == ">"){	
			if(text[i+1]!="="){
				build.push("&#62;");
			}
		}
		else if(text[i] == "{"){	
			build.push("&#123;");	
		}
		else if(text[i] == "}"){	
			build.push("&#125;");	
		}
		else if(text[i] == "\\"){	
			build.push("&#92;");	
		}
		else if(text[i] == "\/"){	
			build.push("&#47;");	
		}
		else if(text[i] == "\""){	
			build.push("&#34;");	
		}
		else if(text[i] == "\$"){	
			build.push("&#36;");	
		}
		else{
			build.push(text[i]);
		}
	}

	return build.join("");
}

Eden.plugins.InputWindow = function(context) {
joe.log("interpreter.js: InputWindow()");
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
	joe.log("interpreter.js: addHistory()");
		me.history.push({input: text, time: ((new Date()).getTime())});
		index = me.history.length;
	}

	/** @private */
	var getHistory = function(index) {
console.log("interpreter.js: getHistory()");
		if (me.history.length == 0) {
			return "";
		} else {
			return me.history[index].input;
		}
	}

	/** @private */
	var previousHistory = function() {
	joe.log("interpreter.js: previousHistory()");
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
	joe.log("interpreter.js: nextHistory()");
		if (index < 0) {
			index = 0;
		}
		if (index >= me.history.length-1) {
			index++;
			return "";
		}
		return getHistory(++index);
	}

	/** @private */
	var loadPreviousEdenCode = function(options) {
	joe.log("interpreter.js: loadPreviousEdenCode()");
		options.editor.setValue(previousHistory());
	}

	/** @private */
	var loadNextEdenCode = function(options) {
	joe.log("interpreter.js: loadNextEdenCode()");
		options.editor.setValue(nextHistory());
	}

	var historydialog = undefined;

	/** @private */
	var submitEdenCode = function(options) {
	joe.log("interpreter.js: submitEdenCode()");
		var editor = options.editor;
		var edenparser = options.edenparser;
		addHistory(editor.getValue());

		if (eden.plugins.MenuBar) {
			eden.plugins.MenuBar.updateStatus("Parsing input...");
		}

		try {
			var myvalue;
		
			if (edenparser !== undefined) {
				//Parse special notation to eden
			} else {
				myvalue = editor.getValue();
			}
joe.log("interpreter.js: myvalue= "+myvalue);
		
			eval(Eden.translateToJavaScript(myvalue));
			editor.setValue("");
		} catch (e) {
			me.history[index-1].error = e;
			Eden.reportError(e);
		}

		if (eden.plugins.MenuBar) {
			eden.plugins.MenuBar.appendStatus(" [complete]");
		}

		if (historydialog !== undefined) {
			historydialog.html(generateHistory());
		}
	}

	/** @private */
	var closeInput = function(options) {
	joe.log("interpreter.js: closeInput()");
		var $dialog = options.$dialog;
		$dialog.dialog('close');
	}

	/** @private */
	var openInput = function(options) {
	joe.log("interpreter.js: openInput()");
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
	joe.log("interpreter.js: setupKeyBind()");
		$(document).bind('keydown', keyCombo, function () {
			callback && callback(options);
		});
	}

	/** @private */
	var setupAllKeyBinds = function(options) {
	joe.log("interpreter.js: setupAllKeyBinds()");
		for (var keyCombo in KEYBINDINGS) {
			setupKeyBind(options, keyCombo, KEYBINDINGS[keyCombo]);
		}
	}

	/** @public */
	this.createEmbedded = function(name, edenparser) {
		joe.log("interpreter.js: createEmbedded()");
	}

	var generateHistory = function() {
	joe.log("interpreter.js: generateHistory()");
		result = "";
		for (var i=0; i<me.history.length; i++) {
			var theclass = "inputwindow-history-line";
			if (me.history[i].error !== undefined) {
				theclass = theclass + " error";
			}
			result = result + "<div class=\""+theclass+"\"><pre>" + Eden.deHTML(me.history[i].input) + "</pre></div>";
		}
		return result;
	}

	this.createHistory = function(name,mtitle) {
	joe.log("interpreter.js: createHistory()");
		historydialog = $('<div id="'+name+'"></div>')
			.html("<div class=\"history\">"+generateHistory()+"</div>")
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
			}).find(".history");
	}

	/** @public */
	this.createDialog = function(name, mtitle, edenparser) {
	joe.log("interpreter.js: createDialog()");
		var myeditor;

		$code_entry = $('<div id="'+name+'-input" class=\"inputwindow-code\"><div></div><pre class="eden exec"></pre></div>');
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

		myeditor = convertToEdenPage('#'+name+'-input','code');

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
