/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */

Eden.plugins.InputWindow = function(context) {

	var me = this;
	me.edenparser = undefined;
	this.history = new Array();

	this.index = 0;

	this.addHistory = function(text) {
		me.history.push(text);
		this.index = me.history.length;
	}

	this.getHistory = function(index) {
		if (me.history.length == 0) {
			return "";
		} else {
			return me.history[this.index];
		}
	}

	this.previousHistory = function(){
	
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

	this.submitEdenCode = function(text) {
	
		this.addHistory(text+" ## (Successful)");

		if (eden.plugins.MenuBar) {
			eden.plugins.MenuBar.updateStatus("Parsing input...");
		}

		try {
	
			eval(Eden.translateToJavaScript(text));
			
		} catch (e) {
			me.history[this.index-1] = text+" ## (Failed)";
			eden.plugins.MenuBar.updateStatus("Eden Code Unrecognised - Did you forget a semicolon?");
			alert("Parsing Failed");
		}

		if (eden.plugins.MenuBar) {
			eden.plugins.MenuBar.appendStatus(" [complete]");
		}

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
			result = result + "<div class=\""+theclass+"\"><p style=\"word-wrap: break-word;\">" + Eden.deHTML(me.history[i]) + "</p></div>";
		}
		return result;
	}

	this.createHistory = function(name,mtitle) {

		historydialog = $('<div id="'+name+'"></div>')
			.html("<div class=\"history\">"+eden.plugins.InputWindow.generateHistory()+"</div>")
			.dialog({
				title: mtitle,
				width: 500,
				height: 500,
				minHeight: 300,
				minWidth: 300

			}).find(".history");
	}

	this.createDialog = function(name, mtitle, edenparser) {

		var myeditor;

		code_entry = $('<textarea onkeyUp="eden.plugins.InputWindow.inputKeypress(event)" id="inputCodeArea"></textarea><div id="subButtonsDiv"><button id="submitButton" onclick="eden.plugins.InputWindow.submit()">Submit</button></div><div id="buttonsDiv"><button id="previousButton" onclick="eden.plugins.InputWindow.prev()" >Previous</button><button id="nextButton" onclick="eden.plugins.InputWindow.next()" >Next</button></div>');
//try removing div: <div id=\"'+name+'-content\" class=\"inputWindow-content\">	</div>
		//Buttons taken out for new methods of terminal: 
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 500,
				height: 200,
				minHeight: 200,
				minWidth: 500,

			});
			input_dialog = $dialog;
	}

	this.next = function(){
		var n = eden.plugins.InputWindow.nextHistory();
		n = n.replace(/\#\# \(Failed\)/g, "");
		n = n.replace(/\#\# \(Successful\)/g, "");
		n = n.replace(/ $/g, "");
		document.getElementById("inputCodeArea").value = n;
	}
	this.prev = function(){
		var p = eden.plugins.InputWindow.previousHistory();
		p = p.replace(/\#\# \(Failed\)/g, "");
		p = p.replace(/\#\# \(Successful\)/g, "");
		p = p.replace(/ $/g, "");
		document.getElementById("inputCodeArea").value = p;
	}
	this.submit = function(){
		eden.plugins.InputWindow.submitEdenCode(document.getElementById("inputCodeArea").value);
		document.getElementById("inputCodeArea").value = "";
	}
	this.inputKeypress = function(event){
	
		//console.log(event.keyCode);
		//console.log(event.ctrlKey);
		if(event.keyCode==13){
			if(event.ctrlKey){
				eden.plugins.InputWindow.submit();
			}
		}
		else if(event.keyCode==38){
			if(event.ctrlKey){
				eden.plugins.InputWindow.prev();
			}
		}
		else if(event.keyCode==40){
			if(event.ctrlKey){
				eden.plugins.InputWindow.next();
			}
		}	
	}
	this.getRidOfInstructions = function(){
		var x = document.getElementById("inputCodeArea").value;
		if(x=="Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next"){
			document.getElementById("inputCodeArea").value = "";
		}
	}
	this.putBackInstructions = function(){
		var x = document.getElementById("inputCodeArea").value;
		if(x==""){
			document.getElementById("inputCodeArea").value = "Ctrl+Enter = Submit\nCtrl+Up = Previous\nCtrl+Down = Next";
		}
	}

	context.views.InputWindow = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "JS-Eden Input Window"
	};
	context.views.History = {
		dialog: this.createHistory,
		title: "Input History"
	};
	
	context.history = this.history;
	
};

Eden.deHTML = function(text){
//a function to allow the display of HTML in pages directly without the HTML being interpreted

	if(text==undefined){
		return undefined;
	}

	var build = [];

	for(var i=0; i<text.length; i++) {
	
		if(text[i] == "<"){
				build.push("&#60;");
		}
		else if(text[i] == ">"){	
			//if(text[i+1]!="="){
				build.push("&#62;");
			//}
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

/* Plugin meta information */
Eden.plugins.InputWindow.title = "Input Window";
Eden.plugins.InputWindow.description = "EDEN style script input window";
Eden.plugins.InputWindow.author = "Joe Butler";

//Make tab do spaces instead of selecting the next element
$(document).delegate('#inputCodeArea', 'keydown', function(e) {
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

