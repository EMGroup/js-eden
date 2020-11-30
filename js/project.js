Eden.Project = function(id, name, source) {
	this.title = name;
	this.name = name.replace(/[^a-zA-Z0-9]/g, "");
	this.author = undefined;
	this.authorid = -1;
	this.tags = name.toLowerCase().split(" ");
	this.src = source;
	this.ast = new Eden.AST(source, undefined, this, {autorecover: true});
	//this.ast.script.lock = 1;
	this.id = id;
	this.vid = undefined;
	this.parentid = undefined;
	//this.triggers = {};
	this.thumb = undefined;
	this.desc = undefined;
	this.readPassword = undefined;
	this.autosavetimeout = undefined;

	if (this.ast && this.ast.script.errors.length == 0) {
	}

	//eden.root.lookup("jseden_project_title").assign(name, eden.root.scope, Symbol.localJSAgent);
	eden.root.lookup("jseden_project_name").assign(this.name, eden.root.scope, EdenSymbol.localJSAgent);
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

	//Eden.Fragment.listenTo("status", this, function() {
	//	if (eden.project) eden.project.autosave();
	//});

	$.get("resources/projects.db.json", function(data) {
		Eden.Project.local = data;

		// Also add local storage projects
		var plist = JSON.parse(window.localStorage.getItem("project_list"));
		if (plist !== null) {
			for (var x in plist) {
				var prefix = "project_"+x;
				//var src = window.localStorage.getItem(prefix+"_project");
				var id = window.localStorage.getItem(prefix+"_id");
				if (id == "undefined") id = undefined;
				var vid = window.localStorage.getItem(prefix+"_vid");
				if (vid == "undefined") vid = undefined;
				var author = window.localStorage.getItem(prefix+"_author");
				if (author == "undefined") author = undefined;
				var authorid = window.localStorage.getItem(prefix+"_authorid");
				var name = window.localStorage.getItem(prefix+"_name");
				var thumb = window.localStorage.getItem(prefix+"_thumb");
				if (thumb == "undefined") thumb = undefined;
				var desc = window.localStorage.getItem(prefix+"_desc");
				var title = window.localStorage.getItem(prefix+"_title");

				Eden.Project.local[name] = {
					author: author,
					listed: true,
					title: title,
					image: thumb,
					id: id
				};
			}
		}
	}, "json");

	// Watch to trigger whens
	/*eden.root.addGlobal(function(sym, create) {
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
	});*/
}

Eden.Project.loadFromFile = function(file) {
	var filename = file.name;
	filename = filename.substring(0,filename.lastIndexOf("."));
	filename = filename.replace(/\([0-9]+\)/,"");
	console.log("FILE",file);

	Eden.Project.emit("loading", [this]);

	var reader = new FileReader();
	reader.onload = function(e) {
		//Eden.loadFromString(e.target.result);
		eden.project = new Eden.Project(undefined, filename, e.target.result.replace(/\r/g,""));
		eden.project.start();
		//importfile.css("display","none");
	};
	reader.readAsText(file);
}

