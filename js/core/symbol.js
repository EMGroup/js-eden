function copy(value) {
	var i, copied;
	if (value instanceof Array) {
		copied = value.slice();
		for (i = 0; i < value.length; ++i) {
			copied[i] = copy(copied[i]);
		}
		return copied;
	}
	return value;
}

edenCopy = copy;

(function() {

/**
 * A EdenSymbol table entry.
 *
 * @constructor
 * @struct
 * @param {Folder} context Folder this EdenSymbol belongs to.
 * @param {string} name Name for the EdenSymbol.
 */
function EdenSymbol(context, name) {
	/**
	 * @type {Folder}
	 * @private
	 */
	this.context = context;

	/**
	 * @type {string}
	 */
	this.name = name;

	/**
	 * @type {ScopeCache}
	 */
	this.cache = (context) ? context.scope.add(name,this) : new ScopeCache( true, undefined, this, false);

	this.definition = undefined;
	this.def_scope = undefined;
	this.extend = undefined;	// Deprecated?
	this.needsGlobalNotify = 0;
	this.has_evaled = false;
	this.isasync = false;		// Expects a promise as value
	this.volatile = false;		// Always evaluate on read
	this.eager = false;			// Evaluate immediately on expire
	this.scopecount = 0;
	this.changed = true;
	this.errored = false;

	// need to keep track of who we subscribe to so
	// that we can unsubscribe from them when our definition changes
	this.dependencies =  Object.create(null);

	// need to keep track of what EdenSymbols subscribe to us
	// so that we can notify them of a change in value
	this.subscribers = Object.create(null);
	this.subscribersArray = null;

	// performs the same role as .dependencies but for the backtick notation, where which
	// observables an observable depends on can be dependent on the values of other observables.
	this.dynamicDependencies = Object.create(null);

	// need to keep track of observers so we can notify those also
	this.observers = Object.create(null);
	this.observees = Object.create(null);
	this.jsObservers = {};

	this.origin = undefined;

	// true when the EdenSymbol ready to be garbage collected from its folder when execution of the
	// current script finishes (if it is not subsequently referenced again).  This occurs when
	// using EDEN's forget function.
	this.garbage = false;
}


/* Virtual AST Attributes */
Object.defineProperty(EdenSymbol.prototype, "type", {
	get: function() { return (this.origin && this.origin.type) ? this.origin.type:"assignment"; }
});

Object.defineProperty(EdenSymbol.prototype, "lvalue", {
	get: function() { return (this.origin) ? this.origin.lvalue : undefined; }
});

Object.defineProperty(EdenSymbol.prototype, "expression", {
	get: function() { return (this.origin) ? this.origin.expression : undefined; }
});

Object.defineProperty(EdenSymbol.prototype, "doxyComment", {
	get: function() { return (this.origin) ? this.origin.doxyComment : undefined; }
});

Object.defineProperty(EdenSymbol.prototype, "parent", {
	get: function() { return this.context; }
});

Object.defineProperty(EdenSymbol.prototype, "stamp", {
	get: function() { return (this.origin) ? this.origin.stamp : undefined; }
});

Object.defineProperty(EdenSymbol.prototype, "id", {
	get: function() { return (this.origin && this.origin.id) ? this.origin.id : this.name; }
});

Object.defineProperty(EdenSymbol.prototype, "executed", {
	get: function() { return 1; }
});

EdenSymbol.prototype.buildID = function() {
	// Do nothing
}

EdenSymbol.prototype.getStartLine = function(relative) {
	return (this.origin) ? this.origin.getStartLine(relative) : -1;
}

EdenSymbol.prototype.getLocationName = function() {
	return (this.origin) ? this.origin.getLocationName() : "ACTIVE";
}

EdenSymbol.prototype.getASTOrigin = function() {
	if (this.origin) {
		var p = this.origin;
		while (p.parent) p = p.parent;
		if (p.base) return p.base.origin;
	}
}

EdenSymbol.prototype.getOrigin = function() {
	if (this.origin) return this.origin.getOrigin();
	return undefined;
}


InternalAgent = function(name, local) {
	this.name = name;
	this.local = local;
	this.internal = true;
}

InternalAgent.prototype.getOrigin = function() {
	if (this.name != "*Default") return eden.project;  // FIXME:
	else return undefined;
}

InternalAgent.prototype.numlines = 0;

// Input device agents are always local only.
EdenSymbol.hciAgent = new InternalAgent("*Input Device", true);
// A JavaScript agent is not local only.
EdenSymbol.jsAgent = new InternalAgent("*JavaScript", false);
EdenSymbol.localJSAgent = new InternalAgent("*JavaScript", true);
// Network changes are always local to prevent loops.
EdenSymbol.netAgent = new InternalAgent("*net", true);
// Something entirely ignored by script generator
EdenSymbol.defaultAgent = new InternalAgent("*Default", true);

EdenSymbol.NONOTIFY = 0;
EdenSymbol.CREATED = 1;
EdenSymbol.EXPIRED = 2;
EdenSymbol.REDEFINED = 3;
EdenSymbol.ASSIGNED = 4;
EdenSymbol.ASYN_UPDATE = 5;


/**
 * Return the current value of this EdenSymbol, forcing calculation if necessary.
 *
 * @return {*}
 */
EdenSymbol.prototype.value = function (pscope) {
	if (pscope && pscope.isRange()) {
		return this.multiValue(pscope);
	} else {
		var scope = pscope;
		this.garbage = false;

		if (scope === undefined) scope = this.context.scope;

		var cache = (this.context === undefined || scope === this.context.scope) ? this.cache : scope.lookup(this.name);

		if (this.definition) {
			if (!cache.up_to_date) {
				this.evaluate(scope, cache);
			}
		}
		return cache.value;
	}
};

EdenSymbol.prototype.multiValue = function (newscope) {
	var results = [];

	console.log("mutli value");

	newscope.range = false;

	if (!newscope.first()) return [];

	while (true) {
		var val = this.value(newscope);
		if (val !== undefined) {
			results.push(val);
		}
		if (newscope.next() == false) break;
	}

	newscope.range = true;

	// Must log scope in cache for ranges as well
	var cache = (this.context === undefined || newscope === this.context.scope) ? this.cache : newscope.lookup(this.name);
	cache.scope = newscope;

	return results;
};

/**
 * Evaluate a definition assuming it is out-of-date.
 * 
 * @param {Scope} scope Evaluation scope
 * @param {ScopeCache} cache Cache entry for this symbol in eval scope.
 */
EdenSymbol.prototype.evaluate = function (scope, cache) {
	if (this.context) {
		this.context.beginEvaluation(this);
	}
	if (!this.subscribersArray) this.subscribersArray = Object.keys(this.subscribers);
	try {
		cache.up_to_date = !this.volatile;
		if (!this.has_evaled) this.clearDynamicDependencies();
		this.has_evaled = true;
		this.scopecount = 0;
		this.errored = false;

		let oldval = cache.value;
		cache.value = this.definition.call(this,this.context, scope, cache);
		if (this.scopecount > 1000) console.log("Scope count for "+this.name, this.scopecount);
		this.changed = oldval !== cache.value;

		// Post process with all extensions
		/*if (this.extend) {
			for (var e in this.extend) {
				this.extend[e].code(this.context, scope, cache.value);
			}
		}*/
	} catch (e) {
		if (e instanceof Eden.RuntimeError) {
			this.context.instance.emit("error", [this,e]);
		}
		// if (this.context) console.error(this.context.currentObservables.map(x => { return x.name; }), e);
		// else console.error(this.name, e);
		cache.up_to_date = !this.volatile;

		if (e === -1) {
			if (this.context) {
				this.context.endEvaluation(this);
			}
			return -1;
		}
		cache.value = undefined;
		this.changed = true;
		this.errored = true;
	}
	if (this.context) {
		this.context.endEvaluation(this);
	}
};

/* Faster version for scope use only */
EdenSymbol.prototype.liteEvaluate = function (scope, cache) {
	if (!this.subscribersArray) this.subscribersArray = Object.keys(this.subscribers);

	cache.up_to_date = !this.volatile;
	cache.value = undefined;
	if (!this.has_evaled) this.clearDynamicDependencies();
	this.has_evaled = true;
	try {cache.value = this.definition.call(this,this.context, scope, cache);} catch(e) {}

	// Post process with all extensions
	// TODO: Remove extensions?
	/*if (this.extend) {
		for (var e in this.extend) {
			this.extend[e].code(this.context, scope, cache.value);
		}
	}*/
	
};

EdenSymbol.prototype.isSourceOfUndefined = function() {
	if (this.value() !== undefined) return false;

	for (let o in this.dependencies) {
		let sym = this.dependencies[o];
		if (sym.cache.value === undefined) return false;
	}
	for (let o in this.dynamicDependencies) {
		let sym = this.dynamicDependencies[o];
		if (sym.cache.value === undefined) return false;
	}

	return true;
}

EdenSymbol.prototype.clearObservees = function () {
	for (var name in this.observees) {
		var EdenSymbol = this.observees[name];
		EdenSymbol.removeObserver(this.name);
	}
	this.observees = Object.create(null);
};

EdenSymbol.prototype.subscribe = function () {
	var dependencies = Utils.flatten(arguments);
	for (var i = 0; i < dependencies.length; ++i) {
		var dependency = dependencies[i];
		var sym = this.context.lookup(dependency);

		if (sym.name != this.name) {
			sym.addSubscriber(this.name, this);
			var name = sym.name;
			this.dependencies[name] = sym;
			delete this.dynamicDependencies[name];
		}
	}

	return this;
};

EdenSymbol.prototype.subscribeDynValue = function (position, sym, scope) {
	let dependency = sym.name;
	//if (!(dependency in scope.cache)) scope.cache[dependency] = new ScopeCache(false, undefined, undefined, false);
	this.subscribeDynamic(position, dependency, scope);
	//scope.rebuildForceAll();
	return sym.value(scope);
}

EdenSymbol.prototype.subscribeDynamicSym = function (sym) {
	if (!(sym.name in this.dependencies)) {
		if (!(sym.name in this.dynamicDependencies)) {
			sym.addSubscriber(this.name, this);
			this.dynamicDependencies[sym.name] = sym;		
		}
	}
}

EdenSymbol.prototype.subscribeDynamic = function (position, dependency, scope) {
	if (!Eden.isValidIdentifier(dependency)) return "__error__";
	var sym = this.context.lookup(dependency);

	if (scope && scope !== this.context.scope && scope.cause) {
		// Only add if actually a definition and not already there.
		if (sym.definition && !scope.cache[dependency]) {
			scope.addSubscriber(dependency);
		}
	}

	if (!this.dependencies[dependency]) {
		if (!this.dynamicDependencies[dependency]) {
			sym.addSubscriber(this.name, this);
			this.dynamicDependencies[sym.name] = sym;			
		}
	}

	return dependency;
}


EdenSymbol.prototype.clearDependencies = function () {
	var dependency;
	for (var name in this.dependencies) {
		dependency = this.dependencies[name];
		dependency.removeSubscriber(this.name);
	}
	this.dependencies = Object.create(null);
	for (var name in this.dynamicDependencies) {
		dependency = this.dynamicDependencies[name];
		dependency.removeSubscriber(this.name);
	}
	this.dynamicDependencies = Object.create(null);
};

EdenSymbol.prototype.clearDynamicDependencies = function () {
	var dependency;
	var count = 0;
	for (var name in this.dynamicDependencies) {
		dependency = this.dynamicDependencies[name];
		dependency.removeSubscriber(this.name);
		++count;
	}
	if (count > 0) this.dynamicDependencies = Object.create(null);
};


EdenSymbol.prototype.getSource = function() {
	//if (this.origin && !this.origin.internal && !this.origin.getSource) console.log("NO GETSOURCE",this);
	if (this.origin && !this.origin.internal) {
			return this.origin.getSource();
	}
	return this.name + " = " + Eden.edenCodeForValue(this.value()) + ";";
}

EdenSymbol.prototype.toString = function() {
	return "&"+this.name;
}

/* Find all indirect dependencies for this symbol. */
EdenSymbol.prototype.indirectDependencies = function(obj) {
	var result = (obj) ? obj : {};
	for (var d in this.dependencies) {
		var sym = this.dependencies[d];
		result[d] = sym;
		sym.indirectDependencies(result);
	}

	for (var d in this.dynamicDependencies) {
		var sym = this.dynamicDependencies[d];
		result[d] = sym;
		sym.indirectDependencies(result);
	}

	return result;
}

/* Find all indirect dependees for this symbol. */
EdenSymbol.prototype.indirectSubscribers = function(obj) {
	var result = (obj) ? obj : {};
	for (var d in this.subscribers) {
		var sym = this.subscribers[d];
		result[d] = sym;
		sym.indirectSubscribers(result);
	}

	return result;
}


/**
 * Set a definition for the EdenSymbol, which will be used to calculate it's value.
 *
 * @param {function(Folder)} definition
 * @param {EdenSymbol} modifying_agent Agent modifying this EdenSymbol.
 */
EdenSymbol.prototype.define = function (definition, origin, subscriptions, source) {
	this.garbage = false;
	this.definition = definition;
	this.origin = origin;
	this.needsGlobalNotify = EdenSymbol.REDEFINED;

	// EdenSymbol no longer observes or depends on anything
	this.clearObservees();
	this.clearDependencies();
	this.subscribe(subscriptions);

	// Re-add any extension dependencies.
	/*if (this.extend) {
		for (var e in this.extend) {
			this.subscribe(this.extend[e].deps);
		}
	}*/

	if (this.context) {
		// Lazy expire.
		this.context.expireEdenSymbol(this);
	}

	if (Eden.logging && origin) {
		if (origin.type === "assignment" || origin.type === "definition" || origin.type === "modify") {
			this.context.instance.emit("debug_log", [origin]);
		}
	}

	if (this.context.instance.peer) this.context.instance.peer.define(origin, this.name, origin.getSource(), subscriptions);

	return this;
};

EdenSymbol.prototype.expireSubscribers = function() {
	for (var s in this.subscribers) {
		let sub = this.subscribers[s];
		sub.needsGlobalNotify = EdenSymbol.EXPIRED;
		this.context.expireEdenSymbol(sub);
	}
}

EdenSymbol.prototype.expireAsync = function() {
	if (this.context) {
		this.needsGlobalNotify = EdenSymbol.ASYNC_UPDATE;
		this.context.expireEdenSymbol(this);
	}
}

/**
 * Watch another EdenSymbol for changes.
 *
 * @param {...string} EdenSymbol_names Names of other EdenSymbols to observe from the same Folder.
 * @return {EdenSymbol}
 */
EdenSymbol.prototype.observe = function (EdenSymbol_names) {
	EdenSymbol_names = Utils.flatten(arguments);
	
	for (var i = 0; i < EdenSymbol_names.length; ++i) {
		var EdenSymbol = this.context.lookup(EdenSymbol_names[i]);
		this.observees[EdenSymbol.name] = EdenSymbol;
		EdenSymbol.addObserver(this.name, this);
	}

	if (this.context) {
		this.context.triggerEdenSymbol(this);
	}
	return this;
};

EdenSymbol.prototype.stopObserving = function (EdenSymbol_name) {
	this.observees[EdenSymbol_name].removeObserver(this.name);
	this.observees[EdenSymbol_name] = undefined;
};

EdenSymbol.prototype.isUpToDate = function() {
	return this.cache.up_to_date;
}

EdenSymbol.prototype.append = function(value, scope, origin) {
	var val = this.value(scope);
	val.push(value);
	this.assign(val, scope, origin);
}

EdenSymbol.prototype.hasChanged = function() {
	if (!this.cache.up_to_date) this.value();
	return this.changed;
}

/**
 * Change the current value of this EdenSymbol and notify.
 *
 * If this is called from within JavaScript code that is initiated in some way other than via the
 * input window (e.g. mouse movement events) then the third parameter must be set to true to
 * ensure that the change gets propagated to other networked instances of JS-EDEN.
 *
 * @param {*} value
 * @param {EdenSymbol} modifying_agent
 * @param {boolean} pushToNetwork
 */
EdenSymbol.prototype.assign = function (value, scope, origin) {
	this.garbage = false;
	if (this.cache.value !== value) value = copy(value);
	
	if (this.name === "autocalc") {
		/* JS-EDEN has a separate Boolean type so users may expect to be able to assign true and
		 * false even though autocalc uses 1 and 0 for compatibility with tkeden. */
		if (value === true) {
			value = 1;
		} else if (value === false) {
			value = 0;
		}
		this.context && this.context.autocalc(value === 1);
	}

	var cache = (this.context === undefined || scope == this.context.scope) ? this.cache : scope.lookup2(this.name);
	if (cache.symbol !== this) {
		console.log("Different symbols for "+this.name);
		cache.symbol.assign(value, scope, origin);
		return;
	}

	this.origin = origin;
	// If was defined, then need full expire.
	this.needsGlobalNotify = (this.definition) ? EdenSymbol.REDEFINED : EdenSymbol.ASSIGNED;
	this.definition = undefined;
	this.has_evaled = true;

	this.extend = undefined;

	this.changed = cache.value !== value;
	cache.value = value;
	cache.up_to_date = true;

	// EdenSymbol no longer observes or depends on anything
	this.clearObservees();
	this.clearDependencies();

	if (this.context) {
		this.context.expireEdenSymbol(this);
	}

	if (Eden.logging && origin) {
		if (origin.type === "assignment" || origin.type === "definition" || origin.type === "modify") {
			this.context.instance.emit("debug_log", [origin]);
		}
	}

	// Attempt send over p2p network
	if (this.context.instance && this.context.instance.peer) this.context.instance.peer.assign(origin, this.name, value);

	return this;
};


EdenSymbol.prototype.assigned = function (origin) {
	this.garbage = false;
	this.origin = origin;
	this.definition = undefined;

	// EdenSymbol no longer observes or depends on anything
	this.clearObservees();
	this.clearDependencies();

	return this;
};

/**
 * Change the current value of this EdenSymbol and notify
 *
 * @param {function(EdenSymbol, EdenSymbol)} mutator
 * @param {EdenSymbol} modifying_agent
 * @param {...*} mutatorArgs args to be passed to the mutator function.
 */
EdenSymbol.prototype.mutate = function (scope, mutator, origin, mutatorArgs) {
	this.garbage = false;
	var me = this;
	this.origin = origin

	// need to make sure the cached value exists before mutation
	// which is allowed to refer to the cached value.
	this.value(scope);
	this.definition = undefined;
	this.needsGlobalNotify = EdenSymbol.ASSIGNED;

	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	mutator.apply(undefined, [this].concat(args));

	if (this.context) {
		this.context.expireEdenSymbol(this);
	}

	return this;
};

/**
 * Used with pointer type observables, e.g. when clicking in the EdenSymbol List view to edit one.
 * @return {string} The EDEN code used to create an expression that references this EdenSymbol,
 *	i.e. &name
 */
EdenSymbol.prototype.getEdenCode = function () {
	return "&" + this.name;
}

EdenSymbol.prototype.trigger = function () {
	try {
		this.value().call(this, this.context, this.context.scope);
	} catch (error) {
		var err = new Eden.RuntimeError(undefined, Eden.RuntimeError.PROCAGENT, undefined, "Triggered proc failed: "+error);
		this.context.instance.emit("error", [this,err]);
	}
};

EdenSymbol.prototype.fireJSObservers = function () {
	for (var jsObserverName in this.jsObservers) {
		try {
			this.jsObservers[jsObserverName](this, this.value());
		} catch (error) {
			var err = new Eden.RuntimeError(undefined, Eden.RuntimeError.JSOBSERVER, undefined, "JavaScript observer '"+jsObserverName+"' failed: "+error);
			this.context.instance.emit("error", [this,err]);
			var debug;
			if (this.context) {
				var debugOptions = this.cache.value;
				debug = typeof(debugOptions) == "object" && debugOptions.jsExceptions;
			} else {
				debug = false;
			}

			throw error;
		}
	}
}


/**
 * Mark this EdenSymbol as out of date, and notify all formulas and observers of
 * this change
 * @param {Object.<string,EdenSymbol>} actions_to_fire set to accumulate all the actions that should be notified about this expiry
 */
EdenSymbol.prototype.expire = function (EdenSymbols_to_force, insertionIndex, actions_to_fire, fullexpire) {
	// console.log("Expire",this.name,this.has_evaled,fullexpire);
	if (this.has_evaled || (fullexpire && this.needsGlobalNotify != EdenSymbol.EXPIRED)) {

		if (this.isasync && this.definition && this.needsGlobalNotify != EdenSymbol.ASYNC_UPDATE) {
			if (this.context) {
				this.context.beginEvaluation(this);
			}
			//this.needsGlobalNotify = EdenSymbol.EXPIRED;
			this.has_evaled = false;

			//console.log("Expire ASYNC definition", this.name);

			try {
				this.clearDynamicDependencies();

				this.definition.call(this,this.context, this.context.scope, this.cache).then(v => {
					//console.log("PROMISE EVAL = ", v);
					this.has_evaled = true;
					this.cache.up_to_date = true;
					this.changed = this.cache.value !== v;
					this.cache.value = v;
					this.expireAsync();
				});
		
				// Post process with all extensions
				/*if (this.extend) {
					for (var e in this.extend) {
						this.extend[e].code(this.context, scope, cache.value);
					}
				}*/
			} catch (e) {
				if (e instanceof Eden.RuntimeError) {
					this.context.instance.emit("error", [this,e]);
				}
				console.error(this.name, e);
				this.cache.value = undefined;
				this.changed = true;
				this.cache.up_to_date = true;
			}
			if (this.context) {
				this.context.endEvaluation(this);
			}
		} else {

			if (this.definition && this.needsGlobalNotify != EdenSymbol.ASYNC_UPDATE) {
				// TODO, Also mark all active scopes for this EdenSymbol as out-of-date.
				this.cache.up_to_date = false;
				this.has_evaled = false;
				EdenSymbols_to_force[this.name] = insertionIndex.value;
				insertionIndex.value++;

				// Need to rebuild the scope dependency path
				if (fullexpire) {
					//console.log("FULL EXPIRE",this.name);
					//this.def_scope = undefined;
					this.cache.scopes = null;
				} else {
					//console.log("NORMAL EXPIRE",this.name);
				}
				//else if (this.def_scope) {
				//	for (var i=0; i<this.def_scope.length; i++) this.def_scope[i].reset();
				//}

				if (this.eager) {
					if (this.evaluate(this.context.scope, this.cache) === -1) {
						return;
					}
				}
			}

			for (var observer_name in this.observers) {
				actions_to_fire[observer_name] = this.observers[observer_name];
			}

			this.needsGlobalNotify = EdenSymbol.EXPIRED;

			// recursively mark out of date and collect
			/*if (this.subscribersArray) {
				for (var subscriber_name of this.subscribersArray) {
					var subscriber = this.subscribers[subscriber_name];
					if (subscriber) {
						subscriber.expire(EdenSymbols_to_force, insertionIndex, actions_to_fire,fullexpire);
					}
				}
			} else {*/
				for (var subscriber_name in this.subscribers) {
					var subscriber = this.subscribers[subscriber_name];
					if (subscriber) {
						subscriber.expire(EdenSymbols_to_force, insertionIndex, actions_to_fire,fullexpire);
					}
				}
			//}
		}
	} else {
		//console.log("NO EXPIRE", this.name);
	}
};

EdenSymbol.prototype.isDependentOn = function (name) {
	if (name == this.name || this.dependencies[name]) {
		return true;
	}

	var EdenSymbol;
	for (var d in this.dependencies) {
		EdenSymbol = this.dependencies[d];
		if (EdenSymbol.isDependentOn(name)) {
			return true;
		}
	}
	for (var d in this.dynamicDependencies) {
		EdenSymbol = this.dynamicDependencies[d];
		if (EdenSymbol.isDependentOn(name)) {
			return true;
		}
	}
	return false;
};

EdenSymbol.prototype.getDependencies = function() {
	var res = [];
	for (var d in this.dependencies) {
		res.push(d);
	}
	console.log("Dependencies");
	return res;
}

EdenSymbol.prototype.assertNotDependentOn = function (name, path) {
	if (path === undefined) {
		path = [];
	}
	path.push(this.name);

	if (this.dependencies[name]) {
		var details = path.join(" -> ") + " -> " + name + " -> " + path[0];
		throw new Error("Cyclic dependency detected: " + details);
	}

	var EdenSymbol;
	for (var d in this.dependencies) {
		EdenSymbol = this.dependencies[d];
		EdenSymbol.assertNotDependentOn(name, path);
	}
	for (var d in this.dynamicDependencies) {
		EdenSymbol = this.dynamicDependencies[d];
		EdenSymbol.assertNotDependentOn(name, path);
	}
	path.pop();
};

/**
 * Add a subscriber to notify on changes to the stored value
 *
 * @param {string} name The name of the subscribing EdenSymbol
 */
EdenSymbol.prototype.addSubscriber = function (name, EdenSymbol) {
	this.garbage = false;
	//this.assertNotDependentOn(name);
	this.subscribers[name] = EdenSymbol;
	//this.subscribersArray = null;
	if (this.subscribersArray) this.subscribersArray.push(name);
};

/**
 * Tell this EdenSymbol that it no longer needs to notify a specific EdenSymbol.
 *
 * @param {string} name The name of the EdenSymbol that no longer needs to be notified.
 */
EdenSymbol.prototype.removeSubscriber = function (name) {
	delete this.subscribers[name];
	this.subscribersArray = null;
	if (this.origin === undefined && this.canSafelyBeForgotten()) {
		this.forget();
	}
};

EdenSymbol.prototype.canSafelyBeForgotten = function () {
	for (var s in this.subscribers) {
		return false;
	}
	for (var o in this.observers) {
		return false;
	}
	return true;
}

EdenSymbol.prototype.forget = function () {
	this.origin = undefined;
	this.definition = undefined;
	this.cache.value = undefined;
	this.cache.up_to_date = true;

	if (this.context) {
		this.context.expireEdenSymbol(this);
	}

	this.clearObservees();
	this.clearDependencies();
	this.garbage = true;

	// Call all jsObservers with undefined value.
	// Note: they can check the garbage property and clean up!!
	for (var o in this.jsObservers) {
		this.jsObservers[o].call(this, this, undefined);
	}

	this.jsObservers = {};
	this.context.queueForGarbageCollection(this);
};

/**
 * Add an observer to notify on changes to the stored value.
 *
 * @param {string} name The name of the subscribing EdenSymbol.
 * @param {EdenSymbol} EdenSymbol The EdenSymbol to trigger when there is a change in this EdenSymbol.
 */
EdenSymbol.prototype.addObserver = function (name, EdenSymbol) {
	this.garbage = false;
	this.observers[name] = EdenSymbol;
};

/**
 * Add a JavaScript function to notify on changes to the stored value.
 *
 * @param {string} name A descriptive ID identifying the code being called.
 * @param {function} listener The JavaScript function to call when there is a change in this EdenSymbol.
 */
EdenSymbol.prototype.addJSObserver = function (name, listener) {
	if (typeof(listener) != "function") {
		throw new Error("Failed adding JavaScript observer " + listener);
	}
	this.jsObservers[name] = listener;
	if (this.cache.up_to_date == false) {
		//listener(this,this.value());
		this.value();
	}
}

/**
 * Tell this EdenSymbol that it no longer needs to notify a specific observer.
 *
 * @param {string} name Name of the observer that no longer needs to be notified.
 */
EdenSymbol.prototype.removeObserver = function (name) {
	delete this.observers[name];
	if (this.origin === undefined && this.canSafelyBeForgotten()) {
		this.forget();
	}
};

/**
 * Tell this EdenSymbol that it no longer needs to notify a specific JavaScript function.
 *
 * @param {string} name Identifier of the function that no longer needs to be notified.
 */
 EdenSymbol.prototype.removeJSObserver = function (name) {
	delete this.jsObservers[name];
}

EdenSymbol.prototype.addExtension = function(idstr, ext, source, modifying_agent, deps) {
	if (this.definition) {	
		if (this.extend === undefined) {
			this.extend = {};
		}
		this.extend[idstr] = { code: ext, source: source, deps: deps };

		this.subscribe(deps);
		this.needsGlobalNotify = EdenSymbol.REDEFINED;

		if (this.context) {
			this.context.expireEdenSymbol(this);
		}
	} else {
		throw new Error(Eden.RuntimeError.EXTENDSTATIC);
	}
}

EdenSymbol.prototype.listAssign = function(value, scope, origin, pushToNetwork, indices) {
	if (this.definition) {		
		// Attempt to find corresponding primary
		if (this.origin && this.origin.type == "definition") {
			var p = this.origin.locatePrimary(indices);
			if (p) {
				this.context.lookup(p).assign(value, scope, origin);
				return;
			} else {
				
			}
		}

		throw new Error(Eden.RuntimeError.ASSIGNTODEFINED);
		return;
	}

	var list = this.value(scope);
	for (var i = 0; i < indices.length-1; i++) {
		//if (indices[i] < 1) {
		//	console.log("ASSIGN OUT OF BOUNDS");
		//}
		if (list) list = list[indices[i]];
	}
	if (list) {
		//if (indices[indices.length-1] < 1) {
		//	console.log("ASSIGN OUT OF BOUNDS");
		//}
		list[indices[indices.length-1]] = value;
	} else {
		throw new Error(Eden.RuntimeError.ASSIGNDIMENSION);
	}

	this.origin = origin;
	this.needsGlobalNotify = EdenSymbol.ASSIGNED;
	if (this.context) {
		this.context.expireEdenSymbol(this);
	}

	if (this.context.instance.peer) this.context.instance.peer.listAssign(origin, this.name, value, indices);
	return this;
}

Eden.EdenSymbol = EdenSymbol;

})();
