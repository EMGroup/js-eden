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

Eden.Agent = function(syms) {
	this.name = makeRandomName();

	for (var i=0; i<syms.length; i++) {
		var sym = eden.root.lookup(syms[i]);

		(function(sym, name) {
			Object.defineProperties(this, name, {
				get: function() { return sym.value(); },
				set: function(v) { sym.assign(v, eden.root.scope, this); }
			});
		}).call(this, sym, syms[i]);
	}
}

Eden.Agent.prototype.on = function(name, cb) {
	var me = this;
	eden.root.lookup(name).addJSObserver(this.name, function(sym,value) {
		if (sym.last_modified_by != me.name) cb(sym,value);
	});
}

Eden.Agent.prototype.cleanUp = function() {

}

