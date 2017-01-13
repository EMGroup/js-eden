function Pointer(initialValue) {
	this.value = initialValue;
}

function copy(value) {
	var i, copied;
	if (value instanceof Array) {
		copied = value.slice();
		for (i = 0; i < value.length; ++i) {
			copied[i] = copy(copied[i]);
		}
		return copied;
	}
	return value;
}

edenCopy = copy;


/**
 * A maintainer of definitions. This also acts as a virtual AST node.
 *
 * @constructor
 * @struct
 * @param {string?} name Name to prepend to all child Symbols.
 * @param {Folder?} parent Parent Folder for this Folder.
 * @param {Folder?} root The top most parent of this Folder.
 */
function Folder(name, parent, root) {
	this.type = "script";
	this.executed = 1;
	this.start = 0;
	this.end = 0;
	this.prefix = "";
	this.postfix = "";
	this.id = "ACTIVE";

	/**
	 * @type {string}
	 * @private
	 */
	this.name = name || "ACTIVE";

	/**
	 * @type {Folder}
	 * @private
	 */
	//this.parent = undefined;
	this.base = undefined;

	this.errors = [];
	this.lock = 1;
	this.numlines = 0;

	/**
	 * @type {Folder}
	 * @private
	 */
	this.root = root || this;

	this.scope = new Scope(this, undefined, {});

	/**
	 * @type {Object.<string, Symbol>}
	 * @public
	 */
	this.symbols = {};
	
	this.evalResults = {};

	/**
	 * @type {Array.<function(Symbol, boolean)>}
	 * @private
	 */
	this.globalobservers = [];

	/**
	 * @type {boolean}
	 * @private
	 */
	this.autocalc_state = true;

	this.needsExpire = [];
	this.needsTrigger = {};
	this.needsGlobalNotify = [];
	this.globalNotifyIndex = 0;
	
	/** expiryCount is used locally inside the expireAndFireActions method.  It's created here
	 * for efficient reuse reasons, to eliminate the need to create and garbage collect many objects.
	 */
	this.expiryCount = new Pointer(0);

	/** Symbols that might be ready to be garbage collected.
	 * @private
	 */
	this.potentialGarbage = {};

	/** Remember if autocalc was enabled or disabled prior to entering a block of JavaScript
	  * statements where we want to guarantee that autocalc is off until at least the end of the block.
	  * @private
	  */
	this.saved_autocalc_state = true;

	/** Number of times beginAutocalcOff has been called minus times endAutocalcOff has been called.
	  * @private
	  */
	this.saved_autocalc_level = 0;

	/** The stack of symbols currently being evaluated. */
	this.currentObservables = [];

	/* Virtual AST Statements */
	Object.defineProperty(this, "statements", {
		enumerable: true,
		get: function() {
			var me = this;
			return Object.keys(this.symbols).map(function(e) {
				return me.symbols[e];
			});
		}
	});

	Object.defineProperty(this, "parent", {
		enumerable: true,
		get: function() {
			return eden.project.ast.script;
		}
	});
}

Folder.prototype.getNumberOfLines = function() {
	return this.numlines + 1;
}

Folder.prototype.hasErrors = function() {
	return false;
}

Folder.prototype.getOrigin = function() {
	return eden.project;
}

Folder.prototype.getStatementByLine = function(line) {
	return undefined;
}

Folder.prototype.getStartLine = function(relative) {
	return (this.parent) ? this.parent.getRelativeLine(this, relative) : -1;
}

Folder.prototype.getRange = function(relative) {
	var sl = this.getStartLine(relative);
	return [sl,sl+this.getNumberOfLines()];
}

