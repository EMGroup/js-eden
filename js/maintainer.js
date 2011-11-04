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

/**
 * A maintainer of definitions
 * @constructor
 */
function Folder(name, parent, root) {
	this.name = name || "/";
	this.parent = parent || this;
	this.root = root || this;
    this.symbols = {};
}

/**
 * Looks up the current value of the requested symbol
 * @param {string} name The name of the observable you want the current value offscreenBuffering
 * @return {number|string|array}
 */
Folder.prototype.lookup = function(name) {
	var me = this;
    if (this.symbols[name] === undefined) {
        this.symbols[name] = new Symbol(this, this.name + name, this.root);

		setTimeout(function() { $(me).trigger('symbolCreate', [me.symbols[name], name])});
    }

    return this.symbols[name];
};

/**
 * A symbol table entry. Maybe.
 * @constructor
 * @param {function} definition
 * @param {Object.<string,number>} subscribers
 * @param {Object.<string,function>} observers
 */
function Symbol(context, name) {
	this.context = context;
	this.name = name;

    this.definition = undefined;
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
 * @param {Folder} The context in which to evaluate the definition
 * @return {number|string|list}
 */
Symbol.prototype.value = function() {
    if (!this.up_to_date) {
		if (this.definition === undefined) {
			this.cached_value = undefined;
		} else {
			this.cached_value = this.definition(this.context);
		}
        this.up_to_date = true;
    }
    return this.cached_value;
};

Symbol.prototype.clearObservees = function() {
	$.each(this.observees, function(name, symbol) {
		symbol.removeObserver(this.name);
	});
	this.observees = {};
};

Symbol.prototype.subscribe = function() {
	var dependencies = Utils.flatten(arguments);
	var me = this;
	$.each(dependencies, function(i,dependency) {
		var symbol = me.context.lookup(dependency);
		symbol.addSubscriber(me.name, me);
		me.dependencies[symbol.name] = symbol;
	});

	return this;
};

Symbol.prototype.clearDependencies = function() {
	var me = this;

	$.each(this.dependencies, function(i, dependency) {
		dependency.removeSubscriber(me.name);
	});

	this.dependencies = {};
};

/**
 * @param {function} definition
 * @param {Array.<string>} dependencies Symbol names for the dependencies
 */
Symbol.prototype.define = function(definition, modifying_agent) {
	var me = this;

	// XXX: not sure if we really want to have lastModifiedBy set
	// in the mutation methods
	//
	// this is a similar problem to the usage of this.context
	if (modifying_agent === window) {
		this.last_modified_by = 'input';
	} else {
		this.last_modified_by = modifying_agent ? modifying_agent.name : 'unknown';
	}

	this.definition = definition;

	this.clearObservees();
	this.clearDependencies();

	var actions_to_fire = {};
	this.expire(actions_to_fire);
	this.fireActions(actions_to_fire);
	setTimeout(function() { $(me).trigger('symbolDefine')});
	return me;
};

/**
 * Watch another symbol for changes
 * @param {string} symbol_name A name for the Symbol
 */
Symbol.prototype.observe = function() {
	var symbol_names = Utils.flatten(arguments);
	var me = this;
	$.each(symbol_names, function(i,symbol_name) {
		var symbol = me.context.lookup(symbol_name);
		me.observees[symbol.name] = symbol;
		symbol.addObserver(me.name, me);
	});

	return this;
};

Symbol.prototype.stopObserving = function(symbol_name) {
	this.observees[symbol_name].removeObserver(this.name);
	this.observees[symbol_name] = undefined;
};

/**
 * Change the current value of this symbol and notify
 * @param {any} value
 */
Symbol.prototype.assign = function(value, modifying_agent) {
	var me = this;

	// XXX: not sure if we really want to have last_modified_by set
	// in the mutation methods
	if (modifying_agent === window) {
		this.last_modified_by = 'input';
	} else {
		this.last_modified_by = modifying_agent ? modifying_agent.name : 'unknown';
	}
	
	this.definition = undefined;
	this.clearDependencies();
	this.clearObservees();
	this.cached_value = value;

	var actions_to_fire = {};
	this.expire(actions_to_fire);
	this.up_to_date = true;

	setTimeout(function() { $(me).trigger('symbolAssign', value)});
	this.fireActions(actions_to_fire);

	return this;
};

/**
 * Change the current value of this symbol and notify
 * @param {function} mutator
 */
Symbol.prototype.mutate = function(mutator, modifying_agent) {
	var me = this;

	// XXX: not sure if we really want to have last_modified_by set
	// in the mutation methods
	if (modifying_agent === window) {
		this.last_modified_by = 'input';
	} else {
		this.last_modified_by = modifying_agent ? modifying_agent.name : 'unknown';
	}

	// XXX: need to make sure the cached value exists before mutation
	// which frequently relies on modifying the cached value
	this.value();

	this.definition = undefined;
	this.clearDependencies();
	this.clearObservees();

	mutator.apply(undefined, [this].concat(Array.prototype.slice.call(arguments, 1)));

	var actions_to_fire = {};
	this.expire(actions_to_fire);

	this.up_to_date = true;
	setTimeout(function() { $(me).trigger('symbolMutate')});

	// accumulate a set of agents to trigger in expire, then trigger each of them
	this.fireActions(actions_to_fire);

	return this;
};

Symbol.prototype.loggers = {
	console: function(error) {
		console.log("<JSEDEN:" + this.name + "> "  + error);
	}
};

Symbol.prototype.logError = function(error) {
	for (var channel_name in this.loggers) {
		var logger = this.loggers[channel_name];
		logger.call(this, error);
	}
};

Symbol.prototype.trigger = function() {
	// if one action fails, it shouldn't prevent all the other
	// scheduled actions from firing
	try {
		//console.log("THIS: ", this);
		this.value().call(this);
	} catch (error) {
		this.logError("Failed while triggering: " + error);
	}
};

Symbol.prototype.fireActions = function(actions_to_fire) {
	for (var action_name in actions_to_fire) {
		var action = actions_to_fire[action_name];
		// if one action fails, it shouldn't prevent all the other
		// scheduled actions from firing
		action.trigger();
	}
};

/**
 * Mark this symbol as out of date, and notify all formulas and observers of
 * this change
 */
Symbol.prototype.expire = function(actions_to_fire) {
	var me = this;
	this.up_to_date = false;

	$.each(this.subscribers, function(subscriber_name, subscriber) {
		if (subscriber !== undefined) {
			subscriber.expire(actions_to_fire);
		}
	});

	for (var observer_name in this.observers) {
		actions_to_fire[observer_name] = this.observers[observer_name];
	}
};

/**
 * Add a subscriber to notify on changes to the stored value
 * @param {string} name The name of the subscribing symbol
 */
Symbol.prototype.addSubscriber = function(name, symbol) {
    this.subscribers[name] = symbol;
};

Symbol.prototype.removeSubscriber = function(name) {
    this.subscribers[name] = undefined;
};

/**
 * Add an observer to notify on changes to the stored value
 * @param {string} name The name of the subscribing symbol
 */
Symbol.prototype.addObserver = function(name, symbol) {
    this.observers[name] = symbol;
};

Symbol.prototype.removeObserver = function(name) {
    this.observers[name] = undefined;
};

var Utils = {
	flatten: function(array) {
		var flat = [];
		for (var i = 0, l = array.length; i < l; ++i){
			flat = flat.concat(array[i] instanceof Array ? this.flatten(array[i]) : array[i]);
		}
		return flat;
	},

	construct: (function() {
		var temp_ctor = function() {};

		return function(ctor) {
			temp_ctor.prototype = ctor.prototype;
			var instance = new temp_ctor();
			ctor.apply(instance, Array.prototype.slice.call(arguments, 1));
			return instance;
		};

	})(),

	arrayEquals: function(a, b) {
		if (a.length !== b.length) {
			return false;
		}

		for (var i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) {
				return false;
			}
		}

		return true;
	},

	copy: function(val) {
		if (typeof val === "object") {
			// XXX: figure out how to write a universal clone 
			// method without relying on jQuery
			return $.extend(true, {}, val);
		} else {
			return val;
		}
	}
};

