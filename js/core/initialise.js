/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

var root;
var eden;
var edenUI;

var doneLoading;

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

//See also plugins/external-html-content/external-html-content.js
var doingNavigateAway = false;
var confirmUnload = function (event) {
	if (!doingNavigateAway) {
		eden.project.localSave();
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
 * lang: Human language to use for parser and UI. E.g. lang=en for English.
*/
function Construit(options,callback) {
	root = new Folder();
	eden = new Eden(root);
	
	var menuBar = URLUtil.getParameterByName("menus") != "false";
	var pluginsStr = URLUtil.getParameterByName("plugins");
	//var views = URLUtil.getParameterByName("views");
	var exec = URLUtil.getParameterByName("exec");
	var load = URLUtil.getParameterByName("load");
	var lang = URLUtil.getParameterByName("lang");
	//var imports = URLUtil.getArrayParameterByName("import");
	var restore = URLUtil.getParameterByName("restore");
	var vid = URLUtil.getParameterByName("vid");
	var readPassword = URLUtil.getParameterByName("r");
	var writePassword = URLUtil.getParameterByName("w");
	
	var master = URLUtil.getParameterByName("master");
	var myid = URLUtil.getParameterByName("id");
	var query = URLUtil.getParameterByName("q");
	var mode = URLUtil.getParameterByName("mode");

	// Add URL parameters to observables...
	var urlparams = URLUtil.getParameters();
	for (var x in urlparams) {
		if (urlparams[x].length > 1) {
			eden.root.lookup("jseden_url_"+x).assign(urlparams[x], eden.root.scope, Symbol.localJSAgent);
		} else {
			eden.root.lookup("jseden_url_"+x).assign(urlparams[x][0], eden.root.scope, Symbol.localJSAgent);
		}
	}

	if (lang == "") {
		lang = "en";
	}

	var plugins;

	var defaultPlugins = [
		"Canvas2D",
		"DependencyMap",
		"HTMLContent",
		//"ObservablePalette",
		"PluginManager",
		"ScriptInput",
		"SymbolLookUpTable",
		"SymbolViewer",
		"Debugger",
		"VersionViewer"
	];

	//imports.push("lib/notifications");

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
			plugins.push("ScriptInput");
		}
	}

	$(document).ready(function () {
		// Browser version checks
		var browser = $.browser;
		var bversion = browser.version.split(".");
		bversion = parseInt(bversion[0]);

		function invalidVersion(msg) {
			$(".loadmessage").html(msg);
		}

		if (browser.msie) {
			if (bversion < 13) invalidVersion("Microsoft Internet Explorer is not supported, use Edge, Firefox or Chrome.");
		} else if (browser.mozilla) {
			if (bversion < 29) invalidVersion("Please upgrade your version of Firefox/Mozilla.");
		} else if (browser.webkit && !browser.chrome) {
			invalidVersion("Your browser is not supported by JS-Eden, please use Edge, Firefox or Chrome.");
		} else if (browser.chrome) {
			if (bversion < 39) invalidVersion("Please upgrade your version of Chrome"); 
		} else if (browser.opera) {
			invalidVersion("Opera is not supported, use Chrome or Firefox.");
		} else {
			invalidVersion("Your browser is not supported by JS-Eden, use Firefox or Chrome.");
		}

		document.addEventListener("touchstart", touchHandler, true);
		document.addEventListener("touchmove", touchHandler, true);
		document.addEventListener("touchend", touchHandler, true);
		document.addEventListener("touchcancel", touchHandler, true);

		edenUI = new EdenUI(eden);
		edenUI.scrollBarSize2 = window.innerHeight - $(window).height();
		Eden.Project.init();

		eden.ismobile = mobilecheck();
		eden.root.lookup("jseden_mobile").assign(eden.ismobile, eden.root.scope, Symbol.defaultAgent);

		// Put JS-EDEN version number or name in top-right corner.
		$.ajax({
			url: "version.json",
			dataType: "json",
			success: function (data) {
				var versionHtml = '';
				if (data.tag) {
					//versionHtml += 'Version ' + data.tag;
					document.title = document.title + " " + data.tag;
				}
				var components = data.tag.slice(1).split(".");
				var components2 = components[2].split("-");
				eden.root.lookup("jseden_version_major").assign(parseInt(components[0]), eden.root.scope, Symbol.defaultAgent);
				eden.root.lookup("jseden_version_minor").assign(parseInt(components[1]), eden.root.scope, Symbol.defaultAgent);
				eden.root.lookup("jseden_version_patch").assign(parseInt(components2[0]), eden.root.scope, Symbol.defaultAgent);
				eden.root.lookup("jseden_version_commit").assign(parseInt(components2[1]), eden.root.scope, Symbol.defaultAgent);
				eden.root.lookup("jseden_version_name").assign(data.tag, eden.root.scope, Symbol.defaultAgent);
				eden.root.lookup("jseden_version_sha").assign(data.sha, eden.root.scope, Symbol.defaultAgent);
				/*if (data.sha) {
					versionHtml = 'Version <a href="https://github.com/EMgroup/js-eden/commit/' + data.sha +'">' + data.tag + '</a>';
				} else {
					versionHtml = 'Version ' + data.tag;
				}
				$('<div id="menubar-version-number"></div>').html(versionHtml).appendTo($("#menubar-main"));*/
			},
			cache: false
		});

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
		
		// TODO Remove this once restore works
		if (edenUI.getOptionValue('optConfirmUnload') != "false") {
			window.addEventListener("beforeunload", confirmUnload);
		}

		/**
		 * Get the correct language script from server.
		 */
		var loadLanguage = function(lang, callback) {
			$.getScript("js/language/"+lang+".js", function(data) {
				Language.language = lang;
				eval(data);
				// Only now can the menu bar and UI be properly created.
				if (menuBar) {
					edenUI.menu = new EdenUI.MenuBar();
					//eden.execute2("jseden_project_subtitle is \"Version \" // jseden_version_name;", Symbol.defaultAgent);
				}

				if (!options || !options.noload) {
					edenUI.feedback = new EdenUI.Feedback();
					edenUI.explorer = new EdenUI.Explorer();
				}
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
		
		doneLoading = function (loaded) {
			window.scrollTo(0, 0); //Chrome remembers position on refresh.
			// Remove spinning loader and message
			edenUI.finishedLoading();

			if (exec) {
				if (exec.slice(-1) != ";") {
					exec = exec + ";";
				}
				eden.execute2(exec);
			}

			// Set up P2P networking
			if (myid != "" || master != "") {
				eden.peer = new Eden.Peer((master != "") ? master : undefined, (myid != "") ? myid : undefined);
			}

			if (callback) callback(loaded);
		}


		loadLanguage(lang, function() {
			if (options && options.noload) {
				Eden.DB.connect(Eden.DB.repositories[Eden.DB.repoindex], function() {
					console.log("DONE LOADING");
					doneLoading(true);
				});
			} else {
				loadPlugins(plugins, function () {
						$.getJSON('config.json', function (config) {
							rt.config = config;

							Eden.DB.connect(Eden.DB.repositories[Eden.DB.repoindex], function() {
								if (load != "") {
									if (mode !== null && mode != "") {
										eden.root.lookup("jseden_project_mode").assign(mode, eden.root.scope, Symbol.defaultAgent);
									}
									Eden.Project.load(parseInt(load),(vid === null || vid == "") ? undefined : parseInt(vid),(readPassword === null || readPassword == "") ? undefined : readPassword,function(){ doneLoading(true); });
								} else if (restore != "") {
									if (mode !== null && mode != "") {
										eden.root.lookup("jseden_project_mode").assign(mode, eden.root.scope, Symbol.defaultAgent);
									}
									Eden.project.restore();
									doneLoading(true);
								} else {
									// Background load library...
									//Eden.Agent.importAgent("lib","default", [], function() {});
									doneLoading(false);
								}
							});
							Eden.DB.repoindex = (Eden.DB.repoindex + 1) % Eden.DB.repositories.length;

						});
					//});
				});
			}
		});
	});
}
