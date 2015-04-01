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
if (!("isInteger") in Number) {
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

function initialiseJSEden() {
	root = new Folder();
	eden = new Eden(root);
	
	var include = getParameterByName("include");
	var plugins = getParameterByName("plugins");
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
			if (pluginList.length > 0) {
				var plugin = pluginList.shift();
				edenUI.loadPlugin(plugin, function () {
					loadPlugins(pluginList, callback);
				});
			} else {
				callback();
			}
		};
		
		if (getParameterByName("menus") != "false") {
			edenUI.loadPlugin("MenuBar", function () { });
		}

		// Load the Eden library scripts
		eden.include("library/eden.jse", {name: '/system'}, loadPlugins(plugins, function () {

			$.getJSON('config.json', function (config) {
				rt.config = config;

				if (include) {
					eden.include(include);
				}
			});
		}));
	});
}
