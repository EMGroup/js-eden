Eden.AST.Import = function() {
	this.type = "import";
	Eden.AST.BaseStatement.apply(this);

	this.path = "";
	this.options = [];
	this.tag = "default";
}

Eden.AST.Import.prototype.setPath = function(path) {
	this.path = path;
}

Eden.AST.Import.prototype.setTag = function(tag) {
	this.tag = tag;
}

/**
 * Checks the validity of options being added and prevents conflicting
 * combinations.
 */
Eden.AST.Import.prototype.addOption = function(opt) {
	if (opt == "local") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return true;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return false;
	} else if (opt == "remote") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return true;
		if (this.options.indexOf("rebase") >= 0) return false;
	}  else if (opt == "rebase") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("local") >= 0) return false;
		if (this.options.indexOf("remote") >= 0) return false;
		if (this.options.indexOf("rebase") >= 0) return true;
	}  else if (opt == "noexec") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("noexec") >= 0) return true;
		if (this.options.indexOf("force") >= 0) return false;
	}  else if (opt == "force") {
		if (this.options.indexOf("remove") >= 0) return false;
		if (this.options.indexOf("noexec") >= 0) return false;
		if (this.options.indexOf("force") >= 0) return true;
	} else if (opt == "remove") {
		if (this.options.length > 0) return false;
		//return true;
	}

	this.options.push(opt);
	return true;
}

/*Eden.AST.Import.prototype.generate = function(ctx) {
	return "Eden.Agent.importAgent(\""+this.path+"\");";
}*/

/*Eden.AST.Import.prototype.execute = function(ctx, base, scope, agent) {
	this.executed = 1;
	var me = this;

	if (eden.peer && agent && !agent.loading) eden.peer.imports(this.path, this.tag, this.options);

	Eden.Agent.importAgent(this.path, this.tag, this.options, function(ag, msg) {
		if (ag) {
			for (var i=0; i<base.imports.length; i++) {
				if (base.imports[i] === ag) return;
			}
			base.imports.push(ag);
		} else {
			me.executed = 3;
			me.errors.push(new Eden.RuntimeError(base, Eden.RuntimeError.NOAGENT, me, "\""+me.path+"@"+me.tag+"\" does not exist: "+msg));
			if (me.parent) me.parent.executed = 3;
		}
	});
}*/

Eden.AST.Import.prototype.setSource = Eden.AST.BaseStatement.setSource;
Eden.AST.Import.prototype.getSource = Eden.AST.BaseStatement.getSource;

Eden.AST.Import.prototype.error = fnEdenASTerror;

