var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:8001');

var SerialPort = require("serialport").SerialPort
var sp = new SerialPort("/dev/ttyACM0", { baudrate: 115200 });

ws.on('open', function() {
	console.log("Connection open...");
	ws.send("abcde");
});

pinModes = [];

function sendCommand(pin, value, command) {
	var buf = new Buffer(3);
	buf.writeUInt8(pin, 0);
	buf.writeUInt8(value, 1);
	buf.writeUInt8(command, 2);
	console.log(buf);
	sp.write(buf);
}

function pinMode(pin, mode) {
	console.log("Mode for "+pin+" = "+mode);	
	var val = 0;
	
	pinModes[pin] = mode;

	switch(mode) {
	case "IN":	val = 1; break;
	case "OUT":	val = 0; break;
	default:	return;
	}

	sendCommand(pin, val, 1);
}

function writeDigitalPin(pin, val) {
	console.log("Value for "+pin+" = "+val);

	var type = typeof val;
	if (type == "boolean") {
		if (pinModes[pin] != "OUT") {
			pinMode(pin, "OUT");
		}
		sendCommand(pin, (val) ? 1 : 0, 3);
	} else if (type == "number") {
		if (val < 0) {
			pinMode(pin, "IN");
		} else {
			if (pinModes[pin] != "OUT") {
				pinMode(pin, "OUT");
			}
			sendCommand(pin, val, 4);
		}
	}
}

ws.on('message', function(data, flags) {
	var struct = JSON.parse(data);

	for (var i=0; i<struct.length; i++) {
		if (struct[i].code && struct[i].code.action == "assign") {
			var name = struct[i].code.symbol;
			var val = struct[i].code.value;

			// Send change to arduino device...
			var components = name.split("_");
			if (components.length == 2 && components[0] == "arduino") {
				if (components[1].charAt(0) == "d") {
					writeDigitalPin(parseInt(components[1].substring(1)), val);
				}
			}
		}
	}
});

/*sp.on('data', function(data) {
	console.log(data.toString());
});*/

