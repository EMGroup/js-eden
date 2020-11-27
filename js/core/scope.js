function ScopeCache(up_to_date, value, scope, override) {
	this.up_to_date = up_to_date;
	this.value = value;
	this.scope = scope;
	this.scopes = null;
	this.override = override;
}

function BoundValue(value,scope) {
	this.value = value;
	this.scope = scope;
}


function ScopeOverride(name, start, end, inc, isin) {
	this.name = name;
	this.start = start;
	this.end = end;
	this.increment = inc;
	this.current = (isin && start) ? start[0] : start;
	this.isin = isin;
	this.index = 1;

	// Check for valid combinations of options
	if (this.increment == 0) {
		throw new Error(Eden.RuntimeError.INFINITERANGE);
	} else if (this.isin && this.end === undefined && !(this.start instanceof Array)) {
		throw new Error(Eden.RuntimeError.NOLISTRANGE);
	}
}


/**
 * Store  a set of overrides and a separate cache of alternative values
 * for all symbols depending upon those overrides.
 */
function Scope(context, parent, overrides, range, cause, nobuild) {
	this.parent = parent;
	this.context = context;
	this.cache = undefined;
	this.overrides = overrides;
	this.cause = (parent && parent.cause) ? parent.cause : cause;
	this.causecount = 0;
	this.range = range;
	this.isolate = false;

	this.cachearray = null;

	if (this.cause && this.cause.hasOwnProperty("scopecount")) {
		if (++this.cause.scopecount > 100000) {
			console.error("Scope limit exceeded", this.cause.name);
			throw "Scope limit exceeded";
		}
	}

	if (!nobuild) this.rebuild();
}

/**
 * Query if somewhere in the scope hierarchy there is a cause matching
 * the one given. Returns a boolean.
 */
Scope.prototype.hasCause = function(cause) {
	var scope = this;
	var causename = cause;
	while (scope) {
		if (scope.cause.name == causename) return true;
		scope = scope.parent;
	}
	return false;
}

Scope.prototype.baseCause = function() {
	var scope = this;
	while(scope.parent && scope.parent.parent) scope = scope.parent;
	return scope.cause.name;
}

Scope.prototype.allCauses = function() {
	var res = [];
	var scope = this;
	while (scope) {
		if (scope.cause) res.push(scope.cause);
		scope = scope.parent;
	}
	return res;
}

Scope.prototype.allOverrides = function() {
	
}

Scope.prototype.hasOverride = function(override) {
	var scope = this;
	while (scope) {
		for (var i=0; i<scope.overrides.length; i++) {
			if (scope.overrides[i].name == override) return true;
		}
		scope = scope.parent;
	}
	return false;
}

Scope.prototype.primaryCause = function() {
	if (this.cause && this.cause.name == "null") {
		if (this.parent && this.parent.cause) {
			return this.parent.cause.name;
		}
	}
	return "null";
}

Scope.prototype.isRange = function() {
	return this.range;
}

Scope.prototype.clear = function() {
	if (this !== eden.root) {
		this.cache = undefined;
	}
}

Scope.prototype.resetCache = function() {
	if (!this.cachearray) {
		this.cachearray = [];
		for (var o in this.cache) {
			var obj = this.cache[o];
			obj.up_to_date = obj.override;
			this.cachearray.push(obj);
		}
	} else {
		for (var obj of this.cachearray) {
			obj.up_to_date = obj.override;
		}
	}
}

Scope.prototype.rebuild = function() {
	if (this.cache !== undefined) return;
	this.cache = Object.create(null);

	this.add("cause");
	this.add("has");
	this.add("from");

	for (var i = 0; i < this.overrides.length; i++) {
		this.updateOverride(this.overrides[i]);
	}

	if (this.context) {
		for (var i = 0; i < this.overrides.length; i++) {
			var sym = this.context.lookup(this.overrides[i].name);
			this.addSubscribers(sym);
		}
	}
}

Scope.prototype.refresh = function() {
	/* Process the overrides */
	for (var i = 0; i < this.overrides.length; i++) {
		this.updateOverride(this.overrides[i]);
	}
}

Scope.prototype.rebuildForce = function() {
	/* Process the overrides */
	for (var i = 0; i < this.overrides.length; i++) {
		this.updateSubscriberForce(this.overrides[i], true);
	}
}

Scope.prototype.rebuildForceAll = function() {
	this.rebuildForce();
	if (this.parent && this.parent !== eden.root.scope) {
		this.parent.rebuildForceAll();
	}
}

Scope.prototype.cloneAt = function(index) {
	var nover = [];

	// Copy the overrides
	for (var i = 0; i < this.overrides.length; i++) {
		nover.push(new ScopeOverride(this.overrides[i].name, this.overrides[i].start, this.overrides[i].end));
	}

	// Make a new exact copy of this scope
	var nscope = new Scope(this.context, this.parent, nover, this.range, this.cause);
	// Move range to correct place. This is brute force.
	for (var i=0; i<index; i++) {
		nscope.next();
	}

	nscope.range = false;
	return nscope;
}

