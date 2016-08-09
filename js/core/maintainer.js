/**
 * Copyright (c) 2011, Tim Monks All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.  Redistributions in binary
 * form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided
 * with the distribution.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS
 * AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING,
 * BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (global) {
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

	function ScopeCache(up_to_date, value, scope) {
		this.up_to_date = up_to_date;
		this.value = value;
		this.scope = scope;
		this.scopes = undefined;
	}

	function BoundValue(value,scope,scopes) {
		this.value = value;
		this.scope = scope;
		this.scopes = scopes;
	}


	function ScopeOverride(name, start, options) {
		this.name = name;
		this.start = start;
		this.end = (options && options.range) ? options.end : undefined;
		this.increment = (options) ? options.increment : undefined;
		this.current = (options && options.isin) ? start[0] : start;
		this.isin = options && options.isin;
		this.index = 1;
		this.isdefault = (options) ? options.isdefault : false;
		this.oneshot = (options) ? options.oneshot : false;
		this.source = (options) ? options.source : "";
	}


	/**
	 * Store  a set of overrides and a separate cache of alternative values
	 * for all symbols depending upon those overrides.
	 */
	function Scope(context, parent, overrides, range, cause) {
		this.parent = parent;
		this.context = context;
		this.cache = undefined;
		this.overrides = overrides;
		this.cause = cause;
		this.causecount = 0;
		this.range = range;

		this.rebuild();
	}

	/**
	 * Query if somewhere in the scope hierarchy there is a cause matching
	 * the one given. Returns a boolean.
	 */
	Scope.prototype.hasCause = function(cause) {
		var scope = this;
		var causename = "/"+cause;
		while (scope) {
			if (scope.cause && scope.cause.name == causename) return true;
			scope = scope.parent;
		}
		return false;
	}

	Scope.prototype.baseCause = function() {
		var scope = this;
		while(scope.parent && scope.parent.parent) scope = scope.parent;
		return scope.cause.name.slice(1);
	}

	Scope.prototype.baseScope = function() {
		var scope = this;
		while(scope.parent && scope.parent.parent) scope = scope.parent;
		return scope;
	}

	Scope.prototype.allCauses = function() {
		var res = [];
		var scope = this;
		while (scope) {
			if (scope.cause) res.push(scope.cause);
			scope = scope.parent;
		}
		return res;
	}

	Scope.prototype.allOverrides = function() {
		
	}

	Scope.prototype.hasOverride = function(override) {
		var scope = this;
		while (scope && scope.parent) {
			for (var i=0; i<scope.overrides.length; i++) {
				if (scope.overrides[i].name == override) return true;
			}
			scope = scope.parent;
		}
		return false;
	}

	Scope.prototype.getOverride = function(override) {
		var scope = this;
		while (scope && scope.parent) {
			for (var i=0; i<scope.overrides.length; i++) {
				if (scope.overrides[i].name == override) return scope.overrides[i];
			}
			scope = scope.parent;
		}
		return undefined;
	}

	Scope.prototype.primaryCause = function() {
		if (this.cause && this.cause.name == "/null") {
			if (this.parent && this.parent.cause) {
				return this.parent.cause.name.slice(1);
			}
		}
		return "null";
	}

	Scope.prototype.isRange = function() {
		return this.range;
	}

	Scope.prototype.clear = function() {
		if (this !== eden.root) {
			this.cache = undefined;
		}
	}

	Scope.prototype.rebuild = function() {
		if (this.cache !== undefined) return;
		this.cache = {};

		this.add("/this");
		this.add("/has");
		this.add("/from");

		/* Process the overrides */
		for (var i = 0; i < this.overrides.length; i++) {
			this.addOverride(this.overrides[i]);
		}
	}

	Scope.prototype.cloneAt = function(index) {
		var nover = [];

		// Copy the overrides
		for (var i = 0; i < this.overrides.length; i++) {
			nover.push(new ScopeOverride(this.overrides[i].name, this.overrides[i].start, this.overrides[i].end));
		}

		// Make a new exact copy of this scope
		var nscope = new Scope(this.context, this.parent, nover, this.range, this.cause);
		// Move range to correct place. This is brute force.
		for (var i=0; i<index; i++) {
			nscope.next();
		}

		nscope.range = false;
		return nscope;
	}

	Scope.prototype.clone = function() {
		var nover = [];

		// Copy the overrides
		for (var i = 0; i < this.overrides.length; i++) {
			var nov = new ScopeOverride(this.overrides[i].name, this.overrides[i].start, this.overrides[i].end, this.overrides[i].inc, this.overrides[i].isin);
			nov.current = this.overrides[i].current;
			nover.push(nov);
		}

		// Make a new exact copy of this scope
		var nscope = new Scope(this.context, this.parent, nover, this.range, this.cause);

		return nscope;
	}

	Scope.prototype.lookup = function(name, noroot) {
		//if (this.parent === undefined && noroot) return;
		if (this.cache === undefined) this.rebuild();

		/*if (this.parent) {
			var res = this.parent.lookup(name, true);
			if (res !== undefined) return res;
			res = this.cache[name];
			if (res !== undefined) return res;
			if (!noroot) res = this.parent.lookup(name);
			return res;
		} else {
			var res = this.cache[name];
			if (res !== undefined) return res;
			this.cache[name] = new ScopeCache(true, undefined);
			return this.cache[name];
		}*/

		var symcache = this.cache[name];
		if (symcache) {
			return symcache;
		} else {
			if (this.parent) {
				//var inherit = this.parent.lookup(name);
				//this.cache[name] = new ScopeCache(inherit.value, inherit.up_to_date, this);
				return this.parent.lookup(name);
				//return this.cache[name];
			} else {
				//console.log("Symbol without cache: " + name);
				this.cache[name] = new ScopeCache(true, undefined);
				return this.cache[name];
			}
		}
	}

	Scope.prototype.add = function(name) {
		var cache = new ScopeCache( false, undefined, this);
		this.cache[name] = cache;
		return cache;
	}

	Scope.prototype.addOverride = function(override) {
		if (override.isdefault) {
			if (this.parent && this.parent.lookup("/"+override.name).value !== undefined) return;
		}

		this.updateOverride(override);
		if (this.context) {
			var sym = this.context.lookup(override.name);
			//console.log(sym);
			for (var d in sym.subscribers) {
				this.updateSubscriber(d);
			}
		}
	}

	Scope.prototype.updateOverride = function(override) {
		var name = "/"+override.name;
		var currentval;
		var currentscope;

		if (override.current instanceof BoundValue) {
			//console.log(override.current);
			currentval = override.current.value;
			currentscope = override.current.scope;
		} else {
			//console.log(override.current);
			currentval = override.current;
			currentscope = this.parent;
		}

		if (this.cache[name] === undefined) {
			this.cache[name] = new ScopeCache( true, currentval, this );
		} else {
			this.cache[name].value = currentval;
			this.cache[name].scope = this;
			this.cache[name].up_to_date = true;
		}
	}

	Scope.prototype.updateSubscriber = function(name) {
		//console.log("Adding scope subscriber...: " + name);
		if (this.cache[name] === undefined) {
			this.cache[name] = new ScopeCache( false, undefined, this);
		} else {
			this.cache[name].up_to_date = false;
			this.cache[name].value = undefined;
			this.cache[name].scope = this;
		}
		var sym = this.context.lookup(name.slice(1));
		for (var d in sym.subscribers) {
			this.updateSubscriber(d);
		}
	}

	Scope.prototype.invalidate = function(name) {
		if (this.cache[name]) this.cache[name].up_to_date = false;
		if (this.parent && this.parent.parent) this.parent.invalidate(name);
	}

	Scope.prototype.next = function() {
		for (var o in this.cache) {
			this.cache[o].up_to_date = false;
			// Also invalidate all parents
			//if (this.parent && this.parent.parent) this.parent.invalidate(o);
		}
		for (var i = this.overrides.length-1; i >= 0; i--) {
			var over = this.overrides[i];

			if (over.end === undefined && !over.isin) continue;

			if (over.isin) {
				// TODO runtime check that start is a list...
				if (over.index < over.start.length) {
					over.current = over.start[over.index];
					over.index++;
					this.updateOverride(over);
					return true;
				} else {
					over.index = 1;
					over.current = over.start[0];
					this.updateOverride(over);
				}
			} else {
				if (over.start <= over.end) {
					if (over.current < over.end) {
						if (over.increment) {
							over.current += over.increment;
						} else {
							over.current++;
						}
						this.updateOverride(over);

						// Make sure all other overrides are also up-to-date
						for (var j=i-1; j >= 0; j--) {
							this.updateOverride(this.overrides[j]);
						}

						return true;
					} else {
						over.current = over.start;
						this.updateOverride(over);
					}
				} else {
					if (over.current > over.end) {
						if (over.increment) {
							over.current += over.increment;
						} else {
							over.current--;
						}
						this.updateOverride(over);

						// Make sure all other overrides are also up-to-date
						for (var j=i-1; j >= 0; j--) {
							this.updateOverride(this.overrides[j]);
						}

						return true;
					} else {
						over.current = over.start;
						this.updateOverride(over);
					}
				}
			}
		}
		return false;
	}

	function ScopeList() {
		this.raw = [];
		this.caches = [];
	}

	/*Scope.prototype.toString = function() {
		var result = "{";
		for (var a in this.cache) {
			if (typeof this.cache[a].value != "object") {
				result += a.slice(1) + ": " + this.context.lookup(a).value(this) + ",";
			}
		}
		result += "}";
		return result;
	}*/

	/*Scope.prototype.assign = function(name, value, modifying_agent, pushToNetwork) {
		var data = this.lookup2("/" + name);

		value = copy(value);

		if (name === "autocalc") {
			
			if (value === true) {
				value = 1;
			} else if (value === false) {
				value = 0;
			}
			data.context && data.context.autocalc(value === 1);
		}

		var sym = undefined;
		if (data.context) {
			sym = data.context.lookup(name);

			if (pushToNetwork) {
				eden.emit("beforeAssign", [sym, value, modifying_agent]);
			}

			sym.assigned(modifying_agent);
		}

		data.cache.value = value;
		data.cache.up_to_date = true;

		if (data.context) {
			data.context.expireSymbol(sym);
		}
	}*/

	/**
	 * A maintainer of definitions
	 *
	 * @constructor
	 * @struct
	 * @param {string?} name Name to prepend to all child Symbols.
	 * @param {Folder?} parent Parent Folder for this Folder.
	 * @param {Folder?} root The top most parent of this Folder.
	 */
	function Folder(name, parent, root) {
		/**
		 * @type {string}
		 * @private
		 */
		this.name = name || "/";

		/**
		 * @type {Folder}
		 * @private
		 */
		this.parent = parent || this;

		this.base = undefined;

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
	}

	/**
	 * Looks up the the Symbol with the given name.
	 *
	 * @param {string} name The name of the symbol you want.
	 * @return {Symbol}
	 */
	Folder.prototype.lookup = function (name) {
		if (this.symbols[name] === undefined) {
			this.symbols[name] = new Symbol(this, this.name + name);
			this.notifyGlobals(this.symbols[name], true);
		}
		return this.symbols[name];
	};

	Folder.prototype.currentObservableName = function () {
		if (this.currentObservables.length == 0) {
			return undefined;
		} else {
			return this.currentObservables[this.currentObservables.length - 1].name.slice(1);
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
				delete this.symbols[name.slice(this.name.length)];
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
	Folder.prototype.notifyGlobals = function (symbol, create) {
		for (var i = 0; i < this.globalobservers.length; i++) {
			if (this.globalobservers[i] !== undefined) {
				this.globalobservers[i].call(this, symbol, create);
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
			sym.expire(symbolNamesToForce, this.expiryCount, this.needsTrigger);
			sym.needsGlobalNotify = true;
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
			var sym = this.symbols[symbolNamesArray[i].slice(this.name.length)];
			sym.evaluateIfDependenciesExist();
			sym.needsGlobalNotify = true;
			symbolsToForce.push(sym);
		}
		var actions_to_fire = this.needsTrigger;
		this.needsTrigger = {};
		fireActions(actions_to_fire);
		fireJSActions(expired);
		fireJSActions(symbolsToForce);

		if (this.needsGlobalNotify.length == 0) {
			//Append expired onto symbolsToForce, create a notification queue and schedule notifications.
			expired.unshift(symbolsToForce.length, 0);
			symbolsToForce.splice.apply(symbolsToForce, expired);
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
			symbolsToForce.unshift(globalNotifyList.length, 0);
			globalNotifyList.splice.apply(globalNotifyList, symbolsToForce);
			expired.unshift(globalNotifyList.length, 0);
			globalNotifyList.splice.apply(globalNotifyList, expired);
		}
	};

	Folder.prototype.processGlobalNotifyQueue = function () {
		var notifyList = this.needsGlobalNotify;
		var index = 0;
		while (index < notifyList.length) {
			this.globalNotifyIndex++;
			var symbol = notifyList[index];
			if (symbol.needsGlobalNotify) {
				symbol.needsGlobalNotify = false;
				this.notifyGlobals(symbol, false);
			}
			index = this.globalNotifyIndex;
		}
		this.needsGlobalNotify = [];
		this.globalNotifyIndex = 0;
	};

	/**
	 * A symbol table entry.
	 *
	 * @constructor
	 * @struct
	 * @param {Folder} context Folder this Symbol belongs to.
	 * @param {string} name Name for the Symbol.
	 */
	function Symbol(context, name) {
		/**
		 * @type {Folder}
		 * @private
		 */
		this.context = context;

		/**
		 * @type {string}
		 */
		this.name = name;

		this.cache = (context) ? context.scope.add(name) : new ScopeCache( true, undefined );

		this.definition = undefined;
		this.causecount = 0;
		//this.eden_definition = undefined;
		this.evalResolved = true;
		this.extend = undefined;
		this.needsGlobalNotify = false;

		// need to keep track of who we subscribe to so
		// that we can unsubscribe from them when our definition changes
		this.dependencies =  {};

		// need to keep track of what symbols subscribe to us
		// so that we can notify them of a change in value
		this.subscribers = {};

		// performs the same role as .dependencies but for the backtick notation, where which
		// observables an observable depends on can be dependent on the values of other observables.
		this.dynamicDependencies = {};

		// tracks which observable names currently fill in for the parts of the definition defined
		// by backticks.  Element 0 represents the first invocation of backticks in the EDEN definition.
		this.dynamicDependencyTable = [];
		// tracks how many times the same observable is referenced by different invocations of
		// backticks.  When a reference count is decremented to zero then it's time to unsubscribe.
		this.dynamicDependencyRefCount = {};

		// need to keep track of observers so we can notify those also
		this.observers = {};
		this.observees = {};
		this.jsObservers = {};

		this.last_modified_by = undefined;

		// true when the symbol ready to be garbage collected from its folder when execution of the
		// current script finishes (if it is not subsequently referenced again).  This occurs when
		// using EDEN's forget function.
		this.garbage = false;
	}

	Symbol.getInputAgentName = function () {
		return "*Script Input";
	}
	
	Symbol.hciAgent = {name: "*Input Device"};

	/**
	 * Get the value of this symbol bound with the scope the value was
	 * generated in.
	 */
	Symbol.prototype.boundValue = function(scope, indices) {
		var value = this.value(scope);
		var cache = scope.lookup(this.name);

		if (indices) {
			// Generate a non range scope equivalent to a specific index.
			if (cache.scopes) {
				var tscope = cache.scopes[indices[0]];
				var tvalue = value[indices[0]];
				for (var i=1; i<indices.length; i++) {
					tscope = tscope[indices[i]];
					tvalue = tvalue[indices[i]];
				}
				return new BoundValue(tvalue, tscope);
			} else {
				var tvalue = value[indices[0]];
				for (var i=1; i<indices.length; i++) {
					tvalue = tvalue[indices[i]];
				}
				return new BoundValue(tvalue, cache.scope);
			}
		} else {
			return new BoundValue(value, cache.scope, cache.scopes);
		}
	}
	
	/**
	 * Return the current value of this symbol, forcing calculation if necessary.
	 *
	 * @return {*}
	 */
	Symbol.prototype.value = function (pscope) {
		if (pscope && pscope.isRange()) {
			var cache = (this.context === undefined || pscope === this.context.scope) ? this.cache : pscope.lookup(this.name);
			if (cache.scope === pscope && cache.up_to_date) return cache.value;
			return this.multiValue(pscope);
		} else {
			var scope = pscope;
			this.garbage = false;

			if (scope === undefined) scope = this.context.scope;

			var cache = (this.context === undefined || scope === this.context.scope) ? this.cache : scope.lookup(this.name);

			if (this.definition) {
				if (!cache.up_to_date) {
					this.evaluate(scope, cache);
				}
			}
			return cache.value;
		}
	};

	Symbol.prototype.multiValue = function (newscope) {
		var results = [];
		var scoperesults = [];
		newscope.range = false;

		while (true) {
			var val = this.boundValue(newscope.clone());
			if (val.value !== undefined) {
				results.push(val.value);
				scoperesults.push(val.scope);
			}
			if (newscope.next() == false) break;
		}

		newscope.range = true;

		// Must log scope in cache for ranges as well
		var cache = (this.context === undefined || newscope === this.context.scope) ? this.cache : newscope.lookup(this.name);
		cache.scope = newscope;
		cache.scopes = scoperesults;

		return results;
	};

	Symbol.prototype.evaluateIfDependenciesExist = function () {
		var name;
		for (name in this.dependencies) {
			// only evaluate if all dependencies have been defined by some agent
			if (!this.dependencies[name].last_modified_by) {
				return;
			}
		}
		this.evaluate(this.context.scope, this.context.scope.lookup(this.name));
	};

	Symbol.prototype.getValueScope = function(scope) {
		return scope.lookup(this.name).scope;
	}

	Symbol.prototype.evaluate = function (scope, cache) {
		if (this.context) {
			this.context.beginEvaluation(this);
		}
		try {
			cache.up_to_date = true;
			//NOTE: Don't do copy here, be clever about it.
			//cache.value = copy(this.definition(this.context, scope));
			this.causecount = 0;
			cache.value = this.definition.evaluate(this,this.context, scope, cache);

			// Post process with all extensions
			/*if (this.extend) {
				for (var e in this.extend) {
					this.extend[e].code(this.context, scope, cache.value);
				}
			}*/

			if (!this.evalResolved) {
				/*var replacedDef = this.eden_definition;
				//Replace eval() in EDEN definition with the actual value.
				var re = /\beval\(/;
				var searchIndex;
				var searchFrom = 0;
				while ((searchIndex = replacedDef.slice(searchFrom).search(re)) != -1) {
					var combinedIndex = searchFrom + searchIndex;
					var found = false;
					for (var exp in this.evalIDs) {
						var subString = replacedDef.slice(combinedIndex + 5, combinedIndex + exp.length + 6);
						if (subString == exp + ")") {
							var jsValue = this.context.getEval(this.evalIDs[exp]);
							var edenValue = Eden.edenCodeForValue(jsValue);
							replacedDef = replacedDef.slice(0, combinedIndex) +
								edenValue +
								replacedDef.slice(combinedIndex + exp.length + 6);
							searchFrom = combinedIndex + edenValue.length;
							found = true;
							break;
						}
					}
					if (!found) {
						searchFrom = combinedIndex + 5;
					}
				}
				this.eden_definition = replacedDef;*/
				this.evalResolved = true;
			}
		} catch (e) {
			this.logError(e);
			cache.value = undefined;
			cache.up_to_date = true;
		}
		if (this.context) {
			this.context.endEvaluation(this);
		}
	};

	Symbol.prototype.clearEvalIDs = function () {
		var context = this.context;
		for (var id in this.evalIDs) {
			context.clearEval(this.evalIDs[id]);
		}
		this.evalIDs = {};
		this.evalResolved = false;
	}

	Symbol.prototype.clearObservees = function () {
		for (var name in this.observees) {
			var symbol = this.observees[name];
			symbol.removeObserver(this.name);
		}
		this.observees = {};
	};

	Symbol.prototype.subscribe = function (dependencies) {
		//var dependencies = Utils.flatten(arguments);
		for (var o in dependencies) {
			var dependency = dependencies[o];

			var symbol = this.context.lookup(o);

			if (symbol.name != this.name) {
				symbol.addSubscriber(this.name, (dependency) ? this : undefined);
				var name = symbol.name;
				this.dependencies[name] = symbol;
				delete this.dynamicDependencies[name];
			}
		}

		return this;
	};

	Symbol.prototype.subscribeDynamic = function (position, dependency, scope) {
		// To put the dependency on the outer scoped observable is in a scoping context
		if (scope && scope.cause) {
			var basescope = scope.baseScope();
			return basescope.cause.subscribeDynamic(basescope.cause.causecount++, dependency);
		}

		if (!(dependency in this.dependencies)) {
			var symbol, refCount;
			var previousDependency = this.dynamicDependencyTable[position];
			if (previousDependency !== undefined) {
				refCount = this.dynamicDependencyRefCount[previousDependency];
				if (refCount == 1) {
					symbol = this.context.lookup(previousDependency);
					symbol.removeSubscriber(this.name);
					delete this.dynamicDependencies[symbol.name];
					delete this.dynamicDependencyRefCount[previousDependency];
				} else {
					this.dynamicDependencyRefCount[previousDependency] = refCount - 1;
				}
			}
			if (!(dependency in this.dynamicDependencies)) {
				symbol = this.context.lookup(dependency);
				symbol.addSubscriber(this.name, this);
				this.dynamicDependencies[symbol.name] = symbol;
				this.dynamicDependencyRefCount[dependency] = 1;
			} else {
				this.dynamicDependencyRefCount[dependency]++;				
			}
		}
		this.dynamicDependencyTable[position] = dependency;
		return this.context.lookup(dependency);
	}

	
	Symbol.prototype.clearDependencies = function () {
		var dependency;
		for (var name in this.dependencies) {
			dependency = this.dependencies[name];
			dependency.removeSubscriber(this.name);
		}
		this.dependencies = {};
		for (var name in this.dynamicDependencies) {
			dependency = this.dynamicDependencies[name];
			dependency.removeSubscriber(this.name);
		}
		this.dynamicDependencies = {};
		this.dynamicDependencyTable = [];
		this.dynamicDependencyRefCount = {};
	};

	Symbol.prototype._setLastModifiedBy = function (modifying_agent) {
		if (modifying_agent === global) {
			this.last_modified_by = Symbol.getInputAgentName();
		} else {
			this.last_modified_by = modifying_agent ? modifying_agent.name.replace(/^\//, '') : "*JavaScript";
		}
	};

	/**
	 * Set a definition for the Symbol, which will be used to calculate it's value.
	 *
	 * @param {function(Folder)} definition
	 * @param {Symbol} modifying_agent Agent modifying this Symbol.
	 */
	Symbol.prototype.define = function (definition, modifying_agent, base) {
		this.garbage = false;
		this._setLastModifiedBy(modifying_agent);
		//this.definition = definition;

		if (this.definition === undefined) this.definition = new Symbol.Definition();
		this.definition.setBase(definition, base);

		// symbol no longer observes or depends on anything
		this.clearObservees();
		this.clearDependencies();

		/*var args = [];
		for (var i = 2; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		this.subscribe(args);*/

		// Re-add any extension dependencies.
		/*if (this.extend) {
			for (var e in this.extend) {
				this.subscribe(this.extend[e].deps);
			}
		}*/

		this.subscribe(this.definition.dependencies);

		if (this.context) {
			this.context.expireSymbol(this);
		}

		return this;
	};

	/**
	 * Watch another symbol for changes.
	 *
	 * @param {...string} symbol_names Names of other symbols to observe from the same Folder.
	 * @return {Symbol}
	 */
	Symbol.prototype.observe = function (symbol_names) {
		symbol_names = Utils.flatten(arguments);
		
		for (var i = 0; i < symbol_names.length; ++i) {
			var symbol = this.context.lookup(symbol_names[i]);
			this.observees[symbol.name] = symbol;
			symbol.addObserver(this.name, this);
		}

		if (this.context) {
			this.context.triggerSymbol(this);
		}
		return this;
	};

	Symbol.prototype.stopObserving = function (symbol_name) {
		this.observees[symbol_name].removeObserver(this.name);
		this.observees[symbol_name] = undefined;
	};

	/**
	 * Change the current value of this symbol and notify.
	 *
	 * If this is called from within JavaScript code that is initiated in some way other than via the
	 * input window (e.g. mouse movement events) then the third parameter must be set to true to
	 * ensure that the change gets propagated to other networked instances of JS-EDEN.
	 *
	 * @param {*} value
	 * @param {Symbol} modifying_agent
	 * @param {boolean} pushToNetwork
	 */
	Symbol.prototype.assign = function (value, scope, modifying_agent, pushToNetwork) {
		if (!(scope instanceof Scope)) {
			pushToNetwork = modifying_agent;
			modifying_agent = scope;
			scope = root.scope;
		}
		this.garbage = false;
		value = copy(value);
		if (pushToNetwork) {
			eden.emit("beforeAssign", [this, value, modifying_agent]);
		}
		if (this.name === "/autocalc") {
			/* JS-EDEN has a separate Boolean type so users may expect to be able to assign true and
			 * false even though autocalc uses 1 and 0 for compatibility with tkeden. */
			if (value === true) {
				value = 1;
			} else if (value === false) {
				value = 0;
			}
			this.context && this.context.autocalc(value === 1);
		}
		//this.eden_definition = undefined;
		this.clearEvalIDs();
		this.evalResolved = true;
		this._setLastModifiedBy(modifying_agent);
		this.definition = undefined;

		this.extend = undefined;

		//if (this.context) {
		var cache = (this.context === undefined || scope == this.context.scope) ? this.cache : scope.lookup(this.name);
		cache.value = value;
		cache.up_to_date = true;

		// symbol no longer observes or depends on anything
		this.clearObservees();
		this.clearDependencies();

		if (this.context) {
			this.context.expireSymbol(this);
		}

		return this;
	};

	/**
	 * Change the current value of this symbol and notify.
	 *
	 * If this is called from within JavaScript code that is initiated in some way other than via the
	 * input window (e.g. mouse movement events) then the third parameter must be set to true to
	 * ensure that the change gets propagated to other networked instances of JS-EDEN.
	 *
	 * @param {*} value
	 * @param {Symbol} modifying_agent
	 * @param {boolean} pushToNetwork
	 */
	Symbol.prototype.assigned = function (modifying_agent) {
		this.garbage = false;
		//this.eden_definition = undefined;
		this.clearEvalIDs();
		this.evalResolved = true;
		this._setLastModifiedBy(modifying_agent);
		this.definition = undefined;

		// symbol no longer observes or depends on anything
		this.clearObservees();
		this.clearDependencies();

		return this;
	};

	/**Makes a JavaScript function appear in the Function List view, rather than instead appearing
	 * as a function typed observable, as it otherwise would using assign.
	 * @param {function} f The function to assign.
	 * @param {Symbol} agent The modifying agent.
	 */
	Symbol.prototype.assignFunction = function (f, agent) {
		this.assign(f, this.context.scope, agent);
		//this.eden_definition = "func " + this.name.slice(1);
		if (this.definition === undefined) this.definition = new Symbol.Definition();
		this.definition.setBase(function (context, scope) { return f; });
	}

	/**
	 * Change the current value of this symbol and notify
	 *
	 * @param {function(Symbol, Symbol)} mutator
	 * @param {Symbol} modifying_agent
	 * @param {...*} mutatorArgs args to be passed to the mutator function.
	 */
	Symbol.prototype.mutate = function (scope, mutator, modifying_agent, mutatorArgs) {
		this.garbage = false;
		var me = this;
		this._setLastModifiedBy(modifying_agent);

		// need to make sure the cached value exists before mutation
		// which is allowed to refer to the cached value.
		this.value(scope);
		this.definition = undefined;

		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		mutator.apply(undefined, [this].concat(args));

		if (this.context) {
			this.context.expireSymbol(this);
		}

		return this;
	};

	Symbol.prototype.loggers = {
		console: function (error) {
			//console.log("<JSEDEN:" + this.name + "> "  + error);
		}
	};

	Symbol.prototype.logError = function (error) {
		for (var channel_name in this.loggers) {
			var logger = this.loggers[channel_name];
			logger.call(this, error);
		}
	};

	/**
	 * Used with pointer type observables, e.g. when clicking in the Symbol List view to edit one.
	 * @return {string} The EDEN code used to create an expression that references this symbol,
	 *	i.e. &name
	 */
	Symbol.prototype.getEdenCode = function () {
		return "&" + this.name.slice(1);
	}


	Symbol.prototype.getSource = function() {
		if (this.definition) {
			return this.definition.getFullSource();
		} else {
			return "";
		}
	}

	
	Symbol.prototype.trigger = function () {
		var name;
		// only trigger when all observed symbols have been defined by some agent
		for (name in this.observees) {
			if (!this.observees[name].last_modified_by) {
				return;
			}
		}
		// if one action fails, it shouldn't prevent all the other
		// scheduled actions from firing
		try {
			this.value().call(this, this.context, this.context.scope);
		} catch (error) {
			this.logError("Failed while triggering: " + error);
		}
	};

	function fireActions(actions_to_fire){
		for (var action_name in actions_to_fire) {
			var action = actions_to_fire[action_name];

			// if one action fails, it shouldn't prevent all the other
			// scheduled actions from firing
			if (action) {
				action.trigger();
			}
		}
	};
	
	function fireJSActions(symbols_to_fire_for) {
		for (var i = 0; i < symbols_to_fire_for.length; i++) {
			symbols_to_fire_for[i].fireJSObservers();
		}
	}

	Symbol.prototype.fireJSObservers = function () {
		for (var jsObserverName in this.jsObservers) {
			try {
				this.jsObservers[jsObserverName](this, this.cache.value);
			} catch (error) {
				this.logError("Failed while triggering JavaScript observer for symbol " + this.name + ": " + error);
				var debug;
				if (this.context) {
					var debugOptions = this.cache.value;
					debug = typeof(debugOptions) == "object" && debugOptions.jsExceptions;
				} else {
					debug = false;
				}
				if (debug) {
					debugger;
				}
				throw error;
			}
		}
	}

	
	/**
	 * Mark this symbol as out of date, and notify all formulas and observers of
	 * this change
	 * @param {Object.<string,Symbol>} actions_to_fire set to accumulate all the actions that should be notified about this expiry
	 */
	Symbol.prototype.expire = function (symbols_to_force, insertionIndex, actions_to_fire) {
		if (this.cache.up_to_date) {
			for (var observer_name in this.observers) {
				actions_to_fire[observer_name] = this.observers[observer_name];
			}
		}

		if (this.definition) {
			this.cache.up_to_date = false;
			symbols_to_force[this.name] = insertionIndex.value;
			insertionIndex.value++;
		}

		// recursively mark out of date and collect
		for (var subscriber_name in this.subscribers) {
			var subscriber = this.subscribers[subscriber_name];
			if (subscriber) {
				subscriber.expire(symbols_to_force, insertionIndex, actions_to_fire);
			}
		}
	};

	Symbol.prototype.isDependentOn = function (name) {
		if (name == this.name || this.dependencies[name]) {
			return true;
		}

		var symbol;
		for (var d in this.dependencies) {
			symbol = this.dependencies[d];
			if (symbol.isDependentOn(name)) {
				return true;
			}
		}
		for (var d in this.dynamicDependencies) {
			symbol = this.dynamicDependencies[d];
			if (symbol.isDependentOn(name)) {
				return true;
			}
		}
		return false;
	};

	Symbol.prototype.getDependencies = function() {
		var res = [];
		for (var d in this.dependencies) {
			res.push(d.slice(1));
		}

		return res;
	}

	Symbol.prototype.assertNotDependentOn = function (name, path) {
		if (path === undefined) {
			path = [];
		}
		path.push(this.name.slice(1));

		if (this.dependencies[name]) {
			var details = path.join(" -> ") + " -> " + name.slice(1) + " -> " + path[0];
			throw new Error("Cyclic dependency detected: " + details);
		}

		var symbol;
		for (var d in this.dependencies) {
			symbol = this.dependencies[d];
			symbol.assertNotDependentOn(name, path);
		}
		for (var d in this.dynamicDependencies) {
			symbol = this.dynamicDependencies[d];
			symbol.assertNotDependentOn(name, path);
		}
		path.pop();
	};

	/**
	 * Add a subscriber to notify on changes to the stored value
	 *
	 * @param {string} name The name of the subscribing symbol
	 */
	Symbol.prototype.addSubscriber = function (name, symbol) {
		this.garbage = false;
		this.assertNotDependentOn(name);
		this.subscribers[name] = symbol;
	};

	/**
	 * Tell this Symbol that it no longer needs to notify a specific symbol.
	 *
	 * @param {string} name The name of the symbol that no longer needs to be notified.
	 */
	Symbol.prototype.removeSubscriber = function (name) {
		delete this.subscribers[name];
		if (this.last_modified_by === undefined && this.canSafelyBeForgotten()) {
			this.forget();
		}
	};

	Symbol.prototype.canSafelyBeForgotten = function () {
		for (var s in this.subscribers) {
			return false;
		}
		for (var o in this.observers) {
			return false;
		}
		return true;
	}

	Symbol.prototype.forget = function () {
		//this.eden_definition = undefined;
		this.clearEvalIDs();
		this.evalResolved = true;
		this.definition = undefined;
		this.cache.value = undefined;
		this.cache.up_to_date = true;
		this.clearObservees();
		this.clearDependencies();
		this.jsObservers = {};
		this.garbage = true;
		this.context.queueForGarbageCollection(this);
	};

	/**
	 * Add an observer to notify on changes to the stored value.
	 *
	 * @param {string} name The name of the subscribing Symbol.
	 * @param {Symbol} symbol The Symbol to trigger when there is a change in this Symbol.
	 */
	Symbol.prototype.addObserver = function (name, symbol) {
		this.garbage = false;
		this.observers[name] = symbol;
	};

	/**
	 * Add a JavaScript function to notify on changes to the stored value.
	 *
	 * @param {string} name A descriptive ID identifying the code being called.
	 * @param {function} listener The JavaScript function to call when there is a change in this Symbol.
	 */
	Symbol.prototype.addJSObserver = function (name, listener) {
		if (typeof(listener) != "function") {
			throw new Error("Failed adding JavaScript observer " + listener);
		}
		this.jsObservers[name] = listener;
	}
	
	/**
	 * Tell this Symbol that it no longer needs to notify a specific observer.
	 *
	 * @param {string} name Name of the observer that no longer needs to be notified.
	 */
	Symbol.prototype.removeObserver = function (name) {
		delete this.observers[name];
		if (this.last_modified_by === undefined && this.canSafelyBeForgotten()) {
			this.forget();
		}
	};

	/**
	 * Tell this Symbol that it no longer needs to notify a specific JavaScript function.
	 *
	 * @param {string} name Identifier of the function that no longer needs to be notified.
	 */
	 Symbol.prototype.removeJSObserver = function (name) {
		delete this.jsObservers[name];
	}


	var Utils = {
		flatten: function (array) {
			var flat = [];
			for (var i = 0, l = array.length; i < l; ++i){
				flat = flat.concat(array[i] instanceof Array ? this.flatten(array[i]) : array[i]);
			}
			return flat;
		},

		construct: (function () {
			/** @constructor */
			var temp_ctor = function () {};

			return function (ctor) {
				temp_ctor.prototype = ctor.prototype;
				var instance = new temp_ctor();
				var args = [];
				for (var i = 1; i < arguments.length; i++) {
					args.push(arguments[i]);
				}
				ctor.apply(instance, args);
				return instance;
			};
		})()
	};

	Symbol.prototype.addExtension = function(idstr, ext, base, modifying_agent) {
		if (this.definition) {
			this.definition.setExtension(idstr, ext, base);

			this.subscribe(this.definition.dependencies);

			if (this.context) {
				this.context.expireSymbol(this);
			}
		} else {
			throw new Error(Eden.RuntimeError.EXTENDSTATIC);
		}
	}

	Symbol.prototype.listAssign = function(value, scope, modifying_agent, pushToNetwork, indices) {
		if (this.definition) {
			throw new Error(Eden.RuntimeError.ASSIGNTODEFINED);
			return;
		}

		var list = this.value(scope);
		for (var i = 0; i < indices.length-1; i++) {
			if (list) {
				//if (indices[i] < 0 || indices[i] >= list.length) throw new Error(Eden.RuntimeError.LISTINDEX);
				list = list[indices[i]];
			}
		}
		if (list) {
			//if (indices[i] < 0 || indices[i] >= list.length) throw new Error(Eden.RuntimeError.LISTINDEX);
			list[indices[indices.length-1]] = value;
		} else {
			throw new Error(Eden.RuntimeError.ASSIGNDIMENSION);
		}

		this._setLastModifiedBy(modifying_agent);
		if (this.context) {
			this.context.expireSymbol(this);
		}
		return this;
	}

	/**
	 * Lookup part of the value for this Symbol, and return a SymbolAccessor for it.
	 *
	 * @param {...string} keys Keys to look up successively in the symbol value.
	 * @return {SymbolAccessor}
	 */
	Symbol.prototype.get = function (keys) {
		var args = [];
		for (var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		return Utils.construct.apply(undefined, [SymbolAccessor,this].concat(args));
	};

	/**
	 * A SymbolAccessor can be used to focus on part of a Symbol, allowing
	 * assignment and lookup of the value.
	 *
	 * E.g.
	 *
	 * ```
	 * var array = root.lookup('myArray');
	 * array.assign(['a', 'b', 'c']);
	 * var firstElement = new SymbolAccessor(symbol, '0');
	 * firstElement.value() // results in 'a'
	 * ```
	 *
	 * @constructor
	 * @struct
	 * @param {Symbol} symbol The symbol to access a part of.
	 * @param {...string} keys Keys to look up successively in the symbol value.
	 */
	function SymbolAccessor(symbol, keys) {
		this.parent = symbol;
		this.symbol = symbol;
		//this.keys = Array.prototype.slice.call(arguments, 1);

		this.keys = [];
		for (var i = 1; i < arguments.length; i++) {
			this.keys.push(arguments[i]);
		}
	};

	/**
	 * @param {*} value The value to assign.
	 * @param {Symbol} modifying_agent The agent responsible for the modification.
	 */
	SymbolAccessor.prototype.assign = function (value, scope, modifying_agent, pushToNetwork) {
		this.symbol.garbage = false;
		value = copy(value);
		var me = this;
		if (pushToNetwork) {
			eden.emit("beforeAssign", [this, value, modifying_agent]);
		}
		this.parent.mutate(scope, function (symbol, modifying_agent) {
			var list = symbol.value(scope);
			for (var i = 0; i < me.keys.length - 1; ++i) {
				list = list[me.keys[i]];
			}
			list[me.keys[i]] = value;
		}, modifying_agent);
		return this;
	};

	/**
	 * @return {*} The current value for this part of the parent Symbol.
	 */
	SymbolAccessor.prototype.value = function (scope) {
		this.symbol.garbage = false;
		var value = this.parent.value(scope);
		for (var i = 0; i < this.keys.length; ++i) {
			value = value[this.keys[i]];
		}
		return value;
	};

	/**
	 * Create a new SymbolAccessor by combining starting with the keys used for this one.
	 *
	 * @param {...string} keys Keys to lookup successively for the new accessor.
	 * @return {SymbolAccessor}
	 */
	SymbolAccessor.prototype.get = function (keys) {
		var args = [];
		for (var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		var newLookup = this.keys.concat(args);
		return Symbol.prototype.get.apply(this.parent, newLookup);
	};

	// expose API
	global.Folder = Folder;
	global.Symbol = Symbol;
	global.Scope = Scope;
	global.ScopeOverride = ScopeOverride;
	global.edenCopy = copy;
	global.BoundValue = BoundValue;
	
	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Folder = Folder;
		exports.Symbol = Symbol;
		exports.Scope = Scope;
		exports.ScopeOverride = ScopeOverride;
		exports.edenCopy = copy;
	}
}(typeof window !== 'undefined' ? window : global));
