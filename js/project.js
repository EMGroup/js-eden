Eden.Project = function(id, name, source) {
	this.title = name;
	this.name = name.replace(/[^a-zA-Z0-9]/g, "");
	this.author = undefined;
	this.authorid = -1;
	this.tags = name.toLowerCase().split(" ");
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this);
	//this.ast.script.lock = 1;
	this.id = id;
	this.vid = undefined;
	this.parentid = undefined;
	this.triggers = {};
	this.thumb = undefined;
	this.desc = undefined;

	if (this.ast && this.ast.script.errors.length == 0) {
	}

	eden.root.lookup("jseden_project_title").assign(name, eden.root.scope, Symbol.localJSAgent);
	eden.root.lookup("jseden_project_name").assign(this.name, eden.root.scope, Symbol.localJSAgent);
}

Eden.Project.listenTo = listenTo;
Eden.Project.emit = emit;
Eden.Project.unListen = unListen;
Eden.Project.listeners = {};

Eden.Project.init = function() {
	var titleSym = eden.root.lookup("jseden_project_title");
	titleSym.addJSObserver("project", function(sym, value) {
		if (sym.origin !== eden.project) {
			if (eden.project === undefined) return;
			eden.project.title = value;
			if (this.id === undefined) {
				Eden.Index.remove(eden.project.ast.script);
				eden.project.name = value.replace(/[^a-zA-Z0-9]/g, "");
				eden.project.ast.script.name = eden.project.name;
				console.log("REINDEX PROJECT");
				Eden.Index.update(eden.project.ast.script);
			}
			// Fabricate a fake doxy comment for the script using meta data.
			//eden.project.updateDoxy();
			eden.project.ast.script.doxyComment = eden.project.ast.doxyFromOrigin();
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
			eden.root.lookup("jseden_project_mode").assign("restore", eden.root.scope, Symbol.defaultAgent);
			eden.project = new Eden.Project(undefined, name, data);
			eden.project.start();
			if (cb) cb(eden.project);
		}, "text");
	} else {
		
	}
}

Eden.Project.search = function(q, cb) {

}

Eden.Project.load = function(pid, vid, readPassword, cb) {
	var me = this;
	
	if(arguments.length == 3){
		cb = readPassword;
		readPassword = undefined;
	}
	
	//Eden.DB.getMeta(pid, function(metaA) {
	//	if (metaA.length == 0) {
	//		if (cb) cb();
	//		return;
	//	}

	//	var meta = metaA[0];
	//	console.log("META",meta);

		Eden.DB.load(pid, vid, readPassword, function(data) {
			if (data) {
				var meta = data;
				eden.project = new Eden.Project(pid, meta.minimisedTitle, data.source);
				console.log("LOAD PROJECT",data);
				eden.project.vid = data.saveID;
				eden.project.title = meta.title;
				eden.project.author = meta.ownername;
				eden.project.authorid = meta.owner;
				eden.project.thumb = meta.image;
				eden.project.tags = meta.tags.trim().split(" ");
				eden.project.parentid = meta.parentProject;
				eden.root.lookup("jseden_project_title").assign(meta.title, eden.root.scope, Symbol.localJSAgent);
				eden.root.lookup("jseden_project_name").assign(meta.minimisedTitle, eden.root.scope, Symbol.localJSAgent);	
				eden.root.lookup("jseden_project_thumb").assign(meta.image, eden.root.scope, Symbol.localJSAgent);
				eden.root.lookup("jseden_project_author").assign(meta.ownername, eden.root.scope, Symbol.localJSAgent);
				if (meta.projectMetaData !== null) {
					var extra = JSON.parse(meta.projectMetaData);
					eden.project.desc = extra.description;
				}
				// TODO More meta
				// rebuild doxy comment
				eden.project.ast.script.doxyComment = eden.project.ast.doxyFromOrigin();
				eden.project.start();

				var url = "?load="+eden.project.id+"&vid="+eden.project.vid + ((readPassword) ? "&r=" + readPassword : "");
				window.history.replaceState({id: eden.project.id, vid: eden.project.vid},"",url);

				Eden.Project.emit("load", [me]);
			}
			if (cb) cb(eden.project);
		});
	//});

	if (cb) cb();
}

