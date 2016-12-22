Eden.Project = function(id, name, source) {
	this.title = undefined;
	this.name = name.replace(/[^a-bA-B0-9]/g, "");
	this.author = undefined;
	this.tags = undefined;
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this);
	this.id = id;

	if (this.ast && this.ast.script.errors.length == 0) {
		if (this.ast.mainDoxyComment) {
			var controls = this.ast.mainDoxyComment.getControls();
			if (controls["@title"]) this.title = controls["@title"][0];
			if (controls["@author"]) this.author = controls["@author"][0];
			this.tags = this.ast.mainDoxyComment.getHashTags();
		}
	}
}

Eden.Project.fromOldPath = function(path, tag, cb) {
	Eden.Agent.importAgent(path, tag, ["noexec"], function(ag) {
		var src = ag.getSource();
		eden.project = new Eden.Project(ag.meta.saveID, path, src);
		if (cb) cb(eden.project);
	});
}

Eden.Project.newFromExisting = function(name, cb) {
	Eden.Agent.importAgent(name, undefined, ["noexec"], function(ag) {
		var src = ag.getSource();
		eden.project = new Eden.Project(undefined, name, src);
		if (cb) cb(eden.project);
	});
}

Eden.Project.search = function(q, cb) {

}

Eden.Project.list = function(count, cb) {

}

Eden.Project.load = function(name, cb) {
	Eden.DB.getSourceRaw("nick/projects/p"+name, "v1", function(src) {
		if (src) {
			eden.project = new Eden.Project(undefined, name, src);
			eden.project.start();
		}
		if (cb) cb(eden.project);
	});
}

Eden.Project.prototype.start = function() {
	// Get patches from local storage... but don't apply
	this.ast.execute(this);

	if (this.ast.scripts["ACTIVE"]) {
		// Find the active action and replace
		for (var i=0; i<this.ast.script.statements.length; i++) {
			if (this.ast.script.statements[i] === this.ast.scripts["ACTIVE"]) {
				this.ast.script.statements[i] = eden.root;
				break;
			}
		}
	} else {
		this.ast.scripts["ACTIVE"] = eden.root;
		this.ast.script.append(eden.root);
	}
}

Eden.Project.prototype.save = function(pub, callback) {
	var me = this;
	// Generate and upload to pm.
	$.ajax({
		url: Eden.DB.remoteURL+"/agent/add",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{	path: "nick/projects/p"+this.name,
				parentSaveID: undefined,
				title: this.title,
				source: this.generate(),
				tag: "v1",
				permission: (pub) ? "public" : undefined
		},
		success: function(data){
			if (data == null || data.error) {
				console.error(data);
				eden.error((data) ? data.description : "No response from server");
				if (callback) callback(false);
			} else {
				me.id = data.saveID;
				if (callback) callback(true);
			}
		},
		error: function(a){
			//console.error(a);
			//eden.error(a);
			Eden.DB.disconnect(true);
			if (callback) callback(false);
		}
	});
}

Eden.Project.prototype.restore = function() {
	// Get local patches and do apply them...
}

Eden.Project.prototype.patch = function(oldast, newast) {
	
}

Eden.Project.prototype.addAction = function(name) {
	var script = new Eden.AST.Script();
	script.name = name;
	script.prefix = "action "+name+"{\n";
	script.postfix = "\n}";
	script.parent = this.ast.script;
	this.ast.script.append(script);
	this.ast.scripts[name] = script;
}

Eden.Project.prototype.generate = function() {
	return this.ast.getSource();
}

