/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
 Eden.plugins.ADM = function(context) {
	var me = this;
	
	this.actionsList;
	
	this.agents = new Array();
	// Definition store: (probably this isn't needed)
	this.definitions = new Array();
	
	// Holds the index of the agent currently displayed in the input box.
	this.currIndex = -1;
	
	// Holds guard / action sequence pairs.
	function GuardActions(guard, action) {
		this.guard = guard;
		this.action = action;
	};

	GuardActions.prototype.toString = function() {
		return this.guard + ' --> ' + this.action;
	};

	// Holds information defining an agent:
	function Agent(name, entities, actionsArr) {
		this.name = name;
		this.entities = entities;
		this.actionsArr = actionsArr;
	};
	
	/** @private */
	var generateInputHTML = function(name) {
		return '<div id="'+name+'-input" class=\"inputwindow-code\">\
			<form>\
				<label>Name: </label><input id="adm-name" type=\"text\" class=\"adm-name\"></input><br>\
				<label>Entities:</label><br><textarea id="adm-entities" class=\"adm-entities\"></textarea><br>\
				<label>Actions:</label><br><textarea id="adm-actions" class=\"adm-actions\"></textarea>\
			</form>\
		</div>\
		<div id="adm-results" class=\"agentlist-results\">\
			<ul id="results"> </ul>\
		</div>';
	};
	
	/* Process the entities of a newly created agent. */
	var processEntities = function(entities) {
		for (var i = 0; i < entities.length; i++) {
			// Submit each entitiy as eden code to add to definition store.
			try {
				// TODO append name of agent instance to entity.
				eval(Eden.translateToJavaScript(entities[i]));
			} catch (e) {
				Eden.reportError(e);
				return -1;
			}
			me.definitions.push(entities[i]);
		}
	};
	
	/* Process the actions of a newly created agent. */
	var processActions = function(name, entities, actions) {
		// TODO validate here! e.g. by trying to convert to eden code
		var actionsArr = new Array();
		for (var i = 0; i < actions.length; i++) {
			// Actions of the form guard --> action:
			var split = actions[i].split('-->');
			if (split.length == 2) {
				actionsArr.push(new GuardActions(split[0], split[1]));
			}
		}
		me.agents.push(new Agent(name, entities, actionsArr));
	};
	
	var processNewAgent = function(name) {
		// TODO add ability to edit existing agent!
		// TODO append greek letters to agent instances.
		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-entities'),
		entities = input.value.split('\n');
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		
		var returnCode = processEntities(entities);
		// If entities processed ok, also process actions!
		if (returnCode != -1) {
			processActions(name, entities, actions);
		}
		return returnCode;
	};
	
	var validateInput = function() {
		var input = document.getElementById('adm-name'),
		agentName = input.value;
		if (agentName) {
			var returnCode = processNewAgent(agentName);
			
			if (returnCode != -1) {
				alert('Agent was successfully added!');
				document.getElementById('adm-name').value = '';
				document.getElementById('adm-entities').value = '';
				document.getElementById('adm-actions').value = '';
				
				// Add a new element in the agent list for this new agent:
				var newdiv = document.createElement('li');
				newdiv.setAttribute('id',agentName);
				newdiv.class = 'agentlist-element';
				newdiv.innerHTML = '<label>'+agentName+'</label>';
				var results = document.getElementById('results');
				results.appendChild(newdiv);
				
				this.currIndex = -1;
			}
		} else {
			alert('Please enter a name for this agent.');
			input.focus();
		}
	};
	
	var process = function() {
		// List to store the actions we are processing this round.
		var actions = new Array();
		alert('processing ' + me.agents.length + ' agents');
		
		// Find all actions to evaluate and add to the actions list:
		for (x in me.agents) {
			var agent = me.agents[x];
			for (var j = 0; j < agent.actionsArr.length; j++) {
				// The guard should be EDEN code! Execute it
				var action = agent.actionsArr[j];
				try {
					var answer = eval(Eden.translateToJavaScript('return ' + action.guard + ';'));
				} catch (e) {
					Eden.reportError(e);
				}
				if (answer == true) {
					actions.push(action.action);
	
					// Add action to selectable list of potential actions this step:
					// TODO make these clickable!
					me.actionsList.addAction(action.action, actions.length - 1);
				}
			}
		}
		
		// Somehow extract the dependencies between all actions!!!
		// Check for conflicts between actions in the list
	};
	
	/* Display information about the agent at the current index. */
	var display = function(index) {
		if (index < -1) {
			index = me.agents.length - 1;
		} else if (index >= me.agents.length) {
			index = -1;
		}
		
		if (index == -1) {
			document.getElementById('adm-name').value = '';
			document.getElementById('adm-entities').value = '';
			document.getElementById('adm-actions').value = '';
		} else {
			var agent = me.agents[index];
			document.getElementById('adm-name').value = agent.name;
			document.getElementById('adm-entities').value = agent.entities;
			document.getElementById('adm-actions').value = agent.actionsArr;
		}
		me.currIndex = index;
	};
	
	var deleteAgent = function(index) {
		if (index > -1) {
			alert('deleting an instance of agent ' + me.agents[index].name);
			me.agents.splice(index);
			me.currIndex = index-1;
			display(me.currIndex);
		}
	};
		
	 /** @public */
     this.createInputDialog = function(name, mtitle) {
		var myeditor;
		var code_entry = $('<div></div>');
		code_entry.html(generateInputHTML(name));
		
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
						id: "btn-process",
						text: "Step",
						click: function() {
							process();
						},
					},
					{
						id: "btn-add",
						text: "Add Agent",
						click: function() {
							validateInput();
						}
					},
					{
						id: "btn-delete",
						text: "Delete Agent",
						click: function() {
							deleteAgent(me.currIndex);
						}
					},
					{
						text: "Previous",
						click: function() {
							display(me.currIndex-1);
						}
					},
					{
						text: "Next",
						click: function() {
							display(me.currIndex+1);
						}
					}
				]
			});
			
		input_dialog = $dialog;
		
		$("#btn-submit").css("margin-right", "30px");
		
		myeditor = convertToEdenPageNew('#'+name+'-input','code');
	};
	
	/** @public */
    this.createHumanPerspective = function(name, mtitle) {
		var code_entry = $('<div></div>');
		code_entry = $("<div id="+name+"-human-perspective\" class=\"actionlist\"></div>");
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 360
			});
			
		me.actionsList = new Eden.plugins.ADM.ActionsList(
			code_entry[0]
		);
	};
	
	context.views["AdmInput"] = {
		dialog: this.createInputDialog,
		title: "ADM Input Window"
	};
	
	context.views["AdmHumanPerspective"] = {
		dialog: this.createHumanPerspective,
		title: "ADM Human Perspective"
	};
};
 
 Eden.plugins.ADM.ActionsList = function(element) {
	this.actionresults = element;
	alert('element is ' + element);
	this.actions = {};
}

