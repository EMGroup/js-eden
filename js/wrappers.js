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



Eden.Agent = function(parent, name, meta, options) {
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
	this.enabled = (meta && meta.enabled !== undefined) ? meta.enabled : false;
	this.owned = false;
	this.oracles = [];
	this.handles = [];
	this.meta = meta;
	this.title = (meta && meta.title) ? meta.title : "Agent";
	this.history = JSON.parse(edenUI.getOptionValue('agent_'+this.name+'_history')) || [];
	this.index = JSON.parse(edenUI.getOptionValue('agent_'+this.name+'_index')) || 0;
	this.snapshot = edenUI.getOptionValue('agent_'+this.name+'_snap') || "";
	this.autosavetimer = undefined;
	this.executed = false;

	this.setOptions(options);

	if (this.snapshot) {
		this.setSource(this.snapshot);
	} else {
		this.setSource("");
	}

	this.dmp = new diff_match_patch();

	Eden.Agent.agents[this.name] = this;
	Eden.Agent.emit("create", [this]);
	Eden.DB.updateDirectory(this.name);

	var me = this;

	// Watch to trigger whens
	eden.root.addGlobal(function(sym, create) {
		if (me.ast && me.executed) {
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

Eden.Agent.agents = {};		// Imported agents

Eden.Agent.listeners = {};
Eden.Agent.emit = emit;
Eden.Agent.listenTo = listenTo;

Eden.Agent.unlisten = function(target) {
	for (var e in Eden.Agent.listeners) {
		for (var i=0; i<Eden.Agent.listeners[e].length; i++) {
			if (Eden.Agent.listeners[e][i].target === target) {
				Eden.Agent.listeners[e].splice(i,1);
			}
		}
	}
}

Eden.Agent.AUTOSAVE_INTERVAL = 2000;




Eden.Agent.importAgent = function(path, options, callback) {
	//console.log("IMPORT: " + path + " options = " + JSON.stringify(options));
	//if (Eden.Agent.db === undefined) return;

	if (Eden.Agent.agents[path] !== undefined) {
		var ag = Eden.Agent.agents[path];
		ag.setOptions(options);
		if (options && options.indexOf("noexec") == -1) {
			ag.execute();
			console.log("Import execute: " + ag.name);
		}
		if (callback) callback(ag);
		return;
	}

	var ag;

	function finish() {
		if (ag) {
			if (options && options.indexOf("noexec") == -1) {
				ag.execute();
				console.log("Import execute: " + ag.name);
			}
		}
		if (callback) callback(ag);
	}

	Eden.DB.getMeta(path, function(path, meta) {
		if (meta) {			
			ag = new Eden.Agent(undefined, path, meta, options);
			if (((options && options.indexOf("remote") >= 0)
					|| (options === undefined || (options && options.indexOf("local") == -1) && !Eden.Agent.hasLocalModifications(path)))
					&& meta.file) {
				ag.loadFromFile(meta.file, finish);
				return;
			}
			//if (callback) callback(ag);
		}
		finish();
	});
}



Eden.Agent.hasLocalModifications = function(name) {
	try {
		if (window.localStorage) {
			var ix = JSON.parse(window.localStorage.getItem('agent_'+name+'_index'));
			if (ix === null) return false;
			if (ix >= 0) return true;
			return false;
		}
	} catch (e) {
		return false;
	}
}



/*Eden.Agent.save = function() {
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
}*/



Eden.Agent.remove = function(agent) {
	Eden.Agent.agents[agent.name] = undefined;

	var previousAgent;
	for (var a in Eden.Agent.agents) {
		if (a == agent.name) break;
		previousAgent = a;
	}

	delete Eden.Agent.agents[agent.name];
	Eden.Agent.emit("remove", [agent.name, previousAgent]);
	// TODO Do cleanup here.
	agent.enabled = false;
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
	//console.log(redo);

	// Calculate undo diff
	d = savedmp.diff_main(this.ast.stream.code, this.snapshot, false);
	p = savedmp.patch_make(this.ast.stream.code, this.snapshot, d);
	var undo = savedmp.patch_toText(p);
	//console.log(undo);

	if (undo == "") return;

	// Save history and set last snapshot
	this.addHistory(redo,undo);
	this.setSnapshot(this.ast.stream.code);

	this.autosavetimer = undefined;

	Eden.Agent.emit("autosave", [this]);
}



Eden.Agent.prototype.setOptions = function(options) {
	if (options) {
		if (options.indexOf("disabled") >= 0) this.setEnabled(false);
		if (options.indexOf("enabled") >= 0) this.setEnabled(true);
		if (options.indexOf("readonly") >= 0) this.owned = true;
	}
}



Eden.Agent.prototype.setSnapshot = function(source) {
	this.snapshot = source;
	if (this.history.length > 0) {
		edenUI.setOptionValue('agent_'+this.name+'_snap', source);
	}
}



Eden.Agent.prototype.setEnabled = function(enabled) {
	if (this.enabled != enabled) {
		this.enabled = enabled;
		Eden.DB.updateMeta(this.name, "enabled", enabled);
		//edenUI.setOptionValue('agent_'+this.name+'_enabled', JSON.stringify(this.enabled));
	}	
}



Eden.Agent.prototype.saveHistory = function() {
	if (this.history.length > 0) {
		edenUI.setOptionValue('agent_'+this.name+'_history', JSON.stringify(this.history));
	}
}



Eden.Agent.prototype.saveHistoryIndex = function() {
	if (this.index >= 0) {
		edenUI.setOptionValue('agent_'+this.name+'_index', JSON.stringify(this.index));
	}
}



Eden.Agent.prototype.addHistory = function(redo, undo) {
	// Discard any future
	if (this.history.length-1 != this.index) {
		this.history = this.history.slice(0, this.index+1);
	}

	this.history.push({time: Date.now() / 1000 | 0, redo: redo, undo: undo});
	this.index = this.history.length - 1;
	this.saveHistory();
	this.saveHistoryIndex();
}



Eden.Agent.prototype.clearHistory = function() {
	this.history = [];
	this.index = this.history.length - 1;
	this.saveHistory();
	this.saveHistoryIndex();
}



/**
 * Move agent back to a specific point in history.
 */
Eden.Agent.prototype.rollback = function(index) {
	var snap = this.generateSnapshot(index);
	//console.log("Rollback: " + snap);

	this.index = index;
	this.saveHistoryIndex();
	
	this.setSnapshot(snap);
	this.setSource(snap);

	Eden.Agent.emit("rollback", [this]);
}



/**
 * Generate a history snapshot.
 */
Eden.Agent.prototype.generateSnapshot = function(index) {
	if (index >= 0 && this.history[index].snapshot) return this.history[index].snapshot;

	// TODO find nearest existing snapshot and use that...

	var undodmp = new diff_match_patch();
	var snap = this.snapshot;

	var i = this.index;

	if (i > index) {
		while (i > index) {
			var hist = this.history[i];
			i--;
			var p = undodmp.patch_fromText(hist.undo);
			var r = undodmp.patch_apply(p, snap);
			snap = r[0];
		}
	} else {
		while (i < index) {
			i++;
			var hist = this.history[i];
			var p = undodmp.patch_fromText(hist.redo);
			var r = undodmp.patch_apply(p, snap);
			snap = r[0];
		}
	}

	return snap;
}



/**
 * Make a particular history index a snapshot point.
 */
Eden.Agent.prototype.makeSnapshot = function(index) {
	if (this.history[index].snapshot) return;
	var snap = this.generateSnapshot(index);
	this.history[index].snapshot = snap;
	this.saveHistory();
}



Eden.Agent.prototype.undo = function() {
	if (this.index < 0) return;
	if (this.history.length == 0) return;

	var hist = this.history[this.index];
	this.index--;

	var snap;

	if (this.index >= 0 && this.history[this.index].snapshot) {
		snap = this.history[this.index].snapshot;
	} else {
		var undodmp = new diff_match_patch();
		var p = undodmp.patch_fromText(hist.undo);
		var r = undodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.saveHistoryIndex();
	this.setSnapshot(snap);
	this.setSource(snap);
}



Eden.Agent.prototype.canUndo = function() {
	return this.history.length > 0 && this.index >= 0;
}

Eden.Agent.prototype.canRedo = function() {
	return this.index < this.history.length-1;
}



Eden.Agent.prototype.redo = function() {
	if (this.index >= this.history.length-1) return;

	this.index++;
	var hist = this.history[this.index];
	var snap;

	if (hist.snapshot) {
		snap = hist.snapshot;
	} else {
		var redodmp = new diff_match_patch();
		var p = redodmp.patch_fromText(hist.redo);
		var r = redodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.saveHistoryIndex();
	this.setSnapshot(snap);
	this.setSource(snap);
}



Eden.Agent.prototype.loadFromFile = function(filename, callback) {
	var me = this;
	this.executed = false;

	$.get(filename, function(data) {
		me.setSnapshot(data);
		me.clearHistory();
		me.setSource(data);
		if (callback) callback();
		Eden.Agent.emit("loaded", [me]);
	}, "text");
}



Eden.Agent.prototype.clearExecutedState = function() {
	this.ast.clearExecutedState();
}



Eden.Agent.prototype.setTitle = function(title) {
	this.title = title;
	Eden.DB.updateMeta(this.name, "title", title);
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
		//if (sym.last_modified_by != me.name)
		cb.call(me, sym.name.slice(1), value);
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
	this.ast.executeLine(lineno);
	Eden.Agent.emit('executeline', [this, undefined, lineno]);
}



Eden.Agent.prototype.execute = function(force) {
	if (this.executed == false || force) {
		this.executeLine(-1);
		this.executed = true;
		Eden.Agent.emit('execute', [this]);
	}
}



/*Eden.Agent.prototype.executeStatement = function(statement, line) {
	try {
		statement.execute(eden.root,undefined, this.ast);
		var code = this.ast.getSource(statement);
		//console.log("PATCH line = " + line + " code = "+code);
		Eden.Agent.emit('execute', [this, code, line]);
	} catch (e) {
		eden.error(e);
		throw e;
	}
}*/



/**
 * Provide a source script as a string. This then generates an AST used to
 * create definitions, actions etc.
 */
Eden.Agent.prototype.setSource = function(source) {

	if (this.ast) {
		var me = this;
		clearTimeout(this.autosavetimer);
		this.autosavetimer = setTimeout(function() { me.autoSave(); }, Eden.Agent.AUTOSAVE_INTERVAL);

		//console.time("MakePATCH");
		var d = this.dmp.diff_main(this.ast.stream.code, source, false);
		var p = this.dmp.patch_make(this.ast.stream.code, source, d);
		var t = this.dmp.patch_toText(p);
		//console.timeEnd("MakePATCH");
		//console.log(t);
	} else {
		this.setSnapshot(source);
	}

	var gettitle = this.ast === undefined;
	if (this.ast) {
		this.ast = new Eden.AST(source, this.ast.imports);
	} else {
		this.ast = new Eden.AST(source);
	}

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

