/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.ScriptInput.dialogs = {};

EdenUI.plugins.ScriptInput.dialogs.newAgent = function(element, callback) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-newagent noselect"><span class="script-subdialog-title">Create or import agent:</span><br/><input class="script-subdialog-text" type="text" spellcheck="false" placeholder="model/component/agent"></input><span class="status missing"></span><br><button class="button-icon-green button-add">Add</button><button style="float: right;" class="button-icon-silver button-cancel">Cancel</button></div>');
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
				if (edenUI.getOptionValue("agent_"+value+"_snap")) {
					status.className = "valid";
					valid = true;
				} else {
					status.className = "addnew";
					valid = true;
				}
			} else {
				status.className = "warning";
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



function get_time_diff( timestamp )
{
	var datetime = timestamp * 1000;
    var now = Date.now();

    if( isNaN(datetime) )
    {
        return "";
    }

    if (datetime < now) {
        var milisec_diff = now - datetime;
    }else{
        var milisec_diff = datetime - now;
    }

    var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));

    var date_diff = new Date( milisec_diff );

	if (days > 5) {
		return "";
	} else {
		var result = "";
		if (days > 0) {
			result += days;
			if (days > 1) {
				result += " days ago";
			} else {
				result += " day ago";
			}
		} else {
			if (date_diff.getHours() > 0) {
				var hours = date_diff.getHours();
				result += hours;
				if (hours > 1) {
					result += " hours ago";
				} else {
					result += " hour ago";
				}
			} else {
				var mins = date_diff.getMinutes();
				if (mins > 0) {
					result += mins;
					if (mins > 1) {
						result += " minutes ago";
					} else {
						result += " minute ago";
					}
				} else {
					var secs = date_diff.getSeconds();
					result += secs;
					if (secs > 1) {
						result += " seconds ago";
					} else {
						result += " seconds ago";
					}
				}
			}
		}
		return result;
	}
}



EdenUI.plugins.ScriptInput.dialogs.showHistory = function(element, callback, data) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-history noselect"><span class="script-subdialog-title">Agent History:</span><br/><div class="script-history-list"></div><div class="script-history-buttons"><button class="button-icon-green button-ok">Load</button><button style="float: right;" class="button-icon-silver button-cancel">Cancel</button></div></div>');
	var hist = content.find(".script-history-list");
	var valid = true;
	var active = data.index;
	var activeelement;

	for (var i=data.history.length-1; i>=0; i--) {
		var item = $('<div class="script-history-item"></div>');
		if (active == i) {
			item.addClass("current");
			item.addClass("original");
			activeelement = item;
		}
		item.get(0).setAttribute("data-index", ""+i);
		var bookmark = $('<div class="script-history-bookmark"></div>');
		var time = $('<div class="script-history-time"></div>');
		var content2 = $('<div contenteditable class="script-history-content"></div>');
		time.html(get_time_diff(data.history[i].time));
		time.get(0).title = data.history[i].time;
		if (data.history[i].bookmark) {
			bookmark.addClass("bookmarked");
		}
		if (data.history[i].title) {
			content2.html(data.history[i].title);
		} else {
			content2.html("[Autosave]");
		}
		item.append(bookmark);
		item.append(content2);
		item.append(time);
		hist.append(item);
	}

	content
	.on("input", ".script-history-content", function(e) {
		var index = parseInt(e.target.parentNode.getAttribute("data-index"));
		data.history[index].title = e.target.textContent;
		data.saveHistory();
		data.makeSnapshot(index);
	})
	.on("click", ".script-history-item", function(e) {
		console.log(e);
		var index = parseInt(e.currentTarget.getAttribute("data-index"));
		active = index;
		activeelement.removeClass("current");
		activeelement = $(e.currentTarget);
		activeelement.addClass("current");
	})
	.on("click", ".script-history-bookmark", function(e) {
		var index = parseInt(e.target.parentNode.getAttribute("data-index"));
		if (data.history[index].bookmark === undefined) {
			data.history[index].bookmark = true;
		} else {		
			data.history[index].bookmark = !data.history[index].bookmark;
		}

		// Save bookmark
		data.saveHistory();

		if (data.history[index].bookmark) {
			e.target.className = "script-history-bookmark bookmarked";
		} else {
			e.target.className = "script-history-bookmark";
		}
	})
	.on("click", ".button-ok", function() {
		if (valid) {
			element.get(0).removeChild(obscurer.get(0));
			console.log("Rollback to: " + active);
			callback(true, active);
		}
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}

