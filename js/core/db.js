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
		this.origin_scope = 0;			// Scope of the value
		this.up_to_date = true;
		this.dependants = [];			// List of value entries dependant on this
		this.formula = undefined;		// Formula entry defining this value
		this.overrides = undefined;		// List of scopes with overrides of this
	}

	function FormulaEntry() {
		this.formula = undefined;
		this.origin_scope = 0;
		this.dependencies = [];
	}

	function DBScope(parent) {
		this.parent = parent;
	}

	var values = {};
	var formulas = {};
	var scopes = [];
	var observables = {};
	var global_events = {
		newscope: [],
		newobservable: [],
		setvalue: [],
		setformula: []
	};
	var eventQueue = [];

	var Database = {};



	function processEvents() {
		for (var i=0; i<eventQueue.length; i++) {
			processEvent.apply(this, eventQueue[i]);
		}
		eventQueue = [];
	}


	function processEvent(event) {
		for (var i=0; i<global_events[event].length; i++) {
			global_events[event][i].apply(this, arguments);
		}
	}


	function triggerGlobal(event) {
		if (global_events[event] === undefined) return;

		eventQueue.push(arguments);
		if (eventQueue.length == 1) {
			setTimeout(processEvents,10);
		}
	}



	Database.on = function(event) {
		switch (event) {
		case "newscope"			:	global_events.newscope.push(arguments[1]); break;
		case "newobservable"	:	global_events.newobservable.push(arguments[1]); break;
		case "setvalue"			:	if (typeof arguments[1] == "function") {
										global_events.setvalue.push(arguments[1]); break;
									}
		case "setformula"		:	if (typeof arguments[1] == "function") {
										global_events.setformula.push(arguments[1]); break;
									}
		}
	}



	Database.newScope = function(parent) {
		var scope = new DBScope(parent);
		scopes.push(scope);
		this.setValue("scope", scopes.length-1, scopes.length-1);
		triggerGlobal("newscope", scopes.length-1);
		return scopes.length-1;
	}



	Database.getValues = function(query) {
		return values;
	}



	Database.bringInRelatives = function(name, scopeid) {
		var pscope = scopes[scopeid].parent;
		if (pscope === undefined) return;
		var inherited = this._getValueEntry(name, pscope);

		console.log("BRING IN RELATIVES: " + name + ", " + scopeid + "pscole = " + pscope);

		if (inherited) {
			// Record this override in the original parent.
			if (inherited.overrides === undefined) {
				inherited.overrides = [];
			}
			inherited.overrides.push(scopeid);

			for (var i=0; i<inherited.dependants.length; i++) {
				// Same scope references are relative, so bring them in
				if (inherited.origin_scope == inherited.dependants[i].origin_scope) {
					var dentry = values[inherited.dependants[i].name + "/" + scopeid];
					if (dentry === undefined) {
						dentry = new ValueEntry(inherited.dependants[i].name);
						dentry.origin_scope = scopeid;
						dentry.formula = inherited.dependants[i].formula;
						dentry.up_to_date = false;
						values[inherited.dependants[i].name + "/" + scopeid] = dentry;
						this.bringInRelatives(dentry.name, scopeid);
					}
				} //else {

				//TODO: This can be made more efficient, but for now allows
				// dependencies across scope to be updated correctly.
				this.expire(inherited.dependants[i]);
				//}
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
			entry.origin_scope = scopeid;

			// Notify anyone dependent on this value
			this.expire(entry);
			entry.up_to_date = true;
		}
		triggerGlobal("setvalue", name, scopeid, value);
	}



	Database.getValue = function(name, scopeid) {
		var entry = this.getValueEntry(name, scopeid);
		if (entry !== undefined) return entry.value;
		return undefined;
	}



	/**
	 * Internal version of getValue that is used by formuli. It also adds
	 * a dependency on the value retrieved.
	 */
	Database._getValue = function(origin, name, scopeid) {
		var entry = this.getValueEntry(name, scopeid);

		// Must be created if doesn't exist in order to record dependency
		if (entry === undefined) {
			this.setValue(name, scopeid, undefined);
			entry = this.getValueEntry(name, scopeid);
		}

		entry.dependants.push(origin);
		return entry.value;
	}



	/**
	 * Get a value entry, but also add a dependency on the origin value entry.
	 * This makes sure the value is up-to-date first.
	 */
	Database.getEntryD = function(origin, name, scopeid) {
		// Get the up-to-date value entry
		var entry = this.getValueEntry(name, scopeid);

		// Must be created if doesn't exist in order to record dependency
		if (entry === undefined) {
			this.setValue(name, scopeid, undefined);
			entry = this.getValueEntry(name, scopeid);
		}

		entry.dependants.push(origin);
		/*if (entry.overrides) {
			for (var i=0; i<entry.overrides.length; i++) {
				//var oentry = this._getValueEntry(name, entry.overrides[i]);
				this.bringInRelatives(name, entry.overrides[i]);
			}
		}*/
		return entry;
	}



	Database.expire = function(entry) {
		// Nothing to do if already expired
		if (entry.up_to_date === false) return

		// It may not have a definition and still be expired by mistake
		if (entry.formula !== undefined) {
			entry.up_to_date = false;
		}
		var dependants = entry.dependants;
		entry.dependants = [];

		for (var i=0; i<dependants.length; i++) {
			this.expire(dependants[i]);
		}

		// Also need to expire all overrides that use this formula
		if (entry.overrides) {
			for (var i=0; i<entry.overrides.length; i++) {
				var oent = this._getValueEntry(entry.name, entry.overrides[i]);
				if (oent) {
					this.expire(oent);
				} else {
					console.log("ERROR: " + entry.name + "/" + entry.overrides[i]);
				}
			}
		}
	}



	/**
	 * Get the value entry, but without updating value if out-of-date.
	 */
	Database._getValueEntry = function(name, scopeid) {
		var entry = values[name + "/" + scopeid];
		if (entry === undefined) {
			var scope = scopes[scopeid];
			if (scope === undefined || scope.parent === undefined) {
				return undefined;
			} else {
				return this.getValueEntry(name, scope.parent);
			}
		}

		return entry;
	}



	/**
	 * Get the value entry but make sure value is up-to-date first.
	 */
	Database.getValueEntry = function(name, scopeid) {
		var entry = this._getValueEntry(name, scopeid);

		if (entry && entry.up_to_date === false) {
			//Need to find and evaluate associated formula in this scope
			var formula = this.getFormula(name, scopeid);
			entry.origin_scope = scopeid;
			entry.value = formula.formula.call(entry, scopeid);
			entry.up_to_date = true;
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



	Database.setFormula = function(name, scopeid, func, deps) {
		var entry = formulas[name + "/" + scopeid];
		if (entry === undefined) {
			entry = new FormulaEntry();
			formulas[name + "/" + scopeid] = entry;
		}
		entry.origin_scope = scopeid;
		entry.formula = func;
		if (deps) {
			entry.dependencies = deps;
		}

		// TODO Notify all formula dependencies.

		var value = values[name + "/" + scopeid];
		if (value === undefined) {
			value = new ValueEntry(name);
			value.formula = entry;
			values[name + "/" + scopeid] = value;
			this.bringInRelatives(name, scopeid);
		}
		value.origin_scope = scopeid;
		this.expire(value);

		// Also need to expire all overrides that use this formula
		/*if (value.overrides) {
			for (var i=0; i<value.overrides.length; i++) {
				this.expire(this._getValueEntry(name, value.overrides[i]));
			}
		}*/

		triggerGlobal("setformula", name, scopeid);
	}


	// Initialise root scope
	Database.newScope(undefined);


	// expose API
	global.Database = Database;
	// expose as node.js module
	if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
		exports.Database = Database;
	}
}(typeof window !== 'undefined' ? window : global));
