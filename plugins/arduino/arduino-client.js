var WebSocket = require('ws');
var yargs = require('yargs').argv;

var serialp = require("serialport");
var SerialPort = serialp.SerialPort;

var arduinoDevice = "/dev/ttyACM0";
var nrAddr = "localhost";
var nrPort = "8001";
var nrKey = "abcde";

serialp.list(function (err, ports) {
	ports.forEach(function(port) {
		if (port.manufacturer == "Arduino_Srl") arduinoDevice = port.comName;
	});

	if (yargs.d) arduinoDevice = yargs.d;
	if (yargs.device) arduinoDevice = yargs.device;
	if (yargs.h) nrAddr = yargs.h;
	if (yargs.host) nrAddr = yargs.host;
	if (yargs.p) nrPort = yargs.p;
	if (yargs.port) nrPort = yargs.port;
	if (yargs.s) nrKey = yargs.s;
	if (yargs.session) nrKey = yargs.session;

	var ws = new WebSocket('ws://'+nrAddr+':'+nrPort);


	ws.on('error', function(error) {
		console.log("Could not connect to network-remote");
	});

	ws.on('open', function() {
		console.log("Network connection open...");
		ws.send(nrKey);

		var sp = new SerialPort(arduinoDevice, { baudrate: 115200, autoOpen: false });

		var arduino_connected = false;

		pinModes = [];

		for (var i=0; i<14; i++) {
			pinModes[i] = "IN";
		}

		function sendCommand(pin, value, command) {
			var buf = new Buffer(4);
			buf.writeUInt8(pin, 0);
			buf.writeUInt16LE(value, 1);
			buf.writeUInt8(command, 3);
			//console.log(buf);
			sp.write(buf);
		}

		function pinMode(pin, mode) {
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
			//if (val > 255) val = true;
			if (val < 0) val = false;

			var type = typeof val;
			if (type == "boolean") {
				if (pinModes[pin] != "OUT") {
					pinMode(pin, "OUT");
				}
				sendCommand(pin, (val) ? 1 : 0, 3);
			} else if (type == "number") {
				if (pinModes[pin] != "OUT") {
						pinMode(pin, "OUT");
				}
				sendCommand(pin, val, 4);
			}
		}

		function inputHandler(name, value) {
			if (name.charAt(0) == "d") {
				if (value) pinMode(parseInt(name.substring(1)), "IN");
				else pinMode(parseInt(name.substring(1)), "OUT");
			}
		}

		function enabledHandler(name, value) {
			if (value) {
				sendCommand(50+parseInt(name.substring(1)), 1, 1);
			} else {
				sendCommand(50+parseInt(name.substring(1)), 0, 1);
			}
		}

		function digitalHandler(name, value) {
			writeDigitalPin(parseInt(name.substring(1)), value);
		}

		function analogHandler(name, value) {
			// Doesn't accept writes
		}

		function servoHandler(name, value) {
			if (value && name == "d9") {
				sendCommand(9, 1, 5);
			}
		}

		function toneHandler(dummy, pin) {
			sendCommand(pin, 1, 6);
		}

		arduinoHandlers = {
			"input": inputHandler,
			"enabled": enabledHandler,
			"digital": digitalHandler,
			"analog": analogHandler,
			"servo": servoHandler,
			"tone": toneHandler
		}

		/**
		 * Process assign events by parsing arduino observable names and directing
		 * to correct handler.
		 */
		ws.on('message', function(data, flags) {
			var struct = JSON.parse(data);

			if (!arduino_connected) return;

			for (var i=0; i<struct.length; i++) {
				if (struct[i].code && struct[i].code.action == "assign") {
					var name = struct[i].code.symbol;
					var val = struct[i].code.value;

					// Send change to arduino device...
					var components = name.split("_");
					if (components.length >= 2 && components[0] == "arduino") {
						if (arduinoHandlers[components[1]]) {
							arduinoHandlers[components[1]]((components.length == 3) ? components[2] : undefined, val);
						} else if (components[1].charAt(0) == "d") {
							arduinoHandlers.digital(components[1], val);
						} else if (components[1].charAt(0) == "a") {
							arduinoHandlers.analog(components[1], val);
						}
					}
				}
			}
		});

		var cacheData = [];

		function broadcastAssign(symbol, value) {
			ws.send(JSON.stringify({action: "assign", symbol: symbol, value: value}));
		}

		function processSerialData(obj) {
			var pin = obj[0];

			if (pin < 50) {
				var val = obj[1];
				//ws.send(JSON.stringify({action: "assign", symbol: "arduino_d"+pin, value: (val > 0) ? true : false}));
				broadcastAssign("arduino_d"+pin, (val > 0) ? true : false);
			} else {
				var val = obj[1] + (obj[2]*256);
				//ws.send(JSON.stringify({action: "assign", symbol: "arduino_a"+(pin-50), value: val}));
				broadcastAssign("arduino_a"+(pin-50), val);
			}
		}

		function serialHandlers() {
			sp.on('error', function(error) {
				console.log(error);
				arduino_connected = false;
				broadcastAssign("arduino_connected", false);
				broadcastAssign("arduino_error", error);

				setTimeout(function() {
					sp.open();
				}, 2000);
			});


			sp.on('open', function() {
				arduino_connected = true;
				broadcastAssign("arduino_connected", true);
				console.log("Arduino connected...");

				sp.on('close', function() {
					arduino_connected = false;
					broadcastAssign("arduino_connected", false);
					console.log("Arduino disconnected.");
					setTimeout(function() {
						serialHandlers();
						sp.open();
					}, 10000);
				});


				sp.on('data', function(data) {
					var i = 0;

					while (i < data.length) {
						if (cacheData.length == 0) {
							cacheData.push(data[i]);
							i++;
						}

						var pin = cacheData[0];
						var expect = (pin < 50) ? 2 : 3;

						while (i < data.length && cacheData.length < expect) {
							cacheData.push(data[i]);
							i++;
						}

						if (expect == cacheData.length) {
							processSerialData(cacheData);
							cacheData = [];
						}
					}
				});
			});
		}

		serialHandlers();
		sp.open();
	});
});

