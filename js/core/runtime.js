/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

//data types
Point = function(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype.toString = function() {
  return "{" + Eden.edenCodeForValue(this.x) + ", " + Eden.edenCodeForValue(this.y) + "}";
};
Point.prototype.getEdenCode = Point.prototype.toString;

// functions to act in the same way as EDEN operators
var rt = {
	index: function (ix) {
		var type = typeof ix;
		if (type == "number") {
			return ix-1;
		} else {
			return ix;
		}
	},

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
		} else if (a instanceof Point) {
			return new Point(a.x + b.x, a.y + b.y);
		} else {
			return a + b;
		}
	},

	subtract: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		} else if (a instanceof Point) {
			return new Point(a.x - b.x, a.y - b.y);
		} else {
			return a - b;
		}
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

	pow: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		}
		return Math.pow(a, b);
	},

	concat: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		} else if (Array.isArray(a)) {
			if (Array.isArray(b)) {
				return a.concat(b);
			} else {
				eden.error(new Error(
					"Concatenation: When the left hand side is a list then the right hand side must " +
					"also be a list, not a " + typeof(b)
				));
				return undefined;
			}
		} else if (Array.isArray(b)) {
			eden.error(new Error(
				"Concatenation: When the right hand side is a list then the left hand side must " +
				"also be a list, not a " + typeof(a)
			));
			return undefined;
		} else {
			return String(a) + b;
		}
	},

	regExpMatch: function (subject, pattern) {
		if (subject === undefined || pattern === undefined) {
			return undefined;
		} else if (pattern instanceof RegExp) {
			return pattern.test(subject);
		} else {
			return (new RegExp(pattern)).test(subject);
		}
	},
	
	regExpNotMatch: function (subject, pattern) {
		if (subject === undefined || pattern === undefined) {
			return undefined;
		} else if (pattern instanceof RegExp) {
			return !pattern.test(subject);
		} else {
			return !(new RegExp(pattern)).test(subject);
		}
	}

};

this.rt = rt;

// expose as node.js module
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
	exports.rt = rt;
}
