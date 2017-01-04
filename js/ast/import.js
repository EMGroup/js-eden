Eden.AST.Import = function() {
	this.type = "import";
	Eden.AST.BaseStatement.apply(this);

	this.path = undefined;
	this.selector = undefined;
	this.statements = undefined;
}

Eden.AST.Import.prototype.setPath = function(path) {
	this.path = path;
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