Folder.prototype.getInnerSource = function() {
	var res = "";
	this.numlines = 0;
	for (var x in this.symbols) {
		var sym = this.symbols[x];
		//if (sym.origin && sym.origin.parent && sym.origin.parent.statements !== undefined) continue;
		//if (!sym.origin || sym.origin.name == "*Default") continue;
		if (sym.origin && sym.origin.getOrigin) {
			var o = sym.origin.getOrigin();
			if (o && !o.remote) {
				res += sym.getSource() + "\n";
				this.numlines += sym.origin.numlines + 1;
			}
		}
	}
	return res;
}

Folder.prototype.getSource = function() {
	var res = "action ACTIVE {\n";
	res += this.getInnerSource();
	res += "}";
	return res;
}

Folder.prototype.execute = function() {}

/**
 * Looks up the the Symbol with the given name.
 *
 * @param {string} name The name of the symbol you want.
 * @return {Symbol}
 */
Folder.prototype.lookup = function (name) {
	if (this.symbols[name] === undefined) {
		this.symbols[name] = new Symbol(this, name);
		this.notifyGlobals(this.symbols[name], 1);
	}
	return this.symbols[name];
};

Folder.prototype.currentObservableName = function () {
	if (this.currentObservables.length == 0) {
		return undefined;
	} else {
		return this.currentObservables[this.currentObservables.length - 1].name;
	}
}

Folder.prototype.beginEvaluation = function (symbol) {
	this.currentObservables.push(symbol)
}

Folder.prototype.endEvaluation = function (symbol) {
	this.currentObservables.pop();
}

/**
 * Adds a symbol to the garbage queue, for example, when EDEN's forget function is used.
 * @param {Symbol} The symbol that will require garbage collection if it isn't referenced again
 * before execution of the current script completes.
 */
Folder.prototype.queueForGarbageCollection = function (symbol) {
	this.potentialGarbage[symbol.name] = symbol;
}

Folder.prototype.collectGarbage = function () {
	for (var name in this.potentialGarbage) {
		if (this.potentialGarbage[name].garbage) {
			delete this.symbols[name];
		}
	}
	this.potentialGarbage = {};
}

/**
 * Saves the result of an eval() invocation.
 *
 * @param {*} id An opaque ID issued to the parser by an instance of the Eden prototype.
 * @param {value} The computed result of the expression.
 */
Folder.prototype.putEval = function (id, value) {
	this.evalResults[id] = value;
}

/**
 * Fetches the result of an eval() invocation.
 *
 * @param {*} id An opaque ID issued to the parser by an instance of the Eden prototype.
 */
Folder.prototype.getEval = function (id) {
	return this.evalResults[id];
}

Folder.prototype.clearEval = function (id) {
	delete this.evalResults[id];
}

/**
 * Add a listener for any change in the Folder.
 *
 * @param {function(Symbol, boolean)} listener This will be executed when a change occurs in the Folder.
 */
Folder.prototype.addGlobal = function (listener) {
	this.globalobservers.push(listener);
};

/**
 * Remove a global observer / global listener.
 *
 * @param {function(Symbol, boolean)} listener This listener will cease being executed when a change occurs in the Folder.
 * @return {boolean} True if the listener was successfully removed, or false if it could not be found.
 */
Folder.prototype.removeGlobal = function (listener) {
	for (var i = 0; i < this.globalobservers.length; i++) {
		if (this.globalobservers[i] === listener) {
			this.globalobservers.splice(i, 1);
			return true;
		}
	}
	return false;
};

/**
 * Notify all global listeners about a change in the Folder.
 *
 * @param {Symbol} symbol The symbol that changed.
 * @param {boolean} create 
 */
Folder.prototype.notifyGlobals = function (symbol, kind) {
	for (var i = 0; i < this.globalobservers.length; i++) {
		if (this.globalobservers[i] !== undefined) {
			this.globalobservers[i].call(this, symbol, kind);
		}
	}
};

/**
 * Set whether autocalc is on or off.
 *
 * @param {boolean} state True to enable autocalc, false to disable.
 */
Folder.prototype.autocalc = function (state) {
	this.autocalc_state = state;
	this.expireAndFireActions();
};

