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
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if (results === null) {
		return "";
	} else {
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}
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

if (!("keys") in Object) {
	//Not in IE 8.
	Object.keys = function (obj) {
		var result = [];
		for (var name in obj) {
			if (obj.hasOwnProperty(name)) {
				result.push(name);
			}
		}
		return result;
	}
}

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
	
	var menuBar = getParameterByName("menus") != "false";
	var plugins = getParameterByName("plugins");
	var include = getParameterByName("include");
	var exec = getParameterByName("exec");

	if (plugins == "") {
		//Default plug-ins
		plugins = [
			"ScriptInput",
			"PluginManager",
			"ProjectList",
			"Canvas2D",
			"SymbolViewer",
			"HTMLContent",
			"SymbolLookUpTable",
			"ScriptGenerator",
			"DependencyMap",
			"StateTimeLine"
		];
	} else {
		plugins = plugins.split(",");
	}

	$(document).ready(function () {
		edenUI = new EdenUI(eden);
		
		var loadPlugins = function (pluginList, callback) {
			var loadPlugin = function () {
				if (pluginList.length > 0) {
					var plugin = pluginList.shift();
					edenUI.loadPlugin(plugin, loadPlugin);
				} else {
					callback();
				}
			};
			return loadPlugin;
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
		
		if (menuBar) {
			edenUI.loadPlugin("MenuBar", function () { });
		}

		// Load the Eden library scripts
		eden.include("library/eden.jse", {name: '/system'}, loadPlugins(plugins, function () {

			$.getJSON('config.json', function (config) {
				rt.config = config;

				if (include) {
					eden.include(include, doneLoading);
				} else {
					doneLoading();
				}
			});
		}));
	});
}
