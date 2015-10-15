/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

(function (global) {

	function ValueEntry () {
		this.value = undefined;
		this.origin_scope = 0;
		this.up_to_date = true;
		this.subscribers = undefined;
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



	Database.setValue = function(name, scopeid, value) {
		var entry = values[name + "/" + scopeid];
		if (entry === undefined) {
			// Construct a new value entry;
			entry = new ValueEntry();
			entry.value = value;
			entry.origin_scope = scopeid;
			values[name + "/" + scopeid] = entry;
		} else {
			entry.value = value;
			entry.origin_scope = scopeid;
			entry.up_to_date = true;
			// Remove and link to a formula.
			// Notify anyone dependent on this value
		}
		triggerGlobal("setvalue", name, scopeid, value);
	}



	Database.getValue = function(name, scopeid) {
		var entry = this.getValueEntry(name, scopeid);
		if (entry !== undefined) return entry.value;
		return undefined;
	}



	Database.getValueEntry = function(name, scopeid) {
		var entry = values[name + "/" + scopeid];
		if (entry === undefined) {
			var scope = scopes[scopeid];
			if (scope === undefined || scope.parent === undefined) {
				return undefined;
			} else {
				return this.getValueEntry(name, scope.parent);
			}
		}

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
			value = new ValueEntry();
			values[name + "/" + scopeid] = value;
		}
		value.up_to_date = false;
		value.origin_scope = scopeid;

		triggerGlobal("setformula", name, scopeid);

		// TODO Notify all value dependencies.
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
