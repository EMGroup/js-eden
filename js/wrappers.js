/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Used to generate a random agent name if no name is given.
 */
function makeRandomName()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 10; i++ )
	    text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}



Eden.Agent = function(parent, name) {
	this.name = undefined;
	if (name === undefined) {
		this.name = makeRandomName();
	} else {
		this.name = name;
	}

	this.watches = [];
	this.scope = eden.root.scope;
	this.ast = undefined;
	this.state = {};
}



Eden.Agent.prototype.setReadonly = function(ro) {
	this.oracles.push.apply(this.oracles, ro);

	for (var i=0; i<ro.length; i++) {
		var sym = eden.root.lookup(ro[i]);

		(function(sym, name) {
			var me = this;
			Object.defineProperty(this.state, name, {
				get: function() { return sym.value(me.parent.scope); },
				set: function(v) { sym.assign(v, me.scope, me); }
			});
		}).call(this, sym, ro[i]);
	}
}



Eden.Agent.prototype.setWriteonly = function(wo) {
	this.handles.push.apply(this.handles, wo);

	for (var i=0; i<wo.length; i++) {
		var sym = eden.root.lookup(wo[i]);

		(function(sym, name) {
			var me = this;
			Object.defineProperty(this.state, name, {
				get: function() { return sym.value(me.scope); },
				set: function(v) { sym.assign(v, me.parent.scope, me); }
			});
		}).call(this, sym, wo[i]);
	}
}



Eden.Agent.prototype.setReadWrite = function(rw) {
	this.oracles.push.apply(this.oracles, rw);
	this.handles.push.apply(this.handles, rw);

	for (var i=0; i<rw.length; i++) {
		var sym = eden.root.lookup(rw[i]);

		(function(sym, name) {
			var me = this;
			Object.defineProperty(this.state, name, {
				get: function() { return sym.value(me.parent.scope); },
				set: function(v) { sym.assign(v, me.parent.scope, me); }
			});
		}).call(this, sym, rw[i]);
	}
}



Eden.Agent.prototype.declare = function(name) {
	var sym = eden.root.lookup(name);
	var me = this;

	Object.defineProperty(this.state, name, {
		get: function() { return sym.value(me.scope); },
		set: function(v) { sym.assign(v, me.scope, me); }
	});
}



Eden.Agent.prototype.derivative = function(name, deps) {
	var sym = eden.root.lookup(name);
	var me = this;
	sym.define(function(context, scope) {
		me.ast.definitions[name].evaluate(context, scope);
	}, deps, this);
}



/**
 * Get all current definitions provided by this agent.
 */
Eden.Agent.prototype.definitions = function() {
	return this.ast.definitions;
}



/**
 * Get all named actions provided by this agent.
 */
Eden.Agent.prototype.actions = function() {
	return this.ast.scripts;
}



Eden.Agent.prototype.setScope = function(scope) {
	this.scope = scope;
}



/**
 * Add a trigger on one or more observables.
 */
Eden.Agent.prototype.on = function(name, cb) {
	var me = this;
	this.watches.push(name);
	eden.root.lookup(name).addJSObserver(this.name, function(sym,value) {
		if (sym.last_modified_by != me.name) cb.call(me, sym.name.slice(1), value);
	});
}

Eden.Agent.prototype.when = function(triggers, condition, action) {
	
}



/**
 * Provide a source script as a string. This then generates an AST used to
 * create definitions, actions etc.
 */
Eden.Agent.prototype.setSource = function(source) {
	this.ast = new EdenAST(source);
}



Eden.Agent.prototype.cleanUp = function() {
	for (var i=0; i<this.watches.length; i++) {
		eden.root.lookup(this.watches[i]).removeJSObserver(this.name);
	}
}

