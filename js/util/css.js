/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 *
 * JavaScript functions for manipulating CSS.
 * Used by library/html.js-e and the canvas.
 *
 */

CSSUtil = {};

/**Replaces one style with another.  The target can either be a HTMLElement or a CSSStyleRule
 * (JavaScript objects for the parts between the braces in a style sheet).  The value can either be:
 * (1) Undefined, which sets the style attribute to the empty string (or empties the style sheet block).
 * (2) A string containing zero or more valid CSS attribute and value pairs separated by semicolons.
 * (3) A JavaScript object where the keys are the CSS attribute names and the values are strings
 *     representing the corresponding CSS values.
 */
CSSUtil.setStyle = function (elementOrCSSRule, value) {
	var style = elementOrCSSRule.style;
	if (value === undefined) {
		style.cssText = "";
	} else if (typeof(value) == "object") {
		var capital = /([A-Z])/g;
		function replaceCapital(match, capitalLetter) {
			return "-" + capitalLetter.toLowerCase();
		}
		var jsSyntax = /^\w*[A-Z]\w*$/;
		var declarations = "";
		for (var key in value) {
			if (typeof(value[key]) == "string") {
				var property;
				if (jsSyntax.test(key)) {
					property = key.replace(capital, replaceCapital);
				} else {
					property = key;
				}
				declarations = declarations + property + ": " + value[key] + ";\n";
			}
		}
		style.cssText = declarations;
	} else {
		style.cssText = value;
	}
}
