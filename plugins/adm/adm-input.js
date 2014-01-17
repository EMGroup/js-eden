/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
 Eden.plugins.ADM = function(context) {
	var me = this;
	
	// Array of actions selected to be executed
	this.actions = new Array();
	
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
	
	// Holds guard / action sequence pairs.
	function GuardActions(guard, actions) {
		this.guard = guard;
		this.actions = actions;
	};

	GuardActions.prototype.toString = function() {
		return this.guard + ' --> ' + this.actions;
	};

	function Template(name, parameters, definitions, actionsArr) {
		this.name = name;
		this.parameters = parameters;
		this.definitions = definitions;
		this.actionsArr = actionsArr;
	};

	// Holds information defining an entity:
	function Entity(name, definitions, actionsArr) {
		this.name = name;
		this.definitions = definitions;
		this.actionsArr = actionsArr;
		// This array is to store the next sequential actions which can be executed.
		this.queuedActions = new Array();
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
	var processActions = function(name, actions) {
		// TODO validate here! e.g. by trying to convert to eden code
		var actionsArr = new Array();
		for (var i = 0; i < actions.length; i++) {
			// Actions of the form guard --> action:
			var split = actions[i].split('-->');
			if (split.length == 2) {
				actionsArr.push(new GuardActions(split[0], split[1]));
			}
		}
		return actionsArr;
	};
	
	var processNewTemplate = function(nameParams) {
		// TODO add ability to edit existing entity!

		// Get the parameters between the brackets, split by commas:
		if ((nameParams.split('(')).length < 2) {
			alert('Format: TemplateName(param1, param2, ...) or TemplateName()'); return -1;
		}
		var params = ((nameParams.split('(')[1]).split(')')[0]).split(',');
		var name = nameParams.split('(')[0];

		// Entities and actions should be separated by \n.
		var input = document.getElementById('adm-definitions');
		var definitions = [];
		if (input.value.length > 0) {
			definitions = input.value.split('\n');
		} 
		var input = document.getElementById('adm-actions'),
		actions = input.value.split('\n');
		
		var actionsArr = processActions(name, actions);
		var template = new Template(name, params, definitions, actionsArr);
		
		me.templates.push(template);
		if (me.templateList != null) {
			me.templateList.addTemplate(name, params);
		}
		return 0;
	};
	
	var validateInput = function() {
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

	this.actionPush = function(value) {
		me.actions.push(value);
	};

	this.actionRemove = function(value) {
		var newActions = new Array();
		for (x in me.actions) {
			var action = me.actions[x];
			if (action != value) {
				newActions.push(action);
			}
		}
		me.actions = newActions;
	};
	
	this.process = function() {
		// Find all actions to evaluate and add to the actions list:
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
					tmpQueue.push(queueSplit.join(';'));
					actionList.addAction(firstAction);
				}
			}
			entity.queuedActions = tmpQueue;
			processSelected(entity, actionList);
		}
	};

	var processSelected = function(entity, actionList) {
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
				split.splice(0, 1);
				if (split[0].length > 0) {
					entity.queuedActions.push(split.join(';'));
				}
	
				// Add action to selectable list of potential actions this step:
				actionList.addAction(firstAction);
			}
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
			document.getElementById('adm-definitions').value = template.definitions;
			document.getElementById('adm-actions').value = template.actionsArr;
		}
		me.currIndex = index;
	};
	
	var deleteTemplate = function(index) {
		if (index > -1) {
			alert('deleting template ' + me.templates[index].name);
			me.templates.splice(index);
			me.currIndex = index-1;
			display(me.currIndex);
		}
	};
		
	/** @private */
	var generateTemplateHTML = function(name) {
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

	/** @public */
	this.createTemplateCreator = function(name, mtitle) {
		var myeditor;
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
							validateInput();
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
		
		myeditor = convertToEdenPageNew('#'+name+'-input','code');
	};

	var step = function() {
		// Execute all actions currently highlighted!
		for (x in me.actions) {
			var action = me.actions[x];
			eval(Eden.translateToJavaScript(action+';'));
		}
		me.actions = new Array();
		eden.plugins.ADM.process();
	}
	
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
						eden.plugins.ADM.process();
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
			me.actionLists.push(new Eden.plugins.ADM.ActionsList(name));
		}
		eden.plugins.ADM.process();
	};

	// Replace all occurences of "this" in array arr with "name" Strings
	var replaceThis = function(name, arr) {
		var result = new Array();
		for (x in arr) {
			var element = arr[x];
			result.push(element.replace("this", name));
		}
		return result;
	};

	// Replace all occurences of "this" in array arr with "name" GuardActions
	var replaceThisActions = function(name, guardActions) {
		var result = new Array();
		for (x in guardActions) {
			var element = guardActions[x];
			var guard = element.guard.replace("this", name);
			var actions = element.actions.replace("this", name);
			result.push(new GuardActions(guard, actions));
		}
		return result;
	};

	// Clear instantiator on successful instantiation
	var clearInstantiator = function(box, boxes) {
		box.value = "";
		for (x in boxes) {
			boxes[x].value = "";
		}
	};

	// Instantiate a selected template with given parameters in instantiator
	var instantiate = function() {
		// Find the template we are instantiating
		var menu = document.getElementById('template-menu');
		var templateName = menu.options[menu.selectedIndex].value;
		for (x in me.templates) {
			var template = me.templates[x];
			if (template.name == templateName) {
				thisTemplate = template;
				break;
			}
		}

		var nameBox = document.getElementById('entity-name');
		var name = nameBox.value;
		// Ensure new entity name is unique
		var unique = true;
		for (var i = 0; i < me.entities.length; i++) {
			var entity = me.entities[i];
			if (entity.name == name) unique = false;
		}
		if (unique == false) {
			alert('please enter a unique name for this instantiation'); return;
		}

		// Instantiate all parameters
		var params = $("#instantiate-params");
		var inputs = params.find("input");
		var paramIndex = 0;
		var inputBoxes = new Array();
		for (x in inputs) {
			var input = inputs[x];
			if (input.type == "text") {
				var param = thisTemplate.parameters[paramIndex];
				var value = input.value;
				inputBoxes.push(input);
				eval(Eden.translateToJavaScript(name+'_'+param+'='+value+';'));
				paramIndex++;
			}
		}

		// Replace "this" keyword with entity name in actions and definitions.
		var entityDefinitions = replaceThis(name, thisTemplate.definitions);

		// Process definitions and actions.
		var returnCode = processDefinitions(name, entityDefinitions);
		if (returnCode != -1) {
			var entityActions = replaceThisActions(name, thisTemplate.actionsArr);
			var entity = new Entity(name, entityDefinitions, entityActions);
			me.entities.push(entity);
			if (me.actionLists != null) {
				var actionList = new Eden.plugins.ADM.ActionsList(name);
				me.actionLists.push(actionList);
				processSelected(entity, actionList);
			}
			if (me.entityList != null) {
				me.entityList.addEntity(name, entityDefinitions, entityActions);
			}
			alert('Successfully added instantiation of ' + templateName + ' as ' + name);
			clearInstantiator(nameBox, inputBoxes);
		}
	};
	
	/** @public */
	this.createInstantiator = function(name, mtitle) {
		var code_entry = $('<div></div>');
		code_entry = $('<div id=\"template-instantiator\">\
					<label>Templates:</label>\
					<select id=\"template-menu\">\
					</select><br>\
					<label>Entity name:</label>\
					<input id=\"entity-name\"></input><br>\
					<label>Parameters:</label><br>\
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
						instantiate();
					}
				}]
			});
		me.templateList = new Eden.plugins.ADM.TemplateList();
		for (x in me.templates) {
			var template = me.templates[x];
			me.templateList.addTemplate(template.name, template.parameters);
		}
	};

	/** @private */
	var generateInstanceListHTML = function() {
		return '<div id=\"entity-list\" class=\"instance-list\"></div>';
	}

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
					id: "btn-instantiate",
					text: "Instantiate",
					click: function() {
						instantiate();
					}
				}]
			});
		me.entityList = new Eden.plugins.ADM.EntityList();
		for (x in me.entities) {
			var entity = me.entities[x];
			me.entityList.addEntity(entity.name, entity.definitions, entity.actionsArr);
		}
	};

	context.views["AdmTemplateCreator"] = {
		dialog: this.createTemplateCreator,
		title: "ADM Template Creator"
	};
	
	context.views["AdmHumanPerspective"] = {
		dialog: this.createHumanPerspective,
		title: "ADM Human Perspective"
	};

	context.views["AdmInstantiator"] = {
		dialog: this.createInstantiator,
		title: "ADM Template Instantiator"
	};

	context.views["AdmEntityList"] = {
		dialog: this.createInstanceList,
		title: "ADM Entity List"
	};
};

