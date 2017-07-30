Eden.Peer = function(master, id) {
	this.connections = {};
	this.id = id;
	this.master = master;
	var me = this;
	this.roles = {};
	this.enabled = false;
	this.loading = false;
	this.config = {
		control: true,
		share: false,
		observe: false,
		logging: false
	};
	this.callbacks = {};
	this.callbackid = 0;
	this.capturepatch = false;

	if (eden.root.lookup("jseden_p2p_newconnections").value() === undefined) {
		eden.root.lookup("jseden_p2p_newconnections").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}
	if (eden.root.lookup("jseden_p2p_newdisconnections").value() === undefined) {
		eden.root.lookup("jseden_p2p_newdisconnections").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}
	if (eden.root.lookup("jseden_p2p_errors").value() === undefined) {
		eden.root.lookup("jseden_p2p_errors").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}

	//Eden.Agent.importAgent("lib/p2p","default",[],function() {});
	Eden.Selectors.execute("lib > p2p");

	function processAssign(obj) {
		//console.log("process assign",obj);
		var sym = eden.root.lookup(obj.symbol);
		//var ast = new Eden.AST(obj.value, undefined, Symbol.netAgent, {noparse: true});
		var express = Eden.AST.parseExpression(obj.value); //ast.pEXPRESSION();
		sym.assign(express.execute({}, EdenSymbol.netAgent, eden.root.scope), eden.root.scope, EdenSymbol.netAgent);
		me.broadcastExcept(obj.id, obj);
	}

	function processDefine(obj) {
		var sym = eden.root.lookup(obj.symbol);
		//sym.eden_definition = obj.source;
		sym.define(eval(obj.code), EdenSymbol.netAgent, obj.dependencies, obj.source);
		me.broadcastExcept(obj.id, obj);
	}

	function processImport(obj) {
		//Eden.Agent.importAgent(obj.path, obj.tag, obj.options, function() {});
		//me.broadcastExcept(obj.id, obj);
	}

	function processListAssign(obj) {
		var sym = eden.root.lookup(obj.symbol);
		//var ast = new Eden.AST(obj.value, undefined, Symbol.netAgent, true);
		var express = Eden.AST.parseExpression(obj.value); //ast.pEXPRESSION();
		sym.listAssign(express.execute({}, EdenSymbol.netAgent, eden.root.scope), eden.root.scope, EdenSymbol.netAgent, false, obj.components);
		me.broadcastExcept(obj.id, obj);
	}

	function processRestore(obj) {
		me.loading = true;
		// TODO Must reset environment first!
		/*Eden.DB.load(undefined, undefined, obj, function() {
			me.loading = false;
		});*/
		eden.project = new Eden.Project(obj.pid, obj.name, obj.script);
		Eden.Project.emit("loading", [eden.project]);
		eden.project.vid = obj.vid;
		eden.project.title = obj.title;
		eden.project.author = obj.ownername;
		eden.project.authorid = obj.owner;
		eden.project.start(function() {
			Eden.Project.emit("load", [eden.project]);
		});
	}

	function processExecStatus(obj) {
		/*var ag = Eden.Agent.agents[obj.path];
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
		}*/
	}

	function processRegister(obj) {
		Eden.Peer.emit("user", [obj.id,obj.username]);
		eden.root.lookup("jseden_p2p_"+obj.id+"_name").assign(obj.username, eden.root.scope, EdenSymbol.localJSAgent);
	}

	function processGetSnapshot(obj) {
		var script = eden.project.generate();
		me.connections[obj.id].connection.send(JSON.stringify({cmd: "callback", data: script, cbid: obj.cbid}));
	}

	function processReqShare(obj) {
		var pconn = me.connections[obj.id];

		if (obj.value) {
			pconn.share = true;
			// Auto share state.
			if (eden.project) {
				var script = eden.project.generate();
				pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
					vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
					name: eden.project.name, title: eden.project.title}));
			}
			pconn.connection.send(JSON.stringify({cmd: "callback", data: true, cbid: obj.cbid}));
			Eden.Peer.emit("share", [obj.id]);
		} else {
			pconn.share = false;
			Eden.Peer.emit("unshare", [obj.id]);
		}
	}

	function processReqObserve(obj) {
		var pconn = me.connections[obj.id];

		if (obj.value) {
			pconn.observe = true;
			pconn.connection.send(JSON.stringify({cmd: "callback", data: true, cbid: obj.cbid}));
			Eden.Peer.emit("observe", [obj.id]);
		} else {
			pconn.observe = false;
			Eden.Peer.emit("unobserve", [obj.id]);
		}
	}

	function processCallback(obj) {
		var cb = me.callbacks[obj.cbid];
		if (cb) cb(obj.data);
		delete me.callbacks[obj.cbid];
	}

	function processPatch(obj) {
		//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.applyPatch(obj.patch, obj.lineno) });
	}

	function processOwnership(obj) {
		//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.setOwned(obj.owned, "net"); });
	}

	function processDoxy(obj) {
		//eden.updateDictionary(obj.symbol, new Eden.AST.DoxyComment(obj.content,0,0), true);
	}

	function processData(conn, data) {
		var obj = JSON.parse(data);
		obj.id = conn.peer;
		var pconn = me.connections[obj.id];
		//console.log(obj.cmd,obj.symbol);

		switch(obj.cmd) {
		case "assign"		: if (pconn.observe) processAssign(obj); break;
		case "define"		: if (pconn.observe) processDefine(obj); break;
		case "import"		: if (pconn.observe) processImport(obj); break;
		case "listassign"	: if (pconn.observe) processListAssign(obj); break;
		case "restore"		: if (pconn.observe) processRestore(obj); break;
		case "execstatus"	: if (pconn.observe) processExecStatus(obj); break;
		case "register"		: processRegister(obj); break;
		case "getsnapshot"	: processGetSnapshot(obj); break;
		case "callback"		: processCallback(obj); break;
		case "reqshare"		: processReqShare(obj); break;
		case "reqobserve"	: processReqObserve(obj); break;
		case "patch"		: processPatch(obj); break;
		case "ownership"	: processOwnership(obj); break;
		case "doxy"			: processDoxy(obj); break;
		}

		if (me.config.logging) {
			console.log(obj);
		}
	}

	function init(name) {
		if (me.enabled) return;
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
						me.connections[conn.peer] = {id: conn.peer, username: undefined, connection: conn, share: false, observe: false};
						conn.on('data',function(data) { processData(conn, data); });
						eden.root.lookup("jseden_p2p_newconnections").append(conn.peer, eden.root.scope, EdenSymbol.localJSAgent);

						// Register
						conn.send(JSON.stringify({cmd: "register", username: Eden.DB.username, id: id}));
					});
				}
			});

			peer.on('connection', function(conn) {
				me.connections[conn.peer] = {id: conn.peer, username: undefined, connection: conn, share: false, observe: false};
				conn.on('data', function(data) { processData(conn, data); });
				console.log("Peer connection from " + conn.peer);
				Eden.Peer.emit("peer", [conn.peer]);
				eden.root.lookup("jseden_p2p_newconnections").append(conn.peer, eden.root.scope, EdenSymbol.localJSAgent);

				conn.on('open', function() {
					if (me.config.share) {
						// Auto share state.
						var script = eden.project.generate();
						conn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
							vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
							name: eden.project.name, title: eden.project.title}));
					}
				});
			});

			peer.on('error', function(err) {
				console.log("Peer error: ", err);
				Eden.Peer.emit("error", [err]);
				eden.root.lookup("jseden_p2p_errors").append(err, eden.root.scope, EdenSymbol.localJSAgent);
			});

			peer.on('disconnected', function(conn) {
				Eden.Peer.emit("disconnect", [conn.peer, (me.connections[conn.peer]) ? me.connections[conn.peer].username : undefined]);
				delete me.connections[conn.peer];
				eden.root.lookup("jseden_p2p_newdisconnections").append(conn.peer, eden.root.scope, EdenSymbol.localJSAgent);
			});
		}

		/*Eden.Fragment.listenTo('changed',this,function(origin,patch,lineno){
			if(origin && me.capturepatch) {
				var data = {cmd: "patch", name: origin.name, patch: patch, lineno: lineno};
				me.broadcast(data);
			}
		});
		Eden.Agent.listenTo("owned", this, function(origin, cause) {
			if (cause == "net" || !me.capturepatch) return;
			me.broadcast({cmd: "ownership", name: origin.name, owned: origin.owned});
		});
		Eden.Agent.listenTo("version", this, function(origin, saveID, ispublic) {
			console.log("VERSION CHANGE", origin.name, saveID);
			me.imports(origin, origin.name, saveID, ["noexec"]);
		});
		Eden.Agent.listenTo("execute", this, function(origin, force, saveID) {
			//if (force && origin.canUndo() == false) {
			//	console.log("EXECUTE IMPORT", origin.name, saveID);
			//	me.imports(origin, origin.name, saveID, ["force"]);
			//}
			me.broadcast(JSON.stringify({cmd: "execstatus", path: origin.name, saveID: saveID}));
		});*/
	}
	
	Eden.DB.listenTo("login", this, init);
	if (Eden.DB.isLoggedIn()) init(Eden.DB.username);

	var capInSym = eden.root.lookup("jseden_p2p_captureinput");
	capInSym.addJSObserver("p2p", function(sym, value) {
		if (value) {
			EdenSymbol.hciAgent.local = false;
			EdenSymbol.localJSAgent.local = false;
		} else {
			EdenSymbol.hciAgent.local = true;
			EdenSymbol.localJSAgent.local = true;
		}
	});

	var capEdSym = eden.root.lookup("jseden_p2p_captureedits");
	capEdSym.addJSObserver("p2p", function(sym, value) {
		me.capturepatch = value;
	});

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