/**
 * Enter a block of JavaScript statements where we want to guarantee autocalc is off.
 */
Folder.prototype.beginAutocalcOff = function () {
	this.saved_autocalc_level++;
	if (this.saved_autocalc_level != 1) {
		return;
	}
	this.saved_autocalc_state = this.autocalc_state;
	if (this.autocalc_state) {
		this.autocalc(false);
	}
}

/**
 * Leave a block of JavaScript statements where we wanted to guarantee autocalc was off.
 */
Folder.prototype.endAutocalcOff = function () {
	this.saved_autocalc_level--;
	if (this.saved_autocalc_level != 0) {
		return;
	}
	if (this.saved_autocalc_state) {
		this.autocalc(true);
	}
}

Folder.prototype.expireSymbol = function (sym) {
	if (this.needsExpire.indexOf(sym) == -1) {
		this.needsExpire.push(sym);
	}
	this.expireAndFireActions();
};

Folder.prototype.triggerSymbol = function (sym) {
	this.needsTrigger[sym.name] = sym;
	this.expireAndFireActions();
}

Folder.prototype.expireAndFireActions = function () {
	if (!this.autocalc_state) {
		return;
	}

	this.expiryCount.value = 0;
	var symbolNamesToForce = {};
	for (var i = 0; i < this.needsExpire.length; i++) {
		var sym = this.needsExpire[i];
		sym.expire(symbolNamesToForce, this.expiryCount, this.needsTrigger, sym.needsGlobalNotify == Symbol.REDEFINED);
		//sym.needsGlobalNotify = 2;
	}
	var expired = this.needsExpire;
	this.needsExpire = [];
	var symbolNamesArray = Object.keys(symbolNamesToForce);
	symbolNamesArray.sort(function (name1, name2) {
		return symbolNamesToForce[name1] - symbolNamesToForce[name2];
	});
	var symbolsToForce = [];
	for (var i = 0; i < symbolNamesArray.length; i++) {
		// force re-eval
		var sym = this.symbols[symbolNamesArray[i]];
		sym.evaluateIfDependenciesExist();
		sym.needsGlobalNotify = Symbol.EXPIRED;
		symbolsToForce.push(sym);
	}
	var actions_to_fire = this.needsTrigger;
	this.needsTrigger = {};
	fireActions(actions_to_fire);
	fireJSActions(expired);
	fireJSActions(symbolsToForce);

	if (this.needsGlobalNotify.length == 0) {
		//Append expired onto symbolsToForce, create a notification queue and schedule notifications.
		symbolsToForce.push.apply(symbolsToForce, expired);
		if (symbolsToForce.length > 0) {
			this.needsGlobalNotify = symbolsToForce;
			var me = this;
			setTimeout(function () {
				me.processGlobalNotifyQueue();
			}, 0);
		}
	} else {
		//Append both expired and symbolsToForce onto the existing notification queue.
		var globalNotifyList = this.needsGlobalNotify;
		globalNotifyList.push.apply(globalNotifyList, symbolsToForce);
		globalNotifyList.push.apply(globalNotifyList, expired);
	}
};

Folder.prototype.processGlobalNotifyQueue = function () {
	var notifyList = this.needsGlobalNotify;
	var index = 0;
	while (index < notifyList.length) {
		this.globalNotifyIndex++;
		var symbol = notifyList[index];
		if (symbol.needsGlobalNotify) {
			var kind = symbol.needsGlobalNotify;
			symbol.needsGlobalNotify = 0;
			this.notifyGlobals(symbol, kind);
		}
		index = this.globalNotifyIndex;
	}
	this.needsGlobalNotify = [];
	this.globalNotifyIndex = 0;
};

