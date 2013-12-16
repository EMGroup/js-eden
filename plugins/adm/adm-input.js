/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.plugins.adm = function(context) {
	var me = this;
	
	// TODO make different classes for agents...
	this.agents = new Array();
	// Definition store:
	this.definitions = new Array();
	
	function Pair(guard, action) {
		this.guard = guard;
		// TODO actions could be a sequential list.
		this.action = action;
	}
	
	function Agent(actionsArr) {
		this.actionsArr = actionsArr;
	}
	
	/** @private */
	var generateHTML = function(name) {
		return '<div id="'+name+'-input" class=\"inputwindow-code\">\
			<form>\
				<label>Name: </label><input id="adm-name" type=\"text\" class=\"adm-name\"></input><br>\
				<label>Entities:</label><br><textarea id="adm-entities" class=\"adm-entities\"></textarea><br>\
				<label>Actions:</label><br><textarea id="adm-actions" class=\"adm-actions\"></textarea>\
			</form>\
		</div>';
	};
	
	function processEntities(entities) {
		for (var i = 0; i < entities.length; i++) {
			// Submit each as eden code to add to definition store.
		}
	};
	
	function processActions(actions) {
		var actionsArr = new Array();
		// Add to some kind of data structure mapping guard to action.
		for (var i = 0; i < actions.length; i++) {
			// Actions of the form guard THEN action:
			var split = actions[i].split('THEN');
			actionsArr.push(Pair(split[0], split[1]));
		}
		me.agents.push(Agent(actionsArr));
	};
	
	function processNewAgent(name) {
		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-entities'),
		entities = input.value.split('\n');
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		//TODO template actions more (not validating atm because this is planned)
		
		// Regex the entities to check it is valid.
		// Probably fine, who needs validation.
		processEntities(entities);
		processActions(actions);
	};
	
	function validateInput() {
		var input = document.getElementById('adm-name'),
		agentName = input.value;
		if (agentName) {
			processNewAgent(agentName);
			// TODO also add a list of existing agents
			alert('Agent was successfully added!');
			document.getElementById('adm-name').value = '';
			document.getElementById('adm-entities').value = '';
			document.getElementById('adm-actions').value = '';
		} else {
			alert('Please enter a name for this agent.');
			input.focus();
		}
	};
		
	 /** @public */
     this.createDialog = function(name, mtitle) {
	    var myeditor;
		
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML(name));
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
					title: mtitle,
					width: 360,
					height: 400,
					minHeight: 200,
					minWidth: 360,
				buttons: [
					{
						id: "btn-add",
						text: "Add Agent",
						click: function() {
							validateInput();
						}
					},
					{
						text: "Previous",
						click: function() {
							//loadPreviousAdmCode({editor: myeditor});
						}
					},
					{
						text: "Next",
						click: function() {
							//loadNextAdmCode({editor: myeditor});
						}
					}
				]
			});
			
		input_dialog = $dialog;
		
		$("#btn-submit").css("margin-right", "30px");
		
		myeditor = convertToEdenPageNew('#'+name+'-input','code');

	};
	
	/** @public */
	this.createEmbedded = function(name, edenparser) {

	};
	
	context.views.adm = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "ADM Input Window"
	};
};

Eden.plugins.adm.title = "ADM Input Window";
Eden.plugins.adm.description = "ADM input window";
Eden.plugins.adm.author = "Ruth King";
