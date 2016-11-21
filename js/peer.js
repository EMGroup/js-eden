Eden.Peer = function(master, id) {
	this.connections = [];
	var me = this;

	function processData(data) {
		var obj = JSON.parse(data);
		console.log(obj.cmd,obj.symbol);
		if (obj.cmd == "assign") {
			var sym = eden.root.lookup(obj.symbol.slice(1));
			sym.assign(obj.value, eden.root.scope, {name: "*net"});
		} else if (obj.cmd == "define") {
			var sym = eden.root.lookup(obj.symbol.slice(1));
			sym.eden_definition = obj.source;
			sym.define(eval(obj.code), {name: "*net"}, obj.dependencies);
		} else if (obj.cmd == "import") {
			Eden.Agent.importAgent(obj.path, obj.tag, obj.options, function() {

			});
		}
	}

	function init(name) {
		if (name) {
			var myid = name.replace(/[ \!\'\-\?\&]/g, "");
			var peer;
			if (id) {
				peer = new Peer(id, {key: 'w2cjkz0cpw6x0f6r'});
			} else {
				peer = new Peer({key: 'w2cjkz0cpw6x0f6r'});
			}
			peer.on('open', function(id) {
				console.log("My peer id is " + id);

				if (master) {
					var conn = peer.connect(master);
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
			});
		}
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
	for (var i=0; i<this.connections.length; i++) {
		this.connections[i].send(msg);
	}
}

Eden.Peer.prototype.assign = function(sym, value) {
	this.broadcast(JSON.stringify({cmd: "assign", symbol: sym, value : value}));
}

Eden.Peer.prototype.define = function(sym, source, rhs, deps) {
	this.broadcast(JSON.stringify({cmd: "define", symbol: sym, source: source, code: rhs, dependencies: deps}));
}

Eden.Peer.prototype.imports = function(path, tag, options) {
	this.broadcast(JSON.stringify({cmd: "import", path: path, tag: tag, options: options}));
}
