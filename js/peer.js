let patchCount = 0;

Eden.Peer = function(master, id, password) {
	this.connections = {};
	this.id = id;
	this.master = master;
	var me = this;
	this.roles = {};
	this.enabled = false;
	this.loading = false;
	this.password = password;
	this.config = {
		control: true,
		share: false,
		observe: false,
		logging: false
	};
	this.callbacks = {};
	this.callbackid = 0;
	this.capturepatch = false;
	this.record = false;
	this.clone = true;
	this.startrecordtime = 0;
	this.log = null;
    this.lastPatch = new Map();
    this.patchQueue = new Map();

	this.frags = {};
	this.todorm = [];

	if (eden.root.lookup("jseden_p2p_newconnections").value() === undefined) {
		eden.root.lookup("jseden_p2p_newconnections").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}
	if (eden.root.lookup("jseden_p2p_newdisconnections").value() === undefined) {
		eden.root.lookup("jseden_p2p_newdisconnections").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}
	if (eden.root.lookup("jseden_p2p_errors").value() === undefined) {
		eden.root.lookup("jseden_p2p_errors").assign([], eden.root.scope, EdenSymbol.defaultAgent);
	}
	if (eden.root.lookup("jseden_p2p_doactive").value() === undefined) {
		eden.root.lookup("jseden_p2p_doactive").assign(true, eden.root.scope, EdenSymbol.defaultAgent);
	}

	//Eden.Agent.importAgent("lib/p2p","default",[],function() {});
	Eden.Selectors.execute("lib > p2p", eden.root.scope);

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
		//sym.define(eval(obj.code), EdenSymbol.netAgent, obj.dependencies, obj.source);
		var stat = Eden.AST.parseStatement(obj.source);
		stat.local = true;
		//console.log("Define", obj.source, stat);
		stat.execute({}, EdenSymbol.netAgent, eden.root.scope);
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

		eden.root.lookup("jseden_project_mode").assign((eden.root.lookup("jseden_p2p_doactive").value()) ? "restore" : "normal", eden.root.scope, Symbol.defaultAgent);

		// TODO Must reset environment first!
		/*Eden.DB.load(undefined, undefined, obj, function() {
			me.loading = false;
		});*/
		eden.project = new Eden.Project(obj.pid, obj.name, obj.script,eden);
		Eden.Project.emit("loading", [eden.project]);
		eden.project.vid = obj.vid;
		eden.project.title = obj.title;
		eden.project.author = obj.ownername;
		eden.project.authorid = obj.owner;
		eden.project.start(function() {
			Eden.Project.emit("load", [eden.project]);
			me.loading = false;
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
		console.log("Register peer",obj.id,obj.username);
		Eden.Peer.emit("user", [obj.id,obj.username, obj.password]);
		eden.root.lookup("jseden_p2p_"+obj.id.replace(/\-/g, "_")+"_name").assign(obj.username, eden.root.scope, EdenSymbol.localJSAgent);
		me.connections[obj.id].connection.send(JSON.stringify({cmd: "status", status: "Connected", code: 1}));
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
			if (eden.project && me.clone) {
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

	function processCall(obj) {
		var p = eden.root.lookup(obj.name);
		try {
			p.value().apply(p, obj.args);
		} catch(e) {

		}
	}

	function processWhen(obj) {
		console.log("ProcessWhen", obj);

		Eden.Selectors.query(".id("+obj.wid+")",undefined,undefined,function(whens){
			for (var i=0; i<whens.length; i++) {
				if (obj.status) {
					eden.project.registerAgent(whens[i], true);
				} else {
					eden.project.removeAgent(whens[i], true);
				}
			}
		});
		// TODO BroadcastExcept
	}

	function processRequire(obj) {
		edenUI.loadPlugin(obj.name);
		// TODO BroadcastExcept
	}

	function removePatchParts(obj){
        console.log("Patch", obj);
		// First remove old
        if (obj.remove.length > 0) {
            removePatchPart(0,obj, function(){
                for (var i=0; i<me.todorm.length; i++) {
                    me.todorm[i][0].removeChild(me.todorm[i][1]);
                }
                addPatchParts(obj);	
            });
        } else {
            addPatchParts(obj);
        } 
	}

	function removePatchPart(i,obj,callback){
		Eden.Selectors.query(obj.remove[i].path,undefined,undefined,function(nodeList){
			var node = nodeList[0];
			if (!node){
                console.error("Failed to remove path: ", obj.remove[i].path);
				if(i < obj.remove.length - 1)
					removePatchPart(i+1,obj,callback);
				else{
					callback();
				}
				return;
			}
            if (nodeList.length > 1) {
                console.warn("Too many nodes");
            }
			me.frags[obj.remove[i].path] = node;
			
			var stat = undefined; // = Eden.Index.getByID(obj.remove[i].id)[0];
			if (obj.remove[i].id == 0) {
				stat = node.statements[0];
			} else {
				for (var j=0; j<node.statements.length; j++) {
					if (node.statements[j].id == obj.remove[i].id) {
						if (obj.remove[i].ws) {
							stat = node.statements[j].nextSibling;
							//console.log("STAT BEING REMOVED", stat);
							if (stat && stat.type != "dummy") stat = undefined;
						} else {
							stat = node.statements[j];
						}
						break;
					}
				}
			}
			//console.log("Remove stat", stat);
			if (stat) {
				for (var j=0; j<obj.add.length; j++) {
					if (obj.add[j].ws && obj.add[j].id == stat.id) {
						obj.add[j].id = (stat.previousSibling) ? stat.previousSibling.id : 0;
						//console.log("FIXUP");
					}
				}
	
				// TODO Adding new may be relative to removed node ... fix this
	
				//node.removeChild(stat);
				me.todorm.push([node,stat]);
			}	
			if(i < obj.remove.length - 1)
				removePatchPart(i+1,obj,callback);
			else{
				callback();
			}
		});		
	}

	function addPatchParts(obj){
		// Second, add new
        if (obj.add.length === 0) {
            for (var x in me.frags) {
                Eden.Fragment.emit("patch", [undefined, me.frags[x]]);
            }	
            me.broadcastExcept(obj.id, obj);
        } else {
            addPatchPart(0,obj,function(){
                for (var x in me.frags) {
                    Eden.Fragment.emit("patch", [undefined, me.frags[x]]);
                }	
                me.broadcastExcept(obj.id, obj);
            });
        }
	}
	
	function addPatchPart(i,obj,callback){
		Eden.Selectors.query(obj.add[i].path,undefined,undefined,function(nodeList){
			var node = nodeList[0];
			if (!node){
                console.error("Node not found during add", obj.add[i].path);
				if(i < obj.add.length -1){
					addPatchPart(i+1,obj,callback);
				}else{
					callback();
				}
				return;
			}
            if (nodeList.length > 1) {
                console.warn("Too many nodes");
            }
			me.frags[obj.add[i].path] = node;
			if (!obj.add[i].ws) {
				var stat = Eden.AST.parseStatement(obj.add[i].source);
				if (node.statements[obj.add[i].index]) node.insertBefore(node.statements[obj.add[i].index], stat);
				else node.appendChild(stat);
			} else {
				var stat = new Eden.AST.DummyStatement();
				stat.source = obj.add[i].source;
				stat.numlines = stat.source.split("\n").length-1;
	
				if (obj.add[i].id == 0) {
					if (node.statements[0]) node.insertBefore(node.statements[0], stat);
					else node.appendChild(stat);
					stat.buildID();
				} else {
					for (var j=0; j<node.statements.length; j++) {
						if (node.statements[j].id == obj.add[i].id) {
							//console.log("INSERTAFTER", node.statements[j]);
							var nstat = node.statements[j].nextSibling;
							if (nstat) node.insertBefore(nstat, stat);
							else node.appendChild(stat);
							//if (stat && stat.type != "dummy") stat = undefined;
							stat = undefined;
							break;
						}
					}
	
					if (stat) {
						node.appendChild(stat);
						stat.buildID();
					}
				}
	
				//if (node.statements[obj.add[i].index]) node.insertBefore(node.statements[obj.add[i].index], stat);
				//else node.appendChild(stat);
			}
			if(i < obj.add.length -1){
				addPatchPart(i+1,obj,callback);
			}else{
				callback();
			}
		});

	}

	function processPatch(obj) {
		//console.log("Patching", obj);
		me.frags = {};
		me.todorm = [];

        if (!me.lastPatch.has(obj.id)) {
            me.lastPatch.set(obj.id, obj.stamp - 1);
        }

        const lastPatch = me.lastPatch.get(obj.id);

        if (lastPatch + 1 == obj.stamp) {
            me.lastPatch.set(obj.id, obj.stamp);
		    removePatchParts(obj);
            const newKey = obj.id + '--' + (obj.stamp + 1);
            if (me.patchQueue.has(newKey)) {
                processPatch(me.patchQueue.get(newKey));
                me.patchQueue.delete(newKey);
            }
        } else {
            console.warn("Queue patch", obj.stamp);
            const key = obj.id + '--' + obj.stamp;
            me.patchQueue.set(key, obj);
        }

		//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.applyPatch(obj.patch, obj.lineno) });
	}

	function processData(conn, data) {
		var obj = JSON.parse(data);
		obj.id = conn.peer;
		// console.log("P2P DATA",obj);
		var pconn = me.connections[obj.id];
		//console.log(obj.cmd,obj.symbol);

		switch(obj.cmd) {
		case "assign"		: if (pconn.observe) processAssign(obj); break;
		case "define"		: if (pconn.observe) processDefine(obj); break;
		case "do"			: if (pconn.observe) processDo(obj); break;
		case "listassign"	: if (pconn.observe) processListAssign(obj); break;
		case "restore"		: if (pconn.observe) processRestore(obj); break;
		case "execstatus"	: if (pconn.observe) processExecStatus(obj); break;
		case "register"		: processRegister(obj); break;
		case "status"		: Eden.Peer.emit("status", [obj.status, obj.code]); break;
		case "getsnapshot"	: processGetSnapshot(obj); break;
		case "callback"		: processCallback(obj); break;
		case "reqshare"		: processReqShare(obj); break;
		case "reqobserve"	: processReqObserve(obj); break;

		//TODO: Should the below cases also have if(pconn.observe)?!

		case "patch"		: processPatch(obj); break;
		case "when"			: processWhen(obj); break;
		case "require"		: processRequire(obj); break;
		case "call"			: processCall(obj); break;
		//case "ownership"	: processOwnership(obj); break;
		//case "doxy"			: processDoxy(obj); break;
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
				peer = new Peer(id, {config: { iceServers: [{url:'stun:stun.l.google.com:19302'}]}});
			} else {
				peer = new Peer({config: { iceServers: [{url:'stun:stun.l.google.com:19302'}]}});
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
						conn.send(JSON.stringify({cmd: "register", username: name, id: id, password: eden.peer.password}));
					});
					conn.on('error',function(e){
						console.error(e);
					});
					conn.on('close',function(e){
						console.warn('Closing connection ', e);
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
					if (me.config.share && me.clone) {
						// Auto share state.
						var script = eden.project.generate();
						conn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
							vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
							name: eden.project.name, title: eden.project.title}));
					}
				});
				conn.on('error', function(e){
					console.error(e);
				});
				conn.on('close', function(e){
					console.warn('Closing connection ', e);
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

		Eden.Fragment.listenTo('patch',this,function(frag,ast,changes){
			if(changes && changes.length > 0 && me.capturepatch) {
				var data = {cmd: "patch", timestamp: frag.ast.stamp, stamp: patchCount++, remove: changes[1], add: changes[0]};
				me.broadcast(data);
				//console.log("Patch changes", data);
			}
		});
		/*Eden.Agent.listenTo("owned", this, function(origin, cause) {
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

	this.init = init;
	
	Eden.DB.listenTo("login", this, () => {init((Eden.DB.username) ? Eden.DB.username : "Anonymous")});
	// if (master || Eden.DB.isLoggedIn() && id) init((Eden.DB.username) ? Eden.DB.username : "Anonymous");
    if (master || id) init((Eden.DB.username) ? Eden.DB.username : "Anonymous");

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

	var cloneSym = eden.root.lookup("jseden_p2p_clone");
	if (cloneSym.value() === undefined) cloneSym.assign(true, eden.root.scope, EdenSymbol.defaultAgent);
	cloneSym.addJSObserver("p2p", function(sym, value) {
		if (value) {
			me.clone = true;
		} else {
			me.clone = false;
		}
	});

	var capEdSym = eden.root.lookup("jseden_p2p_captureedits");
	capEdSym.addJSObserver("p2p", function(sym, value) {
		me.capturepatch = value;
	});

	var recordSym = eden.root.lookup("jseden_p2p_record");
	recordSym.addJSObserver("p2p", function(sym, value) {
		me.record = value;
		if (value) {
			me.startrecordtime = Date.now();
			me.log = [];
		}
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

	if (this.record) {
		this.log.push('{"timestamp": ' + (Date.now() - this.startrecordtime) + ', "message": "'+msg+'"}');
	}

	for (var x in this.connections) {
		var pconn = this.connections[x];
		if (pconn.share) {
			//console.log("Send DATA",x,msg);
			pconn.connection.send(msg);
		}
	}
}

Eden.Peer.prototype.broadcastExcept = function(id, msg) {
	//console.log(msg); return;
	if (this.loading || this.id === undefined) return;
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

Eden.Peer.prototype.assign = function(agent, sym, value) {
	if (agent && !agent.loading && !agent.local) {
		//console.log("P2P Assign "+sym + " = " + Eden.edenCodeForValue(value));
		this.broadcast({cmd: "assign", symbol: sym, value : Eden.edenCodeForValue(value)});
	}
}

Eden.Peer.prototype.define = function(agent, sym, source, deps) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast({cmd: "define", symbol: sym, source: source, dependencies: deps});
	}
}

Eden.Peer.prototype.doRequire = function(str) {
	this.broadcast({cmd: "require", name: str});
}

Eden.Peer.prototype.doImport = function(agent, selector) {

}

Eden.Peer.prototype.callProcedure = function(name, args) {
	this.broadcast({cmd: "call", name: name, args: args});
}

Eden.Peer.prototype.activateWhen = function(whenid) {
	this.broadcast({cmd: "when", status: true, wid: whenid});
}

Eden.Peer.prototype.deactivateWhen = function(whenid) {
	this.broadcast({cmd: "when", status: false, wid: whenid});
}

/*Eden.Peer.prototype.doExec = function(agent, selector) {
	if (agent && !agent.loading && !agent.local) {
		this.broadcast({cmd: "do", selector: selector});
	}
}*/

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
	Eden.Peer.emit("peerupdate");
}

Eden.Peer.prototype.requestUnShare = function(id, cb) {
	var pconn = this.connections[id];

	// TODO Only share one at a time unless collaborating...
	
	if (pconn) {
		pconn.observe = false;
		pconn.connection.send(JSON.stringify({cmd: "reqshare", value: false, cbid: this.addCallback(cb)}));
	}
	Eden.Peer.emit("peerupdate");
}

Eden.Peer.prototype.requestObserve = function(id, cb) {
	var pconn = this.connections[id];

	
	if (pconn) {
		pconn.share = true;
		pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: true, cbid: this.addCallback(cb)}));
		// Auto share state.
		
		if (eden.project && this.clone) {
			var script = eden.project.generate(); //Eden.Generator.getScript();
			pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
			vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
			name: eden.project.name, title: eden.project.title}));
		}
	}
	Eden.Peer.emit("peerupdate");
}

Eden.Peer.prototype.requestUnObserve = function(id, cb) {
	var pconn = this.connections[id];

	if (pconn) {
		pconn.share = false;
		pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: false, cbid: this.addCallback(cb)}));
	}
	Eden.Peer.emit("peerupdate");
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
		
		if (eden.project && me.clone) {
			// Auto share state.
			var script = eden.project.generate(); //Eden.Generator.getScript();
			pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
			vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
			name: eden.project.name, title: eden.project.title}));
		}
	}
	Eden.Peer.emit("peerupdate");
}

Eden.Peer.prototype.requestUnCollaborate = function(id, cb) {
	Eden.Peer.emit("peerupdate");
}


