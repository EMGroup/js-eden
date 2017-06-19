Eden.Arduino = function(port) {
	this.sp = new SerialPort(port, { baudrate: 115200, autoOpen: false });
	this.pinModes = [];
	this.connected = false;

	for (var i=0; i<14; i++) {
		this.pinModes[i] = "IN";
	}

	this.digipincache = {};
}

Eden.Arduino.prototype.connect = function() {
	console.log("Attempt connect");
	var me = this;
	var cacheData = [];

	function serialHandlers() {
	me.sp.on('error', function(error) {
		console.log(error);
		me.connected = false;
		//broadcastAssign("arduino_connected", false);
		//broadcastAssign("arduino_error", error);
		eden.root.lookup("arduino_connected").assign(false, eden.root.scope, EdenSymbol.localJSAgent);
		eden.root.lookup("arduino_error").assign(error, eden.root.scope, EdenSymbol.localJSAgent);

		setTimeout(function() {
			sp.open();
		}, 2000);
	});


	me.sp.on('open', function() {
		me.connected = true;
		eden.root.lookup("arduino_connected").assign(true, eden.root.scope, EdenSymbol.localJSAgent);
		console.log("Arduino connected...");

		me.sp.on('close', function() {
			eden.root.lookup("arduino_connected").assign(false, eden.root.scope, EdenSymbol.localJSAgent);
			console.log("Arduino disconnected.");
			setTimeout(function() {
				serialHandlers();
				me.sp.open();
			}, 10000);
		});


		me.sp.on('data', function(data) {
			var i = 0;

			console.log("RAW", data);

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
					me.processSerialData(cacheData);
					cacheData = [];
				}
			}
		});
	});
	}
	serialHandlers();
	me.sp.open();

	function digiHandler(sym, value) {
		console.log("Write arduino",sym.name,value);
		if (!me.connected || sym.origin === EdenSymbol.localJSAgent) return;
		var pin = parseInt(sym.name.replace("arduino_d",""));
		if (value != me.digipincache[pin]) {
			me.writeDigitalPin(pin, value);
			me.digipincache[pin] = value;
		}
	}

	var digisyms = [];
	for (var i=1; i<=14; i++) {
		digisyms[i-1] = eden.root.lookup("arduino_d"+i);
		digisyms[i-1].addJSObserver(this.port, digiHandler);
	}

	function inputHandler(sym, value) {
		if (!me.connected || sym.origin === EdenSymbol.localJSAgent) return;
		var pin = parseInt(sym.name.replace("arduino_input_d",""));
		if (value) me.pinMode(pin, "IN");
		else me.pinMode(pin, "OUT");
	}

	function enabledHandler(sym, value) {
		var pin = parseInt(sym.name.replace("arduino_input_a",""));
		if (value) {
			me.sendCommand(50+pin, 1, 1);
		} else {
			me.sendCommand(50+pin, 0, 1);
		}
	}

	var inputsyms = [];
	for (var i=1; i<=14; i++) {
		inputsyms[i-1] = eden.root.lookup("arduino_input_d"+i);
		inputsyms[i-1].addJSObserver(this.port, inputHandler);
	}

	var ainputsyms = [];
	for (var i=0; i<=15; i++) {
		ainputsyms[i-1] = eden.root.lookup("arduino_input_a"+i);
		ainputsyms[i-1].addJSObserver(this.port, enabledHandler);
	}
}

Eden.Arduino.prototype.processSerialData = function(obj) {
	var pin = obj[0];

	console.log("IN", obj);

	if (pin < 50) {
		var val = obj[1];
		eden.root.lookup("arduino_d"+pin).assign((val > 0) ? true : false, eden.root.scope, EdenSymbol.localJSAgent);
	} else {
		var val = obj[1] + (obj[2]*256);
		eden.root.lookup("arduino_a"+(pin-50)).assign(val, eden.root.scope, EdenSymbol.localJSAgent);
	}
}

Eden.Arduino.prototype.sendCommand = function(pin, value, command) {
	var buf = new Buffer(4);
	buf.writeUInt8(pin, 0);
	buf.writeUInt16LE(value, 1);
	buf.writeUInt8(command, 3);
	console.log(buf);
	this.sp.write(buf);
}

Eden.Arduino.prototype.pinMode = function(pin, mode) {
	var val = 0;

	this.pinModes[pin] = mode;

	switch(mode) {
	case "IN":	val = 1; break;
	case "OUT":	val = 0; break;
	default:	return;
	}

	this.sendCommand(pin, val, 1);
}

Eden.Arduino.prototype.writeDigitalPin = function(pin, val) {
	//if (val > 255) val = true;
	if (val < 0) val = false;

	var type = typeof val;
	if (type == "boolean") {
		if (this.pinModes[pin] != "OUT") {
			this.pinMode(pin, "OUT");
		}
		this.sendCommand(pin, (val) ? 1 : 0, 3);
	} else if (type == "number") {
		if (this.pinModes[pin] != "OUT") {
				this.pinMode(pin, "OUT");
		}
		this.sendCommand(pin, val, 4);
	}
}

Eden.Arduino.prototype.enabledHandler = function(name, value) {
	if (value) {
		this.sendCommand(50+parseInt(name.substring(1)), 1, 1);
	} else {
		this.sendCommand(50+parseInt(name.substring(1)), 0, 1);
	}
}

Eden.Arduino.prototype.inputHandler = function(name, value) {
	if (name.charAt(0) == "d") {
		if (value) this.pinMode(parseInt(name.substring(1)), "IN");
		else this.pinMode(parseInt(name.substring(1)), "OUT");
	}
}

Eden.Arduino.prototype.analogHandler = function(name, value) {
	// Doesn't accept writes
}

Eden.Arduino.prototype.toneHandler = function(dummy, pin) {
	this.sendCommand(pin, 1, 6);
}

Eden.Arduino.prototype.servoHandler = function(name, value) {
	if (value && name == "d9") {
		this.sendCommand(9, 1, 5);
	}
}

Eden.Arduino.devices = {};

Eden.Arduino.check = function() {
	// DO SERIAL PORT FOR ARDUINO
	var found = false;

	Eden.Arduino.devices = {};

	SerialPort.list(function (err, ports) {
		ports.forEach(function(port) {
			console.log("Serial",port.manufacturer);
			if (port.manufacturer && port.manufacturer.includes("Arduino")) {
				Eden.Arduino.devices[port.comName] = new Eden.Arduino(port.comName);
				found = true;
				console.log("Has arduino");
			}
		});

		if (!found) {
			return;
		}

		console.log("Arduinos",Eden.Arduino.devices);

		var devele = $("#arduinodevices");

		/*for (var x in Eden.Arduino.devices) {
			var ele = $('<div class="arduinodevice"></div>');
		}*/

		var arddiag = $("#arduinodialog");
		arddiag.on("click",".close",function() {
			arddiag.hide();
		})
		.on("click",".use",function() {
			arddiag.hide();
			for (var x in Eden.Arduino.devices) {
				Eden.Arduino.devices[x].connect();
			}
		});
		arddiag.show();
		//console.log("Serial ports", ports);
	});
}
