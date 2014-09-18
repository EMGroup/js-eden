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

		/**
		 * @type {Folder}
		 * @private
		 */
		this.root = root || this;

		/**
		 * @type {Object.<string, Symbol>}
		 * @public
		 */
		this.symbols = {};

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

		/**
		 * @type {Array.<function(*)>}
		 * @private
		 */
		this.todoactions = [];
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

	/**
	 * Add a listener for any change in the Folder.
	 *
	 * @param {function(Symbol, boolean)} listener This will be executed when a change occurs in the Folder.
	 */
	Folder.prototype.addGlobal = function (listener) {
		this.globalobservers.push(listener);
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
		if ((state === true) && (this.autocalc_state === false)) {
			this.autocalc_state = true;
			this.fireAllActions(this.todoactions);
		} else if ((state === false) && (this.autocalc_state === true)) {
			this.todoactions = [];
			this.autocalc_state = false;
		}
	};

	/**
	 * @param {Array.<Object.<string, Symbol>>} actions Actions to trigger in turn.
	 */
	Folder.prototype.fireAllActions = function (actions) {
		for (var i = 0; i < actions.length; i++) {
			var actions_to_fire = actions[i];
			for (var action_name in actions_to_fire) {
				var action = actions_to_fire[action_name];
				// if one action fails, it shouldn't prevent all the other
				// scheduled actions from firing
				if (action !== undefined) {
					action.trigger();
				}
			}
		}
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
		 * @private
		 */
		this.name = name;

		this.definition = undefined;
		this.eden_definition = undefined;
		this.cached_value = undefined;
		this.up_to_date = false;

		// need to keep track of who we subscribe to so
		// that we can unsubscribe from them when our definition changes
		this.dependencies =  {};

		// need to keep track of what symbols subscribe to us
		// so that we can notify them of a change in value
		this.subscribers = {};

		// need to keep track of observers so we can notify those also
		this.observers = {};

		this.observees = {};

		this.last_modified_by = undefined;
	}

	/**
	 * Return the current value of this symbol, recalculating it if necessary.
	 *
	 * @return {*}
	 */
	Symbol.prototype.value = function () {
		if (!this.up_to_date) {
			if (this.definition === undefined) {
				this.cached_value = undefined;
			} else {
				try {
					this.cached_value = this.definition(this.context);
					this.up_to_date = true;
				} catch (e) {
					this.cached_value = undefined;
					this.up_to_date = false;
				}
			}
		}
		return this.cached_value;
	};

	/**
	 *
	 */
	Symbol.prototype.clearObservees = function () {
		for (var name in this.observees) {
			var symbol = this.observees[name];
			symbol.removeObserver(this.name);
		}
		this.observees = {};
	};

	Symbol.prototype.subscribe = function () {
		var dependencies = Utils.flatten(arguments);
		for (var i = 0; i < dependencies.length; ++i) {
			var dependency = dependencies[i];
			var symbol = this.context.lookup(dependency);

			symbol.addSubscriber(this.name, this);
			this.dependencies[symbol.name] = symbol;
		}

		return this;
	};

	Symbol.prototype.clearDependencies = function () {
		for (var name in this.dependencies) {
			var dependency = this.dependencies[name];
			dependency.removeSubscriber(this.name);
		}
		this.dependencies = {};
	};

	Symbol.prototype._setLastModifiedBy = function (modifying_agent) {
		if (modifying_agent === global) {
			this.last_modified_by = 'input';
		} else {
			this.last_modified_by = modifying_agent ? modifying_agent.name : 'unknown';
		}
	};

	/**
	 * Set a definition for the Symbol, which will be used to calculate it's value.
	 *
	 * @param {function(Folder)} definition
	 * @param {Symbol} modifying_agent Agent modifying this Symbol.
	 */
	Symbol.prototype.define = function (definition, modifying_agent) {
		this._setLastModifiedBy(modifying_agent);
		this.definition = definition;

		this.clearObservees();
		this.clearDependencies();

		var actions_to_fire = {};
		this.expire(actions_to_fire);

		if (this.context !== undefined) {
			if (this.context.autocalc_state) {
				this.fireActions(actions_to_fire);
			} else {
				this.context.todoactions.push(actions_to_fire);
			}
		} else {
			this.fireActions(actions_to_fire);
		}

		if (this.context !== undefined) {
			this.context.notifyGlobals(this,false);
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
		return this;
	};

	Symbol.prototype.stopObserving = function (symbol_name) {
		this.observees[symbol_name].removeObserver(this.name);
		this.observees[symbol_name] = undefined;
	};

	/**
	 * Change the current value of this symbol and notify.
	 *
	 * @param {*} value
	 * @param {Symbol} modifying_agent
	 */
	Symbol.prototype.assign = function (value, modifying_agent) {
		var me = this;
		this._setLastModifiedBy(modifying_agent);
		this.definition = undefined;
		this.clearDependencies();
		this.clearObservees();
		this.cached_value = value;

		var actions_to_fire = {};
		this.expire(actions_to_fire);
		this.up_to_date = true;

		if (this.context !== undefined) {
			if (this.context.autocalc_state) {
				this.fireActions(actions_to_fire);
			} else {
				this.context.todoactions.push(actions_to_fire);
			}
		} else {
			this.fireActions(actions_to_fire);
		}

		if (this.context !== undefined) {
			this.context.notifyGlobals(this,false);
		}
		return this;
	};

	/**
	 * Change the current value of this symbol and notify
	 *
	 * @param {function(Symbol, Symbol)} mutator
	 * @param {Symbol} modifying_agent
	 * @param {...*} mutatorArgs args to be passed to the mutator function.
	 */
	Symbol.prototype.mutate = function (mutator, modifying_agent, mutatorArgs) {
		var me = this;
		if (modifying_agent === global) {
			this.last_modified_by = 'input';
		} else {
			this.last_modified_by = modifying_agent ? modifying_agent.name : 'unknown';
		}

		// need to make sure the cached value exists before mutation
		// which is allowed to refer to the cached value.
		this.value();

		this.definition = undefined;
		this.clearDependencies();
		this.clearObservees();

		mutator.apply(undefined, [this].concat(Array.prototype.slice.call(arguments, 1)));

		var actions_to_fire = {};
		this.expire(actions_to_fire);

		this.up_to_date = true;

		// accumulate a set of agents to trigger in expire, then trigger each of them
		if (this.context !== undefined) {
			if (this.context.autocalc_state) {
				this.fireActions(actions_to_fire);
			} else {
				this.context.todoactions.push(actions_to_fire);
			}
		} else {
			this.fireActions(actions_to_fire);
		}

		if (this.context !== undefined) {
			this.context.notifyGlobals(this,false);
		}
		return this;
	};

	Symbol.prototype.loggers = {
		console: function (error) {
			console.log("<JSEDEN:" + this.name + "> "  + error);
		}
	};

	Symbol.prototype.logError = function (error) {
		for (var channel_name in this.loggers) {
			var logger = this.loggers[channel_name];
			logger.call(this, error);
		}
	};

	Symbol.prototype.trigger = function () {
		// if one action fails, it shouldn't prevent all the other
		// scheduled actions from firing
		try {
			this.value().call(this);
		} catch (error) {
			this.logError("Failed while triggering: " + error);
		}
	};

	Symbol.prototype.fireActions = function (actions_to_fire){
		for (var action_name in actions_to_fire) {
			var action = actions_to_fire[action_name];

			// if one action fails, it shouldn't prevent all the other
			// scheduled actions from firing
			if (action) {
				action.trigger();
			}
		}
	};

	/**
	 * Mark this symbol as out of date, and notify all formulas and observers of
	 * this change
	 * @param {Object.<string,Symbol>} actions_to_fire set to accumulate all the actions that should be notified about this expiry
	 */
	Symbol.prototype.expire = function (actions_to_fire) {
		var me = this;
		this.up_to_date = false;

		for (var subscriber_name in this.subscribers) {
			var subscriber = this.subscribers[subscriber_name];
			if (subscriber) {
				subscriber.expire(actions_to_fire);
			}
		}

		for (var observer_name in this.observers) {
			actions_to_fire[observer_name] = this.observers[observer_name];
		}

		setTimeout(function () {
			if (me.context !== undefined) {
				me.context.notifyGlobals(me, false);
			}
		}, 0);
	};

	Symbol.prototype.assertNotDependentOn = function (name) {
		if (this.dependencies[name]) {
			throw new Error("Cyclic dependency detected");
		}

		for (var d in this.dependencies) {
			var symbol = this.dependencies[d];
			symbol.assertNotDependentOn(name);
		}
	};

	/**
	 * Add a subscriber to notify on changes to the stored value
	 *
	 * @param {string} name The name of the subscribing symbol
	 */
	Symbol.prototype.addSubscriber = function (name, symbol) {
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
	};

	/**
	 * Add an observer to notify on changes to the stored value.
	 *
	 * @param {string} name The name of the subscribing Symbol.
	 * @param {Symbol} symbol The Symbol to trigger when there is a change in this Symbol.
	 */
	Symbol.prototype.addObserver = function (name, symbol) {
		this.observers[name] = symbol;
	};

	/**
	 * Tell this Symbol that it no longer needs to notify a specific observer.
	 *
	 * @param {string} name Name of the observer that no longer needs to be notified.
	 */
	Symbol.prototype.removeObserver = function (name) {
		delete this.observers[name];
	};

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
				ctor.apply(instance, Array.prototype.slice.call(arguments, 1));
				return instance;
			};
		})()
	};

	/**
	 * Lookup part of the value for this Symbol, and return a SymbolAccessor for it.
	 *
	 * @param {...string} keys Keys to look up successively in the symbol value.
	 * @return {SymbolAccessor}
	 */
	Symbol.prototype.get = function (keys) {
		return Utils.construct.apply(undefined, [SymbolAccessor,this].concat(Array.prototype.slice.call(arguments)));
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
		this.keys = Array.prototype.slice.call(arguments, 1);
	};

	/**
	 * @param {*} value The value to assign.
	 * @param {Symbol} modifying_agent The agent responsible for the modification.
	 */
	SymbolAccessor.prototype.assign = function (value, modifying_agent) {
		var me = this;
		this.parent.mutate(function (symbol, modifying_agent) {
			var list = symbol.cached_value;
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
	SymbolAccessor.prototype.value = function () {
		var value = this.parent.value();
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
		var newLookup = this.keys.concat(Array.prototype.slice.call(arguments));
		return Symbol.prototype.get.apply(this.parent, newLookup);
	};

	// expose API
	global.Folder = Folder;
	global.Symbol = Symbol;
}(typeof window !== 'undefined' ? window : global));
