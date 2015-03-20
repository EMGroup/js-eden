/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
/**
 * JS-EDEN Abstract Definitive Machine Plugin.
 * This prototype plugin was developed as a coursework project for CS405. It seeks to create a
 * plugin where entities can be created as collections of definitions and guarded actions.
 * These can then be instantiated and computation takes place through selections of available
 * actions made by the human user.
 */
 EdenUI.plugins.ADM = function (edenUI, success) {
	var me = this;
	
	// Array of actions selected to be executed
	this.selectedActions = new Array();
	// Array of entities selected in EntityList
	this.selectedEntities = new Array();
	
	this.templates = new Array();
	this.entities = new Array();
	// Definition store:
	this.definitions = new Array();

	// Holds the index of the entity currently displayed in the input box.
	this.currIndex = -1;

	// This holds the ActionList objects for every entity
	this.actionLists;
	// Var to hold the TemplateList object
	this.templateList;
	// Var to hold the EntityList object
	this.entityList;

	eden.polyglot.register('adm', {
		execute: function (code, origin, prefix, agent, success) {
			submitAdmCode(code);
		}
	});
	
	// Holds guard / action sequence pairs, and the eden var depending on the guard.
	function GuardActions(edenVar, guard, actions) {
		this.edenVar = edenVar;
		this.guard = guard;
		this.actions = actions;
	};

	GuardActions.prototype.toString = function() {
		return this.guard + ' --> ' + this.actions;
	};

	// Holds information about a template together.
	function Template(name, parameters, definitions, actionsArr) {
		this.name = name;
		this.parameters = parameters;
		this.definitions = definitions;
		this.actionsArr = actionsArr;
	};

	Template.prototype.toString = function() {
		return this.name+'('+this.parameters.join(',')+
			')\nDefinitions:\n'+this.definitions+
			'\nActions:\n'+this.actionsArr;
	};

	// Holds information defining an entity:
	function Entity(name, definitions, actionsArr) {
		this.name = name;
		this.definitions = definitions;
		this.actionsArr = actionsArr;
		// This array is to store the next sequential actions which can be executed.
		this.queuedActions = new Array();
	};

	/***** CODE FOR TEMPLATE CREATOR VIEW *****/
	
	/* Convert the actions of a newly created template to GuardActions objects. */
	var processActions = function(name, actions) {
		// TODO add validation e.g. by trying to convert to eden code
		var actionsArr = new Array();
		for (var i = 0; i < actions.length; i++) {
			var action = new String(actions[i]);
			// Actions of the form guard --> action:
			var split = action.split('-->');
			if (split.length == 2) {
				var edenVar = 'this_g'+actionsArr.length;
				actionsArr.push(new GuardActions(edenVar, split[0], split[1]));
			}
		}
		return actionsArr;
	};
	
	/* Process a template being created. */
	var processNewTemplate = function(nameParams) {
		// Get the parameters between the brackets, split by commas:
		var params = new Array();
		var name;
		if ((nameParams.split('(')).length < 2) {
			name = nameParams;
		} else {
			params = ((nameParams.split('(')[1]).split(')')[0]).split(',');
			name = nameParams.split('(')[0];
		}

		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-definitions');
		var definitions = [];
		if (input.value.length > 0) {
			definitions = input.value.split('\n');
		} 
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		
		var actionsArr = processActions(name, actions);
		addTemplate(name, params, definitions, actionsArr);
		return 0;
	};

	/* Validate a new template and then add it. */	
	var validateTemplate = function() {
		var input = document.getElementById('adm-name'),
		templateName = input.value.split('(')[0];

		// Ensure template name is unique
		var unique = true;
		for (var i = 0; i < me.templates.length; i++) {
			var template = me.templates[i];
			if (template.name == templateName) unique = false;
		}

		if (templateName && unique) {
			var returnCode = processNewTemplate(input.value);
			
			if (returnCode != -1) {
				alert('Template was successfully added!');
				document.getElementById('adm-name').value = '';
				document.getElementById('adm-definitions').value = '';
				document.getElementById('adm-actions').value = '';
				
				me.currIndex = -1;
			}
		} else {
			alert('Please enter a unique name for this template.');
			input.focus();
		}
	};
	
	/* Display information about the entity at the current index. */
	var display = function(index) {
		if (index < -1) {
			index = me.templates.length - 1;
		} else if (index >= me.templates.length) {
			index = -1;
		}
		
		if (index == -1) {
			document.getElementById('adm-name').value = '';
			document.getElementById('adm-definitions').value = '';
			document.getElementById('adm-actions').value = '';
		} else {
			var template = me.templates[index];
			document.getElementById('adm-name').value = template.name;
			document.getElementById('adm-definitions').value =
				template.definitions.join('\n');
			document.getElementById('adm-actions').value =
				template.actionsArr.join('\n');
		}
		me.currIndex = index;
	};
	
	/* Delete the template at the given index. */
	var deleteTemplate = function(index) {
		if (index > -1) {
			alert('Deleting template ' + me.templates[index].name);
			me.templates.splice(index);
			me.currIndex = index-1;
			display(me.currIndex);
		}
	};
		
	/** @private */
	var generateTemplateHTML = function(name) {
		return '<div id="'+name+'-input" class=\"inputwindow-code\">\
			<div>Name:</div>\
			<div><textarea id="adm-name" type=\"text\" class=\"adm-name\"></textarea></div>\
			<div>Definitions:</div>\
			<div><textarea id="adm-definitions" class=\"adm-definitions\"></textarea></div>\
			<div>Actions:</div>\
			<div><textarea id="adm-actions" class=\"adm-actions\"></textarea></div>\
		</div>\
		<div id="adm-results" class=\"entitylist-results\">\
			<ul id="results"> </ul>\
		</div>';
	};

	/** @public */
	this.createTemplateCreator = function(name, mtitle) {
		var code_entry = $('<div></div>');
		code_entry.html(generateTemplateHTML(name));
		
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
						text: "Add Template",
						click: function() {
							validateTemplate();
						}
					},
					{
						id: "btn-delete",
						text: "Delete Template",
						click: function() {
							deleteTemplate(me.currIndex);
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
	};

	/***** CODE FOR TEMPLATE INSTANTIATOR VIEW *****/

	/* Replace all occurences of "this" in array arr with "name" Strings. */
	var replaceThis = function(name, arr) {
		var result = new Array();
		for (x in arr) {
			var element = arr[x];
			result.push(element.replace(/this/g, name));
		}
		return result;
	};

	/* Replace all occurences of "this" in array arr with "name" GuardActions. */
	var replaceThisActions = function(name, guardActions) {
		var result = new Array();
		for (x in guardActions) {
			var element = guardActions[x];
			var guard = element.guard.replace(/this/g, name);
			var actions = element.actions.replace(/this/g, name);
			var edenVar = element.edenVar.replace(/this/g, name);
			result.push(new GuardActions(edenVar, guard, actions));
		}
		return result;
	};

	/* Clear instantiator on successful instantiation. */
	var clearInstantiator = function(box, boxes) {
		box.value = "";
		for (x in boxes) {
			boxes[x].value = "";
		}
	};

	/* Find the template object with the given name. */
	var findTemplate = function(templateName) {
		var template;
		for (x in me.templates) {
			if (me.templates[x].name == templateName) {
				template = me.templates[x];
				break;
			}
		}
		return template;
	};

	/* Instantiate a selected template with given parameters in instantiator. */
	var instantiateButton = function() {
		// Find the template we are instantiating.
		var menu = document.getElementById('template-menu');
		var templateName = menu.options[menu.selectedIndex].value;
		var thisTemplate = findTemplate(templateName);

		var nameBox = document.getElementById('entity-name');
		var name = nameBox.value;
		// Ensure new entity name is unique.
		var unique = true;
		for (var i = 0; i < me.entities.length; i++) {
			var entity = me.entities[i];
			if (entity.name == name) unique = false;
		}
		if (unique == false) {
			alert('please enter a unique name for this instantiation'); return;
		}

		// Instantiate all parameters as EDEN observables.
		var params = $("#instantiate-params");
		var inputs = params.find("input");
		var paramIndex = 0;
		var inputBoxes = new Array();
		for (x in inputs) {
			var input = inputs[x];
			if (input.type == "text") {
				var param = trim(thisTemplate.parameters[paramIndex]);
				var value = trim(input.value);
				inputBoxes.push(input);
				eden.executeEden(name+'_'+param+' is '+value+';');
				paramIndex++;
			}
		}

		// Replace "this" keyword with entity name in actions and definitions.
		var entityDefinitions = replaceThis(name, thisTemplate.definitions);

		// Process definitions and actions.
		var returnCode = processDefinitions(name, entityDefinitions);
		if (returnCode != -1) {
			finishInstantiation(name, entityDefinitions, thisTemplate.actionsArr);
			alert('Successfully added instantiation of ' + templateName + ' as ' + name);
			clearInstantiator(nameBox, inputBoxes);
		}
	};
	
	/* Process the definitions of a newly instantiated entity. */
	var processDefinitions = function(name, definitions) {
		name = trim(name);
		for (var i = 0; i < definitions.length; i++) {
			// Submit each definition as EDEN code to add to definition store.
			var definition = trim(definitions[i]);
			eden.executeEden(name+'_'+definition);
			me.definitions.push(name+'_'+definition);
		}
	};
	
	/** @public */
	this.createInstantiator = function(name, mtitle) {
		var code_entry = $('<div></div>');
		code_entry = $('<div id=\"template-instantiator\">\
					<div>Templates:</div>\
					<div>\
						<select id=\"template-menu\">\
						</select>\
					</div>\
					<div>Entity name:</div>\
					<div>\
						<textarea id=\"entity-name\"></textarea>\
					</div>\
					<div>Parameters:</div>\
					<div id=\"instantiate-params\"></div>\
				</div>');
		
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
					id: "btn-instantiate",
					text: "Instantiate",
					click: function() {
						instantiateButton();
					}
				}]
			});
		me.templateList = new EdenUI.plugins.ADM.TemplateList();
		// Show all precreated templates in the dropdown list for instantiation.
		for (x in me.templates) {
			var template = me.templates[x];
			me.templateList.addTemplate(template.name, template.parameters);
		}
	};

	/***** CODE FOR HUMAN PERSPECTIVE VIEW *****/

	/* Remove an entity instance with the given name - alpha_r(entityName)*/
	var processEntityRemove = function(entityName) {
		var entity;
		var index;
		// Find and remove the entity requested for removal
		for (x in me.entities) {
			if (me.entities[x].name == entityName) {
				entity = me.entities[x];
				index = x;
				break;
			}
		}
		if (entity == null) {
			alert(entityName + ' doesn\'t exist to delete.');
			return;
		}
		me.entities.splice(index, 1);

		// Also remove this entity's ActionList and Entity object
		for (x in me.actionLists) {
			if (me.actionLists[x].entityName == entityName) {
				index = x;
				me.actionLists[x].remove();
				break;
			}
		}
		if (me.actionLists != null) me.actionLists.splice(index, 1);
		if (me.entityList != null) me.entityList.removeEntity(entityName);
	};

	/* Process the instantiation of a new entity -
	 * alpha_i(templateName(params) as entityName).
	 */
	var processEntityInstantiate = function(templateName, params, entityName) {
		var template = findTemplate(templateName);
		if (template == null) {
			alert ('no template with name ' + templateName); return -1;
		}

		// Ensure the name for the new entity is unique.
		for (x in me.entities) {
			if (me.entities[x].name == entityName) {
				alert('Please enter a unique entity name'); return -1;
			}
		}
		
		// Process any given parameter values by matching to template parameters.
		if (params == '') {
			var splitParams = [];
		} else if (params.indexOf(',') == -1) {
			var splitParams = [params];
		} else {
			var splitParams = params.split(',');
		}
		if (splitParams.length != template.parameters.length) {
			alert('not enough parameters to instantiate ' + template);
			return -1;
		}
		for (x in splitParams) {
			var param = trim(template.parameters[x]);
			var value = trim(splitParams[x]);
			// Add the parameter definition to the EDEN definition store.
			eden.executeEden(entityName+'_'+param+' is '+value+';');
		}
		
		// Replace "this" keyword with entity name in actions and definitions.
		var entityDefinitions = replaceThis(entityName, template.definitions);
		
		// Process definitions and actions.
		var returnCode = processDefinitions(entityName, entityDefinitions);
		if (returnCode != -1) {
			finishInstantiation(entityName, entityDefinitions, template.actionsArr);
		}
		return returnCode;
        };

	/* Complete the instantiation of a new entity. */
	var finishInstantiation = function(name, definitions, actions) {
		var entityActions = replaceThisActions(name, actions);
		var entity = new Entity(name, definitions, entityActions);
		me.entities.push(entity);

		// Create all EDEN guard variables
		for (x in entityActions) {
			var action = entityActions[x];
			var statement = action.edenVar + ' is ' + action.guard + ';';
			eden.executeEden(statement);
		}

		if (me.actionLists != null) {
			var actionList = new EdenUI.plugins.ADM.ActionsList(name);
			me.actionLists.push(actionList);
			// Display available actions in the human perspective.
			refreshEntity(entity, actionList);
		}
		// Add to the entity list view.
		if (me.entityList != null) {
			me.entityList.addEntity(name, definitions, entityActions);
		}
	};

	/* Carry out a single step of computation. */
	var step = function() {
		// Execute all actions currently highlighted
		for (x in me.selectedActions) {
			var action = me.selectedActions[x];
			/* If the action starts with a alpha it is referring to an entity.
			This means it needs special treatment, otherwise it is just EDEN code.*/
			action = trim(action);
			if (action.charCodeAt(0) == 945) {
				if (action[2] == 'r') {
					// Removing an entity
					var entityName = action.split('(')[1];
					entityName = entityName.substring(0, entityName.length - 1);
					processEntityRemove(entityName);
				} else if (action[2] == 'i') {
					// Instantiate a new entity.
					var templateName = action.split('(')[1];
					var params = (action.split('(')[2]).split(')')[0];
					var entityName = action.split('as')[1];
					var returnCode = processEntityInstantiate(templateName, params, entityName);
					if (returnCode == -1) break;
				} else {
					alert('Action on another entity must one of α_remove(entity_name), α_r, α_instantiate(template(param_value) as entity_name) or α_i');
				}
			} else {
				// Execute any EDEN code normally.
				eden.executeEden(action+';');
			}
		}
		me.selectedActions = new Array();
		// Check for the next available actions.
		edenUI.plugins.ADM.refreshHumanPerspective();
	}

	/* Add selected action to list of currently selected actions in human perspective. */
	this.actionPush = function(action) {
		me.selectedActions.push(action);
	};

	/* Remove action from selected list as it has been deselected. */
	this.actionRemove = function(actionToRemove) {
		var newActions = new Array();
		for (x in me.selectedActions) {
			var action = me.selectedActions[x];
			if (action != actionToRemove) {
				newActions.push(action);
			}
		}
		me.selectedActions = newActions;
	};

	/* Find and display available actions for all instantiated entities in the given
	   state. */
	this.refreshHumanPerspective = function() {
		for (x in me.entities) {
			var entity = me.entities[x];

			// Find the ActionsList for this entity and clear it
			var actionList;
			for (y in me.actionLists) {
				var nextActionList = me.actionLists[y];
				if (nextActionList.entityName == entity.name) {
					actionList = nextActionList;
					break;
				}
			}
			actionList.clear();

			// First add the next sequential items from last round
			var tmpQueue = [];
			for (x in entity.queuedActions) {
				var queueSplit = entity.queuedActions[x].split(';');
				var firstAction = queueSplit[0];
				if (firstAction.length > 0) {
					queueSplit.splice(0, 1);
					var finalAction = true;
					if (queueSplit[0].length > 0) {
						tmpQueue.push(queueSplit.join(';'));
						finalAction = false;
					}
					actionList.addAction(firstAction, finalAction);
				}
			}
			// Also store the sequential actions to display next step in sequence.
			entity.queuedActions = tmpQueue;
			// Check all guards for this entity:
			refreshEntity(entity, actionList);
		}
	};

	/* Check all guards for this entity to refresh its list of available actions in the
	   human perspective. */
	var refreshEntity = function(entity, actionList) {
		for (var j = 0; j < entity.actionsArr.length; j++) {
			// The guard is an EDEN observable - check its value.
			var guardAction = entity.actionsArr[j];
			var answer = eden.root.lookup(guardAction.edenVar).value();
			// If the guard was true, add the first action in the sequence.
			if (answer === true) {
				var split = guardAction.actions.split(';');
				var firstAction = split[0];
				var finalAction = true;
				split.splice(0, 1);
				if (split[0].length > 0) {
					entity.queuedActions.push(split.join(';'));
					finalAction = false;
				}
	
				// Add action to selectable list of actions this step:
				actionList.addAction(firstAction, finalAction);
			}
		}
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
				minWidth: 360,
				buttons: [
				{
					id: "btn-refresh",
					text: "Refresh actions",
					click: function() {
						edenUI.plugins.ADM.refreshHumanPerspective();
					}
				},
				{
					id: "btn-step",
					text: "Step",
					click: function() {
						step();
					}
				}]
			});
		me.actionLists = new Array();
		for (x in me.entities) {
			var name = me.entities[x].name;
			me.actionLists.push(new EdenUI.plugins.ADM.ActionsList(name));
		}
		edenUI.plugins.ADM.refreshHumanPerspective();
	};

	/***** CODE FOR ENTITY LIST VIEW *****/

	/* Delete all currently selected entities. */
	var deleteSelected = function() {
		for (x in me.selectedEntities) {
			processEntityRemove(me.selectedEntities[x]);
		}
		alert('Entities successfully deleted.');
		me.selectedEntities = new Array();
	};

	/* Save all edits made to the selected entities.*/
	var saveEntityEdits = function() {
		for (x in me.selectedEntities) {
			// Find entity and save its definitions and actions as the ones listed.
			processEntityEdit(me.selectedEntities[x]);
		}
		alert('Edits successfully saved.');
		me.selectedEntities = new Array();
		me.entityList.unselectAll();
	};

	/* Find the Entity with the given name.*/
	var findEntity = function(entityName) {
		for (x in me.entities) {
			if (me.entities[x].name == entityName) return me.entities[x];
		}
	};

	/* Process the editing of the entity with the given name.*/
	var processEntityEdit = function(entityName) {
		var entity = findEntity(entityName);

		entity.definitions = document.getElementById(entityName + '-definitions');
		entity.actionsArr = document.getElementById(entityName + '-actions');

		for (x in me.actionLists) {
			if (me.actionLists[x].entityName == entityName) {
				me.actionsLists[x] = new EdenUI.plugins.ADM.ActionsList(entityName);
				for (x in entity.actionsArr) {
					//me.actionsLists[x].addAction(entity.actionsArr[x]);
				}
			}
		}
	};
	
	/* Add selected entity to list of selected entities. */
	this.entityPush = function(value) {
		me.selectedEntities.push(value);
	};

	/* Remove entity from selected list as it has been deselected. */
	this.entityRemove = function(value) {
		var newEntities = new Array();
		for (x in me.selectedEntities) {
			var entity = me.selectedEntities[x];
			if (entity != value) {
				newEntities.push(entity);
			}
		}
		me.selectedEntities = newEntities;
	};

	/** @private */
	var generateInstanceListHTML = function() {
		return '<div id=\"entity-list\" class=\"instance-list\"></div>';
	};

	/** @public */
	this.createInstanceList = function(name, mtitle) {
		var code_entry = $('<div></div>');
		code_entry.html(generateInstanceListHTML());
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
					id: "btn-delete-entity",
					text: "Delete selected",
					click: function() {
						deleteSelected();
					}
				},
				/*{
					id: "btn-edit-entity",
					text: "Save edits",
					click: function() {
						saveEntityEdits();
					}
				}*/]
			});
		me.entityList = new EdenUI.plugins.ADM.EntityList();
		for (x in me.entities) {
			var entity = me.entities[x];
			me.entityList.addEntity(entity.name, entity.definitions.join('\n'), entity.actionsArr.join('\n'));
		}
	};

	/***** CODE FOR ADVANCED INPUT VIEW *****/

	/* Given a line "name: templateName" parse out the templateName. */
	var processName = function(line) {
		var nameParams = line.split(':')[1];
		return trim(nameParams.split('(')[0]);
	};

	/* Given a line "name: templateName(param1,param2,...)" parse out the parameter names.
	   Return the comma separated parameter names as an array.*/
	var processParams = function(line) {
		var parenthesisSplit = line.split(':')[1].split('(')[1];
		if (parenthesisSplit.length > 1) {
			return (parenthesisSplit.split(')')[0]).split(',');
		} else {
			return [];
		}
	};

	/* Remove any space or tab characters from the start or end of the given string.*/
	var trim = function(string) {
		while (string.charCodeAt(0) == 32 || string.charCodeAt(0) == 9) {
			string = string.substring(1, string.length);
		}
		while (string.charCodeAt(string.length-1) == 32 
			|| string.charCodeAt(string.length - 1) == 9) {
			string = removeLastChar(string);
		}
		return string;
	};

	/* Trim the final character from the given string.*/
	var removeLastChar = function(string) {
		return string.substring(0, string.length-1);
	};

	/* Add a new template with the specified variables.*/
	var addTemplate = function(name, params, defsArr, actions) {
		// Ensure the name for the new template is unique.
		for (x in me.templates) {
			if (me.templates[x].name == name) {
				alert('Templates must have unique names.');
				return -1;
			}
		}
		var actionsArr = processActions(name, actions);
		var template = new Template(name, params, defsArr, actionsArr);
		me.templates.push(template);
		// Also add the template to the template creator view if it exists.
		if (me.templateList != null) {
			me.templateList.addTemplate(name, params);
		}
		return 1;
	};

	/*
	 * Parse code in the following format:
	 * {
	 * name: template_name(parameters) (can be on above line)
	 * definitions: {
	 *   eden_definition;
	 * }
	 * actions: {
	 *   guard --> action;
	 * }
	 * }
	 * template_name(parameter_values) as entity_name
	 */
	var submitAdmCode = function(code) {
		var lines = code.split('\n');
		// Variables for new template creation
		var name;
		var params = new Array();
		var defs = new Array();
		var actions = new Array();
		// Variables to keep track of which part of input we are processing
		var processingDefs = false;
		var processingActions = false;
		var parsingTemplate = false;

		for (x in lines) {
			var line = lines[x];
			// First trim whitespace from the start and end of the line.
			line = trim(line);
			if (line == '') continue;

			if (parsingTemplate == false) {
				if (line[0] == '{') {
					// This is the first line of a new template
					parsingTemplate = true;
					// Check if name is included on this line.
					if (line.indexOf("name:") != -1) {
						name = processName(line);
						params = processParams(line);
					}
				} else {
					// This is an instantiation.
					var templateName = line.split('(')[0];
					var entityParams = line.split('(')[1].split(')')[0];
					var entityName = removeLastChar(trim(line.split('as')[1]));
					var returnCode = processEntityInstantiate(templateName, entityParams, entityName);
					if (returnCode == -1) break;
				}
			} else if (processingDefs == true) {
				// We are currently processing definitions.
				var brace = line.indexOf('}');
				if (brace != -1) {
					line = removeLastChar(line);
					processingDefs = false;
				}
				if (line.length > 0) defs.push(line);
			} else if (processingActions == true) {
				// We are currently processing actions.
				var brace = line.indexOf('}');
				if (brace != -1) {
					line = removeLastChar(line);
					processingActions = false;
				}
				if (line.length > 0) actions.push(line);
			} else {
				// We are waiting for one of name, defs, actions or closing.
				if (line[0] == '}') {
					parsingTemplate = false;
					var returnCode = addTemplate(name, params, defs, actions);
					// Reset the variables ready for a new template.
					name = "";
					params = new Array();
					defs = new Array();
					actions = new Array();
					// Stop parsing if there was an error.
					if (returnCode == -1) return;
				} else if (line.indexOf("name:") != -1) {
					name = processName(line);
					params = processParams(line);
				} else if (line.indexOf("definitions:") != -1 || line.indexOf("defs:") != -1) {
					processingDefs = true;
					// Line might also contain the first definition.
					line = trim(line);
					if (line.split('{').length > 1) {
						var afterBrace = trim(line.split('{')[1]);
						if (afterBrace.indexOf('}') != -1) {
							afterBrace = removeLastChar(afterBrace);
							processingDefs = false;
						}
						if (afterBrace.length > 0) defs.push(afterBrace);
					}
				} else if (line.indexOf("actions:") != -1) {
					processingActions = true;
					// Line might also contain the first action.
					line = trim(line);
					if (line.split('{').length > 1) {
						var afterBrace = trim(line.split('{')[1]);
						var brace = afterBrace.indexOf('}');
						if (brace != -1) {
							afterBrace = removeLastChar(afterBrace);
							processingActions = false;
						}
						if (afterBrace.length > 0) actions.push(afterBrace);
					}
				}
			}
		}
		
	};
	
	/** @public */
	this.createAdvancedInput = function(name, mtitle) {
		var myeditor = document.createElement("textarea");
		myeditor.style.boxSizing = "border-box";
		myeditor.style.width = "100%";
		myeditor.style.height = "100%";
		
		$code_entry = $('<div id=\"advanced-input\" class=\"inputwindow-code\" style=\"height: 100%\"></div>');
		$code_entry.append(myeditor);
		
		$dialog = $('<div id="'+name+'"></div>')
			.html($code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 360,
				buttons: [
				{
					id: "btn-submit-advanced",
					text: "Submit",
					click: function() {
						var code = myeditor.value;
						submitAdmCode(code);
						// Clear the editor to indicate input was successful.
						myeditor.value = "";
					}
				}]
			});
		input_dialog = $dialog;
		$("#btn-submit-advanced").css("margin-right", "30px");
	};


	edenUI.addViewCategory("adm", "Abstract Definitive Machine");
	
	edenUI.views["AdmTemplateCreator"] = {
		dialog: this.createTemplateCreator,
		title: "ADM Template Creator",
		category: edenUI.viewCategories.adm
	};

	edenUI.views["AdmInstantiator"] = {
		dialog: this.createInstantiator,
		title: "ADM Template Instantiator",
		category: edenUI.viewCategories.adm
	};
	
	edenUI.views["AdmHumanPerspective"] = {
		dialog: this.createHumanPerspective,
		title: "ADM Human Perspective",
		category: edenUI.viewCategories.adm
	};

	edenUI.views["AdmEntityList"] = {
		dialog: this.createInstanceList,
		title: "ADM Entity List",
		category: edenUI.viewCategories.adm
	};

	edenUI.views["AdmAdvancedInput"] = {
		dialog: this.createAdvancedInput,
		title: "ADM Advanced Input",
		category: edenUI.viewCategories.adm
	};

	success();
};

