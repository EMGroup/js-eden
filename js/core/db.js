/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function (global) {

	function ValueEntry (name) {
		this.name = name;
		this.value = undefined;
		this.origin_scope = 0;			// Scope of the entry
		this.value_scope = 0;			// Scope of the formula/value.
		this.expired = false;
		this.dependants = [];			// List of value entries dependant on this
		this.formula = undefined;		// Formula entry defining this value
		this.overrides = undefined;		// List of scopes with overrides of this
		this.events = undefined;		// Set of handlers for different event types.
	}

	function FormulaEntry() {
		this.formula = undefined;
		this.origin_scope = 0;
		this.dependencies = [];
	}

	function DBScope(parent) {
		this.parent = parent;
		this.events = undefined;		// Set of handlers for different event types.
	}

	var values = {};
	var formulas = {};
	var scopes = [];
	var observables = {};
	var agents = {};
	var agentrate = 15;
	var todoAgents = {};
	var todoTimeout = undefined;
	var globalevents = {events: {
		newscope: [],
		newobservable: [],
		setvalue: [],
		setformula: []
	}};
	var todoqueue = [];

	var Database = {};



	/**
	 * Fire any waiting agents and make sure the database is synchronised after
	 * they have finished. This is called by a timeout.
	 */
	function processEvents() {
		var todos = todoAgents;
		todoAgents = {};
		todoTimeout = undefined;

		for (var a in todos) {
			console.log("Agent Trigger: " + a);
			var gen = agents[a].apply(this, todos[a]);
			runAgent(gen);

			// An agent may cause changes that need synching.
			if (todoqueue.length > 0) {
				Database.sync();
			}
		}
	}



	/**
	 * Process the agent generator, adding delays as required. Agents may use
	 * "yield [time]" to pause. yield 0 causes a sync, yield < 0 is a return
	 * and yield > 0 will delay by that number of milliseconds.
	 */
	function runAgent(agent) {
		if (agent === undefined) return;
		var delay = agent.next();
		if (delay == 0) {
			Database.sync();
			runAgent(agent);
		} else if (delay > 0) {
			Database.sync();
			setTimeout(function() {runAgent(agent)}, delay);
		}
	}



	/**
	 * Mark all agents listening to this event as being in need of firing. The
	 * actual firing of the agent code is done later at sync.
	 */
	function trigger(event) {
		if (this.events === undefined || this.events[event] === undefined) return;

		// Add all listeners for this event to a queue for later firing.
		for (var i=0; i<this.events[event].length; i++) {
			var agent = this.events[event][i];
			if (todoAgents[agent] === undefined) todoAgents[agent] = [];
			todoAgents[agent].push(arguments);
		}
	}



	Database.addAgent = function(name, cb) {
		agents[name] = cb;
	}



	/**
	 * Map agents to specific events on a selection of observables and scopes.
	 * If only 2 arguments are given then the agent listens globally for the
	 * specified event, the second argument being the agent name. If 3
	 * arguments are given then the second is a selector specifying which
	 * observables and in which scope to watch. The selector can contain
	 * wildcards for the observable name and scope number. Multiple selectors
	 * can be given using a comma.
	 *
	 * Events include:
	 *     newscope
	 *     newobservable
	 *     setvalue
	 *     setformula
	 *     change
	 */
	Database.on = function(event) {
		// A global notification
		if (arguments.length == 2) {
			switch (event) {
			case "newscope"			:
			case "newobservable"	:
			case "setvalue"			:
			case "setformula"		:	globalevents.events[event].push(arguments[1]); break;
			}
		// A selector to specify notifications
		} else if (arguments.length == 3) {
			var selector = arguments[1];
			// Specify a scope, an observable or an observable and scope...
			// List multiple combinations
			var items = selector.split(",");
			for (var i=0; i<items.length; i++) {
				var comps = items[i].trim().split("/");
				var name = comps[0].trim();

				if (name == "*" || name == "") {
					// Match any observable.
					if (comps.length == 1) {
						// No scope given, so globally match everything.
						return this.on(event, arguments[2]);
					} else {
						// Trigger on scope changes
						var scope = scopes[comps[1]];
						if (scope === undefined) return;
						if (scope.events === undefined) scope.events = {};
						if (scope.events[event] === undefined) scope.events[event] = [];
						scope.events[event].push(arguments[2]);
					}
				} else {
					// Match a particular observable
					if (comps.length == 1) {
						// In any scope
					} else {
						// In a specific scope.
						var entry = this.getEntry(name, parseInt(comps[1]));
						if (entry.events === undefined) entry.events = {};
						if (entry.events[event] === undefined) entry.events[event] = [];
						entry.events[event].push(arguments[2]);
					}
				}
			}
		}
	}



	/**
	 * Finish a block of changes and make sure all changes are propagated and
	 * make the entire system consistent again. Finally, trigger any agents
	 * that may be waiting for the event notifications. This must always be
	 * called after changes are finished being made.
	 */
	Database.sync = function() {
		// Go over todoqueue and expire all
		for (var i=0; i<todoqueue.length; i++) {
			if (todoqueue[i].expired) {
				this.update(todoqueue[i]);
			}
		}
		todoqueue = [];

		// Now get ready to activate any agents listening to events.
		if (todoTimeout === undefined) {
			todoTimeout = setTimeout(processEvents,agentrate);
		}
	}



	Database.newScope = function(parent) {
		var scope = new DBScope(parent);
		scopes.push(scope);
		this.setValue("scope", scopes.length-1, scopes.length-1);
		trigger.call(globalevents, "newscope", scopes.length-1);
		return scopes.length-1;
	}



	Database.getValues = function(query) {
		return values;
	}



	/**
	 * When making a new observable in a given scope, bring in any other
	 * observables that are dependant on that one in the parent scope. It is
	 * this which allows scope overrides to also generate new values of
	 * dependant formuli.
	 */
	Database.bringInRelatives = function(name, scopeid) {
		// Get the parent version of this observable
		var pscope = scopes[scopeid].parent;
		if (pscope === undefined) return;
		var inherited = this.getEntry(name, pscope);

		//console.log("BRING IN RELATIVES: " + name + ", " + scopeid + "pscole = " + pscope);

		if (inherited) {
			// Record this override in the original parent.
			if (inherited.overrides === undefined) {
				inherited.overrides = [];
			}
			inherited.overrides.push(scopeid);

			// For each of the parents dependants
			for (var i=0; i<inherited.dependants.length; i++) {
				// Same scope references are relative, so bring them in
				if (inherited.origin_scope == inherited.dependants[i].origin_scope) {
					var dentry = values[inherited.dependants[i].name + "/" + scopeid];
					// If not already in this scope, bring it in with the formula
					// being inherited from the parent definition
					if (dentry === undefined) {
						dentry = new ValueEntry(inherited.dependants[i].name);
						dentry.origin_scope = scopeid;
						dentry.value_scope = scopeid;
						dentry.formula = inherited.dependants[i].formula;
						values[inherited.dependants[i].name + "/" + scopeid] = dentry;

						// Must expire and bring in next batch of relatives.
						this.expire(dentry);
						this.bringInRelatives(dentry.name, scopeid);
					}
				}
			}
		}
	}



	Database.setValue = function(name, scopeid, value) {
		var entry = values[name + "/" + scopeid];
		if (entry === undefined) {
			// Construct a new value entry;
			entry = new ValueEntry(name);
			entry.value = value;
			entry.origin_scope = scopeid;
			values[name + "/" + scopeid] = entry;

			this.bringInRelatives(name, scopeid);
		} else {
			entry.value = value;
			entry.formula = undefined;
			entry.origin_scope = scopeid;

			this.expire(entry);
		}

		trigger.call(globalevents, "setvalue", name, scopeid, value);
		trigger.call(scopes[scopeid], "setvalue", name, scopeid, value);
		trigger.call(entry, "setvalue", name, scopeid, value);
	}



	Database.getValue = function(name, scopeid) {
		var entry = this.getEntry(name, scopeid);

		// Do an immediate update if this entry is expired. Note: reading
		// a symbol in an agent without doing a sync will cause that symbol
		// and any it depends upon to be force updated. This could reduce
		// performance if any subsequent changes are made to the read symbol.
		if (entry.expired) {
			this.update(entry);
			// XXX: Not syncing entire DB could be problematic here!!!!!
			//Database.sync();
		}

		if (entry !== undefined) return entry.value;
		return undefined;
	}



	Database.getEntryD_UTD = function(origin, name, scopeid) {
		var entry = this.getEntryD(origin, name, scopeid);
		// Do an immediate update if this entry is expired. Note: reading
		// a symbol in an agent without doing a sync will cause that symbol
		// and any it depends upon to be force updated. This could reduce
		// performance if any subsequent changes are made to the read symbol.
		if (entry.expired) {
			this.update(entry);
			// XXX: Not syncing entire DB could be problematic here!!!!!
			//Database.sync();
		}
		return entry;
	}



	/**
	 * Get a value entry, but also add a dependency on the origin value entry.
	 * This makes sure the value is up-to-date first.
	 */
	Database.getEntryD = function(origin, name, scopeid) {
		// Get the up-to-date value entry
		var entry = this.getEntry(name, scopeid);

		// Must be created if doesn't exist in order to record dependency
		if (entry === undefined) {
			this.setValue(name, scopeid, undefined);
			entry = this.getEntry(name, scopeid);
		}

		entry.dependants.push(origin);
		return entry;
	}



	Database.expire = function(entry) {
		entry.expired = true;
		todoqueue.push(entry);
	}



	/**
	 * Make sure this entries value is up-to-date if expired. If the value
	 * consequently changes then also expire all entries dependant upon it.
	 */
	Database.update = function(entry) {
		entry.expired = false;

		var doexpire = false;
		// It may not have a definition and still be expired
		if (entry.formula !== undefined) {
			var formula = this.getFormula(entry.name, entry.origin_scope);
			var newvalue = formula.formula.call(entry, entry.value_scope);

			// Has an actual change happened?
			if (newvalue != entry.value) {
				entry.value = newvalue;
				doexpire = true;
			}
		} else {
			doexpire = true;
		}

		if (doexpire) {
			var dependants = entry.dependants;

			if (dependants) {
				entry.dependants = [];

				// Make it unique
				dependants = dependants.reduce(function(prev,cur,ix,arr) {
					if (prev.indexOf(cur) == -1) prev.push(cur);
					return prev;
				}, []);

				for (var i=0; i<dependants.length; i++) {
					this.expire(dependants[i]);
				}
			}

			// Also need to expire all overrides that use this formula
			if (entry.overrides) {
				for (var i=0; i<entry.overrides.length; i++) {
					var oent = this.getEntry(entry.name, entry.overrides[i]);
					if (oent) {
						this.expire(oent);
					} else {
						console.log("ERROR: " + entry.name + "/" + entry.overrides[i]);
					}
				}
			}

			// Trigger agents listening for change events
			trigger.call(globalevents, "change", entry.name, entry.origin_scope);
			trigger.call(scopes[entry.origin_scope], "change", entry.name, entry.origin_scope);
			trigger.call(entry, "change", entry.name, entry.origin_scope);
		}
	}



	/**
	 * Get the value entry.
	 */
	Database.getEntry = function(name, scopeid) {
		var entry = values[name + "/" + scopeid];
		if (entry === undefined) {
			var scope = scopes[scopeid];
			if (scope === undefined || scope.parent === undefined) {
				return undefined;
			} else {
				return this.getEntry(name, scope.parent);
			}
		}

		return entry;
	}



	/**
	 * Get the formula entry for a given observable+scope. This may be an
	 * inherited entry.
	 */
	Database.getFormula = function(name, scopeid) {
		var entry = formulas[name + "/" + scopeid];
		if (entry === undefined) {
			var scope = scopes[scopeid];
			if (scope === undefined || scope.parent === undefined) {
				return undefined;
			} else {
				entry = this.getFormula(name, scope.parent);
			}
		}

		return entry;
	}



	Database.setFormula = function(name, scopeid, func, deps, scopegen) {
		var entry = formulas[name + "/" + scopeid];
		if (entry === undefined) {
			entry = new FormulaEntry();
			formulas[name + "/" + scopeid] = entry;
		}
		entry.origin_scope = scopeid;
		entry.formula = func;

		var value = values[name + "/" + scopeid];
		if (value === undefined) {
			value = new ValueEntry(name);
			value.formula = entry;

			if (scopegen) {
				var parscope;
				if (deps && deps.length == 1) {
					parscope = this.getEntry(deps[0],scopeid).value_scope;
				} else {
					parscope = scopeid;
				}
				value.value_scope = Database.newScope(parscope);
				scopegen.call(value, value.value_scope);
			} else {
				value.value_scope = scopeid;
			}

			values[name + "/" + scopeid] = value;
			this.bringInRelatives(name, scopeid);
		} else {
			value.formula = entry;

			if (value.value_scope == scopeid && scopegen) {
				if (deps && deps.length == 1) {
					parscope = this.getEntry(deps[0],scopeid).value_scope;
				} else {
					parscope = scopeid;
				}
				value.value_scope = Database.newScope(parscope);
			}
			// Generate the value scope if it is needed.
			if (scopegen) {
				scopegen.call(value, value.value_scope);
			}
		}
		value.origin_scope = scopeid;

		if (deps) {
			entry.dependencies = deps;

			// Add all static dependencies
			for (var i=0; i<deps.length; i++) {
				this.getEntryD(value, deps[i], scopeid);
			}
		}

		this.expire(value);

		// Trigger agents listening for setformula events
		trigger.call(globalevents, "setformula", name, scopeid);
		trigger.call(scopes[scopeid], "setformula", name, scopeid);
		trigger.call(value, "setformula", name, scopeid);
	}


	// Initialise root scope
	Database.newScope(undefined);

	// Create the special null entry that has no scope
	var nullentry = new ValueEntry("null");
	nullentry.origin_scope = undefined;
	nullentry.value_scope = undefined;
	values["null/0"] = nullentry;


	// expose API
	global.Database = Database;
	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Database = Database;
	}
}(typeof window !== 'undefined' ? window : global));
