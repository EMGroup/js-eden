Eden.AST.BaseStatement = function() {
	this.start = 0;
	this.end = 0;
	this.parent = undefined;
	this.errors = [];
	this.warning = undefined;
	this.executed = 0;
	this.numlines = -1;
	this.doxyComment = undefined;
	this.lock = 0;
	this.source = undefined;
	this.id = 0;
	this.stamp = 0;
	this.nextSibling = undefined;
	this.previousSibling = undefined;
	this.tags = undefined;
	this.local = false;
	this.subscribers = null;
	this.line = -1;
	this.generated = null;
	this.dependencies = Object.create(null);
	this.version = 0;
}

Eden.AST.BaseStatement.attribute = function(name, scope) {
	let val;

	switch(name) {
	case "ast"		:	val = this; break;
	case "brief"	:	if (this.doxyComment) {
							val = this.doxyComment.brief();
						} break;
	case "comment"	:	if (this.doxyComment) {
							val = this.doxyComment.stripped();
						} break;
	case "source"	:	val = this.getSource();
						break;
	case "innersource"	:	if (this.type === "script") {
								val = this.getInnerSource();
							} else if (this.type === "custom") {
								val = this.text;
							} else {
								val = this.getSource();
							} break;
	case "outersource"	:	val = (this.type === "script") ? this.getOuterSource() : this.getSource();
							break;
	case "exprtree"	:	if (this.expression) val = Eden.Selectors.expressionToLists(this.expression);
						break;
	case "expression":	if (this.expression && this.lvalue && this.lvalue.source) {
							val = this.getSource().substr(this.lvalue.source.length).trim();
							if (this.type === "definition") val = val.substring(2,val.length-1).trim();
							else if (this.type === "assignment") val = val.substr(1,val.length-1).trim();
						}
						break;
	case "title"	:	if (this.base && this.base.mainDoxyComment) {
							this.base.mainDoxyComment.stripped();
							var controls = this.base.mainDoxyComment.getControls();
							if (controls && controls["@title"]) val = controls["@title"][0];
						}
						break;
	case "type"		:	val = this.type; break;
	case "locked"	:	val = (this.lock) ? true : false; break;
	case "location"	:	val = this.getLocationName(); break;
	case "name"		:	if (this.lvalue) {
							val = this.lvalue.getSymbol({}, {}, scope).name;
						} else if (this.name && this.type !== "do") {
							val = this.name;
						} else if (this.parent === undefined && this.base && this.base.origin) {
							val = this.base.origin.name;
						} else if (this.path !== undefined) {
							val = this.path;
						} break;
	case "symbol"	:	if (this.lvalue) {
							val = this.lvalue.getSymbol({}, {}, scope);
						} break;
	case "line"		:	if (this.line !== undefined) {
							val = this.line;
						} break; 
	case "depends"	:	val = (this.dependencies) ? Object.keys(this.dependencies) : [];
						break;
	case "datatype"	:	val = (this.expression) ? this.expression.typevalue : 0; break;
	case "value"	: 	try {
							val = (this.expression) ? this.expression.execute({scopes:[]}, {}, scope) : undefined;
						} catch(e) {
						} break;
	case "active"	: 	val = ((this.type === "when" && this.enabled) || (this.lvalue && scope.context.symbols[this.lvalue.name] && scope.context.symbols[this.lvalue.name].origin && scope.context.symbols[this.lvalue.name].origin.id === this.id));
						break;
	case "executed"	:	val = this.executed > 0; break;
	case "historic"	:	val = this.executed == -1; break;
	case "tags"		:	if (this.doxyComment) {
							val = this.doxyComment.getHashTags();
						} break;
	case "rawcomment"	: if (this.doxyComment) {
							val = this.doxyComment.content;
						} break;
	case "controls" :
	case "id"		:	val = this.id; break;
	case "path"		:	val = Eden.Selectors.getID(this); break;
	//case "script"	: 	val = Eden.Selectors.getScriptBase(stat); break;
	case "remote"	:	var p = this;
						while(p.parent) p = p.parent;
						if (!p.base || !p.base.origin) {
							val = false;
							break;
						}
						val = p.base.origin.remote;
						break;

	case "root"		:	val = this.parent === undefined; break;
	case "static"	:	val = (this.lvalue) ? this.lvalue.isstatic : false; break;
	}

	return val;
}

Eden.AST.BaseStatement.addSubscriber = function(dependency) {
	if (!this.subscribers) this.subscribers = {};
	this.subscribers[dependency] = eden.root.lookup(dependency);
}

