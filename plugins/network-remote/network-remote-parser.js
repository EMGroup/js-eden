var filename;
var fs = require("fs");
var reqSession;
var WebSocket = require("ws");

var codeLines;
process.argv.forEach(function(val, index, array){
	if(index == 2)
		filename = val;
	if(index == 3)
		reqSession = val;
});
fs.readFile(filename, "utf-8",function(err,data){
	if(err)
		return console.log(err);
	var lines = data.split(/REPLAY:|\nDeleting|\nAdding/);
	var firstTime = -1;
	codeLines = [];
	for(var i = 0; i < lines.length;i++){
		var tokens = lines[i].split(":")
		var session = tokens[1];
		if(session != reqSession)
			continue;
		var sender = tokens[0];
		var timestamp = tokens[2];
		var line = tokens.slice(3).join(":");
		if(firstTime == -1)
			firstTime = timestamp;
		codeLines.push({time:timestamp - firstTime,code:line});
		firstTime = timestamp;
	}
	playback();
});
function playback(){
	var ws = new WebSocket("ws://localhost:8001");
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