/* Objects to represent the list of templates in the instantiator.*/
EdenUI.plugins.ADM.TemplateList = function() {
	this.templateList = document.getElementById('template-menu');
	this.templateList.style.minWidth="100px";
	this.templates = new Array();
}

EdenUI.plugins.ADM.TemplateList.prototype.addTemplate = function(template, params) {
	var templateElement = new EdenUI.plugins.ADM.Template(template, params);
	templateElement.element.appendTo(this.templateList);
	this.templates.push(templateElement);
}

/* Each template is selectable in the drop down menu of the view.*/
EdenUI.plugins.ADM.Template = function(template, parameters) {
	this.template = template;
	this.element = $('<option value='+template+'>'+template+'</option>');
	var show = this.showParamInput;
	var params = parameters;
	
	this.element.click(function() {
		show(parameters);
	});
	
	var instantiator = document.getElementById("instantiate-params");
	if (instantiator.innerHTML == "") show(parameters);
}

/* Add an input box for every parameter. */
EdenUI.plugins.ADM.Template.prototype.showParamInput = function(params) {
	var instantiator = document.getElementById("instantiate-params");
	instantiator.innerHTML="";
	for (x in params) {
		var param = params[x];
		var newdiv = document.createElement('label');
		newdiv.innerHTML = param+":";
		instantiator.appendChild(newdiv);
		var newinput = document.createElement('input');
		newinput.type="text";
		instantiator.appendChild(newinput);
		var newbr = document.createElement('br');
		instantiator.appendChild(newbr);
	}
}


