const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:8000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/test.html', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

var roomMasters = {};

io.on('connection',(socket) => {
	socket.on('disconnecting', () => {
		console.log('user disconnecting' + socket.id);
	});

	socket.on('client-reg',(masterMode, room,callback) => {
		console.log((masterMode ? 'Master' : 'Client') + ' registration to room ' + room);
		socket.join(room);
		if(masterMode){
			roomMasters[room] = socket;
		}else{
			if(roomMasters[room]){
				roomMasters[room].emit('room-entry',socket.id);
			}
		}
		callback('Done');
//		socket.broadcast.emit('room-entry',{id: socket.id, username: msg.username});
	});

	socket.on('data',msg=>{
		socket.broadcast.emit('data',msg);
		console.log('Data received');
//		console.log(JSON.parse(msg));
	});

	socket.on('restore',function(targSocket, targMessage){
		console.log("Restoring");
		socket.to(targSocket).emit('restore',targMessage);
	});
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

