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

	includeJSE: function (url) {
		$.getScript(rt.config.jseProxyBaseUrl + '?successCallback=Eden.execute&url=' + encodeURIComponent(url));
	},

	includeJS: function (url, success) {
		$.getScript(url, success);
	}
};

this.rt = rt;
