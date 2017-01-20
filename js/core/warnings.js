/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */



/**
 * Constructor for syntax warnings detected in the new parser. It captures the
 * type of warning, the context and location.
 */
Eden.SyntaxWarning = function(context, node, warnno, extra) {
	this.type = "syntax";
	this.context = context;
	this.node = node;
	this.warnno = warnno;
	this.extra = extra;
	this.token = context.token;
	this.prevtoken = context.previous;
	this.line = context.stream.prevline;
	this.position = context.stream.position;
	this.prevposition = context.stream.prevposition;
};

Eden.SyntaxWarning.UNKNOWN = 0;
Eden.SyntaxWarning.DEPRECATED = 1;
Eden.SyntaxWarning.NESTEDWHEN = 2;
Eden.SyntaxWarning.DEFINWHEN = 3;
Eden.SyntaxWarning.EXPRESSIONLIT = 4;

Eden.SyntaxWarning.prototype.messageText = function() {
	var res;
	switch(this.warnno) {
	case Eden.SyntaxWarning.DEPRECATED:	res = "Deprecation: "; break;
	case Eden.SyntaxWarning.NESTEDWHEN:	res = "\"when\"'s should not be nested"; break;
	case Eden.SyntaxWarning.DEFINWHEN:	res = "\"when\"'s should not contain definitions"; break;
	case Eden.SyntaxWarning.EXPRESSIONLIT:	res = "Keep literals in separate observables"; break;
	case Eden.SyntaxWarning.USEOFWHILE:	res = "Try and use 'for', 'when' or 'with' to achieve looping"; break;
	default: res = "Warning: ";
	}

	res += this.extra;
	return res;
}

Eden.RuntimeWarning = function(node, warnno, extra) {
	this.type = "runtime";
	this.node = node;
	this.warnno = warnno;
	this.extra = extra;
	this.line = -1;
}

Eden.RuntimeWarning.UNKNOWN = 0;
Eden.RuntimeWarning.EMPTYDO = 1;
Eden.RuntimeWarning.UNDEFINED = 2;

Eden.RuntimeWarning.prototype.messageText = function() {
	var res;
	switch(this.warnno) {
	case Eden.RuntimeWarning.EMPTYDO:	res = "Empty result for: "; break;
	case Eden.RuntimeWarning.UNDEFINED:	res = "Expression is undefined: "; break;
	default: res = "Warning: ";
	}

	if (this.extra !== undefined) res += this.extra;
	return res;
}


