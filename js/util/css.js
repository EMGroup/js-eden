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

/**Gets the CSS rule associated with a particular selector, creating a new rule if no existing rule
 * has an identical selector.  The new rules are grouped together in a single additional style sheet,
 * which is appended to the end of the document (if it doesn't already exist).  If more than one
 * existing rule matches the given the selector then the rule declared last in the document is
 * returned (i.e. the one that takes precedence over the others).
 */
CSSUtil.getStyle = function (selector) {
	var sheetList = document.styleSheets;
	for (var i = sheetList.length - 1; i >= 0; i--) {
	   var ruleList = sheetList[i].cssRules;
	   for (var j = ruleList.length - 1; j >= 0; j--) {
		   if (ruleList[j].type == CSSRule.STYLE_RULE && ruleList[j].selectorText == selector) {
			   return ruleList[j].style;
		   }
	   }
	}
	//No matching rule found so create one.
	var styleElement = document.getElementById("javascript-injected-styles");
	if (styleElement === null) {
		var bodyElement = document.getElementsByTagName("body")[0];
		styleElement = document.createElement("style");
		styleElement.id = "javascript-injected-styles";
		bodyElement.appendChild(styleElement);
	}
	var stylesheet = styleElement.sheet;
	stylesheet.insertRule(selector + "{ }", stylesheet.cssRules.length);
	return stylesheet.cssRules[0].style;
}