Symbol.prototype.get = function() {
	return Utils.construct.apply(undefined, [SymbolAccessor,this].concat(Array.prototype.slice.call(arguments)));
};


/*
 *
 */
var SymbolAccessor = function(symbol) {
	this.parent = symbol;
	this.symbol = symbol;
	this.keys = Array.prototype.slice.call(arguments, 1);
};

SymbolAccessor.prototype.assign = function(value, modifying_agent) {
	var me = this;
	this.parent.mutate(function(symbol, modifying_agent) {
		var list = symbol.cached_value;
		for (var i = 0; i < me.keys.length - 1; ++i) {
			list = list[me.keys[i]];
		}
		list[me.keys[i]] = value;
	});
	return this;
};

SymbolAccessor.prototype.value = function() {
	var value = this.parent.value();
	for (var i = 0; i < this.keys.length; ++i) {
		value = value[this.keys[i]];
	}
	return value;
};

SymbolAccessor.prototype.get = function() {
	var newLookup = this.keys.concat(Array.prototype.slice.call(arguments));
	return Symbol.prototype.get.apply(this.parent, newLookup);
};

/**
 * implements copy on write, assuming writes
 * happen through the 'mutate' interface
 */
function SymbolCopy() {
	Symbol.call(this, Array.prototype.slice(arguments));
}

SymbolCopy.prototype = new Symbol();

SymbolCopy.prototype.mutate = function() {
	this.cached_value = Utils.copy(this.cached_value);
	Symbol.prototype.mutate.apply(this, Array.prototype.slice(arguments));
};
