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
 * Two modes of interaction are supported.  Direct access to a synthesizer is supported via the
 * getOutput() method.  JS-EDEN code (like that found in the accompanying midi.js-e file) can then
 * schedule midi messages to be sent to the device at precise times for accurate playback of priorly
 * composed tunes with the ability to take full advantage of device specific features, like NRPNs.
 * Alternatively, instead of the procedural "stream of MIDI messages" interface, it is possible to
 * have real-time interaction with the MIDI device by binding JS-EDEN observables such that
 * whenever the observable changes some chosen characteristic of device changes, such as a change in
 * which piano key is currently being struck with a particular finger.
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
			for (var i = 0; i < programs.length; i++) {
				output.send([0xC0 + i, programs[i]]);
			}
		}
	};

	this.addSoftSynth = function (synth) {
		outputs.push(synth);
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

	this.bindPrograms = function (symbol, outputNum) {
		if (!(symbol instanceof Symbol)) {
			throw new Error("The first argument must be a Symbol.");
		}
		//Resolve default device number, etc.
		outputNum = resolveOutputNumber(outputNum);

		if (!Array.isArray(symbol.value())) {
			symbol.assign(this.defaultPrograms);
		}
		symbol.addJSObserver("bind", function (symbol, programs) {
			programChange(outputNum, programs);
		});
		programObservables[outputNum] = symbol;
		programChange(outputNum, symbol.value());
	}

	/* Requests access to the MIDI system and sets things up.  From EDEN's perspective this gets
	 * performed automatically on the first occasion that MIDI functionality is requested.
	 */
	this.initialize = function (symbol, continuationArgs) {
			var continuation = symbol.value();

			function initializeSoftwareDrivers(index) {
				if (index < softwareDrivers.length) {
					//Initialize this software driver and continue by initializing the next one (if any).
					softwareDrivers[index](initializeSoftwareDrivers, [index + 1]);
				} else {
					//Finished initializing all drivers (JavaScript emulated and WebMIDI).

					//Set up the MIDI programs.
					for (var outputNum in programObservables) {
						programChange(outputNum, programObservables[outputNum].value());
					}

					initialized = true;

					//Continue with the operation originally requested (e.g. play a tune).
					continuation.apply(this, continuationArgs);
				}
			}

			var onSuccess = function (midiAccess) {

				if (midiAccess) {
					//Create inventory of the available MIDI output devices.
					var iterator = midiAccess.outputs.values();
					var iteratedItem = iterator.next();
					while (!iteratedItem.done) {
						outputs.push(iteratedItem.value);
						iteratedItem = iterator.next();
					}
				}
				initializeSoftwareDrivers(0);

			};

			var onFailure = function (message) {
				eden.error(new Error("Unable to access Web MIDI: " + message));
				initializeSoftwareDrivers(0); //May still be emulated drivers present even if WebMIDI is unavailable.
			};

			if (window.navigator.requestMIDIAccess) {
				window.navigator.requestMIDIAccess().then(onSuccess, onFailure);
			} else {
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
		} else if (typeof(delay) != "number" || delay < 0) {
			throw new Error("The delay must be a non-negative number.");
		}
		if (!Array.isArray(messageStream)) {
			throw new Error("The message stream must be an array");
		}
		for (var i = 0; i < messageStream.length - 1; i = i + 2) {
			var message = messageStream[i];
			if (!(message instanceof Uint8Array) && !Array.isArray(message)) {
				throw new Error("Item " + i + " must be an array or Uint8Array.");
			}
		}
		for (var i = 1; i < messageStream.length; i = i + 2) {
			var time = messageStream[i];
			if (typeof(time) != "number" || time < 0) {
				throw new Error("Item " + i + " must be a non-negative number.");
			}
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

	this.alterNote = function (inputName, device, channel, note, velocity) {
		var previousNote = noteBindings[inputName];
		var output = outputs[resolveOutputNumber(device)];

		if (note !== undefined && note === previousNote) {
			if (velocity > 0) {
				//Strike the same note again.
				output.send([0x90 + channel, note + 20, velocity]);
			}
		} else {
			if (velocity > 0) {
				//Release previous note and strike new note.
				if (previousNote !== undefined) {
					output.send([0x90 + channel, previousNote + 20, 0]);
				}
				if (note !== undefined) {
					output.send([0x90 + channel, note + 20, velocity]);
				}
			} else if (velocity < 0) {
				//Release the previous note and wait for new velocity before striking the new note.
				if (previousNote !== undefined) {
					output.send([0x80 + channel, previousNote + 20, -velocity]);
				}
			} else {
				//Release the previous note and wait for new velocity before striking the new note.
				if (previousNote !== undefined) {
					output.send([0x90 + channel, previousNote + 20, 0]);
				}
			}
			noteBindings[inputName] = note;
		}
	};

	this.alterVelocity = function (inputName, device, channel, note, velocity) {
		var previousNote = noteBindings[inputName];
		
		if (note === previousNote) {
			var output = outputs[resolveOutputNumber(device)];
			if (velocity > 0) {
				//Aftertouch
				output.send([0xA0 + channel, note + 20, velocity]);
			} else if (velocity < 0) {
				//Release note at a specified release velocity
				output.send([0x80 + channel, note + 20, -velocity]);
			} else {
				//Release note, unspecified velocity
				output.send([0x90 + channel, note + 20, 0]);
			}
		}
	};

	edenUI.eden.include("plugins/midi/midi.js-e", success);
}
EdenUI.plugins.MIDI.title = "MIDI";
EdenUI.plugins.MIDI.description = "Adds musical capabilities to JS-EDEN.";
