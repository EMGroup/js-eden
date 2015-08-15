/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

 
 // First of all, prevent missing browser functionality from causing errors.
/*
 * If supported by the browser then JS-EDEN will measure how long it takes to
 * execute the user's code each time they press the submit button in the input
 * window and print the result in the JavaScript console.  If the browser
 * doesn't natively support making timing measurements then the functionality is
 * simply disabled.
*/
if (!("time" in console)) {
	console.time = function (timerName) {
		return;
	};
	console.endTime = function (timerName) {
		return;
	};
}
 
/**
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */
EdenUI.plugins.ScriptInput = function(edenUI, success) {

	var me = this;
	var inputAgent = {name: Symbol.getInputAgentName()};
	this.history = [];
	this.index = 0;

	this.history = JSON.parse(edenUI.getOptionValue('history')) || [];
	this.index = this.history.length;

	this.addHistory = function(text) {
		this.history.push(text);
		this.index = this.history.length;
		edenUI.setOptionValue('history', JSON.stringify(this.history.slice(-50)));
	}

	this.getHistory = function(index) {
		if (me.history.length == 0) {
			return "";
		} else {
			return me.history[this.index];
		}
	}

	this.previousHistory = function (){
	
		if (this.index <= 0) {
			this.index = 1;
		}
		if (this.index > me.history.length) {
			this.index = me.history.length;
		}
		return this.getHistory(--this.index);
	}

	this.nextHistory = function(){
	
		if (this.index < 0) {
			this.index = 0;
		}
		if (this.index >= me.history.length-1) {
			this.index++;
			return "";
		}
		return this.getHistory(++this.index);
	}

	var historydialog = undefined;

	this.submitEdenCode = function (text) {
		this.addHistory(text);
		console.time("submitEdenCode");
		edenUI.eden.execute(text, 'input', '', inputAgent);
		console.timeEnd("submitEdenCode");
		
		if (historydialog !== undefined) {
			historydialog.html(this.generateHistory());
		}
	}

	var closeInput = function(options) {
		var $dialog = options.$dialog;
		$dialog.dialog('close');
	}

	var openInput = function(options) {

		var $dialog = options.$dialog;
		$dialog.dialog('open');
		$(options.editor.getInputField()).focus();
	}

	this.generateHistory = function() {

		result = "";
		for (var i=0; i<me.history.length; i++) {
			var theclass = "inputwindow-history-line";
			result = result + "<div class=\""+theclass+"\"><p style=\"word-wrap: break-word;\">" + Eden.htmlEscape(me.history[i]) + "</p></div>";
		}
		return result;
	}

	this.createHistory = function(name,mtitle) {

		historydialog = $('<div id="'+name+'"></div>')
			.html("<div class=\"history\">"+edenUI.plugins.ScriptInput.generateHistory()+"</div>")
			.dialog({
				title: mtitle,
				width: 500,
				height: 500,
				minHeight: 300,
				minWidth: 300

			}).find(".history");
	}

	this.createDialog = function (name, mtitle) {
		var $dialogContents = $('<div class="inputCodeArea"><textarea spellcheck="false"></textarea></div><div class="subButtonsDiv"><button class="submitButton">Submit</button></div><div class="buttonsDiv"><button class="previousButton">Previous</button><button class="nextButton">Next</button></div>')
			
		var textarea = $dialogContents.find('textarea').get(0);
		$dialogContents.on('keydown', 'textarea', function (e) {
			if (!e.ctrlKey) {
				return;
			}

			if (e.keyCode === 13){
				// enter
				me.submit(textarea);
			} else if (e.keyCode === 38) {
				// up
				me.prev(textarea);
			} else if (e.keyCode === 40) {
				// down
				me.next(textarea);
			}
		}).on('click', '.submitButton', function (e) {
			me.submit(textarea);
		}).on('click', '.previousButton', function (e) {
			me.prev(textarea);
		}).on('click', '.nextButton', function (e) {
			me.next(textarea);
		});
		
		$dialog = $('<div id="'+name+'"></div>')
			.html($dialogContents);
		var dialogMode = false;
		if(!dialogMode){
			$("#windowsArea").append($dialog);
			$dialog.addClass("tileView");
			$dialog.css({width:500,
				height: 200,
				minHeight: 200,
				minWidth: 500
				});
		}else{
			$dialog.dialog({
				title: mtitle,
				width: 500,
				height: 200,
				minHeight: 200,
				minWidth: 500
			});
		}
			input_dialog = $dialog;

		var confirmClose = !("MenuBar" in edenUI.plugins);

		return {confirmClose: confirmClose, setValue: function (value) { textarea.value = value; }};
	};

	this.next = function (el) {
		var n = edenUI.plugins.ScriptInput.nextHistory();
		el.value = n;
	};

	this.prev = function (el) {
		var p = edenUI.plugins.ScriptInput.previousHistory();
		el.value = p;
	};

	this.submit = function (el) {
		edenUI.plugins.ScriptInput.submitEdenCode(el.value);
		el.value = "";
	};

	this.getRidOfInstructions = function () {
		var x = el.value;

		if (x === "Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next") {
			el.value = "";
		}
	};

	this.putBackInstructions = function () {
		var x = document.getElementById("inputCodeArea").value;
		if (x === "") {
			el.value = "Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next";
		}
	};

	edenUI.views.ScriptInput = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "Script Input Window",
		category: edenUI.viewCategories.interpretation,
		menuPriority: 0
	};

	edenUI.views.History = {
		dialog: this.createHistory,
		title: "Input History",
		category: edenUI.viewCategories.history
	};
	
	edenUI.history = this.history;
	
	success();
};

/* Plugin meta information */
EdenUI.plugins.ScriptInput.title = "Script Input";
EdenUI.plugins.ScriptInput.description = "Provides the ability to type in definitional scripts using the keyboard, submit them for interpretation and recall the input history.";

//Make tab do spaces instead of selecting the next element
$(document).delegate('.inputCodeArea textarea', 'keydown', function(e) {
  var keyCode = e.keyCode || e.which;

  if (keyCode == 9) {
    e.preventDefault();
    var start = $(this).get(0).selectionStart;
    var end = $(this).get(0).selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    $(this).val($(this).val().substring(0, start)
                + "\t"
                + $(this).val().substring(end));

    // put caret at right position again
    $(this).get(0).selectionStart =
    $(this).get(0).selectionEnd = start + 1;
  }
});

