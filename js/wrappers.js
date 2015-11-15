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
	this.history = JSON.parse(edenUI.getOptionValue('agent_'+this.name+'_history')) || [];
	this.index = this.history.length - 1;
	this.snapshot = edenUI.getOptionValue('agent_'+this.name+'_snap') || "";
	this.autosavetimer = undefined;

	this.dmp = new diff_match_patch();

	Eden.Agent.agents[this.name] = this;
	Eden.Agent.emit("create", [this]);

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

Eden.Agent.listeners = {};
Eden.Agent.emit = emit;
Eden.Agent.listenTo = listenTo;

Eden.Agent.AUTOSAVE_INTERVAL = 2000;


Eden.Agent.save = function() {
	// Save list of agents to restore later.
	var agents = [];
	for (var a in Eden.Agent.agents) {
		agents.push({name: a, enabled: Eden.Agent.agents[a].enabled});
	}
	edenUI.setOptionValue("agents", JSON.stringify(agents));
}


Eden.Agent.restore = function() {
	var ag = JSON.parse(edenUI.getOptionValue('agents'));

	if (ag) {
		for (var i=0; i<ag.length; i++) {
			if (Eden.Agent.agents[ag[i].name] === undefined) {
				var agi = new Eden.Agent(undefined, ag[i].name);
				agi.enabled = ag[i].enabled;
				agi.setSource(agi.snapshot);

				if (agi.enabled) {
					agi.executeLine(-1);
				}
			}
		}
	}
}



Eden.Agent.prototype.isSaved = function() {
	return this.autosavetimer === undefined;
}



Eden.Agent.prototype.autoSave = function() {
	if (this.ast === undefined || this.ast.script.errors.length > 0) {
		return;
	}
	var savedmp = new diff_match_patch();

	// Calculate redo diff
	var d = savedmp.diff_main(this.snapshot, this.ast.stream.code, false);
	var p = savedmp.patch_make(this.snapshot, this.ast.stream.code, d);
	var redo = savedmp.patch_toText(p);
	console.log(redo);

	// Calculate undo diff
	d = savedmp.diff_main(this.ast.stream.code, this.snapshot, false);
	p = savedmp.patch_make(this.ast.stream.code, this.snapshot, d);
	var undo = savedmp.patch_toText(p);
	console.log(undo);

	if (undo == "") return;

	// Save history and set last snapshot
	this.addHistory(redo,undo);
	this.setSnapshot(this.ast.stream.code);

	this.autosavetimer = undefined;

	Eden.Agent.emit("autosave", [this]);
}



Eden.Agent.prototype.setSnapshot = function(source) {
	this.snapshot = source;
	edenUI.setOptionValue('agent_'+this.name+'_snap', source);
}



Eden.Agent.prototype.addHistory = function(redo, undo) {
	// Discard any future
	if (this.history.length-1 != this.index) {
		this.history = this.history.slice(0, this.index);
	}

	this.history.push({redo: redo, undo: undo});
	this.index = this.history.length - 1;
	edenUI.setOptionValue('agent_'+this.name+'_history', JSON.stringify(this.history));
}



Eden.Agent.prototype.clearHistory = function() {
	this.history = [];
	this.index = this.history.length - 1;
	edenUI.setOptionValue('agent_'+this.name+'_history', JSON.stringify(this.history));
}



Eden.Agent.prototype.undo = function() {
	if (this.index < 0) return;

	var hist = this.history[this.index];
	this.index--;

	var undodmp = new diff_match_patch();
	var p = undodmp.patch_fromText(hist.undo);
	var r = undodmp.patch_apply(p, this.snapshot);

	this.setSnapshot(r[0]);
	this.setSource(r[0]);
}



Eden.Agent.prototype.canUndo = function() {
	return this.index >= 0;
}

Eden.Agent.prototype.canRedo = function() {
	return this.index < this.history.length-1;
}



Eden.Agent.prototype.redo = function() {
	if (this.index >= this.history.length-1) return;

	this.index++;
	var hist = this.history[this.index];

	var redodmp = new diff_match_patch();
	var p = redodmp.patch_fromText(hist.redo);
	var r = redodmp.patch_apply(p, this.snapshot);

	this.setSnapshot(r[0]);
	this.setSource(r[0]);
}



Eden.Agent.prototype.loadFromFile = function(filename, execute) {
	var me = this;
	var doexecute = execute;

	if (execute === undefined) doexecute = true;
	if (!doexecute) this.enabled = false;

	$.get(filename, function(data) {
		me.setSnapshot(data);
		me.clearHistory();
		me.setSource(data);
		if (doexecute) me.executeLine(-1);
		Eden.Agent.emit("loaded", [me]);
	});
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
	Eden.Agent.emit("title", [this]);
}



Eden.Agent.prototype.setOwned = function(owned, cause) {
	this.owned = owned;
	Eden.Agent.emit("owned", [this,cause]);
}



Eden.Agent.prototype.patchSource = function(line, patch) {
	
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
	this.executeStatement(statement, line);
}



Eden.Agent.prototype.executeStatement = function(statement, line) {
	try {
		statement.execute(eden.root,undefined, this.ast);
		var code = this.ast.getSource(statement);
		console.log("PATCH line = " + line + " code = "+code);
		Eden.Agent.emit('execute', [this, code, line]);
	} catch (e) {
		eden.error(e);
	}
}



/**
 * Provide a source script as a string. This then generates an AST used to
 * create definitions, actions etc.
 */
Eden.Agent.prototype.setSource = function(source) {

	if (this.ast) {
		var me = this;
		clearTimeout(this.autosavetimer);
		this.autosavetimer = setTimeout(function() { me.autoSave(); }, Eden.Agent.AUTOSAVE_INTERVAL);

		console.time("MakePATCH");
		var d = this.dmp.diff_main(this.ast.stream.code, source, false);
		var p = this.dmp.patch_make(this.ast.stream.code, source, d);
		var t = this.dmp.patch_toText(p);
		console.timeEnd("MakePATCH");
		console.log(t);
	} else {
		this.setSnapshot(source);
	}

	var gettitle = this.ast === undefined;
	this.ast = new EdenAST(source);

	if (gettitle) {
		if (this.ast.stream.code.charAt(0) == "#") {
			this.setTitle(this.ast.stream.code.split("\n")[0].substr(2));
		}
	}
}



Eden.Agent.prototype.getSource = function() {
	if (this.ast) {
		return this.ast.stream.code;
	} else {
		return "";
	}
}



Eden.Agent.prototype.cleanUp = function() {
	for (var i=0; i<this.watches.length; i++) {
		eden.root.lookup(this.watches[i]).removeJSObserver(this.name);
	}
}