Eden.AST.BaseStatement.removeSubscriber = function(dependency) {
	delete this.subscribers[dependency];
}

Eden.AST.BaseStatement.setDoxyComment = function(doxy) {
	this.doxyComment = doxy;
	if (doxy) {
		if (this.tags === undefined) {
			this.tags = doxy.getHashTags();
		} else {
			this.tags = this.tags.concat(doxy.getHashTags());
		}

		if (doxy.hasTag("#library")) {
			if (this.type === "function" || this.type === "action") {
				Eden.edenFunctions[this.name] = true;
			} else if (this.type === "definition" || this.type === "assignment") {
				Eden.edenFunctions[this.lvalue.name] = true;
			}
		}
	}
}

Eden.AST.BaseStatement.getLocationName = function() {
	let p = this.parent;
	while (p && !p.name) p = p.parent;
	if (p && p.name) {
		if (p.name == "*When") {
			let pp = p.getLocationName();
			return pp + " > when";
		} else {
			return p.name;
		}
	}

	return "*unknown*";
}

Eden.AST.BaseStatement.buildID = function() {
	var hash = 0;
	var ch;
	var hashstr = this.source;
	// if (this.doxyComment) hashstr = this.doxyComment.content + hashstr;
	//if (this.parent) hashstr += this.parent.id;
	var len = hashstr.length;
	for (var i=0; i<len; i++) {
		ch = hashstr.charCodeAt(i);
		hash = ((hash << 5) - hash) + ch;
		hash = hash & hash;
	}

	if (this.name && this.type != "do") {
		this.id = this.name +"@"+ hash;
	} else if (this.lvalue) {
		this.id = this.lvalue.name + "@" + hash;
	} else {
		this.id = this.type +"@"+ hash;
	}

	var p = this.parent;
	while (p && !p.name) p = p.parent;
	if (p && p.name) this.id = this.id + p.name;
}

Eden.AST.BaseStatement.addIndex = function() {
	//if (this.type == "dummy") console.trace("ADDING DUMMY INDEX");
	this.buildID();
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].addIndex();
		}
	}
	Eden.Index.update(this);
}

Eden.AST.BaseStatement.removeIndex = function() {
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].removeIndex();
		}
	}
	Eden.Index.remove(this);
}

Eden.AST.BaseStatement.destroy = function() {
	if (this.executed < 1) Eden.Index.remove(this);
	this.parent = undefined;
	this.nextSibling = undefined;
	this.previousSibling = undefined;
	if (this.statements) {
		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].type != "dummy") this.statements[i].destroy();
		}
	}
	this.executed = -1;
}

Eden.AST.BaseStatement.hasErrors = function() {
	return this.errors.length > 0;
}

Eden.AST.BaseStatement.getNumberOfLines = function() {
	return this.numlines;
}

Eden.AST.BaseStatement.getNumberOfInnerLines = function() {
	return this.numlines;
}

/** Get start line relative to immediate parent. */
Eden.AST.BaseStatement.getStartLine = function(relative) {
	return (this.parent) ? this.parent.getRelativeLine(this, relative) : -1;
}

Eden.AST.BaseStatement.getEndLine = function(relative) {
	return this.getStartLine(relative) + this.getNumberOfLines();
}

Eden.AST.BaseStatement.getRange = function(relative) {
	var sl = this.getStartLine(relative);
	return [sl,sl+this.getNumberOfLines()];
}

Eden.AST.BaseStatement.setSource = function(start, end, src) {
	this.start = start;
	this.end = end;
	this.source = src;
}

Eden.AST.BaseStatement.getSource = function() {
	return this.source;
}

Eden.AST.BaseStatement.getOuterSource = function() {
	var src = this.getSource();

	if (this.parent === undefined) {
		src = "action " + this.name + "{" + src + "}";
	}

	if (this.doxyComment) {
		src = "/** " + this.doxyComment.content + " */\n"+src;
	}

	var p = this.parent;
	while (p) {
		if (p.type == "script") {
			if (p.name) {
				src = "action "+p.name+" {\n"+src+"\n}";
			} else {
				src = "{\n"+src+"\n}";
			}

			if (p.doxyComment) {
				src = "/** " + p.doxyComment.content + " */\n"+src;
			}
			p = p.parent;
		} else {
			p = undefined;
		}
	}
	return src;
}

Eden.AST.BaseStatement.getOrigin = function() {
	var p = this;
	while (p.parent) p = p.parent;
	if (p.base) return p.base.origin;
	else return undefined;
}

Eden.AST.BaseStatement.getEdenCode = function() {
	return "parse(\""+this.getSource()+"\")";
}
