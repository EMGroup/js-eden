/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

 /**
 * JS-EDEN MIDI plugin.
 * (2016 or later version initially created by Elizabeth Hudnott, building on previous work by Elizabeth and Jonny Foss.)
 *
 * Interface:
 *
 * Two modes of interaction are supported.  JS-EDEN code (like that found in the accompanying midi.js-e file)
 * can schedule midi messages to be sent to a device at precise times for accurate playback of priorly
 * composed tunes.  Alternatively, instead of the procedural "stream of MIDI messages" interface, it
 * is possible to have real-time interaction with the MIDI device by binding JS-EDEN observables such
 * that whenever the observable changes some chosen characteristic of the device changes, such as a
 * change in which piano key is currently being struck with a particular finger.
 *
 * .initialized
 * .initialize(continuationProc, continuationArgsArray)
 * .addSoftwareDriver(init)
 * .addSoftSynth(synth)
 * .outputNames
 * .bindPrograms(edenSymbol, outputNumber)
 * .defaultPrograms
 * .mergeMessageLists(listOfLists)
 * .alterNote(inputID, device, channel, note, velocity)
 * .alterVelocity(inputID, outputNumber, channelNumber, note, velocity)
 *
 */
EdenUI.plugins.MIDI = function (edenUI, success) {
	var me = this;

	/* True when we've previously requested access to the MIDI interfaces, or false if we haven't
	 * attempted to initialize the system yet.
	 */
	var initialized = false;
	
	Object.defineProperty(this, "initialized", {
		get: function () {
			return initialized;
		},
		enumerable: true
	});

	var softwareDrivers = [];
	
	this.addSoftwareDriver = function (init) {
		console.log("New JavaScript MIDI driver registered.");
		softwareDrivers.push(init);
		if (initialized) {
			init();
		}
	}
	
	// A record of the MIDI output devices available on the system.
	var outputs = [];

	/* A mapping between output device number and the name of an observable that stores which
	 * programs (instruments) have been selected for each channel of that output.
	 */
	var programObservables = {};

	/* Sets up the MIDI programs (i.e. which instrument is synthesized on each channel.)
	 */
	function programChange(outputNum, programs) {
		if (outputNum < outputs.length) {
			var output = outputs[outputNum];
			for (var i = 0; i < programs.length && i < 16; i++) {
				var program = programs[i];
				if (Number.isInteger(program) && program >= 0 && program <= 127) {
					output.send([0xC0 + i, program]);
				}
			}
			if (programs.length > 16) {
				eden.error(new Error("MIDI programs list is too long."));
			}
		}
	};

	this.addSoftSynth = function (synth) {
		outputs.push(synth);
		console.log('Added software synthesizer "' + synth.name + '".');
		if (initialized) {
			var outputNum = outputs.length - 1;
			var programsSymbol = programObservables[outputNum];
			if (programsSymbol !== undefined) {
				programChange(outputNum, programsSymbol.value());
			}
		}
	}

	/*The number of the default MIDI output device to play music through when the device is not
	 *explicitly indicated by the arguments of a procedure invocation.
	 */
	var defaultOutput = 0;

	/* A set of "default" programs (instruments) that can be used to quickly configure a MIDI device
	 * so that it is in a known state.
	 * piano, violin, viola, cello, double bass, French horn, trumpet, trombone, tuba, percussion,
	 * piccolo, flute, oboe, cor Anglais, clarinet, bassoon
	 */
	this.defaultPrograms = [0, 40, 41, 42, 43, 60, 56, 57, 58, 0, 72, 73, 68, 69, 71, 70];

	Object.defineProperty(this, "outputNames", {
		get: function () {
			var outputNames = [];
			for (var i = 0; i < outputs.length; i++) {
				outputNames.push(outputs[i].name);
			}
			return outputNames;
		},
		enumerable: true
	});

	function resolveOutputNumber(outputNum) {
		if (outputNum === undefined) {
			return defaultOutput;
		} else if (!Number.isInteger(outputNum)) {
			throw new Error("The output device must be given as a positive integer.");
		} else if (outputNum < 1 || (initialized && outputNum > outputs.length)) {
			throw new Error("No MIDI output device exists with device number " + outputNum);
		} else {
			return outputNum - 1;
		}
	}

	this.roundValue = function (value) {
		if (typeof(value) == "number") {
			if (value <= 0) {
				return 0;
			} else if (value <= 1) {
				return 1;
			} else if (value >= 127) {
				return 127;
			} else {
				return Math.round(value);
			}
		} else {
			return undefined;
		}
	};

	this.isValidNote = function (note) {
		return Number.isInteger(note) && note >= -20 && note <= 107;
	}

	this.bindPrograms = function (symbol, outputNum) {
		if (!(symbol instanceof Symbol)) {
			throw new Error("The first argument must be a Symbol.");
		}
		//Resolve default device number, etc.
		outputNum = resolveOutputNumber(outputNum);

		if (!Array.isArray(symbol.value()) && symbol.definition === undefined) {
			symbol.assign(this.defaultPrograms);
		}
		var programObserver = function (symbol, programs) {
			if (!Array.isArray(programs)) {
				eden.error(new Error("Illegal MIDI programs list: " + Eden.edenCodeForValue(programs)));
				return;
			}
			if (initialized) {
				programChange(outputNum, programs);
			}
		};
		programObserver(symbol, symbol.value());
		symbol.addJSObserver("bind", programObserver);
		programObservables[outputNum] = symbol;
	}

	var initializing = false;
	var continuations = [];
	var continuationsArgs = [];
	/* Requests access to the MIDI system and sets things up.  From EDEN's perspective this gets
	 * performed automatically on the first occasion that MIDI functionality is requested.
	 */
	this.initialize = function (symbol, continuationArgs) {
			var continuation = symbol.value();
			if (initialized) {
				continuation.apply(null, continuationArgs);
				return;
			}

			continuations.push(continuation);
			continuationsArgs.push(continuationArgs);
			if (initializing) {
				return;
			}
			initializing = true;

			function initializeSoftwareDrivers(index) {
				if (index < softwareDrivers.length) {
					if (index == 0) {
						console.log("Found " + softwareDrivers.length + " MIDI drivers written in JavaScript.");
					}
					//Initialize this software driver and continue by initializing the next one (if any).
					softwareDrivers[index](initializeSoftwareDrivers, [index + 1]);
				} else {
					//Finished initializing all drivers (JavaScript emulated and WebMIDI).

					//Set up the MIDI programs.
					for (var outputNum in programObservables) {
						programChange(outputNum, programObservables[outputNum].value());
					}

					initialized = true;
					console.log("Done.");

					//Continue with the operations originally requested (e.g. play a tune).
					for (var i = 0; i < continuations.length; i++) {
						continuations[i].apply(null, continuationsArgs[i]);
					}
				}
			}

			var onSuccess = function (midiAccess) {

				if (midiAccess) {
					//Create inventory of the available MIDI output devices.
					var iterator = midiAccess.outputs.values();
					var iteratedItem = iterator.next();
					if (iteratedItem.done) {
						console.log("No MIDI output devices found.");
					}
					while (!iteratedItem.done) {
						var output = iteratedItem.value;
						console.log("Found MIDI output device " + output.name + ".");
						outputs.push(output);
						iteratedItem = iterator.next();
					}
				}
				initializeSoftwareDrivers(0);

			};

			var onFailure = function (message) {
				var errorMsg = "Unable to access WebMIDI: " + message;
				console.log(errorMsg);
				eden.error(new Error(errorMsg));
				initializeSoftwareDrivers(0); //May still be emulated drivers present even if WebMIDI is unavailable.
			};

			console.log("Initializing MIDI...");
			if (window.navigator.requestMIDIAccess) {
				window.navigator.requestMIDIAccess().then(onSuccess, onFailure);
			} else {
				console.log("This browser does not support the WebMIDI API.  No access to hardware MIDI devices is possible.");
				initializeSoftwareDrivers(0);
			}

	};

	this.mergeMessageLists = function (messageLists) {
		var filteredMessageLists = [];
		for (var i = 0; i < messageLists.length; i++) {
			var item = messageLists[i];
			if (Array.isArray(item)) {
				filteredMessageLists.push(item);
			} else if (item !== undefined) {
				throw new Error("Item " + i + " must be a list of MIDI messages.");
			}
		}
		var numLists = filteredMessageLists.length;
		var nextPositions = new Array(numLists);
		var totalLength = 0;
		for (var i = 0; i < numLists; i++) {
			nextPositions[i] = 0;
			totalLength = totalLength + filteredMessageLists[i].length;
		}
		var mergedList = new Array(totalLength);
		for (var i = 0; i < totalLength; i = i + 2) {
			var earliestNextTime = Infinity
			var earliestList, earliestEvent;
			for (var j = 0; j < numLists; j++) {
				var nextPosition = nextPositions[j];

				if (nextPosition < filteredMessageLists[j].length) {
					var list = filteredMessageLists[j];
					var event = list[nextPosition];
					var nextTime = list[nextPosition + 1];

					if (nextTime < earliestNextTime) {
						earliestNextTime = nextTime;
						earliestEvent = event;
						earliestList = j;
					}
				}
			}
			mergedList[i] = earliestEvent;
			mergedList[i + 1] = earliestNextTime;
			nextPositions[earliestList] = nextPositions[earliestList] + 2;
		}
		return mergedList;
	}

	this.playMIDI = function (outputNum, delay, messageStream) {
		//Resolve default device number, etc.
		outputNum = resolveOutputNumber(outputNum);
		if (delay === undefined) {
			delay = 0;
		} else if (typeof(delay) != "number") {
			throw new Error("The delay must be a number.");
		}
		if (!Array.isArray(messageStream)) {
			throw new Error("The message stream must be an array.");
		}

		var output = outputs[outputNum];
		var beginTime = window.performance.now() + delay;
		for (var i = 0; i < messageStream.length; i = i + 2) {
			output.send(messageStream[i], beginTime + messageStream[i + 1]);
		}
	};

	/* Records which key (on a piano, for example) a finger was previous pressed down on, so that we
	 * know which key to send a note off message for when the key changes. */
	var noteBindings = {};

	this.alterNote = function (inputName, device, channel, note, velocity, strike) {
		var previousNote = noteBindings[inputName];
		var output = outputs[resolveOutputNumber(device)];

		if (me.isValidNote(note)) {
			if (note === previousNote) {
				if (strike && velocity > 0) {
					//Strike the same note again.
					output.send([0x90 + channel, note + 20, me.roundValue(velocity)]);
				}
			} else {
				if (velocity > 0) {
					//Release previous note and strike new note.
					if (previousNote !== undefined) {
						output.send([0x90 + channel, previousNote + 20, 0]);
					}
					if (strike) {
						output.send([0x90 + channel, note + 20, me.roundValue(velocity)]);
					}
				} else if (velocity < 0) {
					//Release the previous note and wait for new velocity before striking the new note.
					if (previousNote !== undefined) {
						output.send([0x80 + channel, previousNote + 20, me.roundValue(-velocity)]);
					}
				} else { // velocity equals 0 or isn't numeric
					//Release the previous note and wait for new velocity before striking the new note.
					if (previousNote !== undefined) {
						output.send([0x90 + channel, previousNote + 20, 0]);
					}
				}
				noteBindings[inputName] = note;
			}
		} else {
			if (previousNote !== undefined) {
				output.send([0x90 + channel, previousNote + 20, 0]);
			}
		}
	};

	this.alterVelocity = function (inputName, device, channel, note, velocity) {
		var previousNote = noteBindings[inputName];
		
		if (note === previousNote && note !== undefined) {
			var output = outputs[resolveOutputNumber(device)];
			if (velocity > 0) {
				//Aftertouch
				output.send([0xA0 + channel, note + 20, me.roundValue(velocity)]);
			} else if (velocity < 0) {
				//Release note at a specified release velocity
				output.send([0x80 + channel, note + 20, me.roundValue(-velocity)]);
			} else {
				//Release note, unspecified velocity
				output.send([0x90 + channel, note + 20, 0]);
			}
		}
	};

	var controlNumbers = {};
	controlNumbers["volume"] = 7;

	this.bindControlChange = function (symbol, outputNum, channel, control) {
		if (!(symbol instanceof Symbol)) {
			throw new Error("The first argument must be a Symbol.");
		}
		var output = outputs[resolveOutputNumber(outputNum)];
		var controlNumber;
		if (typeof(control) == "string") {
			controlNumber = controlNumbers[control.toLowerCase()];
			if (controlNumber === undefined) {
				throw new Error("Unknown control name " + control);
			}
		} else if (Number.isInteger(control) && control >= 0 && control <= 127) {
			controlNumber = control;
		} else {
			throw new Error("The control must be specified either as a string or as an integer between 0 and 127 inclusive.");
		}
		function setControl(sym, value) {
			var roundedValue = me.roundValue(value);
			if (roundedValue !== undefined) {
				output.send([0xB0 + channel, controlNumber, roundedValue]);
			}
		}
		setControl(symbol, symbol.value());
		symbol.addJSObserver("bind", setControl);
	}

	edenUI.eden.include("plugins/midi/midi.js-e", success);
}
EdenUI.plugins.MIDI.title = "MIDI";
EdenUI.plugins.MIDI.description = "Adds musical capabilities to JS-EDEN.";
