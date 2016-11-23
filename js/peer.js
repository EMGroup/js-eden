Eden.Peer = function(master, id) {
	this.connections = [];
	this.id = id;
	this.master = master;
	var me = this;
	this.roles = {};
	this.enabled = false;
	this.loading = false;

	function processData(data) {
		var obj = JSON.parse(data);
		console.log(obj.cmd,obj.symbol);
		if (obj.cmd == "assign") {
			var sym = eden.root.lookup(obj.symbol.slice(1));
			var ast = new Eden.AST(obj.value, undefined, undefined, true);
			var express = ast.pEXPRESSION();
			sym.assign(express.execute({}, ast, eden.root.scope), eden.root.scope, {name: "*net"});
		} else if (obj.cmd == "define") {
			var sym = eden.root.lookup(obj.symbol.slice(1));
			sym.eden_definition = obj.source;
			sym.define(eval(obj.code), {name: "*net"}, obj.dependencies);
		} else if (obj.cmd == "import") {
			Eden.Agent.importAgent(obj.path, obj.tag, obj.options, function() {

			});
		} else if (obj.cmd == "listassign") {
			var sym = eden.root.lookup(obj.symbol.slice(1));
			var ast = new Eden.AST(obj.value, undefined, undefined, true);
			var express = ast.pEXPRESSION();
			sym.listAssign(express.execute({}, ast, eden.root.scope), eden.root.scope, {name: "*net"}, false, obj.components);
		} else if (obj.cmd == "patch") {
			//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.applyPatch(obj.patch, obj.lineno) });
		} else if (obj.cmd == "ownership") {
			//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.setOwned(obj.owned, "net"); });
		} else if (obj.cmd == "restore") {
			//console.log("RESTORE", obj.script);
			me.loading = true;
			Eden.DB.load(undefined, undefined, obj, function() {
				me.loading = false;
			});
		} else if (obj.cmd == "execstatus") {
			var ag = Eden.Agent.agents[obj.path];
			if (ag && ag.meta && ag.meta.saveID == obj.saveID) {
				ag.last_exec_version = obj.saveID;
				ag.executed = true;
			} else {
				// Does not exist at all so load and fake execution
				Eden.Agent.importAgent(obj.path, obj.saveID, ["noexec"], function() {
					var ag = Eden.Agent.agents[obj.path];
					ag.last_exec_version = obj.saveID;
					ag.executed = true;
				});
			}
		}
	}

	function init(name) {
		if (name) {
			var myid = name.replace(/[ \!\'\-\?\&]/g, "");
			var peer;
			if (id) {
				peer = new Peer(id, {key: 'w2cjkz0cpw6x0f6r', config: { iceServers: [{url:'stun:stun.l.google.com:19302'}]}});
			} else {
				peer = new Peer({key: 'w2cjkz0cpw6x0f6r', config: { iceServers: [{url:'stun:stun.l.google.com:19302'}]}});
			}

			if (id || master) me.enabled = true;

			peer.on('open', function(id) {
				console.log("My peer id is " + id);

				if (master) {
					var conn = peer.connect(master, {reliable: true});
					conn.on('open',function() {
						me.connections.push(conn);
						conn.on('data',processData);

						//conn.send("hello");
					});
				}
			});

			peer.on('connection', function(conn) {
				me.connections.push(conn);
				conn.on('data', processData);
				console.log("Peer connection from " + conn.peer);

				conn.on('open', function() {
					// Auto share state.
					var script = Eden.Agent.save();
					script += eden.root.save();
					conn.send(JSON.stringify({cmd: "restore", script: script}));
				});
			});

			peer.on('error', function(err) {
				console.log("Peer error: ", err);
			});
		}

		/*Eden.Agent.listenTo('patch',this,function(origin,patch,lineno){
			if(origin) {
				var data = JSON.stringify({cmd: "patch", name: origin.name, patch: patch, lineno: lineno});
				me.broadcast(data);
			}
		});
		Eden.Agent.listenTo("owned", this, function(origin, cause) {
			if (cause == "net") return;
			me.broadcast(JSON.stringify({cmd: "ownership", name: origin.name, owned: origin.owned}));
		});*/
		Eden.Agent.listenTo("version", this, function(origin, saveID, ispublic) {
			console.log("VERSION CHANGE", origin.name, saveID);
			me.imports(origin, origin.name, saveID, ["noexec"]);
		});
		Eden.Agent.listenTo("execute", this, function(origin, force, saveID) {
			/*if (force && origin.canUndo() == false) {
				console.log("EXECUTE IMPORT", origin.name, saveID);
				me.imports(origin, origin.name, saveID, ["force"]);
			}*/
			me.broadcast(JSON.stringify({cmd: "execstatus", path: origin.name, saveID: saveID}));
		});
	}
	
	Eden.DB.listenTo("login", this, init);
	if (Eden.DB.isLoggedIn()) init(Eden.DB.username);

	function createDialog(name, title) {
		var viewName = name.slice(0,-7); //remove -dialog suffix

		$('<div id="' + name + '"></div>')
		.html("")
		.dialog({
			title: "Peer Connections",
			width: 200,
			height: 300,
			minHeight: 120,
			minWidth: 100 //,
			//dialogClass: "debugger-dialog"
		});
	}

	edenUI.views["Peers"] = {dialog: createDialog, title: "Connections", category: edenUI.viewCategories.environment};
	edenUI.menu.updateViewsMenu();
}

Eden.Peer.prototype.broadcast = function(msg) {
	if (this.loading) return;
	for (var i=0; i<this.connections.length; i++) {
		this.connections[i].send(msg);
	}
}

Eden.Peer.prototype.authoriseWhen = function(when) {
	if (this.enabled) {
		//console.log(when);
		if (when.doxyComment) {
			var roles = when.doxyComment.getControls()["@role"];
			if (roles) {
				for (var i=0; i<roles.length; i++) {
					if (roles[i] == "@role" && this.id !== undefined) return true;
					if (this.roles[roles[i]]) return true;
				}
				console.log("DENIED WHEN: ", roles);
				return false;
			}
		}
		//if (this.id) return true;
		return true;
	} else {
		return true;
	}
}

Eden.Peer.prototype.assign = function(agent, sym, value) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast(JSON.stringify({cmd: "assign", symbol: sym, value : Eden.edenCodeForValue(value)}));
	}
}

Eden.Peer.prototype.define = function(agent, sym, source, rhs, deps) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast(JSON.stringify({cmd: "define", symbol: sym, source: source, code: rhs, dependencies: deps}));
	}
}

Eden.Peer.prototype.imports = function(agent, path, tag, options) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast(JSON.stringify({cmd: "import", path: path, tag: tag, options: options}));
	}
}

Eden.Peer.prototype.listAssign = function(agent, sym, value, components) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast(JSON.stringify({cmd: "listassign", symbol: sym, value : Eden.edenCodeForValue(value), components: components}));
	}
}
