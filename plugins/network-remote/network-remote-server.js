/*
To setup the server on its default port, run:

nodejs state-listener-server.js

If running this file results in an error 'cannot find ws', run 'npm install ws' in this directory
then try the above nodejs command again. You should then have a server running on port 8001

To send messages to the server (and therefore any connected JS-Eden browsers)
You should then be able to run: 
PATH_TO_JSEDEN/node_modules/ws/wscat/bin/wscat -c wc://127.0.0.1:8001/
Any EDEN commands typed into the wscat terminal will be sent to all connected browsers  

*/


//Array of sockets to syncronize data with
/*TODO: Make this into a 2D array, with the key to the first key to the array 
acting as a 'password' allowing one server to host many separate 'channels'
*/
var socketKeys = [];

var allSockets = {};
var sessionKeys = [];

var WebSocketServer = require('ws').Server
var fs = require('fs');
var port = 8001;
var debug = false;

var agents = {};

var savefilename;

function printUsage(){
        console.log("Usage:\nnode network-remote-server.js FILENAME [--port=PORT] [--debug]");
}

process.argv.forEach(function(val, index, array){
	if(index == 2)
		savefilename = val;
	if(val == "--debug")
		debug = true;
	var options = val.split("=");
        if(options[0] == "--port")
        	port = options[1];
});

if(savefilename === undefined){
	console.log("No filename defined");
	return;
}
	

var wss = new WebSocketServer({port: port});
function receiveData(socket, data){
	//For each received command, send it to every known socket 
	//(apart from the socket that sent the data)
	var socketKey = socket.upgradeReq.headers["sec-websocket-key"];
	var sessionKey = socketKeys[socketKey];
	if(typeof sessionKey == 'undefined'){
		//authenticate
		sessionKey = data;
		socketKeys[socketKey] = sessionKey;
		if(typeof allSockets[sessionKey] == 'undefined')
			allSockets[sessionKey] = [];
		allSockets[sessionKey].push(socket);
		var msg = "REPLAY:"+(allSockets[sessionKey].length -1)+":"+sessionKey+":C:"+socketKey;
		if(debug)
			console.log(msg);
		logToFile(msg);
	}else{
		processCode(socket,data);
	}
}

function logToFile(msg){
	fs.appendFile(savefilename, msg + "\n", function(err){
		if(err) throw err;
	});
}

function sendToAllExcept(sessionKey, except, data) {
	var socketsInSession = allSockets[sessionKey];
	var str = JSON.stringify(data);
	for(var i = 0; i < socketsInSession.length; i++){
		if(socketsInSession[i] !== except){
			socketsInSession[i].send(str);
		}
	}
}

function processCode(socket, data){
	var sessionKey = socketKeys[socket.upgradeReq.headers["sec-websocket-key"]];
	var socketsInSession = allSockets[sessionKey];
	var sender = -1;
	var replay = false;
	var code = JSON.parse(data);
	var codeLines = [];

	// Need to manage ownership of script edit permissions
	if (code.action == "ownership") {
		if (agents[code.name] === undefined) {
			agents[code.name] = {owned: code.owned, socket: socket};
		} else {
			// Check for double ownership race condition
			if (agents[code.name].owned && code.owned) {
				socket.send(JSON.stringify([{time: 0, code :{action: "ownership", name: code.name, owned: true}}]));
				return;
			}
			agents[code.name].owned = code.owned;
			agents[code.name].socket = socket;
		}
	}

	codeLines.push({time: 0, code: code});
	var str = JSON.stringify(codeLines);
	for(var i = 0; i < socketsInSession.length; i++){
		if(socketsInSession[i] !== socket){
			socketsInSession[i].send(str);
		}else{
			sender = i;
		}
	}

	//sendToAllExcept(socket, codeLines);

	var msg = "REPLAY: " + sender + ":" + sessionKey + ":" + Date.now() + ":" + data;
	if(debug)
		console.log(msg);
	logToFile(msg);
}


wss.on('connection', function(socket) {
//	console.log(socket);
	socket.on('message', function(data) {
		receiveData(socket,data);	
	});
	socket.on('close', function(){
		closeSocket(socket);
	});
}); 

function receiveDataAuthenticate(socket,data){
}

function closeSocket(socket){
	//Remove closed socket from array of known sockets
	var socketKey = socket.upgradeReq.headers["sec-websocket-key"];
	var sessionKey = socketKeys[socketKey];
	var session = sessionKeys[sessionKey];

	// Unlock all scripts owned by this socket.
	var unlocks = [];
	for (var a in agents) {
		if (agents[a] && agents[a].socket === socket) {
			agents[a].owned = false;
			agents[a].socket = undefined;
			unlocks.push({time: 0, code :{action: "ownership", name: a, owned: false}});
		}
	}
	sendToAllExcept(sessionKey, socket, unlocks);

	var i = allSockets[sessionKey].indexOf(socket);
	if(i != -1)
		allSockets[sessionKey].splice(i,1);
	var msg = "REPLAY:?:" + sessionKey + ":D:" + socketKey;
	if(debug)
		console.log(msg);
	logToFile(msg);
	delete socketKeys[socketKey];
}
