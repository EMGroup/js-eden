/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
 Eden.plugins.ADM = function(context) {
	var me = this;
	
	this.actionLists = new Array();
	
	this.entities = new Array();
	// Definition store:
	this.definitions = new Array();

	// This array is to store the next sequential actions which can be executed.
	this.queuedActions = new Array();
	
	// Holds the index of the entity currently displayed in the input box.
	this.currIndex = -1;
	
	// Holds guard / action sequence pairs.
	function GuardActions(guard, actions) {
		this.guard = guard;
		this.actions = actions;
	};

	GuardActions.prototype.toString = function() {
		return this.guard + ' --> ' + this.actions;
	};

	// Holds information defining an entity:
	function Entity(name, definitions, actionsArr) {
		this.name = name;
		this.definitions = definitions;
		this.actionsArr = actionsArr;
	};
	
	/** @private */
	var generateInputHTML = function(name) {
		return '<div id="'+name+'-input" class=\"inputwindow-code\">\
			<form>\
				<label>Name: </label><input id="adm-name" type=\"text\" class=\"adm-name\"></input><br>\
				<label>Definitions:</label><br><textarea id="adm-definitions" class=\"adm-definitions\"></textarea><br>\
				<label>Actions:</label><br><textarea id="adm-actions" class=\"adm-actions\"></textarea>\
			</form>\
		</div>\
		<div id="adm-results" class=\"entitylist-results\">\
			<ul id="results"> </ul>\
		</div>';
	};
	
	/* Process the definitions of a newly created entity. */
	var processDefinitions = function(name, definitions) {
		for (var i = 0; i < definitions.length; i++) {
			// Submit each definition as eden code to add to definition store.
			try {
				eval(Eden.translateToJavaScript(name+'_'+definitions[i]));
			} catch (e) {
				Eden.reportError(e);
				return -1;
			}
			me.definitions.push(name+'_'+definitions[i]);
		}
	};
	
	/* Process the actions of a newly created entity. */
	var processActions = function(name, definitions, actions) {
		// TODO validate here! e.g. by trying to convert to eden code
		var actionsArr = new Array();
		for (var i = 0; i < actions.length; i++) {
			// Actions of the form guard --> action:
			var split = actions[i].split('-->');
			if (split.length == 2) {
				actionsArr.push(new GuardActions(split[0], split[1]));
			}
		}
		me.entities.push(new Entity(name, definitions, actionsArr));
	};
	
	var processNewEntity = function(name) {
		// TODO add ability to edit existing entity!
		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-definitions');
		var definitions = [];
		if (input.length > 0) {
			definitions = input.value.split('\n');
		} 
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		
		var returnCode = processDefinitions(name, definitions);

		// If definitions processed ok, also process actions!
		if (returnCode != -1) {
			processActions(name, definitions, actions);
			me.actionLists.push(new Eden.plugins.ADM.ActionsList(name));
			eden.plugins.ADM.process();
		}
		return returnCode;
	};
	
	var validateInput = function() {
		var input = document.getElementById('adm-name'),
		entityName = input.value;

		// Ensure entity name is unique
		var unique = true;
		for (var i = 0; i < me.entities.length; i++) {
			var entity = me.entities[i];
			if (entity.name == entityName) unique = false;
		}

		if (entityName && unique) {
			var returnCode = processNewEntity(entityName);
			
			if (returnCode != -1) {
				alert('Entity was successfully added!');
				document.getElementById('adm-name').value = '';
				document.getElementById('adm-definitions').value = '';
				document.getElementById('adm-actions').value = '';
				
				// Add a new element in the entity list for this new entity:
				var newdiv = document.createElement('li');
				newdiv.setAttribute('id',entityName);
				newdiv.class = 'entitylist-element';
				newdiv.innerHTML = '<label>'+entityName+'</label>';
				var results = document.getElementById('results');
				results.appendChild(newdiv);
				
				this.currIndex = -1;
			}
		} else {
			alert('Please enter a unique name for this entity.');
			input.focus();
		}
	};
	
	this.process = function() {
		// Clear the actions list ready for new available actions.
		for (x in me.actionLists) {
			var actionList = me.actionLists[x];
			actionList.clear();
		}
		
		// List to store the actions we are processing this round.
		var actions = new Array();

		// First add the next sequential items from last round
		var tmpQueue = [];
		for (x in me.queuedActions) {
			var queueSplit = me.queuedActions[x].split(';');
			var firstAction = queueSplit[0];
			actions.push(firstAction);
			queueSplit.splice(0, 1);
			tmpQueue.push(queueSplit.join(';'));
			//me.actionsList.addAction(firstAction, actions.length - 1);
		}
		me.queuedActions = tmpQueue;
		
		// Find all actions to evaluate and add to the actions list:
		for (x in me.entities) {
			var entity = me.entities[x];

			// Find the ActionsList for this entitiy
			var actionList;
			for (y in me.actionLists) {
				var nextActionList = me.actionLists[y];
				if (nextActionList.entityName == entity.name) {
					actionList = nextActionList;
					break;
				}
			}

			for (var j = 0; j < entity.actionsArr.length; j++) {
				// The guard should be EDEN code! Execute it
				var guardAction = entity.actionsArr[j];
				try {
					var answer = eval(Eden.translateToJavaScript('return ' + guardAction.guard + ';'));
				} catch (e) {
					Eden.reportError(e);
				}
				if (answer == true) {
					var split = guardAction.actions.split(';');
					var firstAction = split[0];
					actions.push(firstAction);
					split.splice(0, 1);
					me.queuedActions.push(split.join(';'));
	
					// Add action to selectable list of potential actions this step:
					// TODO make these clickable!
					actionList.addAction(firstAction, actions.length - 1);
				}
			}
		}
	};
	
	/* Display information about the entity at the current index. */
	var display = function(index) {
		if (index < -1) {
			index = me.entities.length - 1;
		} else if (index >= me.entities.length) {
			index = -1;
		}
		
		if (index == -1) {
			document.getElementById('adm-name').value = '';
			document.getElementById('adm-definitions').value = '';
			document.getElementById('adm-actions').value = '';
		} else {
			var entity = me.entities[index];
			document.getElementById('adm-name').value = entity.name;
			document.getElementById('adm-definitions').value = entity.definitions;
			document.getElementById('adm-actions').value = entity.actionsArr;
		}
		me.currIndex = index;
	};
	
	var deleteEntity = function(index) {
		if (index > -1) {
			alert('deleting an instance of entity ' + me.entities[index].name);
			me.entities.splice(index);
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
						id: "btn-add",
						text: "Add Entity",
						click: function() {
							validateInput();
						}
					},
					{
						id: "btn-delete",
						text: "Delete Entity",
						click: function() {
							deleteEntity(me.currIndex);
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
		code_entry = $("<div id=\"human-perspective\" class=\"actionlist\"></div>");
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 360
			});
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
 
Eden.plugins.ADM.ActionsList = function(entityName) {
	var humanPerspective = document.getElementById("human-perspective");
	this.actionresults = document.createElement('div');
	this.actionresults.setAttribute('id', 'actions_'+entityName);
	this.actionresults.innerHTML = '<label>Actions for '+entityName+':</label>';
	humanPerspective.appendChild(this.actionresults);
	this.actions = {};
	this.entityName = entityName;
}

Eden.plugins.ADM.ActionsList.prototype.addAction = function(action, index) {
	var actionElement = new Eden.plugins.ADM.Action(action);
	actionElement.element.appendTo(this.actionresults);
	this.actions[index] = actionElement;
}

Eden.plugins.ADM.ActionsList.prototype.clear = function() {
	this.actions.length = 0;
        this.actionresults.innerHTML = '<label>'+this.entityName+'</label>';
}

Eden.plugins.ADM.Action = function(action) {
	this.action = action;
	this.element = $('<div class="entitylist-element"></div>');
	this.update = this.updateAction;

	this.element.hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "white"}, 100);
		}	
	).click(function() {
		// On click the action should be executed, and the actions list cleared.
		eval(Eden.translateToJavaScript(action + ';'));
		eden.plugins.ADM.process();
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
}

Eden.plugins.ADM.title = "ADM";
Eden.plugins.ADM.description = "Abstract Definitive Machine";
Eden.plugins.ADM.author = "Ruth King";
