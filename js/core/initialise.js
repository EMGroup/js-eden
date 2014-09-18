/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

var root;
var eden;

var workIsDone = false;
window.onbeforeunload = confirmBrowseAway();

function confirmBrowseAway()
{
	if (!workIsDone) {
		return "Are you sure? If you leave this page now, your work will NOT be saved.";
	}
};

/**
 * Utility function to extract URL query string parameters.
 */
function getParameterByName(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if (results == null)
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function makeViewArray() {
	var result = [];
	var x;
	for (x in eden.activeDialogs) {
		result.push($("#"+x+"-dialog")[0]);
	}
	return result;
}

function sortArea(a, b) {
	var areaA = $(a).dialog("option", "width") * $(a).dialog("option", "height");
	var areaB = $(b).dialog("option", "width") * $(b).dialog("option", "height");

	return areaB-areaA;
}

function removeElement(a, index) {
	var result = [];
	var x;

	for (x in a) {
		if (x === index) {
			continue;
		}
		result.push(a[x]);
	}
	return result;
}

function largestHeight(a) {
	var largest = 0;
	var index = 0;
	var x;
	var ele;

	for (x in a) {
		ele = $(a[x]);
		if (ele.dialog("option","height") > largest) {
			largest = ele.dialog("option","height");
			index = x;
		}
	}
	return index;
}

function smallestHeight(a) {
	var smallest = 1000000;
	var index = 0;
	var x;

	for (x in a) {
		ele = $(a[x]);
		if (ele.dialog("option","height") < smallest) {
			smallest = ele.dialog("option","height");
			index = x;
		}
	}
	return index;
}

function totalWidth(a) {
	var width = 0;	
	var x;
	for (x in a) {
		width = width + $(a[x]).dialog("option","width");
	}
	return width;
}

function placeViews(views, top, spacing) {
	var heighest = largestHeight(views);

	var left = spacing;
	var x;
	for (x in views) {
		$(views[x]).dialog("option","position",[left,top]);
		left = left + $(views[x]).dialog("option","width") + spacing;
	}
	return top + heighest + spacing;
}

function tileViews() {
	var views = makeViewArray();
	views.sort(sortArea);
	var overflow = new Array();
	var spacing = 50;

	while (totalWidth(views) > ($(document).width() + (spacing * (views.length+1)))) {
		//Overflow by removing smallest height item.
		index = smallestHeight(views);
		overflow.push(views[index]);
		views = removeElement(views,index);
	}
	
	//TODO Now need to repeat process on overflow incase that exceeds width.

	//Actually position views
	var height = placeViews(views,100,spacing);
	if (overflow.length > 0) {
		placeViews(overflow, height, spacing);
	}
}

function JS_Eden_Initialise(callback) {
	$(document).ready(function() {
		root = new Folder();
		eden = new Eden();
		edenUI = new EdenUI(eden);

		//Create the error window. Hiden to start with.
		$('<pre id="error-window" style="font-family:monospace; display: none;"></pre>').appendTo($('body'));

		//Load the Eden library scripts
		eden.executeFileSSI("library/eden.jse");

		//Process query string for plugins and models to load
		var plugins = getParameterByName("p").split(",");
		var views = getParameterByName("v").split(",");
		var models = getParameterByName("m").split(",");
		var include = getParameterByName("include");
		var x;
		var viewcount;

		$.getJSON('config.json', function (config) {
			rt.config = config;

			if (include) {
				rt.includeJS(include);
			}

			if (plugins[0] != "") {
				for (x in plugins) {
					eden.loadPlugin(plugins[x]);
				}
			}
			if (views[0] != "") {
				viewcount = 0;
				for (x in views) {
					eden.createView("view_" + viewcount, views[x]);
					viewcount = viewcount + 1;
				}
			}

			if (models[0] != "") {
				for (x in models) {
					eden.executeFileSSI(models[x]);
				}
			}

			callback();

			//Layout the dialogs as best as we can
			tileViews();
		});
	});
}