/* Objects to represent the list of available actions for each entity in the human perspective.*/
EdenUI.plugins.ADM.ActionsList = function(entityName) {
	var humanPerspective = document.getElementById("human-perspective");
	this.actionresults = document.createElement('div');
	this.actionresults.setAttribute('id', 'actions_'+entityName);
	this.actionresults.innerHTML = '<label><b>Actions for '+entityName+':</b></label>';
	humanPerspective.appendChild(this.actionresults);
	this.actions = new Array();
	this.entityName = entityName;
}

EdenUI.plugins.ADM.ActionsList.prototype.addAction = function(action, finalAction) {
	var actionElement = new EdenUI.plugins.ADM.Action(action, finalAction);
	actionElement.element.appendTo(this.actionresults);
	this.actions.push(actionElement);
}

EdenUI.plugins.ADM.ActionsList.prototype.clear = function() {
	this.actions = new Array();
        this.actionresults.innerHTML = '<label><b>Actions for '+this.entityName+'</b></label>';
}
	
EdenUI.plugins.ADM.ActionsList.prototype.remove = function() {
	var humanPerspective = document.getElementById("human-perspective");
	humanPerspective.removeChild(document.getElementById("actions_"+this.entityName));
}

EdenUI.plugins.ADM.Action = function(action, finalAction) {
	var action = action;
	this.action = action;
	this.element = $('<div class="entitylist-element"></div>');
	this.update = this.updateAction;
	var selected = false;

	this.element.hover(
		function() {
			if (selected == false) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			} else {
				$(this).animate({backgroundColor: "#66CCCC"}, 100);
			}
		}, function() {
			if (selected == false) {
				$(this).animate({backgroundColor: "white"}, 100);
			} else {
				$(this).animate({backgroundColor: "#6666CC"}, 100);
			}
		}	
	).click(function() {
		// On click select/deselect this action for execution next step.
		if (selected == false) {
			edenUI.plugins.ADM.actionPush(action);
			$(this).css("backgroundColor","#6666CC");
			selected = true;
		} else {
			edenUI.plugins.ADM.actionRemove(action);
			$(this).css("backgroundColor", "white");
			selected = false;
		}
	});

	this.update(finalAction);
}

