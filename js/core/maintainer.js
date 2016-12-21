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
	global.InternalAgent = InternalAgent;
	
	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Folder = Folder;
		exports.Symbol = Symbol;
		exports.Scope = Scope;
		exports.ScopeOverride = ScopeOverride;
		exports.edenCopy = copy;
		exports.InternalAgent = InternalAgent;
	}
}(typeof window !== 'undefined' ? window : global));
