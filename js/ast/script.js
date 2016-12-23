Eden.AST.Script = function() {
	this.type = "script";
	Eden.AST.BaseScript.apply(this);
	this.name = undefined;
	this.active = false;
	this.base = undefined;
	this.prefix = "";
	this.postfix = "";
};

/**
 * Recursive search of all imports for the required action code.
 */
Eden.AST.Script.prototype.getActionByName = function(name) {
	var script;

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
		if (typeof this.statements[i].getSource != "function") console.error("NO GET SOURCE", this.statements[i].type);
		res += this.statements[i].getSource();
	}
	return res;
}

Eden.AST.Script.prototype.patchScript = function(ast) {
	var p = this;
	while (p.parent) {
		p = p.parent;
	}

	for (var i=0; i<this.statements.length; i++) {
		if (ast.script.statements[i].type == "script" && ast.script.statements[i].name == "ACTIVE") {
			console.log("PATCH ROOT");
			ast.script.statements[i] = eden.root;
			ast.scripts["ACTIVE"] = eden.root;
			break;
		}
	}

	this.statements = ast.script.statements;

	// TODO The virtual ACTIVE action needs replacing...
	//if (this.base.origin === eden.project) {
		
	//}

	// Update script index...
	for (var x in ast.scripts) {
		p.base.scripts[x] = ast.scripts[x];
	}
}

Eden.AST.Script.prototype.getLine = function() {
	return this.line;
}

Eden.AST.Script.prototype.setLocals = function(locals) {
	this.locals = locals;
	if (locals) {
		this.errors.push.apply(this.errors, locals.errors);
	}
}

Eden.AST.Script.prototype.subscribeDynamic = function(ix,name) {
	console.log("SUBDYN: " + name);
	return eden.root.lookup(name);
}

Eden.AST.Script.prototype.getParameterByNumber = function(index) {
	if (this.parameters) {
		return this.parameters[index-1];
	}
	return undefined;
}

Eden.AST.Script.prototype.error = fnEdenASTerror;

Eden.AST.Script.prototype.setName = function(base, name) {
	this.name = name;
	this.shortName = name;
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
}

Eden.AST.Script.prototype.append = function (ast) {
	this.statements.push(ast);
	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

Eden.AST.Script.prototype.insertBefore = function(before, ast) {
	var ix;
	for (ix = 0; ix<this.statements.length; ix++) {
		if (this.statements[ix] === before) break;
	}
	if (ix < this.statements.length) {
		this.statements.splice(ix, 0, ast);
	} else {
		// Should this error?
		this.statements.push(ast);
	}

	if (ast.errors.length > 0) {
		this.errors.push.apply(this.errors, ast.errors);
	}
}

Eden.AST.Script.prototype.execute = function(ctx, base, scope, agent) {
	var filtered = [];
	this.executed = 1;

	if (this.locals && this.locals.list.length > 0) {
		if (ctx.locals === undefined) ctx.locals = {};
		for (var i=0; i<this.locals.list.length; i++) {
			ctx.locals[this.locals.list[i]] = new Eden.AST.Local(this.locals.list[i]);
		}
	}

	for (var i=0; i<this.statements.length; i++) {
		if (this.statements[i].type != "script") filtered.push(this.statements[i]);
	}
	return filtered;
}

Eden.AST.Script.prototype.generate = function(ctx, scope) {
	var result = "{\n";
	for (var i = 0; i < this.statements.length; i++) {
		result = result + this.statements[i].generate(ctx, scope, {bound: false});
	}
	result = result + "}";
	return result;
}

