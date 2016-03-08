/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 *
 * JavaScript functions for manipulating URLs.
 *
 */
 
 URLUtil = {};
 
 /**Utility function to extract a URL query parameter.
  */
URLUtil.getParameterByName = function (name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var url = window.location.href;
	var result = regex.exec(url);
	if (result === null) {
		return "";
	} else {
		return decodeURIComponent(result[1].replace(/\+/g, " "));
	}
}

 /**Utility function to extract a URL query parameter that can occur more than once.
  */
URLUtil.getArrayParameterByName = function (name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS, "g");
	var url = window.location.href;
	var result = regex.exec(url);
	var values = [];
	while (result !== null) {
		var value = decodeURIComponent(result[1].replace(/\+/g, " "));
		values.push(value);
		result = regex.exec(url);
	}
	return values;
}

/**Tests if trying to access a particular URL could result in a cross-site scripting security
 * exception being thrown.
 */
URLUtil.isCrossDomain = function (url) {
	var match = url.match(/^([a-zA-Z][a-zA-Z\d+.-]*:)(\/\/)?([^\/@]*@)?([^\/:]+)(:\d+)?(\/|$)/);
	return match !== null &&
		(match[1] != window.location.protocol || match[4] != document.domain ||
		match[5].slice(1) != window.location.port);
}

/**Wrapper function for downloading files using AJAX.
 * Differences between this function and jQuery's $.ajax function:
 *   * Bypasses cross-domain restrictions (using a proxy server).
 *   * The data type defaults to "text" rather than automatic detection.
 *   * The async property has been inverted to a sync property instead.
 *   * Forces the caller to provide values for the url, sync, success and error properties, so that
 *       there is no ambiguity about the result.
 */
URLUtil.downloadFile = function (settings) {
	var url = settings.url;
	var dataType = settings.dataType;
	var synchronous = settings.sync;
	var success = settings.success;
	var error = settings.error;

	if (dataType === undefined) {
		dataType = "text";
	}

	if (typeof(error) != "function") {
		throw new Error("An error handling function must be specified.");
	} else if (typeof(success) != "function") {
		error(null, "error", "A success callback function must be specified.");
		return;
	} else if (url === undefined) {
		error(null, "error", "A URL must be specified.");
		return;
	}

	url = String(url);
	var proxyURL = rt.config.proxyBaseURL;
	var urlIsCrossDomain = this.isCrossDomain(url);

	if (synchronous === true && urlIsCrossDomain && this.isCrossDomain(proxyURL)) {
		error(null, "error", "Synchronous downloading not possible");
		return;
	} else if (typeof(synchronous) != "boolean") {
		error(null, "error", "The sync option must be a boolean, not a " + typeof(synchronous));
		return;
	}

	if (urlIsCrossDomain) {
		var callbackName = "crossDomainCallback" + Math.floor(Math.random() * 9007199254740991);
		window[callbackName] = function (response) {
			try {
				if (response.success) {
					var content = response.success;
					var erroneous = false;
					var result;
					switch (dataType) {
					case "text":
						result = content;
						break;
					case "json":
						try {
							result = JSON.parse(content);
						} catch (e) {
							error(null, "parserror", e);
							erroneous = true;
						}
						break;
					default:
						error(
							null,
							"error",
							"No cross-domain interpretation available for data type " + dataType
						);
						erroneous = true;
					}
					if (!erroneous) {
						success(result, "success", null);
					}
				} else {
					error(null, "error", response.error);
				}
			} finally {
				delete window[callbackName];
			}
		};

		return $.ajax({
			url: proxyURL + "?url=" + encodeURI(url) + "&callback=" + callbackName,
			dataType: "script",
			async: !synchronous,
			error: error,
		});
	} else {
		settings.async = !synchronous;
		return $.ajax(settings);
	}
}
