/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.typeOf = function(sym) {
	var typecount = 0;
	var type = "unknown";
	var deps = sym.getDependencies();
	for (var i=0; i<deps.length; i++) {
		if (deps[i].charCodeAt(0) >= 65 && deps[i].charCodeAt(0) <= 90) {
			type = deps[i];
			typecount++;
		}
	}
	if (typecount > 1) type = "multiple";
	return type;
}

Eden.prototypeOf = function(sym) {
	var type = Eden.typeOf(sym);
	if (type != "multiple" && type != "unknown") {
		return "prototype_"+type;
	} else {
		return "unknown";
	}
}

Eden.membersOf = function(sym) {
	var proto = Eden.prototypeOf(sym);
	var protosym = sym.context.lookup(proto);
	return protosym.getDependencies();
}