Eden.plugins.ADM.EntityList = function() {
	this.entityList = document.getElementById('entity-list');
	this.entities = new Array();
}

Eden.plugins.ADM.EntityList.prototype.addEntity = function(entity, defs, actions) {
	var entityElement = new Eden.plugins.ADM.Entity(entity, defs, actions);
	entityElement.element.appendTo(this.entityList);
	this.entities.push(entityElement);
}

Eden.plugins.ADM.Entity = function(entity, definitions, actions) {
	this.entity = entity;
	this.element = $('<div class="entitylist-element"></div>');
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
		if (this.innerHTML == contentHTML) {
			var newDiv = document.createElement('div');
			newDiv.innerHTML = '<label>Definitions:</label><br>\
					<textarea disabled>'+definitions+'</textarea><br>\
					<label>Actions:</label><br>\
					<textarea disabled>'+actions+'</textarea><br>'
			this.appendChild(newDiv);
			$(this).css("backgroundColor", "#6666CC");
			selected = true;
		} else {
			this.innerHTML = contentHTML;
			$(this).css("backgroundColor", "white");
			selected = false;
		}
	});
}

Eden.plugins.ADM.TemplateList = function() {
	this.templateList = document.getElementById('template-menu');
	this.templateList.style.minWidth="100px";
	this.templates = new Array();
}

