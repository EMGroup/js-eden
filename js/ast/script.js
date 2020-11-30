Eden.AST.Script = function() {
	this.type = "script";
	Eden.AST.BaseScript.apply(this);
	this.name = undefined;
	this.active = false;
	this.base = undefined;
	this.prefix = "";
	this.postfix = "";
	this.readables = null;
	this.writables = null;
};

Eden.AST.registerScript(Eden.AST.Script);

/**
 * Recursive search of all imports for the required action code.
 */
Eden.AST.Script.prototype.getActionByName = function(name) {
	var script;

	// TODO Add index to boost performance.

	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type == "script" && this.statements[i].name == name) return this.statements[i];
	}

	return script;
}

Eden.AST.Script.prototype.getSource = function() {
	return this.prefix + this.getInnerSource() + this.postfix;
}

Eden.AST.Script.prototype.getInnerSource = function() {
	var res = "";
	for (var i=0; i<this.statements.length; i++) {
		res += this.statements[i].getSource();
	}
	return res;
}

Eden.AST.Script.prototype.patchInner = function(ast) {
	var p = this;
	while (p.parent) {
		p = p.parent;
	}

	var added = [];
	var removed = [];

	var path = Eden.Selectors.getID(this);

	// Transfer state
	var statindex = {};
	for (var i=0; i<this.statements.length; i++) {
		var stat = this.statements[i];
		if (statindex[stat.id] === undefined) statindex[stat.id] = [];
		statindex[stat.id].push(stat);
	}
	for (var i=0; i<ast.statements.length; i++) {
		var stat = ast.statements[i];
		stat.buildID();

		// Replace existing ... no change
		if (statindex[stat.id] && statindex[stat.id].length > 0) {
			//this.ast.script.statements[i] = statindex[stat.id];
			ast.replaceChild(i, statindex[stat.id][0]);
			statindex[stat.id].shift();
			if (statindex[stat.id].length == 0) delete statindex[stat.id];
		// Insert new statement
		} else {
			if (stat.type != "dummy" && this.indexed) stat.addIndex();

			if (stat.type == "dummy") {
				added.push({index: i, path: path, source: stat.getSource(), id: (stat.previousSibling) ? stat.previousSibling.id : 0, ws: true});
			} else {
				added.push({index: i, path: path, source: stat.getSource(), ws: false});
			}
			//var stats = Eden.Selectors.queryWithin([stat], ">>");
			//for (var j=0; j<stats.length; j++) Eden.Index.update(stats[j]);
		}
	}

	// Remove any remaining
	for (var x in statindex) {
		var stats = statindex[x];
		for (var i=0; i<stats.length; i++) {
			if (stats[i].type == "when" && stats[i].enabled) {
				eden.project.removeAgent(stats[i]);
			}
			if (stats[i].type == "dummy") {
				removed.push({path: path, id: (stats[i].previousSibling) ? stats[i].previousSibling.id : 0, ws: true});
			} else {
				removed.push({path: path, id: stats[i].id, ws: false});
			}
			if (this.indexed && stats[i].executed == 0) {
				//console.log("Remove index for",statindex[x]);
				stats[i].removeIndex();
				//var stats = Eden.Selectors.queryWithin([statindex[x]], ">>");
				//for (var j=0; j<stats.length; j++) Eden.Index.remove(stats[j]);
			} else {
				stats[i].destroy();
			}
		}
	}

	if (this.parent === undefined) {
		// May need to replace the ACTIVE virtual root
		for (var i=0; i<ast.statements.length; i++) {
			if (ast.statements[i].type == "script" && ast.statements[i].name == "ACTIVE") {
				ast.statements[i] = eden.root;
				Eden.Index.remove(ast.statements[i]);
				//ast.scripts["ACTIVE"] = eden.root;
			} else {
				ast.statements[i].parent = this;
			}
		}
	} else {
		for (var i=0; i<ast.statements.length; i++) {
			// Each parent must be updated to real parent
			ast.statements[i].parent = this;
			//Eden.Index.update(ast.script.statements[i]);
		}
	}

	// Patch the statements
	this.statements = ast.statements;
	//this.base = ast;

	if (this.subscribers) {
		for (var sub in this.subscribers) {
			eden.root.expireEdenSymbol(this.subscribers[sub]);
		}
	}

	// Make sure there is always a blank line after a # comment
	/*if (this.statements.length > 0 && this.statements[this.statements.length-1].type == "dummy") {
		var lstat = this.statements[this.statements.length-1];
		if (lstat.source.charAt(lstat.source.length-1) != "\n") {
			console.log("ADD END LINE");
			lstat.source += "\n";
		}
	}*/

	// Update script index...
	// Is this needed now??
	//for (var x in ast.scripts) {
	//	p.base.scripts[x] = ast.scripts[x];
	//}

	return [added, removed];
}

Eden.AST.Script.prototype.patchOuter = function(node) {
	
}

Eden.AST.Script.prototype.getLine = function() {
	return this.line;
}

Eden.AST.Script.prototype.isRemote = function() {
	var p = this;
	while (p.parent) p = p.parent;
	return p.base.origin.remote;
}

Eden.AST.Script.prototype.setLocals = function(locals) {
	this.locals = locals;
	if (locals) {
		this.errors.push.apply(this.errors, locals.errors);
	}
}

Eden.AST.Script.prototype.subscribeDynamic = function(ix,name) {
	return eden.root.lookup(name);
}

Eden.AST.Script.prototype.getParameterByNumber = function(index) {
	if (this.parameters) {
		return this.parameters[index-1];
	}
	return undefined;
}

Eden.AST.Script.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.Script.prototype.setName = function(base, name) {
	this.name = name;
	this.shortName = name;
}

Eden.AST.Script.prototype.setReadables = function(readables) {
	this.readables = readables;
}

Eden.AST.Script.prototype.setWritables = function(writables) {
	this.writables = writables;
}

Eden.AST.Script.prototype.setSource = function(start, end, src) {
	this.start = start;
	this.end = end;

	if (!src) return;

	if (this.statements.length == 0) {
		
	} else {
		this.prefix = src.substring(0, this.statements[0].start-start);
		this.postfix = src.substring(this.statements[this.statements.length-1].end-start);
	}

	this.numlines = 0;
	for (var i=0; i<this.prefix.length; i++) if (this.prefix.charAt(i) == "\n") this.numlines++;
	for (var i=0; i<this.postfix.length; i++) if (this.postfix.charAt(i) == "\n") this.numlines++;
}

Eden.AST.Script.prototype.execute = function(ctx, base, scope, agent) {
	var filtered = [];
	this.executed = 1;

	// TODO Optimise by compiling if possible
	// Blocking statements would need special treatment and it may not always
	// be possible to compile them simply.

	if (this.locals && this.locals.list.length > 0) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.locals.list.length; i++) {
			ctx.locals[this.locals.list[i]] = new Eden.AST.Local(this.locals.list[i]);
		}
	}

	// Remove nested scripts that shouldn't be executed
	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "script" && this.statements[i].type != "section") filtered.push(this.statements[i]);
	}
	return filtered;
}

Eden.AST.Script.prototype.generate = function(ctx, scope, options) {
	var result = "{\n";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx, scope, options);
	}
	result = result + "}";
	return result;
}

