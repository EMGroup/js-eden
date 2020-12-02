/**
 * @file
 * @license BSD-2-Clause
 * @copyright Empirical Modelling Group, 2013. All rights reserved.
 */

var htmltags = {
	"h1": true,
	"h2": true,
	"h3": true,
	"h4": true,
	"h5": true,
	"h6": true,
	"input": true,
	"form": true,
	"p": true,
	"div": true,
	"span": true,
	"b": true,
	"i": true,
	"ul": true,
	"ol": true,
	"li": true,
	"button": true,
	"a": true,
	"img": true,
	"canvas": true,
	"video": true
};

function patchDOM(parent, child, num) {
	if (!child || !parent) return;
	if (typeof child == "string" || typeof child == "number") {
		if (parent.childNodes[num] && parent.childNodes[num].nodeType == "#text") {
			if (parent.childNodes[num].textContent != child) {
				parent.childNodes[num].textContent = child;
			}
			return;
		}
		child = document.createTextNode(child);
	}

	if (Array.isArray(child)) {
		var count = 0;
		for (var i=0; i<child.length; i++) {
			count += patchDOM(parent, child[i], num+i);
		}
		return count;
	} else {
		if (!parent.childNodes || parent.childNodes.length <= num) {
			try { parent.appendChild(child); } catch(e) {}
		} else if (parent.childNodes[num] === child) {

		} else {
			console.log("PATCH DOM", child);
			try { parent.replaceChild(child, parent.childNodes[num]); } catch(e) {}
		}
		return 1;
	}
}
rt.patchDOM = patchDOM;

rt.cleanDOM = function(parent, num) {
	if (!parent || !parent.childNodes) return;
	while (parent.childNodes.length > num) {
		parent.removeChild(parent.lastChild);
	}
}

var classSym = Symbol("classname");
var classcount = 1;

function cssFromObject(obj) {
	var rules = [];
	var res = "{";
	for (var x in obj) {
		var c0 = x.charAt(0);
		if (c0 == ":" || c0 == "." || c0 == "#" || c0 == "@") {
			rules.push(x+cssFromObject(obj[x]).join(x+": "));
		} else if (htmltags.hasOwnProperty(x.split(/\s|\.|#|:/)[0])) {
			rules.push(x+" "+cssFromObject(obj[x]).join(x+": "));
		} else {
			res += camel2Dash(x)+": "+obj[x]+";\n";
		}
	}
	return [res + "}\n"].concat(rules);
}

rt.setStyle = function(node, style) {
	if (typeof style == "string") {
		node.setAttribute("style", style);
	} else {
		var classname;
		var stylenode = document.getElementById("dynastyles");
		if (!stylenode) {
			stylenode = document.createElement("style");
			stylenode.setAttribute("id", "dynastyles");
			document.head.appendChild(stylenode);
		}
		var sheet = stylenode.sheet;
		classname = style[classSym];
		if (!classname) {
			classname = "class"+classcount;
			classcount++;
			style[classSym] = classname;
		}

		var rules = cssFromObject(style);
		for (var i=0; i<rules.length; i++) {
			// TODO Check if rule exists and replace if needed

			var c0 = rules[i].charAt(0);
			if (c0 == ":" || c0 == "." || c0 == "#") {
				sheet.insertRule("."+classname+rules[i], sheet.cssRules.length);
			} else {
				sheet.insertRule("."+classname+" "+rules[i], sheet.cssRules.length);
			}
		}

		if (classname) {
			var classes = (node.className) ? node.className.split(" ") : [];
			if (classes.indexOf(classname) == -1) {
				classes.push(classname);
				node.className = classes.join(" ");
			}
		}
	}
}

var attributemapping = {
	"class":"className"
}

var svgtags = {
	"svg": true,
	"rect": true
};

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

Eden.AST.HTML.prototype.generate = function(ctx,scope,opt) {
	var res = '(function($o) {\n';
	var xmlns = null;

	if (this.attributes && this.attributes.hasOwnProperty("xmlns")) xmlns = this.attributes.xmlns.value;
	else if (parent && parent.attributes && parent.attributes.hasOwnProperty("xmlns")) xmlns = parent.attributes.xmlns.value;
	else if (svgtags.hasOwnProperty(this.name.toLowerCase())) xmlns = "http://www.w3.org/2000/svg";
	else if (parent && svgtags.hasOwnProperty(parent.name)) xmlns = "http://www.w3.org/2000/svg";

	if (xmlns !== null) {
		res += 'let ele = ($o) ? $o : document.createElementNS("'+xmlns+'", "'+this.name+'");\n';
	} else {
		res += 'let ele = ($o && $o.nodeName == "'+this.name+'") ? $o : document.createElement("'+this.name+'");\n';
	}

	if (this.attributes !== null) {
		for (var x in this.attributes) {
			if (x == "xmlns") continue;
			//var name = attributemapping[x];
			//if (!name) name = x;

			if (x.startsWith("on")) {
				if (this.attributes[x].type != "primary") {
					// This is an ERROR
				} else {
					if (this.attributes[x].backticks === undefined) {
						res += 'ele["'+x.toLowerCase()+'"] = function(e) { eden.root.lookup("'+this.attributes[x].observable+'").assign(true, eden.root.scope, EdenSymbol.hciAgent); };\n';
					} else {
						res += 'ele["'+x.toLowerCase()+'"] = function(e) { eden.root.lookup('+this.attributes[x].backticks.generate(ctx,scope,opt)+').assign(true, eden.root.scope, EdenSymbol.hciAgent); };\n';
					}
				}
			} else if (x == "style") {
				res += "rt.setStyle(ele, "+this.attributes[x].generate(ctx,scope,opt)+");\n";
			} else {
				res += "ele.setAttribute(\""+x+"\","+this.attributes[x].generate(ctx,scope,opt)+");\n";
			}
		}
	}
	if (this.contents !== null) {
		res += "let count=0;\n";
		for (var i=0; i<this.contents.length; i++) {
			res += "let item = "+this.contents[i].generate(ctx,scope,opt);
			if (this.contents[i].type == "html") res += "(ele.childNodes["+i+"]);\n";
			else res += ";\n";
			res += 'count += rt.patchDOM(ele, item, count);\n';
		}
		res += 'rt.cleanDOM(ele, count);\n';
	}
	//if (!opt) {
		//console.log(ctx);
		res += "return ele;\n})(this.cache.value)";
	//} else {
	//	res += "return ele;\n})";
	//}
	return res;
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



