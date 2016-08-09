/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

var root;
var eden;
var edenUI;

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

//See also plugins/external-html-content/external-html-content.js
var doingNavigateAway = false;
var confirmUnload = function (event) {
	if (!doingNavigateAway) {
		var prompt = "Leaving this page will discard the current script. Your work will not be saved.";
		event.returnValue = prompt;
		return prompt;
	}
};

/**
 * Currently supported URL parameters (HTTP GET):
 * views: One of a several preset values.  Currently either "none" (no canvas, input window or project list created) or "default".
 * menus: true or false.  If false then the menu bar is not displayed and views can only be opened by writing JS-EDEN script.
 * plugins: A comma separated listed of plug-ins to load automatically at start up.
 * include: URL of a construal to load as soon as the environment is loaded.
 * exec: A piece of JS-EDEN code to execute after the included construal has been loaded.
*/
function initialiseJSEden() {
	root = new Folder();
	eden = new Eden(root);
	
	var menuBar = URLUtil.getParameterByName("menus") != "false";
	var pluginsStr = URLUtil.getParameterByName("plugins");
	var views = URLUtil.getParameterByName("views");
	var include = URLUtil.getArrayParameterByName("include");
	var exec = URLUtil.getParameterByName("exec");

	var plugins;

	var defaultPlugins = [
		"Canvas2D",
		"DependencyMap",
		"HTMLContent",
		"ObservablePalette",
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
		edenUI = new EdenUI(eden);
		window.pageXOffset = 0; //Chrome remembers position on refresh.
		window.pageYOffset = 0;
		edenUI.scrollBarSize2 = window.innerHeight - $(window).height();

		$(document)
		.on('keydown', null, 'ctrl+m', function () {
			edenUI.cycleNextView();
		})
		.on('keyup', null, 'ctrl', function () {
			edenUI.stopViewCycling();
		})
		.on('keydown', null, 'backspace', function (e) {
			var elem = e.target;
			var tagName = elem.tagName.toUpperCase();
			if (tagName != "INPUT" && tagName != "TEXTAREA" && !elem.isContentEditable) {
				e.preventDefault();
			}
		});
		
		if (edenUI.getOptionValue('optConfirmUnload') != "false") {
			window.addEventListener("beforeunload", confirmUnload);
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
			if (menuBar) {
				root.lookup("_menubar_status").assign("JS-EDEN has finished loading.", {name: "/system"});
			}
			if (exec) {
				if (exec.slice(-1) != ";") {
					exec = exec + ";";
				}
				eden.execute(exec, "URL", "", {name: "execute"}, function () { });
			}
		}

		// Load the Eden library scripts
		loadPlugins(plugins, function () {
			$.getJSON('config.json', function (config) {
				rt.config = config;
				eden.include("library/eden.jse", {name: '/system'}, function () {
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
}
