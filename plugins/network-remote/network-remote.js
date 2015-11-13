EdenUI.plugins.NetworkRemote = function(edenUI, success){
	var me = this;
	var program;
	var longwait = false;
	var connected = false;
	
	this.createDialog = function(name,mtitle) {

		var viewData = {confirmClose: false};

		var nrHTML = "<div class=\"nrdiv\">" +
				"<div><label for=\"nr-ipaddr\">IP Address:</label><input type=\"text\" name=\"nr-ipaddr\" id=\"nr-ipaddr\" value=\"127.0.0.1\"></input></div>" +
				"<div><label for=\"nr-port\">Port:</label><input type=\"text\" name=\"nr-port\" id=\"nr-port\" value=\"8001\"></input></div>" +
				"<div><label for=\"nr-key\">Session Key:</label><input type=\"text\" name=\"nr-key\" id=\"nr-key\" value=\"abcde\"></input></div>" +
				"<div><input type=\"button\" value=\"Connect\" name=\"connectBtn\" id=\"connectBtn\"></input></div>" +
				"<div><label for=\"speedrange\">Speed:</label><input type=\"range\" name=\"speedrange\" id=\"nr-speedrange\" step=\"0.5\" min=\"0.1\" max=\"8\" value=\"1\"/></div>" +
"<p id=\"nr-status\"></p>";
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(nrHTML)
			.dialog(
				{
					title: mtitle,
					width: 300,
					height: 450,
					minHeight: 120,
					minWidth: 230
				}
			)
			
			$("#connectBtn").click(function(){
				if(!connected)
					clickConnect();
				else
					clickDisconnect();
			});

			function clickDisconnect(){
				connected = false;
				$("#connectBtn").attr("value","Connect");
				$("#nr-ipaddr").removeAttr("disabled");
				$("#nr-port").removeAttr("disabled");
				$("#nr-key").removeAttr("disabled");
			}

			function clickConnect(){
				window.WebSocket = window.WebSocket || window.MozWebSocket;
				 
				if (!window.WebSocket) {
					console.log("WebSockets not supported");
					return;
				}
				 
				// open connection
				var url = "ws://" + $("#nr-ipaddr").val() + ":" + $("#nr-port").val() + '/'; 
				var connection = new WebSocket(url);
				
				Eden.Agent.listenTo('execute',this,function(origin,code,line){
					if(origin)
						connection.send(JSON.stringify({name: origin.name, line: line, code: code}));
				});
				Eden.Agent.listenTo("owned", this, function(origin, cause) {
					if (cause == "net") return;
					connection.send(JSON.stringify({name: origin.name, owned: origin.owned}));
				});
				eden.listenTo('beforeAssign',this,function(symbol, value, origin){
					if (origin != "net") {
						connection.send(JSON.stringify({name: undefined, code: symbol.name.slice(1) + "=" + Eden.edenCodeForValue(value) + ";"}));
						//connection.send(symbol.name.slice(1) + "=" + Eden.edenCodeForValue(value) + ";");						
					}
				});
				$("#nr-status").html('<p>Connected to: ' + url + "</p>");
				connection.onopen = function (error) {
					connection.send($("#nr-key").val());
					viewData.confirmClose = true;
					//Make sure the pseudorandom numbers generated by different JS-EDEN instances
					//are the same.
					randomSeedSym = edenUI.eden.root.lookup("randomSeed");
					randomSeed = randomSeedSym.value();
					
					if (randomSeed === undefined) {
						randomSeedSym.assign((new Date()).getTime(), eden.root.scope, undefined, true);
					} else {
						pushSymbol("randomSeed");
					}
					pushSymbol("randomGenerator");
					connected = true;
					$("#connectBtn").attr("value","Disconnect");
					$("#nr-ipaddr").attr("disabled","disabled");
					$("#nr-port").attr("disabled","disabled");
					$("#nr-key").attr("disabled","disabled");
				};
				connection.onerror = function (error) {
					connected = false;
					$("#nr-ipaddr").removeAttr("disabled");
					$("#nr-port").removeAttr("disabled");
					$("#nr-key").removeAttr("disabled");
					$("#connectBtn").attr("value","Connect");
					$("#nr-status").html('<p>Error connecting to server - please verify server is running at ' + url + ". For usage instructions please read the comments in the <a href='plugins/network-remote/network-remote-server.js'>network-remote-server.js</a> file.</p>");
				};
				 

				// Forces the current definition of an observable to be sent to the remote clients,
 				// e.g. one defined before the connection was established.
 				function pushSymbol(name) {
 					var root = edenUI.eden.root;
 					var currentDef = root.lookup("definitionOf").definition(root)(name);
 					connection.send(JSON.stringify({code: currentDef}));
 				}

				// most important part - incoming messages
				connection.onmessage = function (message) {
					program = JSON.parse(message.data);
					
					for(var i = 0; i < program.length; i++){
						line = program[i].code;

						if (line.code) {
							$("#nr-status").html('<p>Received: ' + line.code + "</p>");
							var ast = new EdenAST(line.code);
							if (Eden.Agent.agents[line.name]) {
								ast.script.execute(eden.root, undefined, Eden.Agent.agents[line.name].ast);
							} else {
								ast.script.execute(eden.root, undefined, ast);
							}
						} else if (line.owned !== undefined) {
							console.log("OWNED BY OTHER: " + line.name + " = " + line.owned);
							if (Eden.Agent.agents[line.name]) {
								Eden.Agent.agents[line.name].setOwned(line.owned, "net");
							}
						}
					}
					//me.playCode(0);
					return;

				};
			}
			return viewData;
			//Initialise 
	}
	
	this.playCode = function(i) {
		if(program[i] === undefined){
			$("#nr-status").html("<p>Replay finished</p>");
			return;
		}
			
		var nextTime = program[i].time / $("#nr-speedrange").val();
		if(nextTime > 1000){
			$("#nr-status").html("<p>Next line in " + nextTime  + " milliseconds</p>");
			longwait = true;
		}else{
			if(longwait)
				$("#nr-status").html("<p>Replaying...</p>");
		}
		setTimeout(function(){
			eden.execute(program[i].code,"net","",{name:"/execute"},noop);
			me.playCode(i + 1);
		},nextTime);
	}	
	//Register the HTML view options
	edenUI.views["NetworkRemote"] = {dialog: this.createDialog, title: "Network Remote", category: edenUI.viewCategories.extension};
	edenUI.eden.include("plugins/network-remote/network-remote.js-e", success);
};
/* Plugin meta information */
EdenUI.plugins.NetworkRemote.title = "Network Remote";
EdenUI.plugins.NetworkRemote.description = "Method of syncronizing observables via TCP, and playing back scripts";
EdenUI.plugins.NetworkRemote.author = "Jonny Foss";
