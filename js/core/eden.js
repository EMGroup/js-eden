/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

function noop() {}

function listenTo(eventName, target, callback) {
	if (!this.listeners[eventName]) {
		this.listeners[eventName] = [];
	}
	this.listeners[eventName].push({target: target, callback: callback});
}

function emit(eventName, eventArgs) {
	var listenersForEvent = this.listeners[eventName];
	if (!listenersForEvent) {
		return;
	}
	var i;
	for (i = 0; i < listenersForEvent.length; ++i) {
		var target = listenersForEvent[i].target;
		var callback = listenersForEvent[i].callback;
		callback.apply(target, eventArgs);
	}
}

mobilecheck = function() {
	if (Eden.mobile !== undefined) return Eden.mobile;
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	Eden.mobile = check;
  return check;
};

// import node.js modules
function concatAndResolveUrl(url, concat) {
	var url1 = url.split('/');
	var url2 = concat.split('/');
	var url3 = [ ];
	for (var i = 0, l = url1.length; i < l; i ++) {
		if (url1[i] == '..') {
			url3.pop();
		} else if (url1[i] == '.') {
			continue;
		} else {
			url3.push(url1[i]);
		}
	}
	for (var i = 0, l = url2.length; i < l; i ++) {
		if (url2[i] == '..') {
			url3.pop();
		} else if (url2[i] == '.') {
			continue;
		} else {
			url3.push(url2[i]);
		}
	}
	return url3.join('/');
}

