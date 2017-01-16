Eden.AST.Script = function() {
	this.type = "script";
	Eden.AST.BaseScript.apply(this);
	this.name = undefined;
	this.active = false;
	this.base = undefined;
	this.prefix = "";
	this.postfix = "";
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

Eden.AST.Script.prototype.patchScript = function(ast) {
	var p = this;
	while (p.parent) {
		p = p.parent;
	}

	if (this.parent === undefined) {
		// May need to replace the ACTIVE virtual root
		for (var i=0; i<ast.script.statements.length; i++) {
			if (ast.script.statements[i].type == "script" && ast.script.statements[i].name == "ACTIVE") {
				ast.script.statements[i] = eden.root;
				Eden.Index.remove(ast.scripts["ACTIVE"]);
				ast.scripts["ACTIVE"] = eden.root;
			} else {
				ast.script.statements[i].parent = this;
			}
		}
	} else {
		for (var i=0; i<ast.script.statements.length; i++) {
			// Each parent must be updated to real parent
			ast.script.statements[i].parent = this;
			//Eden.Index.update(ast.script.statements[i]);
		}
	}

	// Patch the statements
	this.statements = ast.script.statements;
	this.base = ast;

	// Update script index...
	// Is this needed now??
	//for (var x in ast.scripts) {
	//	p.base.scripts[x] = ast.scripts[x];
	//}
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

