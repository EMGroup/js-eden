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
		this.origin_scope = 0;
		this.up_to_date = true;
		this.dependants = [];
	}

	function FormulaEntry() {
		this.formula = undefined;
		this.origin_scope = 0;
		this.subscribers = [];
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

	var Database = {};



	function triggerGlobal(event) {
		if (global_events[event] === undefined) return;

		for (var i=0; i<global_events[event].length; i++) {
			global_events[event][i].apply(this, arguments);
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
		this.setValue("scope_id", scopes.length-1, scopes.length-1);
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

		console.log("BRING IN RELATIVES: " + name + ", " + scopeid);

		if (inherited) {
			for (var i=0; i<inherited.dependants.length; i++) {
				// Same scope references are relative, so bring them in
				if (inherited.origin_scope == inherited.dependants[i].origin_scope) {
					var dentry = values[inherited.dependants[i].name + "/" + scopeid];
					if (dentry === undefined) {
						dentry = new ValueEntry(inherited.dependants[i].name);
						dentry.origin_scope = scopeid;
						dentry.up_to_date = false;
						values[inherited.dependants[i].name + "/" + scopeid] = dentry;
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
		if (entry === undefined) {
			this.setValue(name, scopeid, undefined);
			entry = this.getValueEntry(name, scopeid);
		}

		entry.dependants.push(origin);
		return entry.value;
	}



	Database.expire = function(entry) {
		// Nothing to do if already expired
		if (entry.up_to_date === false) return

		entry.up_to_date = false;
		var dependants = entry.dependants;
		entry.dependants = [];

		for (var i=0; i<dependants.length; i++) {
			this.expire(dependants[i]);
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
	 * Get the value entry but make sure value is up-to-date.
	 */
	Database.getValueEntry = function(name, scopeid) {
		var entry = this._getValueEntry(name, scopeid);

		if (entry.up_to_date === false) {
			//Need to find and evaluate associated formula in this scope
			var formula = this.getFormula(name, scopeid);
			entry.origin_scope = scopeid;
			entry.value = formula.formula.call(entry, scopeid);
			entry.up_to_date = true;
		}

		return entry;
	}



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



	Database.setFormula = function(name, scopeid, func) {
		var entry = formulas[name + "/" + scopeid];
		if (entry === undefined) {
			entry = new FormulaEntry();
			formulas[name + "/" + scopeid] = entry;
		}
		entry.origin_scope = scopeid;
		entry.formula = func;
		// TODO Notify all formula dependencies.

		var value = values[name + "/" + scopeid];
		if (value === undefined) {
			value = new ValueEntry(name);
			values[name + "/" + scopeid] = value;
		}
		value.origin_scope = scopeid;
		this.expire(value);

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