Eden.plugins.ADM.TemplateList.prototype.addTemplate = function(template, params) {
	var templateElement = new Eden.plugins.ADM.Template(template, params);
	templateElement.element.appendTo(this.templateList);
	this.templates.push(templateElement);
}

Eden.plugins.ADM.Template = function(template, parameters) {
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

Eden.plugins.ADM.Template.prototype.showParamInput = function(params) {
	// Add input boxes for every parameter
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
 
Eden.plugins.ADM.ActionsList = function(entityName) {
	var humanPerspective = document.getElementById("human-perspective");
	this.actionresults = document.createElement('div');
	this.actionresults.setAttribute('id', 'actions_'+entityName);
	this.actionresults.innerHTML = '<label>Actions for '+entityName+':</label>';
	humanPerspective.appendChild(this.actionresults);
	this.actions = new Array();
	this.entityName = entityName;
}

Eden.plugins.ADM.ActionsList.prototype.addAction = function(action) {
	var actionElement = new Eden.plugins.ADM.Action(action);
	actionElement.element.appendTo(this.actionresults);
	this.actions.push(actionElement);
}

Eden.plugins.ADM.ActionsList.prototype.clear = function() {
	this.actions = new Array();
        this.actionresults.innerHTML = '<label>Actions for '+this.entityName+'</label>';
}

Eden.plugins.ADM.Action = function(action) {
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
		if (selected == false) {
			eden.plugins.ADM.actionPush(action);
			$(this).css("backgroundColor","#6666CC");
			selected = true;
		} else {
			eden.plugins.ADM.actionRemove(action);
			$(this).css("backgroundColor", "white");
			selected = false;
		}
	});

	this.update();
}

Eden.plugins.ADM.Action.prototype.updateAction = function() {
	this.element.html("<li class=\"type-function\"><span class=\"result_name\">"
		+ this.action + "</span></li>"
	);
}

Eden.plugins.ADM.title = "ADM";
Eden.plugins.ADM.description = "Abstract Definitive Machine";
Eden.plugins.ADM.author = "Ruth King";