Folder.prototype.forgetAll = function() {
	var searchStr, caseSensitive, requireConfirm, includeSystemSymbols;
	var regExp, symbol;
	var obsToDelete = undefined;
	var includeAgent = {name: "/include"};
	
	if (arguments.length > 4) {
		eden.error(new Error("forgetAll: This function requires at most 4 arguments."), "error");
		return [[], undefined, []];
	}

	if (arguments.length == 0) {
		searchStr = "";
	} else if (typeof(arguments[0]) == "string") {
		searchStr = arguments[0];
	} else if (Array.isArray(arguments[0])) {
		obsToDelete = arguments[0];
	} else if (arguments[0] === undefined) {
		return [[], undefined, []];
	} else {
		eden.error(new Error("forgetAll: The first argument must be a string, not a " + typeof(arguments[0])), "error");
		return [[], undefined, []];
	}

	if (arguments.length > 1) {
		if (typeof(arguments[1]) != "boolean") {
			eden.error(new Error("forgetAll: The second argument must be a boolean, not a " + typeof(arguments[1])), "error");
			return [[], undefined, []];
		}
		caseSensitive = arguments[1];
	} else {
		caseSensitive = true;
	}
	
	if (obsToDelete !== undefined && arguments.length > 2) {
		eden.error(new Error("forgetAll: Cannot specify case sensitivity when selecting using a list."), "error");
		return [[], undefined, []];
	}
	
	if (arguments.length >= 3) {
		if (typeof(arguments[2]) != "boolean") {
			eden.error(new Error("forgetAll: The third argument must be a boolean, not a " + typeof(arguments[2])), "error");
			return [[], undefined, []];
		}
		requireConfirm = arguments[2];
	} else if (obsToDelete !== undefined && arguments.length == 2) {
		requireConfirm = arguments[1];
	} else {
		requireConfirm = true;
	}
	
	if (arguments.length > 3) {
		if (typeof(arguments[3]) != "boolean") {
			eden.error(new Error("forgetAll: The forth argument must be a boolean, not a " + typeof(arguments[3])), "error");
			return [[], undefined, []];
		}
		includeSystemSymbols = arguments[3];
	} else {
		includeSystemSymbols = false;
	}
	
	var references = {};
	var unableToDelete = [];
	var reset = {};

	var initialDefinition;
	if (obsToDelete !== undefined) {

		//Observables given as a list.
		for (var i = 0; i < obsToDelete.length; i++) {
			var name;
			if (obsToDelete[i] instanceof Symbol) {
				name = obsToDelete[i].name;
				symbol = obsToDelete[i];
			} else if (typeof(obsToDelete[i]) == "string") {
				name = obsToDelete[i];
				symbol = root.lookup(name);
			} else if (obsToDelete === undefined) {
				continue;
			} else {
				eden.error(new Error("forgetAll: All list items must be strings or pointers.  Item " + i + " is a " + typeof(obsToDelete[i])), "error");
				return [[], undefined, []];
			}

			if (!includeSystemSymbols && Eden.isitSystemSymbol(name)) {
				unableToDelete.push(name);
				continue;
			}

			initialDefinition = eden.initialDefinition(name);
			if (initialDefinition) {
				reset[name] = initialDefinition;
			} else {
				var referencedBy = [];
				for (var dependency in symbol.subscribers) {
					referencedBy.push(dependency);
				}
				for (var triggeredProc in symbol.observers) {
					referencedBy.push(triggeredProc);
				}
				references[name] = referencedBy;
			}
		}

	} else {

		//Search for observables by regular expression.
		if (caseSensitive) {
			regExp = new RegExp(searchStr);
		} else {
			regExp = new RegExp(searchStr, "i");
		}
		var viewsRE = /^_[vV]iew(s?)_/;
		
		for (var name in root.symbols) {
			if (regExp.test(name)) {
				if (!includeSystemSymbols) {
					if (Eden.isitSystemSymbol(name) || viewsRE.test(name)) {
						continue;
					}
				}
				
				//initialDefinition = eden.initialDefinition(name);
				//if (initialDefinition) {
				//	reset[name] = initialDefinition;
				//} else {
					symbol = root.symbols[name];
					var referencedBy = [];
					for (var dependency in symbol.subscribers) {
						referencedBy.push(dependency);
					}
					for (var triggeredProc in symbol.observers) {
						referencedBy.push(triggeredProc);
					}
					references[name] = referencedBy;
				//}
			}
		}
	}
	
	var canForget = {};

	/* Traverses the subgraph of symbols suggested for deletion and returns true if the named
	 * symbol isn't referenced by anything outside of the subgraph.
	 */
	var isSafeToForget = function (name) {
		if (name in canForget) {
			return canForget[name];
		}
		if (name in reset) {
			return true;
		}
		if (!(name in references)) {
			canForget[name] = false;
			return false;
		}
		var referencedBy = references[name];
		if (referencedBy.length == 0) {
			canForget[name] = true;
			return true;
		} else {
			for (var i = 0; i < referencedBy.length; i++) {
				var success = isSafeToForget(referencedBy[i]);
				if (!success) {
					canForget[name] = false;
					return false;
				}
			}
			canForget[name] = true;
			return true;
		}
	};
	
	var namesToDelete = [];
	for (name in references) {
		var success = isSafeToForget(name);
		if (success) {
			namesToDelete.push(name);
		} else {
			unableToDelete.push(name);
		}
	}
	
	var confirmed;
	var resetList = Object.keys(reset);
	var deletePlusReset = namesToDelete.concat(resetList);
	if (deletePlusReset.length > 0 && requireConfirm) {
		if (deletePlusReset.length <= 50) {
			confirmed = confirm("You are about to delete the following " + deletePlusReset.length +
				" symbols.  Is this correct?\n\n" + deletePlusReset.join("\n"));
		} else {
			var numNotDisplayed = deletePlusReset.length - 50;
			confirmed = confirm("You are about to delete " + deletePlusReset.length +
				" symbols.  Is this correct?\n\n" + deletePlusReset.slice(0, 50).join("\n") +
				"\n...\n(" + numNotDisplayed + " more)");
		}
	} else {
		confirmed = true;
	}
	
	if (confirmed) {
		var noop = function () { };
		var wasInInitialState = false; //eden.isInInitialState();
		root.beginAutocalcOff();

		for (name in reset) {
			//eden.execute(reset[name], "forgetAll", "", includeAgent, noop);
		}

		for (var i = 0; i < namesToDelete.length; i++) {
			var name = namesToDelete[i];
			symbol = root.symbols[name];
			if (symbol !== undefined) {
				if ("refreshView" in symbol.jsObservers) {
					/* Set the symbol to undefined before deleting it, so at least it is clear
					 * that the view is no longer valid and isn't merely "hung".
					 */
					symbol.assign(undefined, root.scope);
					if (edenUI.plugins.Canvas2D && edenUI.plugins.Canvas2D.destroyViews) {
						// Close the window if it's a canvas picture observable. (JS-EDEN 1.2.2 and earlier).
						edenUI.plugins.Canvas2D.destroyViews(name);
					}
				}
				symbol.forget();
				// Close the window if this observable defines the content for a view (e.g. canvas).
				var match = name.match(/^_view_(.*)_content$/);
				if (match !== null) {
					edenUI.destroyView(match[1], true);
				}
			}
		}
		/*if (wasInInitialState) {
			eden.captureInitialState(); //Re-assert still in initial state.		
		}*/
		/*
		 * The new environment no longer seems to call this automatically at completion of execution, so call
		 * it manually here to force a clean-up.  Hopefully nothing in the parser is holding onto a Symbol
		 * object belonging to a forgotten observable, otherwise bad things will happen.
		 * TODO: Verify that bad things don't happen.
		 */
		root.collectGarbage();
		root.endAutocalcOff();
		return [namesToDelete, unableToDelete, resetList];
	} else {
		return [[], unableToDelete, []];
	}
}
