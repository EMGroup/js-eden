(function (global) {

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

	this.embeddedInstances = {};

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
	/*$.ajax({
		url: "branding.json",
		dataType: "json",
		success: function (data) {
			me.branding = data;
		},
	});*/

	// this.$uimsg = $("<div class='message-box'></div>");
	// this.$uimsg.appendTo("body");
	// this.$uimsg.hide();
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
		console.error("DEPRECATED ERROR REPORTING", e);
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

	// this.windowHighlighter = new WindowHighlighter(this);
	this.currentView = undefined; //Used for cycling between views.
	
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

	// Allow ctrl-click observable identification in the UI...
	// $(document).on("click", function(e) {
	// 	if (e.ctrlKey || e.metaKey) {
	// 		var observables = [];
	// 		var current = e.target;

	// 		// Navigate back through DOM finding associated observables.
	// 		while (current.nodeName != "BODY") {
	// 			var data = current.getAttribute("data-observables");
	// 			if (data && data != "") {
	// 				observables.push.apply(observables, data.split(","));
	// 			}
	// 			current = current.parentNode;
	// 		}

	// 		//console.log("Associated: ",);
	// 		//edenUI.explorer.watch(observables);
	// 	}
	// });
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

	if (EdenUI.plugins[name] === undefined) {
		this.eden.error("Plugin '"+name+"' does not exist");
		success && success.call(agent, false);
		return false;
	}

	if (eden.peer) eden.peer.doRequire(name);

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

EdenUI.prototype.updateStatus = function(message) {
	// If loading, update the loader message
	if (!this.loaded) {
		console.log(message);
		// $(".loadmessage").html(message);
	} else {
		// Otherwise show status bubble for a bit.
		this.showMessage("info", message);
	}
};

EdenUI.prototype.hideMessage = function() {
	// edenUI.$uimsg.hide("slow");
}

EdenUI.prototype.showMessage = function(type, message) {
	if (type == "info") {
		// this.$uimsg.html("<div class='message-infotext'>"+message+"</div>");
	} else if (type == "error") {
		// this.$uimsg.html("<div class='message-errortext'>"+message+"</div>");
	}
	// this.$uimsg.show("fast");
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
// EdenUI.prototype.listenTo = listenTo;

/**
 * @param {string} eventName
 * @param {Array.<*>} eventArgs
 */
// EdenUI.prototype.emit = emit;

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

	if (typeof text === "string") {
		tooltip.innerHTML = text;
	} else {
		tooltip.innerHTML = "";
		tooltip.appendChild(text);
	}
	tooltip.style.display = "block";

	let dialogs = document.querySelectorAll('.ui-front');
	let zindex = 0;
	for (var i=0; i<dialogs.length; ++i) {
		if (dialogs[i].style.display === "none") continue;
		let z = dialogs[i].style.zIndex;
		if (typeof z === "string") z = parseInt(z);
		if (z > zindex) zindex = z;
	}

	tooltip.style.zIndex = Math.max(zindex,10000)+1;
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

EdenUI.prototype.fullscreen = function(name, observable) {
	var sym = eden.root.lookup(observable);
	var val = sym.value();

	if (document.webkitExitFullscreen) {
		if (val) {
			document.onwebkitfullscreenchange = function() {
				if (!document.webkitIsFullScreen) {
					sym.assign(false, eden.root.scope, Symbol.hciAgent);
					edenUI.menu.show();
				}
			}
			var ele = document.getElementById(name+"-canvascontent");
			ele.webkitRequestFullscreen();
			edenUI.menu.hide();
		} else {
			document.webkitExitFullscreen();
			edenUI.menu.show();
		}
	} else if (document.mozCancelFullScreen) {
		if (val) {
			document.onmozfullscreenchange = function() {
				if (!document.mozFullScreen) {
					sym.assign(false, eden.root.scope, Symbol.hciAgent);
					edenUI.menu.show();
				}
			}
			var ele = document.getElementById(name+"-canvascontent");
			ele.mozRequestFullScreen();
			edenUI.menu.hide();
		} else {
			document.mozCancelFullScreen();
			edenUI.menu.show();
		}
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

	// expose API
	global.EdenUI = EdenUI;

	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.EdenUI = EdenUI;
	}
}(typeof window !== 'undefined' ? window : global));
