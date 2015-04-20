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
var wss = new WebSocketServer({port: 8001});

var saveFileCmd = "SAVEFILE = \"";
var savefilename = "";

function receiveData(socket, data){
	//For each received command, send it to every known socket 
	//(apart from the socket that sent the data)
	var socketKey = socket.upgradeReq.headers["sec-websocket-key"];
	var sessionKey = socketKeys[socketKey];
	if(typeof sessionKey == 'undefined'){
		//authenticate
		sessionKey = data;
		socketKeys[socketKey] = sessionKey;
		var tmplog = "Adding " + socketKey + " to session " + sessionKey + " (num: ";
		if(typeof allSockets[sessionKey] == 'undefined')
			allSockets[sessionKey] = [];
		allSockets[sessionKey].push(socket);
		console.log(tmplog + (allSockets[sessionKey].length - 1) + ")");
	}else{
		processCode(socket,data);
	}
}

function processCode(socket, data){
	var sessionKey = socketKeys[socket.upgradeReq.headers["sec-websocket-key"]];
	var socketsInSession = allSockets[sessionKey];
	var sender = -1;
	if(data.slice(0,saveFileCmd.length) == saveFileCmd){
		savefilename = data.slice(saveFileCmd.length,-2);
	}
	var replay = false;
	var codeLines = [];
/*	if(data == "REPLAY = true;"){
		replay = true;
		fs.readFile("replay.txt", "utf-8",function(err,data){
			if(err)
				return console.log(err);
			var lines = data.split("REPLAY: ");
			var starttime = Date.now()
			var firstTime = -1;
			var curTime;
			for(var i = 1; i < lines.length;i++){
				var tokens = lines[i].split(":")
				var sender = tokens[0]
				var timestamp = tokens[1]
				var line = tokens.slice(2).join(":");
				var nextTime = 0;
				if(firstTime == -1)
					firstTime = timestamp;
				codeLines.push({time:timestamp - firstTime,code:line});
				firstTime = timestamp;
			}
			for(var i = 0; i < socketsInSession.length; i++){
				socketsInSession[i].send(JSON.stringify(codeLines));
			}
		});
			
	}else{*/
		codeLines.push({time: 0, code: data});
		for(var i = 0; i < socketsInSession.length; i++){
			if(socketsInSession[i] !== socket){
				socketsInSession[i].send(JSON.stringify(codeLines));
			}else{
				sender = i;
			}
		}
		console.log("REPLAY: " + sender + ":" + sessionKey + ":" + Date.now() + ":" + data);
	//}
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

	var i = allSockets[sessionKey].indexOf(socket);
	if(i != -1)
		allSockets[sessionKey].splice(i,1);
	console.log("Deleting " + socketKey + " from session " + sessionKey);
	delete socketKeys[socketKey];
}