(function (global) {
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		Polyglot = require('./polyglot').Polyglot;
		parser = require('./translator').parser;
		rt = require('./runtime').rt;
	}

	/**Create a new category of plug-ins.  Plug-ins in the same category are displayed immediately
	 * above/below each other in the drop down menu. */
	function ViewCategory(label, menuPriority) {
		this.getLabel = function () {
			return label;
		}
		this.getMenuPriority = function () {
			return menuPriority;
		};
	}

	/**
	 * @constructor
	 * @struct
	 * @param {Eden} eden
	 */
	function EdenUI(eden) {
		/**
		 * @type {Eden}
		 * @public
		 */
		this.eden = eden;

		/**Descriptive information about the types of views that are available.
		 * @type {Object.<string,*>}
		 */
		this.views = {};

		/**Various pieces of information used to communicate between the views and view manager
		 *(or in some cases purely for the view's private use).
		 * Example: the confirmClose attribute determines if the user is prompted to confirm before
		 * the view is closed (destroyed).
		 */
		this.viewInstances = {};

		/**A mapping between view names and the name of the type of view that each view belongs to.
		 * @type {Object.<string,*>}
		 */
		this.activeDialogs = {};

		/**The plug-ins actually loaded.
		 * Contrast with: EdenUI.plugins
		 * @type {Object.<string,*>}
		 */
		this.plugins = {};

		var me = this;
		this.loaded = false;

		this.branding = {};
		$.ajax({
			url: "branding.json",
			dataType: "json",
			success: function (data) {
				me.branding = data;
			},
		});

		this.$uimsg = $("<div class='message-box'></div>");
		this.$uimsg.appendTo("body");
		this.$uimsg.hide();
		this.messagetimeout = undefined;
		this.messagedisplaytime = 5000;

		/*$(document).ajaxError(function(event, j, a, err) {
			eden.error(new Error(err + ": " + a.url));
		});*/
		
		//Never called anymore.
		this.eden.listenTo('executeFileLoad', this, function (path) {
			edenUI.updateStatus("Loading "+path);
		});

		/*this.eden.listenTo('executeBegin', this, function (path) {
			edenUI.updateStatus("Parsing "+path+"...");
		});*/

		this.eden.listenTo('executeError', this, function (e, options) {
			var errorMessageHTML = Eden.htmlEscape(e.message);

			var formattedError = "<div class=\"error-item\">"+
				"## ERROR number " + options.errorNumber + ":<br>"+
				(options.path ? "## " + options.path + "<br>" : "")+
				errorMessageHTML +
				"</div>\n\n";

			//this.showErrorWindow().prepend(formattedError)
			//this.showErrorWindow().prop('scrollTop', 0);

			var msg;
			if (typeof e == "string") msg = e;
			else msg = e.message;

			edenUI.showMessage("error", "Error: " + msg);
		});

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		this.windowHighlighter = new WindowHighlighter(this);
		this.currentView = undefined; //Used for cycling between views.

		this.errorWindow = null;
		
		this.viewCategories = {};
		this.numberOfViewCategories = 0;
		/*Category of plug-ins for construal comprehension. */
		this.addViewCategory("comprehension", "Comprehension");
		/*Category of plug-ins for interacting with the interpreter to create new definitions. */
		this.addViewCategory("interpretation", "Making Definitions");
		/*Category of plug-ins for preserving the current state, revisiting prior states, etc. */
		this.addViewCategory("history", "History &amp; State");
		/*Category of plug-ins for construal visualizations, e.g. Canvas, Plain HTML, etc. */
		this.addViewCategory("visualization", "Visualization");
		/*Category of plug-ins that radically enhance what the environment can do in ways that don't
		 * fit into any of the other categories defined here and don't warrant a whole category of
		 * their own, e.g. State Listener. */
		this.addViewCategory("extension", "Extensions");
		/*Category of plug-ins that pertain to the management of the JS-EDEN environment itself, e.g. Plugin Listing. */
		this.addViewCategory("environment", "Management");		

		this.views.ErrorLog = {
			dialog: function () {
				if (!this.errorWindow) {
					this.errorWindow = $(
						'<pre id="errors-dialog"></pre>'
					);
				}

				this.errorWindow
					.addClass('ui-state-error')
					.dialog({width: 500, height: 250})
					.dialog('moveToTop');
				me.brieflyHighlightView(this.name);
			},
			title: "Error Log",
			name: "errors",
			category: this.viewCategories.interpretation
		};
	}

	/**Momentarily provides a visual cue to direct the user's gaze towards a particular view.
	 * Default implementation (in case support for displaying multiple views simultaneously isn't loaded).
	 * @param {string} name The name of the view to draw attention to.
	 */
	EdenUI.prototype.brieflyHighlightView = function (name) {
		var dialogWindow = $("#"+viewName+"-dialog").dialog.parent();
		dialogWindow.addClass("window-activated");
		setTimeout(function () {
			dialogWindow.removeClass("window-activated");
		}, 600);
	}

	/**Calling this method repeatedly displays each view in turn, cycling through the views.
	 * Requires that a view manager is loaded.
	 */
	EdenUI.prototype.cycleNextView = function () {
		this.stopHighlightingView(this.currentView, true, false);
		var viewNames = Object.keys(this.activeDialogs);
		if (this.currentView === undefined) {
			this.currentView = viewNames[0];
		} else {
			for (i = 0; i < viewNames.length; i++) {
				if (this.currentView == viewNames[i]) {
					this.currentView = viewNames[(i + 1) % viewNames.length];
					break;
				}
			}
		}
		this.highlightView(this.currentView, true);
	};

	EdenUI.prototype.stopViewCycling = function () {
		this.stopHighlightingView(this.currentView, true, true);
	};

	/**
	 * Stores plugins that can be loaded. Plugins will modify this directly in
	 * order for them to be loaded later.
	 */
	EdenUI.plugins = {};

	/**
	 * Load a plugin if it is not already loaded. The plugin must have been
	 * registered first.
	 *
	 * @param {string} name Name of the plugin to load.
	 * @param {function()?} success
	 */
	EdenUI.prototype.loadPlugin = function (name, agent, success) {
		if (arguments.length === 2) {
			success = agent;
			agent = {name: '/loadPlugin'};
		}

		var me = this;
		var wrappedSuccess = function () {
			me.emit('loadPlugin', [name]);
			success && success.call(agent);
		}

		if (this.plugins[name] === undefined) {
			this.plugins[name] = true; // To prevent cycles
			this.plugins[name] = new EdenUI.plugins[name](this, wrappedSuccess);
		} else {
			wrappedSuccess();
		}
	};

	EdenUI.prototype.addViewCategory = function (name, label) {
		this.viewCategories[name] = new ViewCategory(label, this.numberOfViewCategories);
		this.numberOfViewCategories++;
	};

	EdenUI.prototype.showErrorWindow = function () {
		this.createView("errors", "ErrorLog", window);
		return $("#errors-dialog");
	};

	EdenUI.prototype.updateStatus = function(message) {
		// If loading, update the loader message
		if (!this.loaded) {
			console.log(message);
			$(".loadmessage").html(message);
		} else {
			// Otherwise show status bubble for a bit.
			this.showMessage("info", message);
		}
	};

	EdenUI.prototype.hideMessage = function() {
		edenUI.$uimsg.hide("slow");
	}

	EdenUI.prototype.showMessage = function(type, message) {
		if (type == "info") {
			this.$uimsg.html("<div class='message-infotext'>"+message+"</div>");
		} else if (type == "error") {
			this.$uimsg.html("<div class='message-errortext'>"+message+"</div>");
		}
		this.$uimsg.show("fast");
		clearTimeout(this.messagetimeout);
		this.messagetimeout = setTimeout(this.hideMessage, this.messagedisplaytime);
	};

	EdenUI.prototype.finishedLoading = function() {
		//$(".loaddialog").remove();
		this.loaded = true;
		//edenUI.updateStatus(Language.ui.general.finished_loading);
	};

	/**
	 * @param {string} eventName
	 * @param {*} target
	 * @param {function(...[*])} callback
	 */
	EdenUI.prototype.listenTo = listenTo;

	/**
	 * @param {string} eventName
	 * @param {Array.<*>} eventArgs
	 */
	EdenUI.prototype.emit = emit;

	EdenUI.showTooltip = function (event, text) {
		var tooltip = document.getElementById("tooltip");
		var x = event.clientX + 2;
		var y = event.clientY + 20;
		var maxWidth = window.pageXOffset + window.innerWidth - x - 15;
		if (maxWidth < 200) {
			x = x - (200 - maxWidth);
			maxWidth = 200;
		}
		tooltip.style.left = x + "px";
		tooltip.style.maxWidth = maxWidth + "px";
		tooltip.style.top = y + "px";
		tooltip.innerHTML = text;
		tooltip.style.display = "block";
	}
	
	EdenUI.closeTooltip = function () {
		document.getElementById("tooltip").style.display = "none";
	}

  /**Cached copy of user preferences, etc. (needed for when local storage is disabled). */
  EdenUI.prototype.options = {};

	/**Retrieves a program option from local storage or the main memory cache.
	 * @param {String} optionName  The name of the option to set.
	 * @return {String} The option's value, or null if the requested program option has not been given a value yet.
	 */
	EdenUI.prototype.getOptionValue = function (optionName) {
		if (optionName in this.options) {
		  return this.options[optionName];
		} else {
		  try {
			  if (window.localStorage) {
				  return window.localStorage.getItem(optionName);
			  }
		  } catch (e) {
			  //Cookies are blocked.
			  return null;
		  }
		}
	}
	
	/**Stores a program option in memory, and, if possible, local storage too.
	 * @param {String} optionName  The name of the option to set.
	 * @param {*} value The value to assign to the option.
	 * @returns {boolean} True if the option was saved in local storage, or false if it could not be saved.
	 */
	EdenUI.prototype.setOptionValue = function(optionName, value) {
		this.options[optionName] = String(value);
		this.emit("optionChange", [optionName, String(value)]);
		try {
			if (window.localStorage) {
				window.localStorage.setItem(optionName, value);
				return true;
			}
		} catch (e) {
			//Cookies are blocked.
			return false;
		}
	}

	/**Changes an option's value without committing the change to local storage.
	 */
	EdenUI.prototype.setDefaultOptionValue = function (optionName, value) {
		if (this.getOptionValue(optionName) === null) {
			this.options[optionName] = String(value);
			this.emit("optionChange", [optionName, String(value)]);
		}
	}

	EdenUI.prototype.unsetOptionValue = function (optionName) {
		delete this.options[optionName];
		this.emit("optionChange", [optionName, null]);
		try {
			if (window.localStorage) {
				window.localStorage.removeItem(optionName);
			}
		} catch (e) {
			//Cookies are blocked.
		}
	}

	/**Derives a regular expression from a string.  The string can be a simple search keyword or a
	 * string containing a regular expression.  The following rules are applied to interpret the
	 * string:
	 * (1) If the search string is less than 3 characters long and "simple searching" is enabled and
	 *     the string doesn't contain any meta characters, then the search matches against the
	 *     beginning of the target string (i.e. there is an implied ^), otherwise the search keyword
	 *     can be matched anywhere in the target string (unless the exactMatch option is specified).
	 * (2) If simple searching is enabled then * is interpreted like a regular expression .*, ? like
	 *     .? and *, ?, and or like | and these are the only meta characters that are enabled.
	 * (3) If the search string contains a capital letter then the search is case sensitive,
	 *     otherwise it is case insensitive.
	 * If a jQuery object is passed instead of a string then the search string will be read
	 * from the element's .value property and the element will be styled with an indication of
	 * whether the regular expression is a valid one or not.
	 * @param {String} str The search string.
	 * @param {String} flags Any regular expression flags to add.
	 * @param {boolean} exactMatch True to force searching for an exact match, false or no specified otherwise.
	 * @param {String} searchLang "simple" for simple wildcards, "regexp" for full regular expression
	 * syntax.  Default is to the preference set by the user.
	 */
	EdenUI.prototype.regExpFromStr = function (str, flags, exactMatch, searchLang) {
		var regExpStr, regExpObj;
		var valid = true;
		var inputBox;
		var minWordLength = 3;

		if (typeof(str) == "object") {
			inputBox = str;
			str = inputBox[0].value;
		}
		if (flags === undefined) {
			flags = "";
		}

		//Determine the syntax that the user used to express their search.
		var simpleWildcards;
		if (searchLang === undefined) {
			//The following line should match the same heuristic check in showObservables in core.js-e
			if (/[\\+^$|({[]|(\.\*[^\s*?])/.test(str)) {
				//User appears to be using a regular expression even though their usual preference might be simple search.
				simpleWildcards = false;
			} else {
				simpleWildcards = this.getOptionValue("optSimpleWildcards") !== "false";
			}
		} else if (searchLang == "simple") {
			simpleWildcards = true;
		} else if (searchLang == "regexp") {
			simpleWildcards = false;
		} else {
			throw new Error("EdenUI.regExpFromStr: Unsupported search language " + searchLang);
		}

		//Guess desirability of case sensitivity based on the presence or absence of capital letters.
		if (!/[A-Z]/.test(str)) {
			flags = flags + "i";
		}

		//Handle substitutions to replace simple wildcards with real regexp ones.
		if (simpleWildcards) {
			//Mode where * acts as .* , ? as .? , or as |, no other special characters.
			str = str.replace(/([\\+^$.|(){[])/g, "\\$1").replace(/([*?])/g, ".$1");
			var alternatives = str.split(new RegExp("\\s+(?:" + Language.ui.search.disjunction + "|or)\\s+", "i"));
			for (var i = 0; i < alternatives.length; i++) {
				var alternative = alternatives[i];
				if (exactMatch || /[?*]/.test(alternative)) {
					alternatives[i] = "^(" + alternative + ")$";
				} else if (alternative.length < minWordLength) {
					//Assume very short strings are intended to be prefixes in simple search mode.
					alternatives[i] = "^(" + alternative + ")";
				}
			}
			regExpStr = alternatives.join("|");
			regExpObj = new RegExp(regExpStr, flags);

		} else {

			//Attempt to construct a regexp.
			try {
				regExpStr = str;
				if (exactMatch) {
					regExpStr = "^(" + regExpStr + ")$";
				}
				regExpObj = new RegExp(regExpStr, flags);
			} catch (e) {
				//User typed in a bad regexp string.  Unmatched (, ) or [ or begins with *, +, ? or { or ends with backslash.
				valid = false;
				var validPart = str.match(/^([^*+?\\(){[]([^\\()[]*(\\.)?)*)?/)[0];
				if (exactMatch) {
					validPart = "^(" + validPart + ")";
				}
				regExpObj = new RegExp(validPart, flags);
			}
		}

		if (inputBox) {
			if (valid) {
				inputBox.removeClass("invalid_form");
			} else {
				inputBox.addClass("invalid_form");
			}
		}
		return regExpObj;
	}

	/**
	 * @constructor
	 * @struct
	 */
	function Eden(root) {
		this.root = root;
		root.base = this;

		/**
		 * @type {number}
		 * @public (Inspected and reset by the framework for testing EDEN code.)
		 */
		this.errorNumber = 0;

		this.polyglot = new Polyglot();

		var me = this;
		this.polyglot.setDefault('eden');
		this.polyglot.register('eden', {
			execute: function (code, origin, prefix, agent, success) {
				me.executeEden(code, origin, prefix, agent, success);
			}
		});
		this.polyglot.register('js', {
			execute: function (code, origin, prefix, agent, success) {
				var result = eval(code);
				success && success(result);
			}
		});

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

		/**
		 * A record of the external files that have been loaded using the include statement.
		 * Plugins (such as the script generator) can request a copy of this information.
		 * @private
		 */
		this.topLevelIncludes = [];
		
		/**
		 * Includes nested includes.
		 */
		this.included = {};

		/**
		 * Setting this to false temporarily prevents the error method from
		 * producing any output.  This is used by the framework for testing EDEN
		 * code in the scenario when an error is the intended outcome of a test case.
		 *
		 * @see library/assertions.js-e
		 * @type {boolean}
		 * @public
		*/
		this.reportErrors = true;

		/**Records whether or not the environment is in the initial state, i.e. if the system
		 * library is loaded but no other definitions have been made.
		 * @type {boolean}
		 * @private
		 */
		var inInitialState = true;
		
		/**Records the values of the observables in the initial state.
		 * @type {Object}
		 * @private
		 */
		var initialDefinitions = {};
	}

	Eden.prototype.isValidIdentifier = function (name) {
		return Boolean(name && /^[_a-zA-Z]\w*$/.test(name));
	};

	Eden.prototype.captureInitialState = function () {
		this.initialDefinitions = {};
		for (var i = 0; i < Eden.initiallyDefined.length; i++) {
			var name = Eden.initiallyDefined[i];
			if (name in this.root.symbols) {
				var symbol = this.root.symbols[name];
				if (symbol.eden_definition !== undefined && symbol.definition !== undefined) {
					this.initialDefinitions[name] = symbol.eden_definition + ";";
				} else {
					this.initialDefinitions[name] = name + " = " + Eden.edenCodeForValue(symbol.context.scope.lookup(symbol.name).value) + ";";
				}
			}
		}
		this.included = {};
		this.inInitialState = true;
	}

	Eden.load = function(path, tag, cb, nohistory) {
		console.log("Loading: " + path + "@" + tag);
		Eden.DB.load(path,tag, undefined, function(status) {
			var menu = $(".jseden-title").get(0);
			if (menu) {
				menu.textContent = status.title;
			}
			EdenUI.MenuBar.saveTitle(status.title);
			eden.root.lookup("_jseden_loaded").assign(true, eden.root.scope);

			if (!nohistory) window.history.pushState({project: path, tag: tag},"","?load="+path+"&tag="+tag);

			if (cb) cb();
		});
	}

	Eden.loadFromString = function(str, cb) {
		var data = JSON.parse(str);
		//console.log(data);
		//Eden.Statement.load(data.statements);
		eden.execute2(data.script);
		//EdenUI.ScriptView.loadData(data.scriptviews);
		var menu = $(".jseden-title").get(0);
		if (menu) {
			menu.textContent = data.title;
		}
		EdenUI.MenuBar.saveTitle(data.title);
		window.history.pushState(null,"","");
		eden.root.lookup("_jseden_loaded").assign(true, eden.root.scope);
		if (cb) cb(data);
	}

	Eden.prototype.initialDefinition = function (name) {
		return this.initialDefinitions[name];
	}

	Eden.prototype.isInInitialState = function () {
		return this.inInitialState;
	}

	Eden.reset = function() {
		edenUI.destroyAllViews();
		eden.reset();
		Eden.Agent.removeAll();
	}

	Eden.prototype.reset = function () {
		this.root.lookup("forgetAll").definition(root, root.scope)("", true, false);
		this.root.collectGarbage();
		this.errorNumber = 0;
		this.inInitialState = true;
		this.topLevelIncludes = [];
		this.included = {};
		this.reportErrors = true;
	}

	/**
	 * @param {string} eventName
	 * @param {*} target
	 * @param {function(...[*])} callback
	 */
	Eden.prototype.listenTo = listenTo;

	/**
	 * @param {string} eventName
	 * @param {Array.<*>} eventArgs
	 */
	Eden.prototype.emit = emit;

	/**
	 * @param {*} error
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 */
	Eden.prototype.error = function (error, origin) {
		if (origin != "error") {
			//Errors that halt execution are always reported and cause error
			//handling to be restored to the default behaviour to avoid confusion.
			this.reportErrors = true;
		}
		if (this.reportErrors) {
			if (origin) {
				this.emit('executeError', [error, {path: origin, errorNumber: this.errorNumber}]);
			} else {
				this.emit('executeError', [error, {errorNumber: this.errorNumber}]);
			}
		}
		++this.errorNumber;
	};
	
	Eden.prototype.executeEden = function (code, origin, prefix, agent, success) {
		console.trace("DEPRECATED USE OF OLD PARSER");
		var result;
		var me = this;
		this.emit('executeBegin', [origin, code]);
		//try {
			var js = this.translateToJavaScript(code);
			this.inInitialState = false;
			eval(js).call(agent, this.root, this, this.root.scope, prefix, function () {
				success && success();
				me.emit('executeEnd', [origin]);
			});
		//} catch (e) {
		//	this.error(e);
			success && success();
		//}
	};

	/**
	 * @param {string} code
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	Eden.prototype.execute = function (code, origin, prefix, agent, success) {
		if (arguments.length == 1) {
			success = noop;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}
		if (arguments.length == 2) {
			success = origin;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}

		this.polyglot.execute(code, origin, prefix, agent, success);
	};

	/**
	 * @param {string} includePath
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function()} success Called when include has finished successfully.
	 */
	Eden.prototype.include = function (includePath, prefix, agent, success) {
		console.trace("DEPRECATED USE OF INCLUDE: " + includePath);
		var me = this;
		var includePaths;
		if (includePath instanceof Array) {
			includePaths = includePath;
		} else {
			includePaths = [includePath];
		}

		if (arguments.length === 2) {
			// path and callback
			success = prefix;
			agent = {name: '/include'};
			prefix = '';
		} else if (arguments.length === 3) {
			success = agent;
			agent = prefix;
			prefix = '';
		}
		/* The include procedure is the agent that modifies the observables, not the agent passing
		 * the include agent a filename.  Interesting philosophically?  Plus a practical necessity,
		 * e.g. for the Script Generator plug-in to work properly.
		 */
		var originalAgent = agent;
		agent = {name: '/include'};		

		var addIncludeURL = function (url) {
			var index = me.topLevelIncludes.indexOf(url);
			if (index != -1) {
				me.topLevelIncludes.splice(index, 1);
			}
			me.topLevelIncludes.push(url);
		}
		
		var promise;
		includePaths.forEach(function (includePath) {
			var url;
			if (includePath.charAt(0) === '.') {
				url = concatAndResolveUrl(prefix, includePath);
			} else {
				url = includePath;
			}
			var match = url.match(/(.*)\/([^\/]*?)$/);
			var newPrefix = match ? match[1] : '';
			var previousPromise = promise;
			promise = $.ajax({
				url: url,
				dataType: "text"
			}).then(function (data) {
				var deferred = $.Deferred();
				if (previousPromise) {
					return previousPromise.then(function () {
						eden.execute(data, url, newPrefix, agent, deferred.resolve);
						if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
							addIncludeURL(url);
						}
						me.included[url] = true;
						return deferred.promise;
					});
				} else {
					eden.execute(data, url, newPrefix, agent, deferred.resolve);
					if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
						addIncludeURL(url);
					}
					me.included[url] = true;
					return deferred.promise;
				}
			});
		});
		promise.then(function () {
			if (success !== undefined) {
				try {
					success.call(agent);
				} catch (e) {
					me.error(e);
				}
			}
		});
	};

	/**
	 * @param {string} code
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	Eden.prototype.execute2 = function (code, agent, success) {
	console.log(code);
		/*if (arguments.length == 1) {
			success = noop;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}
		if (arguments.length == 2) {
			success = origin;
			origin = 'unknown';
			prefix = '';
			agent = {name: '/execute'};
		}*/

		agobj = {name: 'execute', getSource: function() { return code; }, getLine: function() { return 0; }};
		if (agent) agobj.name = agent;

		var ast = new Eden.AST(code);
		if (ast.script.errors.length == 0) {
			/*if (success) {
				ast.script.statements.push({errors: [], execute: success});
			}*/
			//ast.script.execute(this.root.scope, ast, this.root.scope, agobj);
			ast.execute(agobj, success);
		} else {
			console.error(ast.script.errors[0].prettyPrint());
		}
		//success && success.call();
		//this.polyglot.execute(code, origin, prefix, agent, success);
	};



	Eden.prototype.agentFromFile = function(name, url, execute) {
		var agent;
		if (Eden.Agent.agents[name] === undefined) {
			agent = new Eden.Agent(undefined, name);
		} else {
			agent = Eden.Agent.agents[name];
		}
		agent.loadFromFile(url, execute);
	}


	//Eden.prototype.execute = Eden.prototype.execute2;

	/**
	 * @param {string} includePath
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function()} success Called when include has finished successfully.
	 */
	Eden.prototype.include2 = function (includePath, prefix, agent, success) {
		var me = this;
		var includePaths;
		if (includePath instanceof Array) {
			includePaths = includePath;
		} else {
			includePaths = [includePath];
		}

		if (arguments.length === 2) {
			// path and callback
			success = prefix;
			agent = {name: '/include'};
			prefix = '';
		} else if (arguments.length === 3) {
			success = agent;
			agent = prefix;
			prefix = '';
		}
		/* The include procedure is the agent that modifies the observables, not the agent passing
		 * the include agent a filename.  Interesting philosophically?  Plus a practical necessity,
		 * e.g. for the Script Generator plug-in to work properly.
		 */
		var originalAgent = agent;
		agent = {name: '/include'};		

		var addIncludeURL = function (url) {
			var index = me.topLevelIncludes.indexOf(url);
			if (index != -1) {
				me.topLevelIncludes.splice(index, 1);
			}
			me.topLevelIncludes.push(url);
		}
		
		var promise;
		includePaths.forEach(function (includePath) {
			var url;
			if (includePath.charAt(0) === '.') {
				url = concatAndResolveUrl(prefix, includePath);
			} else {
				url = includePath;
			}
			var match = url.match(/(.*)\/([^\/]*?)$/);
			var newPrefix = match ? match[1] : '';
			var previousPromise = promise;
			promise = $.ajax({
				url: url,
				dataType: "text"
			}).then(function (data) {
				var deferred = $.Deferred();
				if (previousPromise) {
					return previousPromise.then(function () {
						eden.execute2(data, agent, deferred.resolve);
						//var nagent = new Eden.Agent();
						//nagent.setSource(data);
						//nagent.executeLine(-1);
						if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
							addIncludeURL(url);
						}
						me.included[url] = true;
						return deferred.promise;
					});
				} else {
					eden.execute2(data, agent, deferred.resolve);
					//var nagent = new Eden.Agent();
					//nagent.setSource(data);
					//nagent.executeLine(-1);
					if (originalAgent !== undefined && originalAgent.name == Symbol.getInputAgentName()) {
						addIncludeURL(url);
					}
					me.included[url] = true;
					return deferred.promise;
				}
			});
		});
		promise.then(function () {
			success && success.call(agent);
		});
	};

	Eden.prototype.getIncludedURLs = function () {
		return this.topLevelIncludes.slice();
	}

	/**
	 * Includes nested includes.
	 */
	Eden.prototype.getAllIncludedURLs = function () {
		return Object.keys(this.included);
	}

	/**Given any JavaScript value returns a string representing the EDEN code that would be required
	 * to obtain the same value when interpreted.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value.
	 */
	Eden.edenCodeForValue = function (value, refStack) {
		var type = typeof(value);
		var code = "";
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
			// NOTE: For the new parser...
			code = code.replace(/\n/g,"\"\n\"");
		} else if (Array.isArray(value)) {
			if (refStack === undefined) {
				refStack = [];
			}
			if (refStack.indexOf(value) != -1) {
				//Array contains a reference to itself.
				code = code + "<<circular reference>>";
			} else {
				refStack.push(value);
				code = "[";
				for (var i = 0; i < value.length - 1; i++) {
					code = code + Eden.edenCodeForValue(value[i], refStack) + ", ";
				}
				if (value.length > 0) {
					code = code + Eden.edenCodeForValue(value[value.length - 1], refStack);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if ("getEdenCode" in value) {
				code = value.getEdenCode();
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				"parent" in value &&
				value.parent instanceof Symbol
			) {
				code = "&" + value.parent.name.slice(1) + "[" + value.keys[0] + "]";
			} else if (typeof(window) == "object" && typeof(document) == "object" && typeof(Element) == "function") {
				//Web browser runtime environment
				if (value == window) {
					code = "${{ window }}$";
				} else if (value == document) {
					code = "${{ document }}$";
				} else if (value == document.documentElement) {
					code = "${{ document.documentElement }}$";
				} else if (value == document.body) {
					code = "${{ document.body }}$";
				} else if (value instanceof Element && value.id) {
					code = "${{ document.getElementById(\"" + value.id + "\") }}$";
				}
			}
			if (code == "") {
				if (refStack === undefined) {
					refStack = [];
				}
				if (refStack.indexOf(value) != -1) {
					//Object contains a reference to itself.
					code = code + "<<circular reference>>";
				} else {
					refStack.push(value);
					code = "{";
					for (var key in value) {
						if (!(key in Object.prototype)) {
							code = code + key + ": " + Eden.edenCodeForValue(value[key], refStack) + ", ";
						}
					}
					if (code != "{") {
						code = code.slice(0, -2);
					}
					code = code + "}";
					refStack.pop();
				}
			}
		} else if (type == "function") {
			code = "$"+"{{\n\t" +
					value.toString().replace(/\n/g, "\n\t") +
				"\n}}"+"$";
		} else {
			code = String(value);
		}
		return code;
	}

	Eden.edenCodeForValues = function () {
		var s = "";
		for (var i = 0; i < arguments.length - 1; i++) {
			s = s + Eden.edenCodeForValue(arguments[i]) + ", ";
		}
		s = s + Eden.edenCodeForValue(arguments[arguments.length - 1]);
		return s;
	}

	/**Given any JavaScript value returns a string that can be displayed to users in an EDEN
	 * friendly way, possibly truncated to reasonable length to fit in with the UI's requirements.
	 * @param {string} prefix A prefix to prepend to the string representation of the value.  Any HTML
	 * 	mark-up characters present in the prefix will be preserved.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {number} maxChars The character limit for the result (optional).  The returned string will not
	 * 	have significantly more characters than this number.
	 * @param {boolean} showJSFuncs Whether or not to include code that defines a JavaScript function.  If false
	 *	then functions will shortened to the word func.
	 * @param {boolean} multiline True if the result is allowed to span multiple lines, or false if it must
	 * 	fit into a single line display (e.g. for the symbol viewer)
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value, with HTML mark-up characters
	 *	escaped.
	 */
	Eden.prettyPrintValue = function (prefix, value, maxChars, showJSFuncs, multiline, refStack) {
		if (multiline === undefined) {
			multiline = true;
		}
		var type = typeof(value);
		var code = "";
		var truncated = false;
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
			if (maxChars !== undefined && code.length > maxChars + 1) {
				code = code.slice(0, maxChars) + "...";
				truncated = true;
			}
		} else if (Array.isArray(value)) {
			if (refStack === undefined) {
				refStack = [];
			}
			if (refStack.indexOf(value) != -1) {
				//Array contains a reference to itself.
				code = code + "...";
			} else {
				refStack.push(value);
				code = "[";
				for (var i = 0; i < value.length - 1; i++) {
					code = Eden.prettyPrintValue(code, value[i], maxChars, showJSFuncs, multiline, refStack) + ",";
					if (maxChars !== undefined && code.length >= maxChars - 1) {
						if (code.slice(-3) != "...") {
							code = code + "...";
						}
						truncated = true;
						break;
					} else {
						code = code + " ";
					}
				}
				if (value.length > 0 && !truncated) {
					code = Eden.prettyPrintValue(code, value[value.length - 1], maxChars, showJSFuncs, multiline, refStack);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if (value instanceof Symbol) {
				code = value.getEdenCode();
			} else if (
				"keys" in value &&
				Array.isArray(value.keys) &&
				value.keys.length > 0 &&
				"parent" in value &&
				value.parent instanceof Symbol
			) {
				code = "&" + value.parent.name.slice(1) + "[" + value.keys[0] + "]";
			} else if (typeof(window) == "object" && typeof(document) == "object" && typeof(Element) == "function") {
				//Web browser runtime environment
				if (value == window) {
					code = "${{ window }}$";
				} else if (value == document) {
					code = "${{ document }}$";
				} else if (value == document.documentElement) {
					code = "${{ document.documentElement }}$";
				} else if (value == document.body) {
					code = "${{ document.body }}$";
				} else if (value instanceof Element && value.id) {
					code = "${{ document.getElementById(\"" + value.id + "\") }}$";
				}
			}
			if (code == "") {
				if (value.toString != Object.prototype.toString) {
					code = value.toString();
					//If you've written a badly behaved toString() method somewhere that fails to
					//actually return a string then the next statement will cause an error.
					if (maxChars !== undefined && code.length > maxChars) {
						code = code.slice(0, maxChars) + "...";
						truncated = true;
					}
				} else {
					if (refStack === undefined) {
						refStack = [];
					}
					if (refStack.indexOf(value) != -1) {
						//Object contains a reference to itself.
						code = code + "...";
					} else {
						refStack.push(value);
						code = "{";
						var maybeTruncate = false;
						for (var key in value) {
							if (!(key in Object.prototype)) {
								if (maybeTruncate) {
									code = code.slice(0, -1) + "...";
									truncated = true;
									break;
								}
								code = code + key + ": ";
								code = Eden.prettyPrintValue(code, value[key], maxChars, showJSFuncs, multiline, refStack);
								if (code.slice(-3) == "...") {
									truncated = true;
									break;
								}
								if (maxChars !== undefined && code.length >= maxChars) {
									maybeTruncate = true;
								}
								code = code + ", ";
							}
						}
						if (code != "{" && !truncated) {
							code = code.slice(0, -2);
						}
						code = code + "}";
						refStack.pop();
					}
				}
			}
		} else if (type == "function") {
			if (showJSFuncs) {
				code = "$"+"{{\n\t" +
						value.toString().replace(/\n/g, "\n\t") +
					"\n}}"+"$";
				if (maxChars !== undefined && code.length > maxChars) {
					code = code.slice(0, maxChars) + "...";
					truncated = true;
				}
			} else {
				code = "func";
			}
		} else {
			code = String(value);
		}
		if (!prefix) {
			var pretty = Eden.htmlEscape(code, !multiline);
			pretty = pretty.replace(/\.\.\./g, "&hellip;");
			if (!multiline) {
				pretty = pretty.replace(/\n/g, "\\n");
			}
			return pretty;
		} else {
			return prefix + code;
		}
	}

	/**
	 * Converts plain text to HTML, by default preserving line breaks (though all other forms of
	 * white space are collapsed).  HTML mark-up characters are escaped.
	 * @param {string} text The string to escape.
	 * @param {boolean} nobr If true then line breaks won't be converted to <br/>.  (E.g. useful for
	 * 	content of <pre> or <textarea> tags.
	 * @param {boolean} removeLineBreaks If true then the result will not contain line breaks (though it may contain <br/> tags).
	 * @return {string} The escaped string.
	 */
	Eden.htmlEscape = function (text, nobr, removeLineBreaks) {
		if (text === undefined) {
			return "";
		}
		text = String(text);
		text = text.replace(/&/g, "&amp;");
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
		text = text.replace(/"/g, "&quot;");
		text = text.replace(/'/g, "&#39;");
		
		if (removeLineBreaks) {
			if (nobr) {
				text = text.replace(/\n/g, " ");
			} else {
				text = text.replace(/\n/g, "<br/>");
			}
		} else if (!nobr) {
			text = text.replace(/\n/g, "<br/>\n");
		}

		return text;
	}
	
	/** An identifier used to locate the result of the next call to eval(). */
	Eden.prototype.nextEvalID = 0;

	/**Compile-time options that alter the way that EDEN code is translated to JavaScript. Like #pragma in C.
	 *The trackObservableRefsInFunc parsing option controls whether or not z is dependent on y for:
	 * func f  { para x; return x + y; }
	 * z is f(a);
	 */
	Eden.prototype.parsingOptions = {trackObservableRefsInFuncs: false};
	
	/**
	 * This function sets up a bunch of state/functions used in the generated parser. The
	 * `parser.yy` object is exposed as `yy` by jison. (See grammar.jison for usage)
	 *
	 * @param {string} source EDEN code to translate into JavaScript.
	 * @returns {string} JavaScript code as a string.
	 */
	Eden.prototype.translateToJavaScript = function (source) {
		var me = this;

		/** @type {Object.<string,*>} */
		parser.yy;

		source = source.replace(/\r\n/g, '\n');

		parser.yy.commentNesting = 0;
		
		parser.yy.async = function (asyncFuncExpression) {
			var args = Array.prototype.slice.call(arguments, 1);
			return new Code(1, asyncFuncExpression + '(' + args.concat('function () {')); 
		};

		function Code(cps, code) {
			this.cps = cps;
			this.code = code;
		}

		Code.prototype.valueOf = function () {
			throw new Error("Tried to valueOf Code " + this.code);
		};

		parser.yy.sync = function (code) {
			return new Code(0, code);
		};

		parser.yy.code = function (cps, code) {
			return new Code(cps, code);
		};

		parser.yy.withIncludes = function (code, callbackName) {
			var closer = '' + callbackName + '();';
			var i;
			for (i = 0; i < code.cps; ++i) {
				closer += '});';
			}
			return code.code + closer;
		};

		/**
		 * Extract a string from original eden source being parsed.
		 *
		 * @param {number} firstLine Index of the line to start extracting.
		 * @param {number} firstColumn Position in the line to start extracting.
		 * @param {number} lastLine Index of the line to end extracting.
		 * @param {number} lastColumn Position in the line to end extracting.
		 * @returns {string} Extracted source.
		 */
		parser.yy.extractEdenDefinition = function (firstLine, firstColumn, lastLine, lastColumn) {
			var definitionLines = source.split('\n').slice(firstLine - 1, lastLine);
			var definition = "";

			for (var i = 0; i < definitionLines.length; ++i) {
				var line = definitionLines[i];

				var start;
				if (i === 0) {
					start = firstColumn;
				} else {
					start = 0;
				}

				var end;
				if (i === definitionLines.length - 1) {
					end = lastColumn;
				} else {
					end = line.length;
				}

				definition += line.slice(start, end);

				if (i < definitionLines.length - 1) {
					definition += "\n";
				}
			}

			return definition;
		};

		var inDefinition = false;
		var inEval = false;
		var dependencies = {};
		var nextBackticksID = 0;

		/**
		 * Maps from EDEN code contained inside an eval() invocation to an ID number that is later
		 * used to find the result obtained from evaluating the expression written between the
		 * parentheses.
		 */
		var evalIDs = {};

		/**
		 * Called in the parser when entering a definition.
		 */
		parser.yy.enterDefinition = function () {
			dependencies = {};
			evalIDs = {};
			nextBackticksID = 0;
			inDefinition = true;
		};

		/**
		 * Called in the parser when exiting a definition.
		 */
		parser.yy.leaveDefinition = function () {
			inDefinition = false;
		};

		/**
		 * Called in the parser when entering an eval expression.
		 */
		parser.yy.enterEval = function () {
			inEval = true;
		}
		
		/**
		 * Called in the parser when exiting an eval expression.
		 */
		parser.yy.leaveEval = function (eden_exp) {
			inEval = false;
			var id = me.nextEvalID;
			evalIDs[eden_exp] = id;
			me.nextEvalID++;
			return id;
		}
		
		/**
		 * Called in the parser to set a symbol's evalIDs property so that the eden_definition
		 * property can later be updated to replace eval() with the actual values once they are known.
		 */
		parser.yy.printEvalIDs = function (obsName) {
			var obsJS = parser.yy.observable(obsName);
			var str = obsJS + ".clearEvalIDs(); ";
			var evalIDsJS =  obsJS + ".evalIDs";
			for (exp in evalIDs) {
				if (evalIDs.hasOwnProperty(exp)) {
					str = str + evalIDsJS + "[\"" + exp + "\"] = " + evalIDs[exp] + "; ";
				}
			}
			return str;
		}
		
		/**
		 * Used by the parser to test whether currently parsing a definition.
		 *
		 * @returns {boolean}
		 */
		parser.yy.inDefinition = function () {
			return inDefinition;
		};

		/**
		 * Used by the parser to test whether currently parsing an eval expression.
		 *
		 * @returns {boolean}
		 */
		parser.yy.inEval = function () {
			return inEval;
		};

		/**
		 * Used by the parser to record dependencies when parsing a definition.
		 *
		 * @param {string} name
		 */
		parser.yy.addDependency = function (name) {
			dependencies[name] = 1;
		};

		/**
		 * Used by the parser to generate a list of observables to observe for changes.
		 *
		 * @returns {Array.<string>} Array of observable names used in the current definition.
		 */
		parser.yy.getDependencies = function () {
			var dependencyList = [];
			for (var p in dependencies) {
				dependencyList.push(p);
			}
			return dependencyList;
		};

		/** @type {Object.<string,number>} */
		var observables = {};

		/**
		 * Used by the parser to track observables used in a script.
		 *
		 * @param {string} name Name of observable.
		 * @returns {string} Generated code that results in the Symbol for name.
		 */
		parser.yy.observable = function (name) {
			observables[name] = 1;
			return "o_" + name;
		};

		parser.yy.backticks = function () {
			var id = nextBackticksID;
			nextBackticksID = id + 1;
			return id;
		}

		/**
		 * Used by the parser to generate 'var' declarations for the whole script.
		 * These vars store `Symbols` for each observable.
		 *
		 * @returns {string} JavaScript statements defining vars for each observable.
		 */
		parser.yy.printObservableDeclarations = function () {
			var javascriptDeclarations = [];
			for (var observableName in observables) {
				javascriptDeclarations.push(
					"var o_" + observableName + " = context.lookup('" + observableName + "');"
				);
			}

			return javascriptDeclarations.join("\n");
		};

		/**
		 * Used by the parser to store the names of 'auto' and 'para' variables for
		 * a function. These lists are pushed onto each time the parser enters a
		 * function definition.
		 */

		/** @type {Array.<string>} */
		parser.yy.locals = [];

		/** @type {Array.<string>} */
		parser.yy.paras = [];
		
		/** Tracks which observables have been references inside a function body.
		  * E.g. for:
		  * func f  { para x; return x + y; }
		  * z is f(a);
		  * f references y, and z should be recomputed when either a or y changes if the
		  * trackObservableRefsInFunc parsing option is enabled when f is parsed.
		  * @type {Array.<string>}
		  */
		parser.yy.funcBodyDependencies = [];

		parser.yy.addFuncBodyDependency = function (name) {
			if (me.parsingOptions.trackObservableRefsInFuncs) {
				this.funcBodyDependencies[0][name] = 1;
			}
		}

		parser.yy.getFuncBodyDependencies = function () {
			var dependencyList = [];
			for (var p in this.funcBodyDependencies[this.funcBodyDependencies.length - 1]) {
				dependencyList.push(p);
			}
			return dependencyList;
		};

		parser.yy.setParsingOption = function (optionName, value) {
			me.parsingOptions[optionName] = value;
		}
		
		/**
		 * Used by the parser instead of Array.prototype.map which isn't
		 * available in some browsers.
		 *
		 * @param {Array.<?>} array
		 * @param {function(*, number)} f
		 * @returns {Array.<?>}
		 */
		parser.yy.map = function map (array, f) {
			if (array.map) {
				return array.map(function (x, i) { return f(x, i); });
			}

			var results = [];
			for (var i = 0; i < array.length; ++i) {
				results.push(f(array[i], i));
			}
			return results;
		};
		
		return parser.parse(source);
	};

	/**
	 * @param {string} name
	 * @param {Symbol} symbol
	 * @return {string}
	 */
	Eden.prototype.getDefinition = function (name, symbol) {
		if (symbol.eden_definition) {
			return symbol.eden_definition + ";";
		} else {
			return name + " = " + symbol.context.scope.lookup(symbol.name).value + ";";
		}
	};

	// expose API
	global.EdenUI = EdenUI;
	global.Eden = Eden;

	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Eden = Eden;
	}
}(typeof window !== 'undefined' ? window : global));