Eden.plugins.ADM.ActionsList.prototype.addAction = function(action, index) {
	var actionElement = new Eden.plugins.ADM.Action(action);
	actionElement.element.appendTo(this.actionresults);
	this.actions[index] = actionElement;
}

Eden.plugins.ADM.Action = function(action) {
	this.action = action;
	this.element = $('<div class="agentlist-element"></div>');
	this.details = undefined;
	this.update = this.updateAction;

	this.element.hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
	).click(function() {
		//Show symbol details dialog
	});

	this.update();
}

Eden.plugins.ADM.Action.prototype.updateAction = function() {
	var me = this;

	var namehtml = "<span class=\"hasdef_text\" title=\""
		+ this.action
		+"\">"+this.action+"</span>";

	this.element.html("<li class=\"type-function\"><span class=\"result_name\">"
		+ namehtml
		+ "</span></li>"
	);

	/*//Clicking on the value will allow you to edit it
	this.element.find(".result_value").click(function(){
		console.log("value clicked");
		var editbox = $("<input type=\"text\" value=\""+me.symbol.value()+"\"></input>");
		editbox.blur(function() {
			console.log("Execute: " + me.name + " = " + this.value);

			var val = me.symbol.value();
			var valhtml;

			if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
			else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
			else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
			else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
			else { valhtml = val; }

			$(this).replaceWith("<span class='result_value'> = "+valhtml+"</span>");
		});
		$(this).replaceWith(editbox);
	
	});*/
}

Eden.plugins.ADM.title = "ADM";
Eden.plugins.ADM.description = "Abstract Definitive Machine";
Eden.plugins.ADM.author = "Ruth King";