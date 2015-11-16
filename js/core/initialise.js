/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

var root;
var eden;

/**
 * Utility function to extract URL query string parameters.
 */
function getParameterByName(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var url = window.location.href;
	var result = regex.exec(url);
	if (result === null) {
		return "";
	} else {
		return decodeURIComponent(result[1].replace(/\+/g, " "));
	}
}

function getArrayParameterByName(name, isArray) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS, "g");
	var url = window.location.href;
	var result = regex.exec(url);
	var values = [];
	while (result !== null) {
		var value = decodeURIComponent(result[1].replace(/\+/g, " "));
		values.push(value);
		result = regex.exec(url);
	}
	return values;
}

function getStyleBySelector(selector) {
	var sheetList = document.styleSheets;
	for (var i = sheetList.length - 1; i >= 0; i--) {
	   var ruleList = sheetList[i].cssRules;
	   for (var j = 0; j < ruleList.length; j++) {
		   if (ruleList[j].type == CSSRule.STYLE_RULE && ruleList[j].selectorText == selector) {
			   return ruleList[j].style;
		   }
	   }
	}
	//No matching rule found so create one.
	var styleElement = document.getElementById("javascript-injected-styles");
	if (styleElement === null) {
		var headElement = document.getElementsByTagName("head")[0];
		styleElement = document.createElement("style");
		styleElement.id = "javascript-injected-styles";
		headElement.appendChild(styleElement);
	}
	var stylesheet = styleElement.sheet;
	stylesheet.insertRule(selector + "{ }", 0);
	return stylesheet.cssRules[0].style;
}

/*
 * Implementations of functionality specified in web standards but not yet supported by all of
 * supported JS-EDEN runtime platforms.
 */
if (!("isInteger" in Number)) {
	//Not in IE 11.
	Number.isInteger = function (n) {
		return parseInt(n) === n;
	};
}

/* Allow touch events to act like mouse events */
function touchHandler(event) {
    var touch = event.changedTouches[0];

    var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup"
    }[event.type], true, true, window, 1,
        touch.screenX, touch.screenY,
        touch.clientX, touch.clientY, false,
        false, false, false, 0, null);

    touch.target.dispatchEvent(simulatedEvent);
    if (event.target.className.indexOf("ui-dialog-titlebar") != -1 || event.target.className.indexOf("ui-resizable-handle") != -1) {
		event.preventDefault();
	}
}

var confirmUnload = function (event) {
	var prompt = "Leaving this page will discard the current script. Your work will not be saved.";
	event.returnValue = prompt;
	return prompt;
};

/**
 * Currently supported URL parameters (HTTP GET):
 * views: One of a several preset values.  Currently either "none" (no canvas, input window or project list created) or "default".
 * menus: true or false.  If false then the menu bar is not displayed and views can only be opened by writing JS-EDEN script.
 * plugins: A comma separated listed of plug-ins to load automatically at start up.
 * include: URL of a construal to load as soon as the environment is loaded.
 * exec: A piece of JS-EDEN code to execute after the included construal has been loaded.
 * lang: Human language to use for parser and UI. E.g. lang=en for English.
*/
function initialiseJSEden(callback) {
	root = new Folder();
	eden = new Eden(root);
	
	var menuBar = getParameterByName("menus") != "false";
	var pluginsStr = getParameterByName("plugins");
	var views = getParameterByName("views");
	var include = getArrayParameterByName("include");
	var exec = getParameterByName("exec");
	var lang = getParameterByName("lang");

	if (lang == "") {
		lang = "en";
	}

	var plugins;

	var defaultPlugins = [
		"Canvas2D",
		"DependencyMap",
		"HTMLContent",
		"PluginManager",
		"ProjectList",
		"ScriptGenerator",
		"ScriptInput",
		"StateTimeLine",
		"SymbolLookUpTable",
		"SymbolViewer"
	];

	if (pluginsStr == "") {
		plugins = defaultPlugins;
	} else {
		/* A leading + sign indicates to load the default plug-ins in addition to the ones listed in
		 * the URL.  However, plus signs and spaces are interchangeable in HTTP GET parameters!
		 */
		var includeDefaultPlugins = (pluginsStr[0] == " ");
		if (includeDefaultPlugins) {
			pluginsStr = pluginsStr.slice(1);
		}
		plugins = pluginsStr.split(",");
		if (includeDefaultPlugins) {
			plugins = plugins.concat(defaultPlugins);
		}

		if (views == "" || views == "default") {
			plugins.push("Canvas2D");
			plugins.push("ProjectList");
			plugins.push("ScriptInput");
		}
	}

	if (menuBar) {
		plugins.unshift("MenuBar");
	}

	$(document).ready(function () {
		document.addEventListener("touchstart", touchHandler, true);
		document.addEventListener("touchmove", touchHandler, true);
		document.addEventListener("touchend", touchHandler, true);
		document.addEventListener("touchcancel", touchHandler, true);

		edenUI = new EdenUI(eden);
		document.body.scrollLeft = 0; //Chrome remembers position on refresh.
		document.body.scrollTop = 0;
		edenUI.scrollBarSize2 = window.innerHeight - $(window).height();

		$(document)
		.on('keydown', null, 'ctrl+m', function () {
			edenUI.cycleNextView();
		})
		.on('keyup', null, 'ctrl', function () {
			edenUI.stopViewCycling();
		})
		.on('keydown', null, 'backspace', function (e) {
			var tagName = e.target.tagName.toUpperCase();
			if (!(tagName == "INPUT" || tagName == "TEXTAREA" || e.target.contentEditable == "true")) {
				e.preventDefault();
			}
		});
		
		if (edenUI.getOptionValue('optConfirmUnload') != "false") {
			window.addEventListener("beforeunload", confirmUnload);
		}

		var loadLanguage = function(lang, callback) {
			$.getScript("js/language/"+lang+".js", function(data) {
				Language.language = lang;
				eval(data);
				callback();
			});
		}

		var loadPlugins = function (pluginList, callback) {
			var loadPlugin = function () {
				if (pluginList.length > 0) {
					var plugin = pluginList.shift();
					edenUI.loadPlugin(plugin, loadPlugin);
				} else {
					callback();
				}
			};
			loadPlugin();
		};
		
		var doneLoading = function () {
			// Remove spinning loader and message
			edenUI.finishedLoading();

			if (exec) {
				if (exec.slice(-1) != ";") {
					exec = exec + ";";
				}
				eden.execute(exec, "URL", "", {name: "execute"}, function () { });
			}

			if (callback) callback();
		}

		// Load the Eden library scripts
		var librarySource;
		if (document.location.pathname.slice(-15) == "/index-dev.html") {
			librarySource = "library/eden.jse";
		} else {
			librarySource = "library/jseden-lib.min.jse";
		}
		loadLanguage(lang, function() {
			loadPlugins(plugins, function () {
				eden.include(librarySource, {name: '/system'}, function () {
					$.getJSON('config.json', function (config) {
						rt.config = config;

						eden.captureInitialState();
						if (include.length > 0) {
							eden.include(include, doneLoading);
						} else {
							doneLoading();
						}
					});
				});
			});
		});
	});
}