EdenUI.plugins.ADM.Action.prototype.updateAction = function(finalAction) {
	var baseHTML = "<li class=\"type-function\"><span class=\"result_name\">";
	if (finalAction == true) {
		baseHTML = baseHTML + this.action + "</span></li>";
	} else {
		baseHTML = baseHTML + this.action + " ... </span></li>";
	}
	
	this.element.html(baseHTML);
}


/* Objects to represent the list of entities. */
EdenUI.plugins.ADM.EntityList = function() {
	this.entityList = document.getElementById('entity-list');
	this.entities = new Array();
}

EdenUI.plugins.ADM.EntityList.prototype.addEntity = function(entity, defs, actions) {
	var entityElement = new EdenUI.plugins.ADM.Entity(entity, defs, actions);
	entityElement.element.appendTo(this.entityList);
	this.entities.push(entityElement);
}

EdenUI.plugins.ADM.EntityList.prototype.removeEntity = function(entity) {
	var index;
	for (x in this.entities) {
		if (this.entities[x].entity == entity) {
			index = x; break;		
		}
	}
	this.entities.splice(index, 1);
	var entityElement = document.getElementById('element-'+entity);
	this.entityList.removeChild(entityElement);
}

EdenUI.plugins.ADM.EntityList.prototype.unselectAll = function() {
	for (x in this.entities) {
		this.entities[x].unselect();
	}
}