Scope.prototype.clone = function() {
	// TODO, be more selective on use of clone, currently disabled.
	return this;
	var nover = [];

	// Copy the overrides
	for (var i = 0; i < this.overrides.length; i++) {
		var nov = new ScopeOverride(this.overrides[i].name, this.overrides[i].start, this.overrides[i].end);
		nov.current = this.overrides[i].current;
		nover.push(nov);
	}

	// Make a new exact copy of this scope
	var nscope = new Scope(this.context, this.parent, nover, this.range, this.cause, true);

	// Copy the cache
	var ncache = {};
	for (var x in this.cache) {
		//if (this.cache[x].up_to_date) {
			ncache[x] = new ScopeCache(false, this.cache[x].value, nscope, this.cache[x].override);
		//}
	}
	nscope.cache = ncache;
	nscope.refresh();

	return nscope;
}

Scope.prototype.lookup = function(name) {
	//if (this.cache === undefined) return;

	var symcache = this.cache[name];
	if (symcache) {
		return symcache;
	} else {
		if (this.parent) {
			var inherit = this.parent.lookup(name);
			//this.cache[name] = new ScopeCache(inherit.override, inherit.value, inherit.scope, inherit.override);
			//return this.cache[name];
			return inherit;
		} else {
			//console.log("Symbol without cache: " + name);
			this.cache[name] = new ScopeCache(true, undefined, undefined, false);
			return this.cache[name];
		}
	}
}

Scope.prototype.value = function(name) {
	var symcache = this.cache[name];
	if (symcache !== undefined) {
		if (symcache.up_to_date) return symcache.value;
		return this.context.lookup(name).value(this);
	}
	return (this.parent)?this.parent.value(name):undefined;
	//return this.context.lookup(name).value(this.parent);
}

Scope.prototype.assign = function(name, value, agent) {
	if (this.isolate) {
		if (this.cache[name] === undefined) this.cache[name] = new ScopeCache(true, value, this, true);
		else {
			this.cache[name].up_to_date = true;
			this.cache[name].override = true;
			this.cache[name].value = value;
			this.cache[name].scope = this;
		}
	} else {
		this.context.lookup(name).assign(value, this, agent);
	}
}

Scope.prototype.mutate = function(name, func, agent) {
	this.context.lookup(name).mutate(this, func, agent);
}

Scope.prototype.listAssign = function(name, value, agent, ptn, indices) {
	this.context.lookup(name).listAssign(value, this, agent, false, indices);
}

Scope.prototype.define = function(name, def, deps, agent) {
	this.context.lookup(name).define(def, deps, agent);
}

Scope.prototype.boundValue = function(name) {
	return this.context.lookup(name).boundValue(this);
}

Scope.prototype.scope = function(name) {
	var symcache = this.cache[name];
	if (symcache) {
		if (symcache.up_to_date) return symcache.scope;
	}
	return this.context.lookup(name).boundValue(this).scope;
}

Scope.prototype.lookup2 = function(name) {
	//if (this.cache === undefined) return;
	if (this.isolate == false) return this.lookup(name);

	var symcache = this.cache[name];
	if (symcache === undefined) {
		symcache = new ScopeCache(true, undefined, undefined, false);
		this.cache[name] = symcache;
	}
	return symcache;
}

Scope.prototype.add = function(name) {
	var cache = new ScopeCache( false, undefined, this, false);
	this.cache[name] = cache;
	return cache;
}

Scope.prototype.addOverride = function(override) {
	if (!this.updateOverride(override) && this.context) {
		var sym = this.context.lookup(override.name);
		//console.log(sym);
		for (var d in sym.subscribers) {
			this.updateSubscriber(d);
		}
	}
}

Scope.prototype.updateOverride = function(override) {
	var name = override.name;
	var currentval;
	var currentscope;

	if (override.current instanceof BoundValue) {
		//console.log(override.current);
		currentval = override.current.value;
		currentscope = override.current.scope;
	} else {
		//console.log(override.current);
		currentval = override.current;
		currentscope = this;
	}

	if (this.cache[name] === undefined) {
		this.cache[name] = new ScopeCache( true, currentval, currentscope, true);
		return false;
	} else {
		this.cache[name].value = currentval;
		this.cache[name].scope = currentscope;
		this.cache[name].up_to_date = true;
		this.cache[name].override = true;
		return true;
	}
}

Scope.prototype.addSubscribers = function(sym) {
	var subs = [];

	if (!sym.subscribersArray) sym.subscribersArray = Object.keys(sym.subscribers);
	subs.push.apply(subs, sym.subscribersArray);

	var pos = 0;

	while (pos < subs.length) {
		if (!this.cache[subs[pos]]) {
			var name = subs[pos];
			this.cache[name] = new ScopeCache( false, undefined, this, false);
			var sym2 = this.context.lookup(name);
			if (!sym2.subscribersArray) sym2.subscribersArray = Object.keys(sym2.subscribers);
			subs.push.apply(subs, sym2.subscribersArray);
		}
		++pos;
	}
}