Eden.Project.newFromExisting = function(name, cb) {
	var me = this;
	Eden.Project.emit("loading", [me]);

	if (Eden.Project.local[name]) {
		if (Eden.Project.local[name].id) {
			Eden.Project.load(Eden.Project.local[name].id, undefined, undefined, cb);
		} else {
			$.get(Eden.Project.local[name].file, function(data) {
				eden.root.lookup("jseden_project_mode").assign("restore", eden.root.scope, EdenSymbol.defaultAgent);
				eden.project = new Eden.Project(undefined, name, data);
				eden.project.start(function () {
					Eden.Project.emit("load", [me]);
					if (cb) cb(eden.project);
				});
			}, "text");
		}
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

		Eden.Project.emit("loading", [me]);

		Eden.DB.load(pid, vid, readPassword, function(data) {
			if (data) {
				var meta = data;
				var extra;

				if (meta.projectMetaData !== null) {
					extra = JSON.parse(meta.projectMetaData);

					if (extra.env) {
						// Verify the environment matches requirements
						if (!Eden.Project.verifyEnvironment(extra.env)) {
							var validenv = Eden.Project.findEnvironment(extra.env);
							if (validenv) {
								document.location = validenv + URLUtil.updateQueryString({
									load: pid,
									vid: data.saveID,
									r: (readPassword) ? readPassword : ""
								});
							} else {
								alert("This project needs a different version of JS-Eden");
							}
						}
					}
				}

				eden.project = new Eden.Project(pid, meta.minimisedTitle, data.source);
				console.log("LOAD PROJECT",data);
				eden.project.vid = data.saveID;
				eden.project.title = meta.title;
				eden.project.author = meta.ownername;
				eden.project.authorid = meta.owner;
				eden.project.thumb = meta.image;
				eden.project.tags = meta.tags.trim().split(" ");
				eden.project.parentid = meta.parentProject;
				eden.root.lookup("jseden_project_title").assign(meta.title, eden.root.scope, EdenSymbol.localJSAgent);
				eden.root.lookup("jseden_project_name").assign(meta.minimisedTitle, eden.root.scope, EdenSymbol.localJSAgent);	
				eden.root.lookup("jseden_project_thumb").assign(meta.image, eden.root.scope, EdenSymbol.localJSAgent);
				eden.root.lookup("jseden_project_author").assign(meta.ownername, eden.root.scope, EdenSymbol.localJSAgent);
				if (extra) {
					eden.project.desc = extra.description;
				}
				// TODO More meta
				// rebuild doxy comment
				eden.project.ast.script.doxyComment = eden.project.ast.doxyFromOrigin();
				eden.project.start(function() {
					Eden.Project.emit("load", [me]);
				});

				var url = URLUtil.updateQueryString({
									load: eden.project.id,
									vid: eden.project.vid,
									r: (readPassword) ? readPassword : ""
								});
				if (document.location.search != url) {
					window.history.pushState({id: eden.project.id, vid: eden.project.vid},"",url);
				}

				//Eden.Project.emit("load", [me]);
			}
			if (cb) cb(eden.project);
		});
	//});

	//if (cb) cb();
}

Eden.Project.verifyEnvironment = function(env) {
	for (var x in env) {
		var val = eden.root.lookup("jseden_"+x).value();
		if (x == "parser_cs3") {
			eden.root.lookup("jseden_parser_cs3").assign(true, eden.root.scope, EdenSymbol.defaultAgent);
		} else if (typeof env[x] == "string") {
			var ch0 = env[x].charAt(0);

			switch (ch0) {
			case ">"	:	if (val <= parseInt(env[x].substring(1))) return false; break;
			case "<"	:	if (val >= parseInt(env[x].substring(1))) return false; break;
			case ">="	:	if (val < parseInt(env[x].substring(1))) return false; break;
			case "<="	:	if (val > parseInt(env[x].substring(1))) return false; break;
			case "="	:	if (val !== parseInt(env[x].substring(1))) return false; break;
			default		:	if (val != env[x]) return false;
			}
		} else if (val != env[x]) return false;
	}
	return true;
}

// TODO This shouldn't be hard coded.
Eden.Project.findEnvironment = function(env) {
	if (env.webgl && !eden.root.lookup("jseden_webgl").value()) {
		// Try the webgl version
		return "http://jseden.dcs.warwick.ac.uk/webgl/index.html";
	} else if (!env.webgl && eden.root.lookup("jseden_webgl").value()) {
		// Try non-webgl version
		return "http://jseden.dcs.warwick.ac.uk/construit/index.html";
	}
	return null;
}

Eden.Project.prototype.environment = function() {
	return {
		version_major: eden.root.lookup("jseden_version_major").value(),
		webgl: eden.root.lookup("jseden_webgl").value(),
		p2p_constructs: eden.root.lookup("jseden_p2p_constructs").value(),
		parser_cs3: eden.root.lookup("jseden_parser_cs3").value()
	};
}

Eden.Project.prototype.start = function(cb) {
	var me = this;

	if (this.ast.errors.length > 0) {
		for (var i=0; i<this.ast.errors.length; ++i) {
			console.error("Project parse error: ", this.ast.errors[i].toString());
		}
		if (cb) cb();
		return;
	}

	this.ast.execute(this, function() {
		if (me.ast.scripts["ACTIVE"]) {
			// Find the active action and replace
			for (var i=0; i<me.ast.script.statements.length; i++) {
				if (me.ast.script.statements[i] === me.ast.scripts["ACTIVE"]) {
					console.log(me.ast.script.statements[i]);
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

		if (cb) cb();
	});
}

function _diff(a,b) {
	var dmp = new diff_match_patch();
	//var newsrc = this.generate();
	var d = dmp.diff_main(a, b);
	dmp.diff_cleanupSemantic(d);
	//var diffhtml = dmp.diff_prettyHtml(d);

	var res = "";
	var line = 0;
	for (var i=0; i<d.length; i++) {
		var linechars = d[i][1].match(/[\n]+/g);

		if (d[i][0] == 0) {
			if (linechars !== null) line += linechars.length;
			continue;
		} else if (d[i][0] == 1) {
			var html = EdenUI.Highlight.html(d[i][1]);
			res += '<div>line:'+(line+1)+' + <span style="background: #ddffdd;">'+html+'</span></div>';
			if (linechars !== null) line += linechars.length;
		} else if (d[i][1] == 2) {
			var html = EdenUI.Highlight.html(d[i][1]);
			res += '<div>line:'+(line+1)+' - <span style="background: #ffdddd;">'+html+'</span></div>';
			if (linechars !== null) line -= linechars.length;
		}
	}

	return res;
}

Eden.Project.prototype.diff = function(o, n) {
	return _diff((!o) ? this.ast.stream.code : o, (!n) ? this.generate() : n);
}

Eden.Project.prototype.save = function(pub, callback) {
	Eden.DB.save(this, pub, callback);
}

Eden.Project.prototype.restore = function() {
	// Get local patches and do apply them...
}

Eden.Project.prototype.autosave = function() {
	if (this.autosavetimeout) {
		return;
	}

	var me = this;
	this.autosavetimeout = setTimeout(function() {
		this.autosavetimeout = undefined;
		Eden.DB.localSave(me);
		console.log("Doing an autosave");
	}, 10000);
}

Eden.Project.prototype.patch = function(oldast, newast) {

}

Eden.Project.prototype.localSave = function() {
	Eden.DB.localSave(this);
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

/*Eden.Project.prototype.addTrigger = function(when, d, scope) {
	console.log("Add When Trigger",d);
	if (this.triggers[d] === undefined) this.triggers[d] = [];
	this.triggers[d].push({statement: when, scope: scope});
}*/

Eden.Project.prototype.registerAgent = function(when, net) {
	when.executed = 1;
	//console.log("REGISTER WHEN", when.id, when);
	for (var x in when.dependencies) {
		//if (this.triggers[x] === undefined) this.triggers[x] = [];
		//this.triggers[x].push({statement: when, scope: eden.root.scope});
		eden.root.lookup(x).addObserver(when.id, when);
	}

	if (!net && eden.peer) eden.peer.activateWhen(when.id);
}

Eden.Project.prototype.removeAgent = function(when, net) {
	when.executed = 0;

	//console.log("REMOVE WHEN", when);
	for (var x in when.dependencies) {
		/*var t = this.triggers[x];
		if (t) {
			for (var i=0;i<t.length; i++) {
				if (t[i].statement === when) {
					t.splice(i,1);
					break;
				}
			}
		}*/
		eden.root.lookup(x).removeObserver(when.id);
	}

	if (!net && eden.peer) eden.peer.deactivateWhen(when.id);
}

