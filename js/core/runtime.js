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

Point3D = function(x,y,z) { this.x = x; this.y = y; this.z = z; }
Point3D.prototype.toString = function(p) {
  return "Point3D::(" + Eden.edenCodeForValue(this.x, undefined, p) +
		", " + Eden.edenCodeForValue(this.y, undefined, p) +
		", " + Eden.edenCodeForValue(this.z, undefined, p) + ")";
};
Point3D.prototype.getEdenCode = Point.prototype.toString;

Point3D.normal = function(a,b,c) {
	var v1 = vec3.create();
	vec3.set(v1,a[0],a[1],a[2]);
	var v2 = vec3.create();
	vec3.set(v2,b[0],b[1],b[2]);
	var v3 = vec3.create();
	vec3.set(v3,c[0],c[1],c[2]);
	var norm = vec3.create();
	vec3.subtract(v2,v1,v2);
	vec3.subtract(v3,v1,v3);
	vec3.cross(norm, v2,v3);
	return new Point3D(norm[0],norm[1],norm[2]);
}

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
		if (value instanceof BoundValue) return value.value.length;
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
