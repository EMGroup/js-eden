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

	includeJS: function (url, success) {
		if (url.match(/.js$/)) {
			$.getScript(url, success);
		} else if (url.match(/.jse$/)) {
			if (url.match(/^http/)) {
				// cross host
				$.getScript(rt.config.jseProxyBaseUrl + '?successCallback=eden.execute&url=' + encodeURIComponent(url));
			} else {
				// same host, no need to use JSONP proxy
				$.get(url, function (data) {
					eden.execute(data);
				});
			}
		}
	}
};

this.rt = rt;
