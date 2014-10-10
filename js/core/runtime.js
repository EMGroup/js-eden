/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

// functions to act in the same way as EDEN operators
var rt = {
	length: function (value) {
		if (value === null || value === undefined) {
			return undefined;
		}
		return value.length;
	},

	equal: function (a, b) {
		var i;

		if (a === b) {
			return true;
		}

		if (a instanceof Array && b instanceof Array) {
			if (a.length !== b.length) {
				return false;
			}

			for (i = 0; i < a.length; ++i) {
				if (!rt.equal(a[i], b[i])) {
					return false;
				}
			}

			return true;
		}

		return false;
	},

	add: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return a + b;
	},

	subtract: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return a - b;
	},

	multiply: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return a * b;
	},

	divide: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return a / b;
	},

	mod: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return a % b;
	},

	includeJS: function (url, success) {
		eden.include(url, success);
	}
};

this.rt = rt;

// expose as node.js module
if (this.module) {
	this.module.exports.rt = rt;
}
