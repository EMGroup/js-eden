/**
 * @file
 * @license BSD-2-Clause
 * @copyright Empirical Modelling Group, 2013. All rights reserved.
 */

/**
 * @constructor
 * @memberof module:AST
 * @extends BaseExpression
 */
Eden.AST.HTML = function() {
	this.type = "html";
	this.errors = [];
	this.name = null;
	this.attributes = null;
	this.contents = null;
};
//Eden.AST.BaseExpression.extend(Eden.AST.HTML);

Eden.AST.HTML.prototype.setName = function(name) {
	this.name = name;
}

Eden.AST.HTML.prototype.generate = function() {
	return "undefined";
}

/**
 * @param {string} label
 * @param {object} RHS value expression node
 */
Eden.AST.HTML.prototype.addAttribute = function(label, expr) {
	if (this.attributes === null) this.attributes = {};
	if (expr.errors.length > 0) this.errors.push.apply(this.errors, expr.errors);
	this.attributes[label] = expr;
}

Eden.AST.HTML.prototype.addContent = function(expr) {
	if (this.contents === null) this.contents = [];
	this.contents.push(expr);
	if (expr.errors.length > 0) this.errors.push.apply(this.errors, expr.errors);
}



