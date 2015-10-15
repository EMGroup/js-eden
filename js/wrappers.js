/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

function makeRandomName()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 10; i++ )
	    text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

Eden.Agent = function(syms, scope) {
	this._name = makeRandomName();
	this._watches = [];
	this._scope = scope;

	if (scope === undefined) {
		this._scope = eden.root.scope;
	}

	for (var i=0; i<syms.length; i++) {
		var sym = eden.root.lookup(syms[i]);

		(function(sym, name) {
			Object.defineProperty(this, name, {
				get: function() { return sym.value(this._scope); },
				set: function(v) { sym.assign(v, this._scope, {name: this._name}); }
			});
		}).call(this, sym, syms[i]);
	}
}

Eden.Agent.prototype.setScope = function(scope) {
	this._scope = scope;
}

Eden.Agent.prototype.on = function(name, cb) {
	var me = this;
	this._watches.push(name);
	eden.root.lookup(name).addJSObserver(this._name, function(sym,value) {
		if (sym.last_modified_by != me._name) cb.call(me, sym.name.slice(1), value);
	});
}

Eden.Agent.prototype.cleanUp = function() {
	for (var i=0; i<this._watches.length; i++) {
		eden.root.lookup(this._watches[i]).removeJSObserver(this._name);
	}
}