Scope.prototype.addSubscriber = function(name) {
	//console.log("Adding scope subscriber...: " + name);
	if (!this.cache[(name)]) {
		var c = new ScopeCache( false, undefined, this, false);
		this.cache[name] = c;
		if (this.cachearray) this.cachearray.push(c);
		var sym = this.context.lookup(name);
		if (!sym.subscribersArray) sym.subscribersArray = Object.keys(sym.subscribers);
		for (var d of sym.subscribersArray) {
		//for (var d in sym.subscribers) {
			this.addSubscriber(d);
		}
	}
}

Scope.prototype.updateSubscriber = function(name) {
	//console.log("Adding scope subscriber...: " + name);
	if (this.cache[name] === undefined) {
		this.cache[name] = new ScopeCache( false, undefined, this, false);
		var sym = this.context.lookup(name);
		for (var d in sym.subscribers) {
			this.updateSubscriber(d);
		}
	} else {
		this.cache[name].up_to_date = false;
		this.cache[name].value = undefined;
		this.cache[name].scope = this;
	}
}

Scope.prototype.updateSubscriberForce = function(name, override) {
	//console.log("Adding scope subscriber...: " + name);
	if (this.cache[name] === undefined) {
		this.cache[name] = new ScopeCache( false, undefined, this, override);
	} else {
		this.cache[name].up_to_date = false;
		this.cache[name].value = undefined;
		this.cache[name].scope = this;
	}
	var sym = this.context.lookup(name);
	for (var d in sym.subscribers) {
		this.updateSubscriberForce(d, false);
	}
}

Scope.prototype.first = function() {
	for (var i = this.overrides.length-1; i >= 0; i--) {
		var over = this.overrides[i];
		if (over.end === undefined) continue;

		if (over.isin) {
			var length = (isbound) ? over.start.value.length : (over.start) ? over.start.length : 0;
			return over.index < length;
		} else if (over.current <= over.end) {
			return true;
		}
	}
	return false;
}

Scope.prototype.mergeCache = function(prev) {
	var diff = this.range;

	if (!prev) console.error("Missing scope cache");

	// TODO: Verify that this is actually ok!?
	this.cache = prev.cache;
	this.cachearray = prev.cachearray;
	return;

	/*if (!this.range) {
		for (var i=0; i<this.overrides.length; i++) {
			var over = this.overrides[i];
			//console.log("MERGE CACHE",over.name,prevcache[over.name],this.cache[over.name]);
		//	prevcache[over.name] = this.cache[over.name];
			if (over.current != prevcache[over.name].value) {
				diff = true;
				break;
			} 
		}
	}*/

	// TODO If all overrides are the same, use the original cache?

	//if (diff) {
		this.cache = {};
		for (var o in prevcache) {
			//if (prevcache[o].up_to_date) // TODO Check this works in all cache, ie. backticks
			this.cache[o] = new ScopeCache(false, undefined, this, false);
		}
	//} else {
	//	this.cache = prevcache;
	//}

	//this.cache = prevcache;
}

Scope.prototype.reset = function() {
	this.resetCache();  // Make everything out-of-date
	this.refresh();		// Update the override values
}

Scope.prototype.next = function() {
	/*for (var o in this.cache) {
		//if (this.cache[o].up_to_date)
			this.cache[o].up_to_date = this.cache[o].override;
		//else
		//	delete this.cache[o];
	}*/

	this.resetCache();

	for (var i = this.overrides.length-1; i >= 0; i--) {
		var over = this.overrides[i];
		if (over.end === undefined && !over.isin) continue;
		var isbound = over.start instanceof BoundValue;
		var length = (isbound) ? over.start.value.length : (over.start) ? over.start.length : 0;

		if (over.isin) {
			// TODO runtime check that start is a list...
			if (over.index < length) {
				if (isbound) {
					over.current = over.start.value[over.index];
				} else {
					over.current = over.start[over.index];
				}
				over.index++;
				//this.updateOverride(over);
				this.refresh();
				//this.cache = undefined; // FORCE REBUILD
				return true;
			} else {
				over.index = 1;
				over.current = (isbound) ? over.start.value[0] : over.start[0];
				//this.updateOverride(over);
				//this.refresh();
				//this.cache = undefined; // FORCE REBUILD
			}
		} else {
			if (over.current < over.end) {
				if (over.increment) {
					over.current += over.increment;
				} else {
					over.current++;
				}
				//this.updateOverride(over);
				this.refresh();

				// Make sure all other overrides are also up-to-date
				//for (var j=i-1; j >= 0; j--) {
				//	this.updateOverride(this.overrides[j]);
				//}
				//this.cache = undefined; // FORCE REBUILD
				return true;
			} else {
				over.current = over.start;
				//this.updateOverride(over);
				//this.refresh();
				//this.cache = undefined; // FORCE REBUILD
			}
		}
	}
	return false;
}

function ScopeList() {
	this.raw = [];
	this.caches = [];
}
