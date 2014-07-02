/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

joe.log("initialise.js: READING SCRIPT");
 
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

//XXX what is this?
var current_view = new Array();

/**
 * Utility function to extract URL query string parameters.
 */
function getParameterByName( name )
{
joe.log("initialise.js: getParameterByName("+name+")");
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function makeViewArray() {
joe.log("initialise.js: makeViewArray()");
	result = new Array();
	for (x in eden.active_dialogs) {
		result.push($("#"+x+"-dialog")[0]);
	}
	return result;
}

function sortArea(a,b) {
joe.log("initialise.js: sortArea("+a+","+b+")");
	areaA = $(a).dialog("option","width") * $(a).dialog("option","height");
	areaB = $(b).dialog("option","width") * $(b).dialog("option","height");

	return areaB-areaA;
}

function removeElement(a,index) {
joe.log("initialise.js: removeElement()");
	result = new Array();
	for (x in a) {
		if (x == index) continue;
		result.push(a[x]);
	}
	return result;
}

function largestHeight(a) {
joe.log("initialise.js: largestHeight()");
	largest = 0;
	index = 0;
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
joe.log("initialise.js: smallestHeight()");
	smallest = 1000000;
	index = 0;
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
joe.log("initialise.js: totalWidth("+a+")");
	width = 0;	
	for (x in a) {
		width = width + $(a[x]).dialog("option","width");
	}
	return width;
}

function placeViews(views,top,spacing) {
joe.log("initialise.js: placeViews");
	heighest = largestHeight(views);

	left = spacing;
	for (x in views) {
		$(views[x]).dialog("option","position",[left,top]);
		left = left + $(views[x]).dialog("option","width") + spacing;
	}
	return top + heighest + spacing;
}

function tileViews() {
joe.log("initialise.js: tileViews()");
	views = makeViewArray();
	views.sort(sortArea);
	overflow = new Array();
	spacing = 50;

	while (totalWidth(views) > ($(document).width() + (spacing * (views.length+1)))) {
		//Overflow by removing smallest height item.
		index = smallestHeight(views);
		overflow.push(views[index]);
		views = removeElement(views,index);
	}
	
	//TODO Now need to repeat process on overflow incase that exceeds width.

	//Actually position views
	height = placeViews(views,100,spacing);
	if (overflow.length > 0) {
		placeViews(overflow,height,spacing);
	}
}

function JS_Eden_Initialise(callback) {
joe.log("initialise.js: JS_Eden_Initialise(callback)");
	$(document).ready(function() {
		//runTests(all_the_tests);
		root = new Folder();
		eden = new Eden(root);

		//XXX don't think this is needed anymore.
		modelbase = "";

		//Create the error window. Hiden to start with.
		$('<pre id="error-window" style="font-family:monospace; display: none;"></pre>').appendTo($('body'));

		//Load the Eden library scripts
		Eden.executeFileSSI("library/eden.jse");

		//Process query string for plugins and models to load
		var plugins = getParameterByName("p").split(",");
		var views = getParameterByName("v").split(",");
		var models = getParameterByName("m").split(",");

		if (plugins[0] != "") {
			for (x in plugins) {
				eden.loadPlugin(plugins[x]);
			}
		}
		if (views[0] != "") {
			var viewcount = 0;
			for (x in views) {
				eden.createView("view_"+viewcount,views[x]);
				viewcount = viewcount + 1;
			}
		}

		if (models[0] != "") {
			for (x in models) {
				Eden.executeFileSSI(models[x]);
			}
		}

		callback();

		//Layout the dialogs as best as we can
		tileViews();
	});
}
