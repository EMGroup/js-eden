/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */


(function (global) {
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		Polyglot = require('./polyglot').Polyglot;
		//parser = require('./translator').parser;
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

		this.windowHighlighter = new WindowHighlighter(this);
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
		$(document).on("click", function(e) {
			if (e.ctrlKey || e.metaKey) {
				var observables = [];
				var current = e.target;

				// Navigate back through DOM finding associated observables.
				while (current.nodeName != "BODY") {
					var data = current.getAttribute("data-observables");
					if (data && data != "") {
						observables.push.apply(observables, data.split(","));
					}
					current = current.parentNode;
				}

				//console.log("Associated: ",);
				//edenUI.explorer.watch(observables);
			}
		});
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

		let dialogs = $('.ui-front');
		let zindex = 0;
		for (var i=0; i<dialogs.length; ++i) {
			if (dialogs[i].style.zIndex > zindex) zindex = dialogs[i].style.zIndex;
		}

		tooltip.style.zIndex = zindex+1;
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

	/**
	 * @constructor
	 * @struct
	 */
	function Eden(root) {
		this.root = root;
		root.base = this;
		this.dictionary = {};	// Used to store doxy comments for symbols.

		/**
		 * @type {number}
		 * @public (Inspected and reset by the framework for testing EDEN code.)
		 */
		this.errorNumber = 0;

		/**
		 * @type {Object.<string, Array.<{target: *, callback: function(...[*])}>>}
		 * @private
		 */
		this.listeners = {};

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
	}

	Eden.prototype.updateDictionary = function(name, comment, net) {
		this.dictionary[name] = comment;
		// Extract tags...
		/*if (comment) {
			var tags = comment.getHashTags();
			for (var i=0; i<tags.length; i++) {
				if (this.tags[tags[i]] === undefined) this.tags[tags[i]] = [];
				this.tags[tags[i]].push(name);
			}
		}*/
		//if (eden.peer && !net) eden.peer.doxy(name, comment);
	}

	Eden.prototype.isValidIdentifier = function (name) {
		return Boolean(name && /^[_a-zA-Z]\w*$/.test(name));
	};


	/**
	 * Load a project from a project manager path.
	 * @param {String} path Agent path in project manager.
	 * @param {*} tag Version number or name to load.
	 * @param {Function} Callback function when completed.
	 * @param {boolean} Prevent generation of new URL and history entry.
	 * @public
	 */
	Eden.load = function(path, tag, cb, nohistory) {
		console.log("Loading project: " + path + "@" + tag);

		Eden.DB.load(path,tag, undefined, function(status) {
			if (typeof status == "object") EdenUI.MenuBar.saveTitle(status.title);
			eden.root.lookup("_jseden_loaded").assign(true, eden.root.scope);

			if (!nohistory) {
				// Process existing URL
				var master = URLUtil.getParameterByName("master");
				var id = URLUtil.getParameterByName("id");
				var newurl = "?load="+path+"&tag="+tag;
				if (id != "") newurl += "&id="+id;
				if (master != "") newurl += "&master="+master;
				window.history.pushState({project: path, tag: tag},"",newurl);
			}

			if (cb) cb();
		});
	}

	/** Unused currently */
	Eden.loadFromString = function(str, cb) {
		//var data = JSON.parse(str);
		eden.execute2(str);
		//var menu = $(".jseden-title").get(0);
		//if (menu) {
		//	menu.textContent = data.title;
		//}
		//EdenUI.MenuBar.saveTitle(data.title);
		//window.history.pushState(null,"","");
		eden.root.lookup("_jseden_loaded").assign(true, eden.root.scope);
		if (cb) cb(data);
	}


	/**
	 * Reset the entire environment, including the UI, symbol table and agents.
	 * This should be used when going back in the browser and loading a new
	 * project.
	 * TODO Currently does not work, plugin JS observers are lost.
	 * @public
	 */
	Eden.reset = function() {
		edenUI.destroyAllViews();
		eden.reset();
		// Reset plugins!
	}


	/**
	 * Reset the symbol table.
	 */
	Eden.prototype.reset = function () {
		this.root.forgetAll("", true, false);
		this.root.collectGarbage();
		this.errorNumber = 0;
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

		eden.emit("error", [EdenSymbol.jsAgent, new Eden.RuntimeError(undefined, 0, undefined, error)]);
		return;

		/*if (origin != "error") {
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
		++this.errorNumber;*/
	};
	
	Eden.prototype.executeEden = function (code, origin, prefix, agent, success) {
		console.error("DEPRECATED USE OF OLD PARSER", code);
		success && success();
	};

	/**
	 * @param {string} code
	 * @param {string?} origin Origin of the code, e.g. "input" or "execute" or a "included url: ...".
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	/*Eden.prototype.execute = function (code, origin, prefix, agent, success) {
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
	};*/

	/**
	 * @param {string} includePath
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function()} success Called when include has finished successfully.
	 */
	Eden.prototype.include = function (includePath, prefix, agent, success) {
		console.error("DEPRECATED USE OF INCLUDE: ", includePath);
		success && success();
	};

	Eden.prototype.assign = function(name,value,scope) {
		this.root.lookup(name).assign(value, (scope) ? scope : this.root.scope, EdenSymbol.hciAgent);
	}

	Eden.prototype.attribute = function(node, name) {
		var sym = (typeof node == "string") ? eden.root.lookup(node) : node;
		return Eden.Selectors.processResults([sym],name)[0];
	}

	/**
	 * @param {string} code
	 * @param {String?} agent The name of the agent to use/
	 * @param {string?} prefix Prefix used for relative includes.
	 * @param {function(*)} success
	 */
	Eden.prototype.execute2 = function (code, agent, success) {
		var agobj = agent;

		if (agent === undefined || typeof agent == "string") {
			agobj = {name: '*execute'};
			if (agent) agobj.name = agent;
		}

		//if (agobj.getSource === undefined) agobj.getSource = function() { return code; };
		//if (agobj.getLine === undefined) agobj.getLine = function() { return 0; };

		var ast = new Eden.AST(code, undefined, agobj, {noindex: true});
		if (ast.script.errors.length == 0) {
			ast.execute(agobj, success);
		} else {
			console.error(ast.script.errors[0].prettyPrint());
			success && success(false);
		}
	};
	Eden.prototype.execute = Eden.prototype.execute2;


	/** Deprecated */
	Eden.prototype.agentFromFile = function(name, url, execute) {
		var agent;
		if (Eden.Agent.agents[name] === undefined) {
			agent = new Eden.Agent(undefined, name);
		} else {
			agent = Eden.Agent.agents[name];
		}
		agent.loadFromFile(url, execute);
	}



	/**Given any JavaScript value returns a string representing the EDEN code that would be required
	 * to obtain the same value when interpreted.
	 * @param {*} value The value to find an EDEN representation for.
	 * @param {Array} refStack Used when the method recursively calls itself.
	 * @returns {string} The EDEN code that produces the given value.
	 */
	Eden.edenCodeForValue = function (value, refStack, precision) {
		var type = typeof(value);
		var code = "";
		if (type == "undefined") {
			code = "@";
		} else if (value === null) {
			code = "$" + "{{ null }}" + "$";
		} else if (type == "string") {
			if (value.indexOf("\n") >= 0) {
				code = "<<END\n" + value.replace(/\n/g,"\\n") + "\nEND";
			} else {
				code = "\"" + value.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"") + "\"";
			}
			// NOTE: For the new parser...
			//code = code.replace(/\n/g,"\"\n\"");
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
					code = code + Eden.edenCodeForValue(value[i], refStack, precision) + ", ";
				}
				if (value.length > 0) {
					code = code + Eden.edenCodeForValue(value[value.length - 1], refStack, precision);
				}
				code = code + "]";
				refStack.pop();
			}
		} else if (type == "object") {
			if ("getEdenCode" in value) {
				code = value.getEdenCode(precision);
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
					code = "Object(";
					for (var key in value) {
						if (!(key in Object.prototype)) {
							code = code + key + ", " + Eden.edenCodeForValue(value[key], refStack, precision) + ", ";
						}
					}
					if (code != "Object(") {
						code = code.slice(0, -2);
					}
					code = code + ")";
					refStack.pop();
				}
			}
		} else if (type == "function") {
			code = "$"+"{{\n\t" +
					value.toString().replace(/\n/g, "\n\t") +
				"\n}}"+"$";
		} else if (type == "number" && precision) {
			code = value.toFixed(precision);
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

	Eden.edenCodeForValuesP = function (p) {
		var s = "";
		for (var i = 1; i < arguments.length - 1; i++) {
			s = s + Eden.edenCodeForValue(arguments[i], undefined, p) + ", ";
		}
		s = s + Eden.edenCodeForValue(arguments[arguments.length - 1], undefined, p);
		return s;
	}

	Eden.intersection = function(o1, o2) {
		return Object.keys(o1).filter({}.hasOwnProperty.bind(o2));
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

	Eden.prototype.initialDefinition = function() {
		console.error("INIT DEF DEP");
	}


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
