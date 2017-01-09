Eden.Project = function(id, name, source) {
	this.title = name;
	this.name = name.replace(/[^a-zA-Z0-9]/g, "");
	this.author = undefined;
	this.tags = name.toLowerCase().split(" ");
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this);
	//this.ast.script.lock = 1;
	this.id = id;
	this.vid = undefined;
	this.triggers = {};

	if (this.ast && this.ast.script.errors.length == 0) {
		this.updateDoxy();
		this.ast.script.name = this.name;
	}

	eden.root.lookup("jseden_project_title").assign(name, eden.root.scope, this);
	eden.root.lookup("jseden_project_name").assign(this.name, eden.root.scope, this);
}

Eden.Project.prototype.updateDoxy = function() {
	// Fabricate a fake doxy comment for the script using meta data.
	var doxystring = this.name;
	if (this.title) doxystring += "\n * @title " + this.title;
	if (this.author) doxystring += "\n * @author " + this.author;
	if (this.tags && this.tags.length > 0) {
		doxystring += "\n *";
		for (var i=0; i<this.tags.length; i++) {
			doxystring += " #"+this.tags[i];
		}
	}
	var doxy = new Eden.AST.DoxyComment(doxystring);
	this.ast.script.doxyComment = doxy;
}

Eden.Project.init = function() {
	var titleSym = eden.root.lookup("jseden_project_title");
	titleSym.addJSObserver("project", function(sym, value) {
		if (sym.last_modified_by !== eden.project) {
			if (eden.project === undefined) return;
			eden.project.title = value;
			eden.project.name = value.replace(/[^a-zA-Z0-9]/g, "");
			eden.project.ast.script.name = eden.project.name;
			// Fabricate a fake doxy comment for the script using meta data.
			eden.project.updateDoxy();
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
					whens[i].statement.trigger(eden.project.ast, whens[i].scope);
				}
				//gutter.generate(this.ast,-1);
				//me.clearExecutedState();
			}
		//}
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
		
	}
}

Eden.Project.search = function(q, cb) {

}

Eden.Project.load = function(pid, vid, cb) {
	Eden.DB.load(pid, vid, function(data) {
		if (data) {
			eden.project = new Eden.Project(pid, data.name, data.source);
			console.log("LOAD PROJECT",data);
			eden.project.start();
		}
		if (cb) cb(eden.project);
	});

	if (cb) cb();
}

Eden.Project.prototype.start = function() {
	var me = this;

	this.ast.execute(this, function() {
		if (me.ast.scripts["ACTIVE"]) {
			// Find the active action and replace
			for (var i=0; i<me.ast.script.statements.length; i++) {
				if (me.ast.script.statements[i] === me.ast.scripts["ACTIVE"]) {
					me.ast.script.statements[i].statements = undefined;

					// Patch original state into the virtual AST
					// Used for things like diff that need to know original state
					eden.root.start = me.ast.script.statements[i].start;
					eden.root.end = me.ast.script.statements[i].end;
					eden.root.prefix = me.ast.script.statements[i].prefix;
					eden.root.postfix = me.ast.script.statements[i].postfix;

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

Eden.Project.prototype.diff = function() {
	var dmp = new diff_match_patch();
	var newsrc = this.generate();
	var d = dmp.diff_main(this.ast.stream.code, newsrc);
	dmp.diff_cleanupSemantic(d);
	var diffhtml = dmp.diff_prettyHtml(d);

	var res = "";
	var line = 0;
	for (var i=0; i<d.length; i++) {
		var linechars = d[i][1].match(/[\n]+/g);

		if (d[i][0] == 0) {
			if (linechars !== null) line += linechars.length;
			continue;
		} else if (d[i][0] == 1) {
			var html = EdenUI.Highlight.html(d[i][1]);
			res += 'line:'+(line+1)+' + <span style="background: #ddffdd;">'+html+'</span>';
			if (linechars !== null) line += linechars.length;
		} else if (d[i][1] == 2) {
			var html = EdenUI.Highlight.html(d[i][1]);
			res += 'line:'+(line+1)+' - <span style="background: #ffdddd;">'+html+'</span>';
			if (linechars !== null) line -= linechars.length;
		}
	}

	return res;
}

Eden.Project.prototype.save = function(pub, callback) {
	Eden.DB.save(this, pub, callback);
}

Eden.Project.restore = function() {
	if (window.localStorage) {
		var src = window.localStorage.getItem("last_project");
		var title = window.localStorage.getItem("title");
		if (src && src != "") {
			eden.project = new Eden.Project(undefined, title, src);
			eden.project.start();
		}
	}
}

Eden.Project.prototype.restore = function() {
	// Get local patches and do apply them...
}

Eden.Project.prototype.localSave = function() {
	if (window.localStorage) {
		window.localStorage.setItem("last_project", this.generate());
	}
}

Eden.Project.prototype.patch = function(oldast, newast) {

}

Eden.Project.prototype.snapshot = function() {
	// Generate a DIFF and save
	// Allow entire project to rollback
}

Eden.Project.prototype.addAction = function(name) {
	var script = new Eden.AST.Script();
	script.name = name;
	script.prefix = "action "+name+"{\n";
	script.postfix = "\n}\n\n";
	script.parent = this.ast.script;
	this.ast.script.append(script);
	this.ast.scripts[name] = script;
	return script;
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

