Eden.Project = function(id, name, source) {
	this.title = name;
	this.name = name.replace(/[^a-zA-Z0-9]/g, "");
	this.author = undefined;
	this.tags = undefined;
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this);
	this.ast.script.lock = 1;
	this.id = id;
	this.triggers = {};

	if (this.ast && this.ast.script.errors.length == 0) {
		// Fabricate a fake doxy comment for the script using meta data.
		var doxystring = "/** "+ name + "\n * @title " + this.title + "\n * @author " + this.author + "\n */";
		var doxy = new Eden.AST.DoxyComment(doxystring);
		this.ast.script.doxyComment = doxy;	
	}

	eden.root.lookup("jseden_project_title").assign(name, eden.root.scope, this);
	eden.root.lookup("jseden_project_name").assign(this.name, eden.root.scope, this);
}

Eden.Project.init = function() {
	var titleSym = eden.root.lookup("jseden_project_title");
	titleSym.addJSObserver("project", function(sym, value) {
		if (sym.last_modified_by !== eden.project) {
			if (eden.project === undefined) return;
			eden.project.title = value;
			eden.project.name = value.replace(/[^a-zA-Z0-9]/g, "");
			// Fabricate a fake doxy comment for the script using meta data.
			var doxystring = "/** "+ eden.project.name + "\n * @title " + eden.project.title + "\n * @author " + eden.project.author + "\n */";
			var doxy = new Eden.AST.DoxyComment(doxystring);
			eden.project.ast.script.doxyComment = doxy;
			// TODO Notify relevant fragments...
			Eden.Fragment.emit("aststatus", [eden.project.ast.script]);
		}
	});

	$.get("resources/projects.db.json", function(data) {
		Eden.Project.local = data;
	}, "json");

	// Watch to trigger whens
	eden.root.addGlobal(function(sym, create) {
		if (eden.project === undefined) return;
		//if (me.ast && me.executed && me.ast.script.errors.length == 0) {
			var whens = eden.project.triggers[sym.name];
			if (whens) {
				//clearExecutedState();
				for (var i=0; i<whens.length; i++) {
					whens[i].statement.trigger(undefined, whens[i].scope);
				}
				//gutter.generate(this.ast,-1);
				//me.clearExecutedState();
			}
		//}
	});
}

Eden.Project.fromOldPath = function(path, tag, cb) {
	Eden.Agent.importAgent(path, tag, ["noexec"], function(ag) {
		var src = ag.getSource();
		eden.project = new Eden.Project(ag.meta.saveID, path, src);
		eden.project.start();
		if (cb) cb(eden.project);
	});
}

Eden.Project.newFromExisting = function(name, cb) {
	if (Eden.Project.local[name]) {
		$.get(Eden.Project.local[name].file, function(data) {
			eden.project = new Eden.Project(undefined, name, data);
			eden.project.start();
			if (cb) cb(eden.project);
		}, "text");
	} else {
		Eden.Agent.importAgent(name, undefined, ["noexec"], function(ag) {
			var src = ag.getSource();
			eden.project = new Eden.Project(undefined, name, src);
			if (cb) cb(eden.project);
		});
	}
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
	var me = this;

	this.ast.execute(this, function() {
		if (me.ast.scripts["ACTIVE"]) {
			// Find the active action and replace
			for (var i=0; i<me.ast.script.statements.length; i++) {
				if (me.ast.script.statements[i] === me.ast.scripts["ACTIVE"]) {
					me.ast.script.statements[i] = eden.root;
					break;
				}
			}
		} else {
			me.ast.script.append(eden.root);
		}

		eden.root.parent = me.ast.script;
		me.ast.scripts["ACTIVE"] = eden.root;
	});
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

Eden.Project.prototype.registerAgent = function(when) {
	console.log("REGISTER WHEN", when);
	for (var x in when.dependencies) {
		if (this.triggers[x] === undefined) this.triggers[x] = [];
		this.triggers[x].push({statement: when, scope: eden.root.scope});
	}
}

Eden.Project.prototype.removeAgent = function(when) {
	console.log("REMOVE WHEN", when);
}

