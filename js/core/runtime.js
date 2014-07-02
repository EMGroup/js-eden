/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
 
joe.log("runtime.js: READING SCRIPT");

// functions to act in the same way as EDEN operators
var rt = {
	length: function (value) {
	joe.log("!!! runtime.js: runtimevariable called (this is of interest)");
		if (value == undefined) {
			return undefined;
		}
		return value.length;
	}
};
