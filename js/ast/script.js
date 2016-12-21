Eden.AST.Script = function() {
	this.type = "script";
	Eden.AST.BaseScript.apply(this);
	this.name = undefined;
	this.active = false;
	this.base = undefined;
	
};

Eden.AST.Script.prototype.getSource = function() {
	if (this.patched && !this.patch) {
		//if (ast.patch) {
		//	res += ast.getSource();
		//	return;
		//}

		// Get outer start source
		var res = "";
		var start = this.start;
		var end = this.statements[0].start;
		var p = this;
		while (p.parent) p = p.parent;
		var base = p.base;

		//res += base.stream.code.substring(start,end);

		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].patched) {
				console.log("PATCHED",this.statements[i]);
				end = this.statements[i].start;
				res += base.stream.code.substring(start,end);
				res += this.statements[i].getSource();
				start = this.statements[i].end;
				end = this.statements[i].end;
				//getSource(ast.statements[i]);
			} else {
				end = this.statements[i].end;
			}
		}

		//start = ast.statements[ast.statements.length-1].end;
		end = this.end;

		res += base.stream.code.substring(start,end);
		return res;
	} else {
		var ast = this.base;
		if (ast === undefined) {
			var p = this;
			while (p.parent) p = p.parent;
			ast = this.base;
		}

		if (this.patch) {
			var prefix = ast.stream.code.slice(this.start, this.oldstats[0].start);
			var postfix = ast.stream.code.slice(this.oldstats[this.oldstats.length-1].end, this.end);
			return prefix + this.patch.script.getSource() + postfix;
		} else {
			return ast.getSource(this);
		}
	}
}

Eden.AST.Script.prototype.getInnerSource = function() {
	if (this.patch) return this.patch.script.getSource();

	if (this.patched) {
		//if (ast.patch) {
		//	res += ast.getSource();
		//	return;
		//}

		// Get outer start source
		var res = "";
		var start = this.statements[0].start;
		var end = this.statements[0].start;
		var p = this;
		while (p.parent) p = p.parent;
		var base = p.base;

		//res += base.stream.code.substring(start,end);

		for (var i=0; i<this.statements.length; i++) {
			if (this.statements[i].patched) {
				console.log("PATCHED",this.statements[i]);
				end = this.statements[i].start;
				res += base.stream.code.substring(start,end);
				res += this.statements[i].getSource();
				start = this.statements[i].end;
				end = this.statements[i].end;
				//getSource(ast.statements[i]);
			} else {
				end = this.statements[i].end;
			}
		}

		//start = ast.statements[ast.statements.length-1].end;
		//end = this.end;

		res += base.stream.code.substring(start,end);
		return res;
	} else {
		var ast = this.base;
		if (ast === undefined) {
			var p = this;
			while (p.parent) p = p.parent;
			ast = this.base;
		}
		return ast.stream.code.slice(this.statements[0].start,this.statements[this.statements.length-1].end).trim();
	}
}

Eden.AST.Script.prototype.patchScript = function(ast) {
	this.patched = true;
	var p = this.parent;
	while (p) {
		p.patched = true;
		p = p.parent;
	}
	if (!this.patch) this.oldstats = this.statements;

	this.patch = ast;
	this.statements = ast.script.statements;

	// Extract outer source prefix
	
	// Extract outer source postfix

	//this.patch_inner = newsrc;
	//this.patch_src = outer_pre + newsrc + outer_post;
	//this.statements = newstats;
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
	this.name = "*Action:"+base.origin.name+":"+name;
	this.shortName = name;
}

Eden.AST.Script.prototype.setSource = function(start, end) {
	this.start = start;
	this.end = end;
}

Eden.AST.Script.prototype.append = function (ast) {
	this.statements.push(ast);
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

