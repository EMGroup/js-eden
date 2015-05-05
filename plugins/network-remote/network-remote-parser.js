var filename;
var fs = require("fs");
var reqSession;
var WebSocket = require("ws");
var codeLines;
var host = "127.0.0.1";
var port = "8001";
var debug = false;
var send = true;

function printUsage(){
	console.log("Usage:\nnode network-remote-parser.js FILENAME SESSION [--host=HOST] [--port=PORT] [--debug] [--no-send]");
}

process.argv.forEach(function(val, index, array){
	if(index == 2){
		filename = val;
	}else if(index == 3){
		reqSession = val;
	}else{
		if(val == "--help"){
			printUsage();
			return;
		}
		if(val == "--debug")
			debug = true;
		if(val == "--no-send")
			send = false;
		var options = val.split("=");
		if(options[0] == "--port")
			port = options[1];
		if(options[0] == "--host")
			host = options[1];
	}
});
if(reqSession === undefined || filename === undefined){
	printUsage();
	return;
}
fs.readFile(filename, "utf-8",function(err,data){
	if(err)
		return console.log(err);
	var lines = data.split(/REPLAY:/);
	var firstTime = -1;
	codeLines = [];
	for(var i = 1; i < lines.length;i++){
		var tokens = lines[i].split(":");
		var session = tokens[1];
		if(session != reqSession)
			continue;
		var sender = tokens[0];
		var timestamp = tokens[2];
		if(timestamp == "C" || timestamp == "D")
			continue;
		var line = tokens.slice(3).join(":");
		if(firstTime == -1)
			firstTime = timestamp;
		codeLines.push({time:timestamp - firstTime,code:line});
		firstTime = timestamp;
	}
	if(debug)
		console.log(codeLines);
	if(send)
		playback();
});
function playback(){
	var ws = new WebSocket("ws://"+host+":" + port);
	ws.on('open',function(){
		ws.send(reqSession);
		playLine(ws,0);	
	});
}
function playLine(ws, i){
	ws.send(codeLines[i].code);
	if(i < codeLines.length - 1){
		var nextTime = codeLines[i+1].time;
		setTimeout(function(){
			playLine(ws, i+1);
		},nextTime);
		console.log("Waiting for " + nextTime + "ms");
	}else{
		console.log("Finished");
		ws.close();
	}
}