EdenUI.plugins.ADM.Entity = function(entity, definitions, actions) {
	this.entity = entity;
	this.element = $('<div class="entitylist-element" id=element-'+entity+'></div>');
	var contentHTML = "<li class=\"type-function\"><span class=\"result_name\">"
		+ this.entity + "</span></li>";
	this.element.html(contentHTML);
	var definitions = definitions;
	var actions = actions;
	var selected = false;
	this.element.hover(function() {
			if (selected == false) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			} else {
				$(this).animate({backgroundColor: "#66CCCC"}, 100);
			}
		}, function() {
			if (selected == false) {
				$(this).animate({backgroundColor: "white"}, 100);
			} else {
				$(this).animate({backgroundColor: "#6666CC"}, 100);
			}
		}
	).click(function() {
		// On click expand and show definitions and actions for this entity.
		if (this.innerHTML == contentHTML) {
			var newDiv = document.createElement('div');
			newDiv.innerHTML = '<label>Definitions:</label><br>\
					<textarea disabled>'+definitions+'</textarea><br>\
					<label>Actions:</label><br>\
					<textarea disabled>'+actions+'</textarea><br>'
			this.appendChild(newDiv);
			edenUI.plugins.ADM.entityPush(entity);
			$(this).css("backgroundColor", "#6666CC");
			selected = true;
		} else {
			this.innerHTML = contentHTML;
			edenUI.plugins.ADM.entityRemove(entity);
			$(this).css("backgroundColor", "white");
			selected = false;
		}
	});
}

EdenUI.plugins.ADM.Entity.prototype.unselect = function() {
	var contentHTML = "<li class=\"type-function\"><span class=\"result_name\">"
		+ this.entity + "</span></li>";
	this.element.html(contentHTML);
}


EdenUI.plugins.ADM.title = "Abstract Definitive Machine";
EdenUI.plugins.ADM.description = "Abstract Definitive Machine";
EdenUI.plugins.ADM.author = "Ruth King";