Eden.Peer.listeners = {};
Eden.Peer.emit = emit;
Eden.Peer.listenTo = listenTo;

Eden.Peer.prototype.broadcast = function(msg) {
	//console.log(msg); return;
	if (this.loading) return;
	msg = JSON.stringify(msg);

	for (var x in this.connections) {
		var pconn = this.connections[x];
		if (pconn.share) {
			pconn.connection.send(msg);
		}
	}
}

Eden.Peer.prototype.broadcastExcept = function(id, msg) {
	//console.log(msg); return;
	if (this.loading) return;
	msg = JSON.stringify(msg);

	for (var x in this.connections) {
		if (x == id) continue;
		var pconn = this.connections[x];
		if (pconn.share) {
			pconn.connection.send(msg);
		}
	}
}

Eden.Peer.prototype.authoriseWhen = function(when) {
	if (this.enabled) {
		//console.log(when);
		if (when.roles) {
			var roles = when.roles;
			if (roles && roles.length > 0) {
				for (var i=0; i<roles.length; i++) {
					if (this.roles[roles[i]]) return true;
				}
				//console.log("DENIED WHEN: ", roles);
				return false;
			}
		}
		//if (this.id) return true;
		return true;
	} else {
		return true;
	}
}

Eden.Peer.prototype.doxy = function(name, comment) {
	//this.broadcast({cmd: "doxy", symbol: name, value: comment.content});
}

