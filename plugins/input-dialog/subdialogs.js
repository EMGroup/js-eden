/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.ScriptInput.dialogs = {};

EdenUI.plugins.ScriptInput.dialogs.newAgent = function(element, callback) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-newagent noselect"><span class="script-subdialog-title">Create new agent:</span><br/><input class="script-subdialog-text" type="text" spellcheck="false" placeholder="model/component/agent"></input><span class="status missing"></span><br><button class="button-icon-green button-add">Create</button><button style="float: right;" class="button-icon-silver button-cancel">Cancel</button></div>');
	var input = content.find('.script-subdialog-text');
	var status = input.get(0).nextSibling;
	var valid = false;

	content
	.on("input", ".script-subdialog-text", function() {
		var value = input.get(0).value;

		if (value == "") {
			valid = false;
			status.className = "missing";
		} else if (/^[a-z][a-z0-9]*[\/][a-z0-9\/]+$/i.test(value)) {
			if (Eden.Agent.agents[value] === undefined) {
				status.className = "valid";
				valid = true;
			} else {
				status.className = "invalid";
				valid = false;
			}
		} else {
			status.className = "invalid";
			valid = false;
		}
	})
	.on("click", ".button-add", function() {
		if (valid) {
			element.get(0).removeChild(obscurer.get(0));
			callback(true, input.get(0).value);
		}
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}

