/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.ScriptInput.dialogs = {};

EdenUI.plugins.ScriptInput.dialogs.newAgent = function(element, callback) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-newagent noselect"><span class="script-subdialog-title">Create or import agent:</span><br/><input class="script-subdialog-text" type="text" spellcheck="false" list="agentlist" placeholder="model/component/agent"></input><datalist id="agentlist"></datalist><span class="status missing"></span><br><button class="button-icon-green button-add">Add</button><button style="position: absolute; right: 20px" class="button-icon-silver button-cancel">Cancel</button><button style="position: absolute; right: 100px;" class="button-icon-silver button-agents">Browse</button></div>');
	var input = content.find('.script-subdialog-text');
	var status = input.get(0).nextSibling.nextSibling;
	var datalist = content.find('#agentlist');
	var valid = false;

	datalist.empty();
	for (var a in Eden.Agent.agents) {
		var opt = $('<option>'+a+'</option>');
		datalist.append(opt);
	}

	content
	.on("input blur", ".script-subdialog-text", function() {
		var value = input.get(0).value;
		//console.log(value);
		
		var valsplit = value.split("/");
		var valtest = true;
		for (var i=0; i<valsplit.length; i++) {
				if (/^[a-z][a-z0-9]+$/i.test(valsplit[i]) == false) {
						valtest = false;
						break;
				}
		}

		if (value == "") {
			valid = false;
			status.className = "missing";
		} else if (valtest) {
			if (Eden.Agent.agents[value] === undefined) {
				Eden.DB.getMeta(value, function(path,meta) {
					if (meta) {
						status.className = "download";
						valid = true;
					} else {
						status.className = "addnew";
						valid = true;
					}
				});
			} else {
				if (Eden.Agent.agents[value].owned) {
					status.className = "readonly";
				} else {
					status.className = "edit";
				}
				valid = true;
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
	.on("click", ".button-agents", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false, true);
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}



EdenUI.plugins.ScriptInput.dialogs.localChanges = function(element, callback, data) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-uploadagent noselect"><span class="script-subdialog-text">You have local changes to '+data.name+', use these?</span><br><br><button class="button-icon-green button-ok">Yes</button><button style="position: absolute; right: 20px" class="button-icon-silver button-cancel">No</button></div>');


	content
	.on("click", ".button-ok", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(true);
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}



EdenUI.plugins.ScriptInput.dialogs.uploadFailed = function(element, callback) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-uploadagent noselect"><span class="script-subdialog-title">Upload Failed! Try again...</span><br><br><button class="button-icon-green button-upload">Retry</button><button style="position: absolute; right: 20px" class="button-icon-silver button-cancel">Cancel</button></div>');


	content
	.on("click", ".button-upload", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(true);
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}



EdenUI.plugins.ScriptInput.dialogs.uploadAgent = function(element, callback) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-uploadagent noselect"><span class="script-subdialog-title">Upload agent. Give an optional version name:</span><br/><input class="script-subdialog-text tagname" type="text" spellcheck="false"></input><span class="status missing"></span><br><input class="script-subdialog-check makepublic" type="checkbox">Public</input><br><br><button class="button-icon-green button-upload">Upload</button><button style="position: absolute; right: 20px" class="button-icon-silver button-cancel">Cancel</button></div>');
	var input = content.find('.tagname');
	var publiccheck = content.find('.makepublic');
	var status = input.get(0).nextSibling;
	var valid = true;


	content
	.on("input blur", ".script-subdialog-text", function() {
		var value = input.get(0).value;
		console.log(value);

		if (value == "") {
			valid = true;
			status.className = "addnew";
		} else if (/^[a-z][a-z0-9]+$/i.test(value)) {
			status.className = "addnew";
			valid = true;
		} else {
			status.className = "invalid";
			valid = false;
		}
	})
	.on("click", ".button-upload", function() {
		if (valid) {
			element.get(0).removeChild(obscurer.get(0));
			callback(true, input.get(0).value, publiccheck.get(0).checked);
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
		return (new Date(datetime)).toDateString();
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
	var version = data.meta.saveID;

	function clearHistory() {
		var histele = hist.get(0);
		while (histele.firstChild) histele.removeChild(histele.firstChild);
		activeelement = undefined;
	}

	function buildAutosaves(saveID) {
		if (data.history[saveID]) {
			for (var i=data.history[saveID].length-1; i>=0; i--) {
				var item = $('<div class="script-history-item"></div>');
				if (active == i) {
					item.addClass("current");
					item.addClass("original");
					activeelement = item;
				}
				item.get(0).setAttribute("data-index", ""+i);
				var bookmark = $('<div class="script-history-bookmark"></div>');
				var time = $('<div class="script-history-time"></div>');
				var content2 = $('<div class="script-history-content"></div>');
				time.html(get_time_diff(data.history[saveID][i].time));
				time.get(0).title = data.history[saveID][i].time;
				if (data.history[saveID][i].bookmark) {
					bookmark.addClass("bookmarked");
				}
				if (data.history[saveID][i].title) {
					content2.html(data.history[saveID][i].title);
				} else {
					content2.html("[Autosave]");
				}
				item.append(bookmark);
				item.append(content2);
				item.append(time);
				hist.append(item);
			}
		}
	}

	function buildHistory(saveID) {
		// Add base items.
		Eden.DB.getVersions(data.name, function(versions) {
			if (versions == null) return;

			// For every version found on the server (limited to 100)
			for (var i=0; i<versions.length; i++) {
				var item = $('<div class="script-history-item"></div>');

				// If the current version, highlight
				if (versions[i].saveID == version) {
					item.addClass("original");
					if (active == -1) {
						item.addClass("current");
						activeelement = item;
					}
				}
				item.get(0).setAttribute("data-version", ""+versions[i].saveID);
				var storedclass = "script-history-stored";

				// If it public/private/someone elses?
				if (versions[i]["public"] == false) {
					storedclass += " private";
				} else if (versions[i].mine) {
					storedclass += " mine";
				} else {
					storedclass += " public";
				}

				var bookmark = $('<div class="'+storedclass+'"></div>');
				// Generate time message from SQL timestamp
				var t = versions[i].date.split(/[- :]/);
				var time = $('<div class="script-history-time">'+get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000)+'</div>');
				var taglabel = versions[i].tag;
				if (versions[i].tag == null) taglabel = versions[i].saveID;				
				var content2 = $('<div class="script-history-content">'+taglabel+' by '+versions[i].name+'</div>');
				item.append(bookmark);
				item.append(content2);
				item.append(time);
				hist.append(item);

				// Add this versions autosaves if its the current one
				if (versions[i].saveID == version) {
					buildAutosaves(saveID);
				}
			}
		});

		// If there is local origin data the add this as well
		if (data.history["origin"]) {
			var item = $('<div class="script-history-item"></div>');
			if (version == "origin") {
				item.addClass("original");
				if (active == -1) {
					item.addClass("current");
					activeelement = item;
				}
			}
			item.get(0).setAttribute("data-version", "origin");
			var storedclass = "script-history-bookmark";
			var bookmark = $('<div class="'+storedclass+'"></div>');
			var label = "origin";
			if (data.meta && data.meta.file) label = data.meta.file;
			var content2 = $('<div class="script-history-content">'+label+'</div>');
			item.append(bookmark);
			item.append(content2);
			hist.append(item);

			if (version == "origin") {
				buildAutosaves("origin");
			}
		}
	}

	buildHistory(data.meta.saveID);

	content
	.on("input", ".script-history-content", function(e) {
		var index = parseInt(e.target.parentNode.getAttribute("data-index"));
		data.history[data.meta.saveID][index].title = e.target.textContent;
		data.saveHistory();
		data.makeSnapshot(index);
	})
	.on("click", ".script-history-item", function(e) {
		var ver = e.currentTarget.getAttribute("data-version");
		if (ver) {
			if (ver != "origin") ver = parseInt(ver);
			// Rebuild with a different version history
			version = ver;
			clearHistory();
			active = -1;
			buildHistory(version);
		} else {
			var index = parseInt(e.currentTarget.getAttribute("data-index"));
			active = index;
			if (activeelement) activeelement.removeClass("current");
			activeelement = $(e.currentTarget);
			activeelement.addClass("current");
		}
	})
	.on("click", ".script-history-bookmark", function(e) {
		var index = parseInt(e.target.parentNode.getAttribute("data-index"));
		if (data.history[data.meta.saveID][index].bookmark === undefined) {
			data.history[data.meta.saveID][index].bookmark = true;
		} else {		
			data.history[data.meta.saveID][index].bookmark = !data.history[data.meta.saveID][index].bookmark;
		}

		// Save bookmark
		data.saveHistory();

		if (data.history[data.meta.saveID][index].bookmark) {
			e.target.className = "script-history-bookmark bookmarked";
		} else {
			e.target.className = "script-history-bookmark";
		}
	})
	.on("click", ".button-ok", function() {
		if (valid) {
			element.get(0).removeChild(obscurer.get(0));
			console.log("Rollback to: " + active + "@"+version);
			callback(true, active, version);
		}
	})
	.on("click", ".button-cancel", function() {
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	}); 

	obscurer.append(content);
	element.append(obscurer);
}



EdenUI.plugins.ScriptInput.dialogs.browseAgents = function(element, callback, data) {
	var obscurer = $('<div class="script-obscurer noselect"></div>');
	var content = $('<div class="script-subdialog-agents noselect"><span class="script-subdialog-title">'+Language.ui.input_window.browse_agents+':</span><br/><div class="script-agents-list"></div><div class="script-agents-buttons"><button class="button-icon-green button-add">Add</button><button style="float: right;" class="button-icon-silver button-cancel">Cancel</button></div></div>');
	var list = content.find(".script-agents-list");
	var valid = true;
	var scrollpos = 0;

	var selected = {};

	function addAgents(parent, depth, path) {
		Eden.DB.getDirectory(path, function(dir) {
			if (dir === undefined) return;
			var sdir = [];
			for (var a in dir) {
				sdir.push(a);
			}
			sdir.sort(function (a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});

			for (var i=0; i<sdir.length; i++) {
				var npath = (path=="")?sdir[i]:path+"/"+sdir[i];
				var name = sdir[i];
				var item = $('<div class="script-agents-item"></div>');
				var expand = $('<div class="script-agents-expand" style="width: '+(27+depth*15)+'px"></div>');
				var content = $('<div class="script-agents-content"></div>');
				var cbcontainer = $('<div class="script-agents-cbcont"></div>');

				(function(content, path, name, cbcontainer, expand) {
					Eden.DB.getMeta(path, function(path, meta) {
						if (meta) {
							var datestr = "";
							if (meta.date) {
								var t = meta.date.split(/[- :]/);
								datestr = get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000);
							}
							
							var titlestr = meta.title;
							if (titlestr == "Agent" || titlestr === undefined) titlestr = "";
							
							content.html(name+" <span class=\"script-agents-title\">"+titlestr+"</span><span class=\"script-agents-date\">"+datestr+"</span>");
							
							if (meta.remote && meta.defaultID == -1 && meta.latestID == -1) {
								//expand.addClass("private");
								cbcontainer.html("&nbsp;");
							} else {
								var checkbox = $('<input type="checkbox"></input>');
								cbcontainer.append(checkbox);

								if (data.indexOf(path) >= 0) {
									checkbox.get(0).checked = true;
								}
							}
						} else {
							content.html(name);
							cbcontainer.html("&nbsp;");
						}
					});
				}).call(this, content, npath, name, cbcontainer, expand);

				if (Eden.Agent.agents[npath]) {
					item.addClass("loaded");
				}

				item.get(0).setAttribute("data-path", npath);
				item.get(0).setAttribute("data-depth", ""+(depth+1));
				//if (dir[a].missing == false && dir[a].children && Object.keys(dir[a].children).length == 0) {
				//	expand.addClass("noexpand");
				//}
				item.append(expand);
				item.append(cbcontainer);
				item.append(content);

				if (parent === undefined || parent.nextSibling === undefined) {
					list.append(item);
				} else {
					list.get(0).insertBefore(item.get(0),parent.nextSibling);
				}
				//addAgents(depth+1, root[a].children, npath);
			}
		});
	}
	addAgents(undefined, 0, "");

	function removeAgents(base) {
		var depth = parseInt(base.getAttribute("data-depth"));
		var start = base.nextSibling;
		while (start) {
			var ndepth = parseInt(start.getAttribute("data-depth"));
			if (ndepth > depth) {
				var next = start.nextSibling;
				list.get(0).removeChild(start);
				start = next;
			} else {
				break;
			}
		}
	}

	content
	.on("click", ".script-agents-item", function(e) {
		
	})
	.on("click", ".script-agents-expand", function(e) {
		var path = e.currentTarget.parentNode.getAttribute("data-path");
		var depth = parseInt(e.currentTarget.parentNode.getAttribute("data-depth"));
		if (e.currentTarget.className.indexOf("expanded") < 0) {
			addAgents(e.currentTarget.parentNode, depth, path);
			changeClass(e.currentTarget, "expanded", true);
		} else {
			//addAgents(e.currentTarget, depth, path);
			removeAgents(e.currentTarget.parentNode);
			changeClass(e.currentTarget, "expanded", false);
		}
	})
	.on("change", ".script-agents-cbcont input", function(e) {
		var path = e.currentTarget.parentNode.parentNode.getAttribute("data-path");
		if (e.currentTarget.checked) {
			selected[path] = true;
		} else {
			selected[path] = false;
		}
	})
	.on("click", ".button-add", function() {
		scrollpos = list.scrollTop();
		element.get(0).removeChild(obscurer.get(0));
		callback(true, selected);
	})
	.on("click", ".button-cancel", function() {
		scrollpos = list.scrollTop();
		element.get(0).removeChild(obscurer.get(0));
		callback(false);
	});

	obscurer.append(content);

	function show() {
		element.append(obscurer);
		list.scrollTop(scrollpos);
	}

	return {show: show};
}