Eden.Peer.prototype.assign = function(agent, sym, value) {
	if (agent && !agent.loading && !agent.local) {
		//console.log("P2P Assign "+sym + " = " + Eden.edenCodeForValue(value));
		this.broadcast({cmd: "assign", symbol: sym, value : Eden.edenCodeForValue(value)});
	}
}

Eden.Peer.prototype.define = function(agent, sym, source, rhs, deps) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast({cmd: "define", symbol: sym, source: source, code: rhs, dependencies: deps});
	}
}

Eden.Peer.prototype.imports = function(agent, path, tag, options) {
	//if (agent && !agent.loading && !agent.local) {
	//	this.broadcast({cmd: "import", path: path, tag: tag, options: options});
	//}
}

Eden.Peer.prototype.listAssign = function(agent, sym, value, components) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast({cmd: "listassign", symbol: sym, value : Eden.edenCodeForValue(value), components: components});
	}
}

Eden.Peer.prototype.addCallback = function(func) {
	var id = this.callbackid++;
	this.callbacks[id] = func;
	return id;
}

Eden.Peer.prototype.getSnapshot = function(id, cb) {
	if (this.connections[id]) {
		this.connections[id].connection.send(JSON.stringify({cmd: "getsnapshot", cbid: this.addCallback(cb)}));
	}
}

Eden.Peer.prototype.requestShare = function(id, cb) {
	var pconn = this.connections[id];

	if (pconn) {
		pconn.observe = true;
		pconn.connection.send(JSON.stringify({cmd: "reqshare", value: true, cbid: this.addCallback(cb)}));
	}
}

Eden.Peer.prototype.requestUnShare = function(id, cb) {
	var pconn = this.connections[id];

	// TODO Only share one at a time unless collaborating...

	if (pconn) {
		pconn.observe = false;
		pconn.connection.send(JSON.stringify({cmd: "reqshare", value: false, cbid: this.addCallback(cb)}));
	}
}

Eden.Peer.prototype.requestObserve = function(id, cb) {
	var pconn = this.connections[id];

	if (pconn) {
		pconn.share = true;
		pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: true, cbid: this.addCallback(cb)}));
		// Auto share state.
		var script = eden.project.generate(); //Eden.Generator.getScript();
		pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
			vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
			name: eden.project.name, title: eden.project.title}));
	}
}

Eden.Peer.prototype.requestUnObserve = function(id, cb) {
	var pconn = this.connections[id];

	if (pconn) {
		pconn.share = false;
		pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: false, cbid: this.addCallback(cb)}));
	}
}

Eden.Peer.prototype.requestCollaborate = function(id, cb) {
	var me = this;
	var pconn = this.connections[id];

	if (pconn) {
		//this.config.observe = true;
		pconn.connection.send(JSON.stringify({cmd: "reqshare", value: true, cbid: this.addCallback(function() {
			// Only observe now, to ignore restore message.
			pconn.observe = true;
			me.requestObserve(id, cb);
		})}));

		if (eden.project) {
			// Auto share state.
			var script = eden.project.generate(); //Eden.Generator.getScript();
			pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
				vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
				name: eden.project.name, title: eden.project.title}));
		}
	}
}

Eden.Peer.prototype.requestUnCollaborate = function(id, cb) {
	
}


