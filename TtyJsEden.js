var $ = require('jquery');

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

Symbol.prototype.subscribe = function(dependencies) {
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
		dependency.removeSubscriber(me);
	});

	this.dependencies = {};
};

/**
 * @param {function} definition
 * @param {Array.<string>} dependencies Symbol names for the dependencies
 */
Symbol.prototype.define = function(definition) {
	var me = this;
	this.definition = definition;

	this.clearObservees();
	this.clearDependencies();

	this.expire();
	setTimeout(function() { $(me).trigger('symbolDefine')});
	return me;
};

/**
 * Watch another symbol for changes
 * @param {string} symbol_name A name for the Symbol
 */
Symbol.prototype.observe = function(symbol_names) {
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
Symbol.prototype.assign = function(value) {
	var me = this;
	
	this.definition = undefined;
	this.clearDependencies();
	this.clearObservees();
	this.cached_value = value;

	this.expire();
	this.up_to_date = true;
	setTimeout(function() { $(me).trigger('symbolAssign', value)});

	return this;
};

/**
 * Change the current value of this symbol and notify
 * @param {function} mutator
 */
Symbol.prototype.mutate = function(mutator) {
	var me = this;

	// XXX: need to make sure the cached value exists before mutation
	// which frequently relies on modifying the cached value
	// really need to move away from this method
	this.value();

	this.definition = undefined;
	this.clearDependencies();
	this.clearObservees();

	mutator.apply(undefined, [this].concat(Array.prototype.slice.call(arguments, 1)));

	this.expire();
	this.up_to_date = true;
	setTimeout(function() { $(me).trigger('symbolMutate')});

	return this;
};

/**
 * Mark this symbol as out of date, and notify all formulas and observers of
 * this change
 */
Symbol.prototype.expire = function() {
	var me = this;
	this.up_to_date = false;

	$.each(this.subscribers, function(subscriber_name, subscriber) {
		if (subscriber !== undefined) {
			subscriber.expire();
		}
	});

	$.each(this.observers, function(observer_name, symbol) {
		setTimeout(function() { symbol.value()(me.context); });
	});
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

SymbolAccessor.prototype.assign = function(value) {
	var me = this;
	this.parent.mutate(function(symbol) {
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

var parser = require('./js/eden/parser').parser;

function translateEdenToJavaScript(source) {
	var in_definition = false;
	var dependencies = {};

	var original_input = source;

	parser.yy.extractEdenDefinition = function(first_line, first_column, last_line, last_column) {
		var definition_lines = original_input.split('\n').slice(first_line - 1, last_line);
		var definition = "";

		for (var i = 0; i < definition_lines.length; ++i) {
			var line = definition_lines[i];

			if (i === 0) {
				var start = first_column;
			} else {
				var start = 0;
			}

			if (i === definition_lines.length - 1) {
				var end = last_column;
			} else {
				var end = line.length;
			}

			definition += line.slice(start, end);

			if (i < definition_lines.length - 1) {
				definition += "\n";
			}
		}

		return definition;
	}
	
	parser.yy.enterDefinition = function() {
		dependencies = {};
		in_definition = true;
	};
	
	parser.yy.leaveDefinition = function() {
		in_definition = false;
	};
	
	parser.yy.inDefinition = function() {
		return in_definition;
	};
	
	parser.yy.addDependency = function(name) {
		dependencies[name] = 1;
	};
	
	parser.yy.getDependencies = function() {
		var dependency_list = [];
		for (p in dependencies) {
			dependency_list.push(p);
		}
		return dependency_list;
	};

	parser.yy.locals = [];
	parser.yy.paras = [];

    return parser.parse(source);
}

var readline = require('readline');
var lineNumber = 0;

var root = new Folder();

var pr = readline.createInterface(process.stdin, process.stdout, null);

pr.setPrompt(lineNumber + ' |> ');
pr.on('line', function(line) {
	lineNumber++;
	try {
		var js = translateEdenToJavaScript(line);
		try {
			console.log("generated:\n", js);
			console.log("\noutput:");
			eval(js);
		} catch (e) {
			console.log("run time error: ", e);
		}
	} catch (e) {
		console.log("compile error: ", e);
	}
	if (!pr.setPrompt) {
		console.log("WTF:", pr);
	}
	pr.setPrompt(lineNumber + ' |> ');
	pr.prompt();
});

pr.prompt();

eval(translateEdenToJavaScript([
	"func writeln { ${{",
	"  console.log(args.get(0).value())",
	"}}$; }"
].join("\n")));
