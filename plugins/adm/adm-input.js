/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
 Eden.plugins.ADM = function(context) {
	var me = this;
	
	this.actionsList;
	
	this.entities = new Array();
	// Definition store: (probably this isn't needed)
	this.definitions = new Array();
	
	// Holds the index of the entity currently displayed in the input box.
	this.currIndex = -1;
	
	// Holds guard / action sequence pairs.
	function GuardActions(guard, action) {
		this.guard = guard;
		this.action = action;
	};

	GuardActions.prototype.toString = function() {
		return this.guard + ' --> ' + this.action;
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
	var processDefinitions = function(definitions) {
		for (var i = 0; i < definitions.length; i++) {
			// Submit each definition as eden code to add to definition store.
			try {
				// TODO append name of entity instance to definition.
				eval(Eden.translateToJavaScript(definitions[i]));
			} catch (e) {
				Eden.reportError(e);
				return -1;
			}
			me.definitions.push(definitions[i]);
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
		// TODO append greek letters to entity instances.
		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-definitions'),
		definitions = input.value.split('\n');
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		
		var returnCode = processDefinitions(definitions);
		// If definitions processed ok, also process actions!
		if (returnCode != -1) {
			processActions(name, definitions, actions);
		}
		return returnCode;
	};
	
	var validateInput = function() {
		var input = document.getElementById('adm-name'),
		entityName = input.value;
		if (entityName) {
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
			alert('Please enter a name for this entity.');
			input.focus();
		}
	};
	
	this.process = function() {
		// Clear the actions list ready for new available actions.
		me.actionsList.clear();
		
		// List to store the actions we are processing this round.
		var actions = new Array();
		alert('processing ' + me.entities.length + ' entities');
		
		// Find all actions to evaluate and add to the actions list:
		for (x in me.entities) {
			var entity = me.entities[x];
			for (var j = 0; j < entity.actionsArr.length; j++) {
				// The guard should be EDEN code! Execute it
				var action = entity.actionsArr[j];
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
						id: "btn-process",
						text: "Step",
						click: function() {
							eden.plugins.ADM.process();
						},
					},
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
	this.actions = {};
}

Eden.plugins.ADM.ActionsList.prototype.addAction = function(action, index) {
	var actionElement = new Eden.plugins.ADM.Action(action);
	actionElement.element.appendTo(this.actionresults);
	this.actions[index] = actionElement;
}

Eden.plugins.ADM.ActionsList.prototype.clear = function() {
	alert('clearing!');
	this.actions = {};
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
