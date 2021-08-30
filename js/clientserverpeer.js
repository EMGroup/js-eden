Eden.CSPeer = function(master,id){

    this.id = id;
    this.master = master;
    this.room = master;
    this.masterMode = false;
    var me = this;
    if(id){
        this.masterMode = true;
        this.room = id;
    }
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

	this.frags = {};
	this.todorm = [];

    this.socket = io("http://localhost:3000",{withCredentials: true,
	extraHeaders: {
	  "my-custom-header": "abcd"
	}});
    this.socket.emit('client-reg', this.masterMode, this.room, function(r){
        console.log("After client-reg " + r);
    });
    
    this.socket.on("room-entry",function(newEntryID){
        console.log("Room entry");
        var script = eden.project.generate();
        me.socket.emit('restore',newEntryID,JSON.stringify({script: script, pid: eden.project.id,
        vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
        name: eden.project.name, title: eden.project.title}));
    });

    this.socket.on("restore",function(message){
        console.log("Restoring " + message);
        me.processRestore(JSON.parse(message));
    });

    function processAssign(obj){
        var sym = eden.root.lookup(obj.symbol);
        var express = Eden.AST.parseExpression(obj.value);
        sym.assign(express.execute({}, EdenSymbol.netAgent,eden.root.scope), eden.root.scope, EdenSymbol.netAgent);
        me.broadcastExcept(obj.id,obj);
    }

    function processDefine(obj){
        var sym = eden.root.lookup(obj.symbol);
		//sym.eden_definition = obj.source;
		//sym.define(eval(obj.code), EdenSymbol.netAgent, obj.dependencies, obj.source);
		var stat = Eden.AST.parseStatement(obj.source);
		stat.local = true;
		//console.log("Define", obj.source, stat);
		stat.execute({}, EdenSymbol.netAgent, eden.root.scope);
		me.broadcastExcept(obj.id, obj);
    }

    function processImport(obj){

    }

    function processListAssign(obj){
        var sym = eden.root.lookup(obj.symbol);
		//var ast = new Eden.AST(obj.value, undefined, Symbol.netAgent, true);
		var express = Eden.AST.parseExpression(obj.value); //ast.pEXPRESSION();
		sym.listAssign(express.execute({}, EdenSymbol.netAgent, eden.root.scope), eden.root.scope, EdenSymbol.netAgent, false, obj.components);
		me.broadcastExcept(obj.id, obj);
    }

    function processRegister(obj){
        console.log("Register peer",obj.id,obj.username);
		Eden.CSPeer.emit("user", [obj.id,obj.username]);
		eden.root.lookup("jseden_p2p_"+obj.id+"_name").assign(obj.username, eden.root.scope, EdenSymbol.localJSAgent);
		me.socket.emit('data',JSON.stringify({cmd: "status", status: "Connected", code: 1}));
    }

    function processGetSnapshot(obj){
        var script = eden.project.generate();
		me.socket.send(JSON.stringify({cmd: "callback", data: script, cbid: obj.cbid}));
    }

    function processReqShare(obj) {
		if (obj.value) {
            me.config.share = true;
			// Auto share state.
			me.socket.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
					vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
					name: eden.project.name, title: eden.project.title}));
            me.socket.send(JSON.stringify({cmd: "callback", data: true, cbid: obj.cbid}));
			Eden.CSPeer.emit("share", [obj.id]);
		} else {
			me.config.share = false;
			Eden.CSPeer.emit("unshare", [obj.id]);
		}
	}

    function processReqObserve(obj){
        if(obj.value){
            me.config.observe = true;
            me.socket.send(JSON.stringify({cmd: "callback", data: true, cbid: obj.cbid}));
            Eden.CSPeer.emit("observe",[obj.id]);
        }else{
            me.config.observe = false;
            Eden.CSPeer.emit("unobserve",[obj.id]);
        }
    }

    function processCallback(obj){
        var cb = me.callbacks[obj.cbid];
        if(cb) cb(obj.data);
        delete me.callbacks[obj.cbid];
    }

    function processCall(obj){
        var p = eden.root.lookup(obj.name);
        try{
            p.value().apply(p,obj.args);
        }catch(e){

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
		// First remove old
		removePatchPart(0,obj, function(){
			for (var i=0; i<this.todorm.length; i++) {
				this.todorm[i][0].removeChild(this.todorm[i][1]);
			}
			addPatchParts(obj);	
		});
	}

    function removePatchPart(i,obj,callback){
		Eden.Selectors.query(obj.remove[i].path,undefined,undefined,function(nodeList){
			var node = nodeList[0];
			if (!node){
				if(i < obj.remove.length - 1)
					removePatchPart(i+1,obj,callback);
				else{
					callback();
				}
				return;
			}
			this.frags[obj.remove[i].path] = node;
			
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
				this.todorm.push([node,stat]);
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
		addPatchPart(0,obj,function(){
			for (var x in this.frags) {
				Eden.Fragment.emit("patch", [undefined, this.frags[x]]);
			}	
			me.broadcastExcept(obj.id, obj);
		});
	}
	
	function addPatchPart(i,obj,callback){
		Eden.Selectors.query(obj.add[i].path,undefined,undefined,function(nodeList){
			var node = nodeList[0];
			if (!node){
				if(i < obj.add.length -1){
					addPatchPart(i+1,obj,callback);
				}else{
					callback();
				}
				return;
			}
			this.frags[obj.add[i].path] = node;
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
		this.frags = {};
		this.todorm = [];
		
		removePatchParts(obj);

		//Eden.Agent.importAgent(obj.name, "default", ["noexec","create"], function(ag) { ag.applyPatch(obj.patch, obj.lineno) });
	}

    function init(name) {
		if (me.enabled) return;

		Eden.Fragment.listenTo('patch',this,function(frag,ast,changes){
			if(changes && changes.length > 0 && me.capturepatch) {
				var data = {cmd: "patch", remove: changes[1], add: changes[0]};
				me.broadcast(data);
				//console.log("Patch changes", data);
			}
		});

        Eden.DB.listenTo("login", this, init);
        if (master || Eden.DB.isLoggedIn() && id) init((Eden.DB.username) ? Eden.DB.username : "Anonymous");

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

        // function createDialog(name, title) {
        //     var viewName = name.slice(0,-7); //remove -dialog suffix
    
        //     $('<div id="' + name + '"></div>')
        //     .html("")
        //     .dialog({
        //         title: "Peer Connections",
        //         width: 200,
        //         height: 300,
        //         minHeight: 120,
        //         minWidth: 100 //,
        //         //dialogClass: "debugger-dialog"
        //     });
        // }
    
        // edenUI.views["Peers"] = {dialog: createDialog, title: "Connections", category: edenUI.viewCategories.environment};
        // edenUI.menu.updateViewsMenu();
    }

};

Eden.CSPeer.listeners = {};
Eden.CSPeer.emit = emit;
Eden.CSPeer.listenTo = listenTo;

Eden.CSPeer.prototype.processData = function(socket, data) {
	// var obj = JSON.parse(data);
	// obj.id = socket.id;

	// switch(obj.cmd) {
	// case "assign"		: if (pconn.observe) processAssign(obj); break;
	// case "define"		: if (pconn.observe) processDefine(obj); break;
	// case "do"			: if (pconn.observe) processDo(obj); break;
	// case "listassign"	: if (pconn.observe) processListAssign(obj); break;
	// case "restore"		: eden.peer.processRestore(obj); break;
	// case "execstatus"	: if (pconn.observe) processExecStatus(obj); break;
	// case "register"		: processRegister(obj); break;
	// case "status"		: Eden.Peer.emit("status", [obj.status, obj.code]); break;
	// case "getsnapshot"	: processGetSnapshot(obj); break;
	// case "callback"		: processCallback(obj); break;
	// case "reqshare"		: processReqShare(obj); break;
	// case "reqobserve"	: processReqObserve(obj); break;
	// case "patch"		: processPatch(obj); break;
	// case "when"			: processWhen(obj); break;
	// case "require"		: processRequire(obj); break;
	// case "call"			: processCall(obj); break;
	// //case "ownership"	: processOwnership(obj); break;
	// //case "doxy"			: processDoxy(obj); break;
	// }

	// if (me.config.logging) {
	// 	console.log(obj);
	// }
};

Eden.CSPeer.prototype.broadcast = function(msg) {
	//console.log(msg); return;
	// if (this.loading) return;
	// msg = JSON.stringify(msg);

	// if (this.record) {
	// 	this.log.push('{"timestamp": ' + (Date.now() - this.startrecordtime) + ', "message": "'+msg+'"}');
	// }

	// for (var x in this.connections) {
	// 	var pconn = this.connections[x];
	// 	if (pconn.share) {
	// 		//console.log("Send DATA",x,msg);
	// 		pconn.connection.send(msg);
	// 	}
	// }
};

Eden.CSPeer.prototype.broadcastExcept = function(id, msg) {
	//console.log(msg); return;
	// if (this.loading || this.id === undefined) return;
	// msg = JSON.stringify(msg);

	// for (var x in this.connections) {
	// 	if (x == id) continue;
	// 	var pconn = this.connections[x];
	// 	if (pconn.share) {
	// 		pconn.connection.send(msg);
	// 	}
	// }
};

Eden.CSPeer.prototype.authoriseWhen = function(when) {
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
};

Eden.CSPeer.prototype.assign = function(agent,sym,value){
    // if(agent && !agent.loading && !agent.local){
    //     this.broadcast({cmd: "assign", symbol: sym, value : Eden.edenCodeForValue(value)});
    // }
};


Eden.CSPeer.prototype.define = function(agent, sym, source,deps){

};

Eden.CSPeer.prototype.doRequire = function(str) {
	// this.broadcast({cmd: "require", name: str});
};

Eden.CSPeer.prototype.doImport = function(agent, selector) {

};

Eden.CSPeer.prototype.callProcedure = function(name, args) {
	// this.broadcast({cmd: "call", name: name, args: args});
};

Eden.CSPeer.prototype.activateWhen = function(whenid) {
	// this.broadcast({cmd: "when", status: true, wid: whenid});
};

Eden.CSPeer.prototype.deactivateWhen = function(whenid) {
	// this.broadcast({cmd: "when", status: false, wid: whenid});
};

Eden.CSPeer.prototype.listAssign = function(agent, sym, value, components) {
	// if (agent && !agent.loading && !agent.local) {
	// 	this.broadcast({cmd: "listassign", symbol: sym, value : Eden.edenCodeForValue(value), components: components});
	// }
};

Eden.CSPeer.prototype.addCallback = function(func) {
	// var id = this.callbackid++;
	// this.callbacks[id] = func;
	// return id;
};

Eden.CSPeer.prototype.getSnapshot = function(id, cb) {
	// if (this.connections[id]) {
	// 	this.connections[id].connection.send(JSON.stringify({cmd: "getsnapshot", cbid: this.addCallback(cb)}));
	// }
};

Eden.CSPeer.prototype.requestShare = function(id, cb) {
	// var pconn = this.connections[id];

	// if (pconn) {
	// 	pconn.observe = true;
	// 	pconn.connection.send(JSON.stringify({cmd: "reqshare", value: true, cbid: this.addCallback(cb)}));
	// }
};

Eden.CSPeer.prototype.requestUnShare = function(id, cb) {
	// var pconn = this.connections[id];

	// // TODO Only share one at a time unless collaborating...

	// if (pconn) {
	// 	pconn.observe = false;
	// 	pconn.connection.send(JSON.stringify({cmd: "reqshare", value: false, cbid: this.addCallback(cb)}));
	// }
};

Eden.CSPeer.prototype.requestObserve = function(id, cb) {
	// var pconn = this.connections[id];

	// if (pconn) {
	// 	pconn.share = true;
	// 	pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: true, cbid: this.addCallback(cb)}));
	// 	// Auto share state.

	// 	if (eden.project && this.clone) {
	// 		var script = eden.project.generate(); //Eden.Generator.getScript();
	// 		pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
	// 			vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
	// 			name: eden.project.name, title: eden.project.title}));
	// 	}
	// }
};

Eden.CSPeer.prototype.requestUnObserve = function(id, cb) {
	// var pconn = this.connections[id];

	// if (pconn) {
	// 	pconn.share = false;
	// 	pconn.connection.send(JSON.stringify({cmd: "reqobserve", value: false, cbid: this.addCallback(cb)}));
	// }
};

Eden.CSPeer.prototype.requestCollaborate = function(id, cb) {
	// var me = this;
	// var pconn = this.connections[id];

	// if (pconn) {
	// 	//this.config.observe = true;
	// 	pconn.connection.send(JSON.stringify({cmd: "reqshare", value: true, cbid: this.addCallback(function() {
	// 		// Only observe now, to ignore restore message.
	// 		pconn.observe = true;
	// 		me.requestObserve(id, cb);
	// 	})}));

	// 	if (eden.project && me.clone) {
	// 		// Auto share state.
	// 		var script = eden.project.generate(); //Eden.Generator.getScript();
	// 		pconn.connection.send(JSON.stringify({cmd: "restore", script: script, pid: eden.project.id,
	// 			vid: eden.project.vid, ownername: eden.project.author, owner: eden.project.authorid,
	// 			name: eden.project.name, title: eden.project.title}));
	// 	}
	// }
};

Eden.CSPeer.prototype.requestUnCollaborate = function(id, cb) {
	
};


Eden.CSPeer.prototype.processRestore = function(obj){
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
};