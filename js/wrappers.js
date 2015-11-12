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
	this.enabled = true;
	this.owned = false;
	this.oracles = [];
	this.handles = [];
	this.title = "Agent";

	Eden.Agent.agents[this.name] = this;
	Eden.Agent.triggerChange(this);

	var me = this;

	// Watch to trigger whens
	eden.root.addGlobal(function(sym, create) {
		if (me.ast && me.enabled) {
			var whens = me.ast.triggers[sym.name.slice(1)];
			if (whens) {
				//clearExecutedState();
				for (var i=0; i<whens.length; i++) {
					whens[i].execute(eden.root, undefined, me.ast);
				}
				//gutter.generate(this.ast,-1);
				//me.clearExecutedState();
			}
		}
	});
}

Eden.Agent.agents = {};

Eden.Agent.onChange = function(cb) {
	Eden.Agent.changecbs.push(cb);
}

Eden.Agent.changecbs = [];

Eden.Agent.triggerChange = function(agent) {
	for (var i=0; i<Eden.Agent.changecbs.length; i++) {
		Eden.Agent.changecbs[i](agent);
	}
}



Eden.Agent.prototype.clearExecutedState = function() {
	for (var i=0; i<this.ast.lines.length; i++) {
		if (this.ast.lines[i]) {
			if (this.ast.lines[i].executed > 0) {
				this.ast.lines[i].executed = 0;
			}
		}
	}
}



Eden.Agent.prototype.setTitle = function(title) {
	this.title = title;
	Eden.Agent.triggerChange(this);
}



Eden.Agent.prototype.setOwned = function(owned) {
	this.owned = owned;
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



Eden.Agent.prototype.hasErrors = function() {
	return this.ast.script.errors.length > 0;
}



/* Execute a particular line of script.
 * If the statement is part of a larger statement block then execute
 * that instead (eg. a proc).
 */
Eden.Agent.prototype.executeLine = function (lineno) {
	var line = lineno;
	// Make sure we are not in the middle of a proc or func.
	while ((line > 0) && (this.ast.lines[line] === undefined)) {
		line--;
	}

	var statement;
	if (lineno == -1) {
		statement = this.ast.script;
	} else {
		statement = this.ast.lines[line];
	}
	if (!statement) return;

	// Find root statement and execute that one
	while (statement.parent !== undefined && statement.parent.parent !== undefined) statement = statement.parent;

	// Execute only the currently changed root statement
	this.executeStatement(statement);
}



Eden.Agent.prototype.executeStatement = function(statement) {
	try {
		statement.execute(eden.root,undefined, this.ast);
	} catch (e) {
		eden.error(e);
	}
}



/**
 * Provide a source script as a string. This then generates an AST used to
 * create definitions, actions etc.
 */
Eden.Agent.prototype.setSource = function(source) {
	this.ast = new EdenAST(source);
}



Eden.Agent.prototype.getSource = function() {
	return this.ast.stream.code;
}



Eden.Agent.prototype.cleanUp = function() {
	for (var i=0; i<this.watches.length; i++) {
		eden.root.lookup(this.watches[i]).removeJSObserver(this.name);
	}
}

