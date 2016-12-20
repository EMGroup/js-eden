Eden.Project = function(id, title, author, tags, source) {
	this.title = title;
	this.name = title.replace(/[^a-bA-B0-9]/g, "");
	this.author = author;
	this.tags = tags;
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this);
}

Eden.Project.fromOldPath = function(path, tag, cb) {
	Eden.Agent.importAgent(path, tag, ["noexec"], function(ag) {
		var src = ag.getSource();
		eden.project = new Eden.Project(ag.meta.saveID, path, ag.meta.author, [], src);
		if (cb) cb(eden.project);
	});
}

Eden.Project.prototype.load = function() {
	// Get patches from local storage... but don't apply
	this.ast.execute(this);
}

Eden.Project.prototype.restore = function() {
	// Get local patches and do apply them...
}

Eden.Project.prototype.patch = function(oldast, newast) {
	
}

Eden.Project.prototype.generate = function() {
	var res = "";

	// Recursively extract source of children?
	function getSource(ast) {
		if (ast.patch) {
			res += ast.getSource();
			return;
		}

		// Get outer start source
		var start = ast.start;
		var end = ast.statements[0].start;
		var p = ast;
		while (p.parent) p = p.parent;
		var base = p.base;

		//res += base.stream.code.substring(start,end);

		for (var i=0; i<ast.statements.length; i++) {
			if (ast.statements[i].patched) {
				console.log("PATCHED",ast.statements[i]);
				end = ast.statements[i].start;
				res += base.stream.code.substring(start,end);
				getSource(ast.statements[i]);
				start = ast.statements[i].end;
				end = ast.statements[i].end;
				//getSource(ast.statements[i]);
			} else {
				end = ast.statements[i].end;
			}
		}

		//start = ast.statements[ast.statements.length-1].end;
		end = ast.end;

		res += base.stream.code.substring(start,end);

		// For each child statement get source
		// Add outer end source.
	}

	getSource(this.ast.script);
	return res;
}