Eden.Project.prototype.start = function() {
	var me = this;

	this.ast.execute(this, function() {
		if (me.ast.scripts["ACTIVE"]) {
			// Find the active action and replace
			for (var i=0; i<me.ast.script.statements.length; i++) {
				if (me.ast.script.statements[i] === me.ast.scripts["ACTIVE"]) {
					me.ast.script.statements[i].removeIndex();
					me.ast.script.statements[i].destroy();

					// Patch original state into the virtual AST
					// Used for things like diff that need to know original state
					eden.root.start = me.ast.script.statements[i].start;
					eden.root.end = me.ast.script.statements[i].end;
					eden.root.prefix = me.ast.script.statements[i].prefix;
					eden.root.postfix = me.ast.script.statements[i].postfix;
					eden.root.parent = eden.project.ast.script;
					Eden.Index.update(eden.root);
					me.ast.script.statements[i] = eden.root;
					break;
				}
			}
		} else {
			me.ast.script.appendChild(eden.root);
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
		var id = window.localStorage.getItem("last_id");
		if (id == "undefined") id = undefined;
		var vid = window.localStorage.getItem("last_vid");
		if (vid == "undefined") vid = undefined;
		var author = window.localStorage.getItem("last_author");
		if (author == "undefined") author = undefined;
		var authorid = window.localStorage.getItem("last_authorid");
		var name = window.localStorage.getItem("last_name");
		var thumb = window.localStorage.getItem("last_thumb");
		if (thumb == "undefined") thumb = undefined;
		var desc = window.localStorage.getItem("last_desc");
		var title = window.localStorage.getItem("last_title");
		if (src && src != "") {
			eden.root.lookup("jseden_project_mode").assign("restore", eden.root.scope, Symbol.defaultAgent);
			eden.project = new Eden.Project(id, title, src);
			eden.project.vid = vid;
			eden.project.author = author;
			eden.project.name = name;
			eden.project.authorid = authorid;
			eden.project.thumb = thumb;
			eden.project.desc = desc;
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
		window.localStorage.setItem("last_id", this.id);
		window.localStorage.setItem("last_vid", this.vid);
		window.localStorage.setItem("last_author", this.author);
		window.localStorage.setItem("last_authorid", this.authorid);
		window.localStorage.setItem("last_name", this.name);
		window.localStorage.setItem("last_title", this.title);
		window.localStorage.setItem("last_thumb", this.thumb);
		window.localStorage.setItem("last_desc", this.desc);
	}
}

Eden.Project.prototype.patch = function(oldast, newast) {

}

Eden.Project.prototype.snapshot = function() {
	// Generate a DIFF and save
	// Allow entire project to rollback
}

Eden.Project.prototype.addAction = function(name) {
	var script = Eden.AST.parseStatement("action "+name+" {}");
	this.ast.script.appendChild(script);
	script.addIndex();
	//this.ast.scripts[name] = script;
	return script;
}

Eden.Project.prototype.generate = function() {
	return this.ast.getSource();
}

Eden.Project.prototype.getDescription = function() {
	if (this.desc === undefined) {
		this.desc = "# "+this.title+"\nEnter a project description here,\nand some hashtags as below.\n\nTags: #"+this.tags.join(" #");
	}
	return this.desc;
}

Eden.Project.prototype.setDescription = function(text) {
	this.desc = text;
	var tmpdoxy = new Eden.AST.DoxyComment(text,0,0);
	this.tags = tmpdoxy.getHashTags().map(function(e) { return e.substring(1); });
}

Eden.Project.prototype.addTrigger = function(when, d, scope) {
	console.log("Add When Trigger",d);
	if (this.triggers[d] === undefined) this.triggers[d] = [];
	this.triggers[d].push({statement: when, scope: scope});
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
	for (var x in when.dependencies) {
		var t = this.triggers[x];
		if (t) {
			for (var i=0;i<t.length; i++) {
				if (t[i].statement === when) {
					t.splice(i,1);
					break;
				}
			}
		}
	}
}

