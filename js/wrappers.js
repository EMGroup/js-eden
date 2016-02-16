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

	if (meta === undefined) {
		console.error("Meta undefined for " + name);
		meta = Eden.DB.createMeta(name);
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
	this.history = JSON.parse(edenUI.getOptionValue('agent_'+this.name+'_history')) || {};

	if (meta && this.history[meta.saveID] === undefined) {
		this.history[meta.saveID] = [];
	}

	this.index = -1; //JSON.parse(edenUI.getOptionValue('agent_'+this.name+'_index')) || 0;
	this.snapshot = ""; //edenUI.getOptionValue('agent_'+this.name+'_snap') || "";
	this.autosavetimer = undefined;
	this.executed = false;
	this.options = options;

	if (this.snapshot) {
		//this.setSource(this.snapshot);
	} else {
		//this.setSource("");
	}

	this.setOptions(options);

	this.dmp = new diff_match_patch();

	Eden.Agent.agents[this.name] = this;
	Eden.Agent.emit("create", [this]);
	Eden.DB.updateDirectory(this.name);

	var me = this;

	// Watch to trigger whens
	eden.root.addGlobal(function(sym, create) {
		if (me.ast && me.executed && me.ast.script.errors.length == 0) {
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



/**
 * Import an agent script from some source. This is a vitally important function
 * that attempts to find a named agent either locally or on one or more
 * repository servers and activate it.

 * If the agent is already loaded then, by default, this function does nothing
 *     except call the callback function.
 *
 * If not loaded then it searches for a version hosted in a repository.
 *
 * If a remote version is found it is loaded, local changes are kept available
 *     but are not applied automatically, meaning the agent loaded is the one
 *     on the server.
 *
 * If no remote version exists then it attempts to load a local version.
 *
 * If no local version exists either then it either returns undefined or, if
 *     the "create" option is given it will create a new empty agent with that
 *     name.
 *
 * Other options allow you to force particular versions:
 *     - rebase: gets the remote version but automatically applies all local
 *               changes in the local history for that version.
 *     - reload: Even if already loaded, go get a new version from the server.
 *
 * When first imported using the "import" script command the agents are also
 * executed. Importing by other means forces this not to be the case, however,
 * there are also options to control this:
 *     - force: Always execute, even if previously executed.
 *     - noexec: Do not execute.
 */
Eden.Agent.importAgent = function(path, tag, options, callback) {
	var ag;
	if (callback === undefined) {
		console.trace("DEPRECATED USE OF IMPORT");
		return;
	}

	console.log("Importing: " + path + "@" + tag);

	if (tag === undefined || tag == "") tag = "default";

	function finish(success, msg) {
		// There is an agent
		if (ag) {
			// But something went wrong loading its source
			if (!success) {
				callback(undefined, msg);
				return;
			}

			// Errors on load?
			if (ag.ast && ag.ast.script.errors.length > 0) {
				console.error(ag.ast.script.errors[0].prettyPrint());
			}
			// Does it need executing?
			if (options === undefined || options.indexOf("noexec") == -1) {
				ag.execute((options && options.indexOf("force") >= 0), true);
			}
		// There is no existing agent but create it
		} else if (options && options.indexOf("create") >= 0) {
			// Auto create agents that don't exist
			ag = new Eden.Agent(undefined, path, Eden.DB.createMeta(path), options);
			if (tag != "default") ag.meta.tag = tag;
			//Add this to local meta store
			Eden.DB.addLocalMeta(path, ag.meta);
		// There is no existing agent and we are not to create it.
		} else if (!success) {
			callback(undefined, msg);
			return;
		}

		if (callback) callback(ag);
	}

	// Does it already exist
	if (Eden.Agent.agents[path] !== undefined) {
		var ag = Eden.Agent.agents[path];
		ag.setOptions(options);

		// Force a reload? Explicit or by change of tag
		if ((ag.meta && ag.meta.tag != tag && tag != "default") || (options && options.indexOf("reload") >= 0)) {
			ag.meta.tag = tag;
			//console.log("Tag change reload!");
			ag.loadSource(finish);
		} else {
			finish(true);
		}
		return;
	}

	// Ask database for info about this agent
	Eden.DB.getMeta(path, function(path, meta) {
		//console.log(meta);
		// It exists in the database
		if (meta) {	
			//console.log(meta);
			meta.tag = tag;
			ag = new Eden.Agent(undefined, path, meta, options);

			// Get from server or use local?
			if (meta.file || meta.remote) {
				ag.loadSource(finish);
				return;
			} else {
				//console.log("FOUND LOCAL " + path);
				meta.saveID = "origin";
				ag.setSnapshot("");
				ag.setSource("");
				// Auto rebase local only agents
				while (ag.canRedo()) ag.redo();
				finish(true);
				return;
			}
		}
		finish(false, "No agent");
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



Eden.Agent.remove = function(agent) {
	if (agent === undefined) return;
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
		this.options = options;

		if (options.indexOf("remote") >= 0) this.clearHistory();
		if (options.indexOf("readonly") >= 0) this.owned = true;
	} else {
		//this.index = -1;
	}
}



Eden.Agent.prototype.setSnapshot = function(source) {
	this.snapshot = source;
	//if (this.history.length > 0) {
	//	edenUI.setOptionValue('agent_'+this.name+'_snap', source);
	//}
}



Eden.Agent.prototype.saveHistory = function() {
	//if (this.history.length > 0) {
		edenUI.setOptionValue('agent_'+this.name+'_history', JSON.stringify(this.history));
	//}
}



Eden.Agent.prototype.clearFuture = function() {
	// Discard any future
	if (this.history[this.meta.saveID].length-1 != this.index) {
		this.history[this.meta.saveID] = this.history[this.meta.saveID].slice(0, this.index+1);
	}
}



Eden.Agent.prototype.addHistory = function(redo, undo) {
	if (this.meta === undefined) {
		console.error("Cannot save history of metaless agent");
		return;
	}

	// Discard any future
	this.clearFuture();

	this.history[this.meta.saveID].push({time: Date.now() / 1000 | 0, redo: redo, undo: undo});
	this.index = this.history[this.meta.saveID].length - 1;
	this.saveHistory();
}



Eden.Agent.prototype.clearHistory = function() {
	if (this.meta === undefined) {
		console.error("Cannot clear history of metaless agent");
		return;
	}

	this.history[this.meta.saveID] = [];
	this.index = -1;
	this.saveHistory();
}



/**
 * Move agent back to a specific point in history.
 */
Eden.Agent.prototype.rollback = function(index) {
	var snap = this.generateSnapshot(index);
	//console.log("Rollback: " + snap);

	this.index = index;
	this.setSnapshot(snap);
	this.setSource(snap);

	Eden.Agent.emit("rollback", [this]);
}



/**
 * Generate a history snapshot.
 */
Eden.Agent.prototype.generateSnapshot = function(index) {
	if (index >= 0 && this.history[this.meta.saveID][index].snapshot) return this.history[this.meta.saveID][index].snapshot;

	// TODO find nearest existing snapshot and use that...

	var undodmp = new diff_match_patch();
	var snap = this.snapshot;

	var i = this.index;

	if (i > index) {
		while (i > index) {
			var hist = this.history[this.meta.saveID][i];
			i--;
			var p = undodmp.patch_fromText(hist.undo);
			var r = undodmp.patch_apply(p, snap);
			snap = r[0];
		}
	} else {
		while (i < index) {
			i++;
			var hist = this.history[this.meta.saveID][i];
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
	if (this.history[this.meta.saveID][index].snapshot) return;
	var snap = this.generateSnapshot(index);
	this.history[this.meta.saveID][index].snapshot = snap;
	this.saveHistory();
}



Eden.Agent.prototype.undo = function() {
	if (this.index < 0) return;
	if (this.history[this.meta.saveID].length == 0) return;

	var hist = this.history[this.meta.saveID][this.index];
	this.index--;

	var snap;

	if (this.index >= 0 && this.history[this.meta.saveID][this.index].snapshot) {
		snap = this.history[this.meta.saveID][this.index].snapshot;
	} else {
		var undodmp = new diff_match_patch();
		var p = undodmp.patch_fromText(hist.undo);
		var r = undodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.setSnapshot(snap);
	this.setSource(snap);
}



Eden.Agent.prototype.canUndo = function() {
	if (this.meta === undefined) return false;
	return this.history[this.meta.saveID].length > 0 && this.index >= 0;
}

Eden.Agent.prototype.canRedo = function() {
	if (this.meta === undefined) return false;
	return this.index < this.history[this.meta.saveID].length-1;
}



Eden.Agent.prototype.redo = function() {
	if (this.index >= this.history.length-1) return;

	this.index++;
	var hist = this.history[this.meta.saveID][this.index];
	var snap;

	if (hist.snapshot) {
		snap = hist.snapshot;
	} else {
		var redodmp = new diff_match_patch();
		var p = redodmp.patch_fromText(hist.redo);
		var r = redodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.setSnapshot(snap);
	this.setSource(snap);
}



Eden.Agent.prototype.changeVersion = function(tag, callback) {
	Eden.Agent.importAgent(this.name, tag, this.options, callback);
}



Eden.Agent.prototype.findDefinitionLine = function(source) {
	if (this.ast) {
		for (var i=0; i<this.ast.lines.length; i++) {
			if (this.ast.lines[i] && (this.ast.getSource(this.ast.lines[i]) == source)) {
				return i;
			}
		}
	}
	return -1;
}



Eden.Agent.prototype.loadSource = function(callback) {
	var me = this;
	this.executed = false;

	//console.log("Attempt to load source for " + me.name);

	Eden.DB.getSource(me.name, me.meta.tag, function(data, msg) {
		if (data || data == "") {
			//console.log("Source loaded: " + me.name);
			// Make sure we have a local history for this
			if (me.history[me.meta.saveID] === undefined) {
				me.history[me.meta.saveID] = [];
			}

			// Reset undo history to beginning.
			me.index = -1;
			me.setSnapshot(data);
		
			// Do we need to do an automatic fast-forward?
			if (me.options && me.options.indexOf("rebase") >= 0) {
				while (me.canRedo()) me.redo();
			}

			me.setSource(me.snapshot);
			if (callback) callback(true);
			Eden.Agent.emit("loaded", [me]);
		} else {
			if (callback) callback(false, msg);
			else console.error("AGENT ERROR: " + me.name + " - " + msg);
		}
	}, "text");
}



Eden.Agent.prototype.clearExecutedState = function() {
	this.ast.clearExecutedState();
}



Eden.Agent.prototype.setTitle = function(title) {
	this.title = title;
	this.meta.title = title;
	Eden.Agent.emit("title", [this]);
}



Eden.Agent.prototype.setOwned = function(owned, cause) {
	this.owned = owned;
	Eden.Agent.emit("owned", [this,cause]);
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
	return this.ast && this.ast.script.errors.length > 0;
}



/* Execute a particular line of script.
 * If the statement is part of a larger statement block then execute
 * that instead (eg. a proc).
 */
Eden.Agent.prototype.executeLine = function (lineno, auto) {
	this.ast.executeLine(lineno, this);

	if (!auto) {
		Eden.Agent.emit('executeline', [this, lineno]);
	}
}



Eden.Agent.prototype.execute = function(force, auto) {
	if (this.executed == false || force) {
		this.executeLine(-1, auto);
		this.executed = true;

		if (!auto) {
			Eden.Agent.emit('execute', [this, force]);
		}
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



Eden.Agent.prototype.upload = function(tagname, ispublic) {
	var me = this;
	if (this.ast) {
		Eden.DB.upload(this.name, this.meta, this.ast.stream.code, tagname, ispublic, function() {
			if (me.history[me.meta.saveID] === undefined) {
				me.history[me.meta.saveID] = [];
			}
		});
	}
}



Eden.Agent.prototype.applyPatch = function(patch, lineno) {
	var redodmp = new diff_match_patch();
	var p = redodmp.patch_fromText(patch);
	var r = redodmp.patch_apply(p, this.snapshot);
	var snap = r[0];	

	//this.saveHistoryIndex();
	this.clearFuture();
	this.setSnapshot(snap);
	this.setSource(snap,true);

	Eden.Agent.emit("patched", [this, patch, lineno]);
}



/**
 * Provide a source script as a string. This then generates an AST used to
 * create definitions, actions etc.
 */
Eden.Agent.prototype.setSource = function(source, net, lineno) {
	var waserrored = this.hasErrors();
	var haschanged = false;

	if (this.ast) {
		if (!net) {
			var me = this;
			clearTimeout(this.autosavetimer);
			this.autosavetimer = setTimeout(function() { me.autoSave(); }, Eden.Agent.AUTOSAVE_INTERVAL);

			// TODO Only generate patch if there are listeners
			var d = this.dmp.diff_main(this.ast.stream.code, source, false);
			var p = this.dmp.patch_make(this.ast.stream.code, source, d);
			var t = this.dmp.patch_toText(p);

			if (t != "") {
				haschanged = true;
				Eden.Agent.emit("patch", [this, t, lineno]);
			}
		}
	} else {
		this.setSnapshot(source);

		if (!net) {
			haschanged = true;
			Eden.Agent.emit("source", [this, source]);
		}
	}

	if (this.ast) {
		this.ast = new Eden.AST(source, this.ast.imports);
	} else {
		this.ast = new Eden.AST(source);
	}

	if (this.hasErrors() && !waserrored) {
		Eden.Agent.emit("error", [this]);
	} else if (!this.hasErrors() && waserrored) {
		Eden.Agent.emit("fixed", [this]);
	}

	if (haschanged) {
		Eden.Agent.emit("changed", [this, source, lineno]);
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

