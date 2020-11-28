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
Point.prototype.toString = function(p) {
  return "Point(" + Eden.edenCodeForValue(this.x, undefined, p) + ", " + Eden.edenCodeForValue(this.y, undefined, p) + ")";
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

	flattenPromise: function(p) {
		if (p instanceof Promise) {
			return p;
		} else if (Array.isArray(p)) {
			if (p.length > 0 && p[0] instanceof Promise) {
				return Promise.all(p);
			} else {
				return Promise.resolve(p);
			}
		} else {
			return Promise.resolve(p);
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
	
	notequal: function(a,b) { return !rt.equal(a,b); },

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

	/* Arithmetic only version */
	addA: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
		} else {
			return a + b;
		}
	},

	/* Arithmetic only version */
	subtractA: function (a, b) {
		if (a === undefined || b === undefined) {
			return undefined;
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
				throw new Error(Eden.RuntimeError.LEFTCONCAT);
				return a;
			}
		} else if (Array.isArray(b)) {
			throw new Error(Eden.RuntimeError.RIGHTCONCAT);
			return a + JSON.stringify(b);
		} else {
			return String(a) + b;
		}
	},

	/* String only version */
	concatS: function (a, b) {
		if (a === undefined || b === undefined) {
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
