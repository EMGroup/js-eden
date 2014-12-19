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
var sockets = [];


var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({port: 8001});

function receiveData(socket, data){
	//For each received command, send it to every known socket 
	//(apart from the socket that sent the data)
	for(var i = 0; i < sockets.length; i++){
		if(sockets[i] !== socket)
			sockets[i].send(data);
	}
}
wss.on('connection', function(socket) {
	sockets.push(socket)
	socket.on('message', function(data) {
		receiveData(socket,data);	
	});
	socket.on('close', function(){
		closeSocket(socket);
	});
}); 

function closeSocket(socket){
	//Remove closed socket from array of known sockets
	var i = sockets.indexOf(socket);
	if(i != -1)
		sockets.splice(i, 1);
}
