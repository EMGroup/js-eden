/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-EDEN MIDI.js plugin.
 * (2016 or later version initially created by Elizabeth Hudnott, building on previous work by Jonny Foss.)
 *
 * This is a plug-in for a plug-in!  It extends the MIDI plug-in to add support for the software
 * synthesizer in the MIDI.js JavaScript library.
 */
EdenUI.plugins.MIDIDotJS = function (edenUI, success) {

	var soundfontUrl = "plugins/midi/emulation/soundfonts/FluidR3_GM/";
	var instrumentsLoaded = new Array(127);

	function registerDriver() {
		edenUI.plugins.MIDI.addSoftwareDriver(function (continuation, continuationArgs) {
			var midijs;
			var midijsOutput = {};

			midijsOutput.name = "MIDI.js Software Synth";

			midijsOutput.send = function (data, time) {
				var fullCommand = data[0];
				var command = fullCommand & 0xF0;
				var channel = fullCommand & 0x0F;
				var data1 = data[1];
				var data2 = data[2];
				if (time === undefined) {
					time = 0;
				} else {
					time = (time - window.performance.now());
				}

				if (command == 0x80) {
					//N.B. midi.js doesn't support release velocity.
					midijs.noteOff(channel, data1, time / 1000);
				} else if (command == 0x90) {
					midijs.noteOn(channel, data1, data2, time / 1000);
				} else if (command == 0xC0) {
					if (!instrumentsLoaded[data1]) {
						instrumentsLoaded[data1] = true;
						midijs.loadPlugin({
							soundfontUrl: soundfontUrl,
							instrument: data1
						});
					}
					if (time <= 0) {
						midijs.programChange(channel, data1);
					} else {
						setTimeout(function () {
							midijs.programChange(channel, data1);
						}, time);
					}
				} else {
					console.error("Unable to map MIDI command " + fullCommand.toString(16) + " to midi.js");
				}
			};

			midijsOutput.clear = function () {
			
			};

			edenUI.plugins.MIDI.addSoftSynth(midijsOutput);
			
			var jsFiles = ["inc/shim/Base64binary.js", "build/MIDI.min.js"];
	
			function loadJS(i) {
				if (i == jsFiles.length) {
					midijs = window.MIDI;
					midijs.loadPlugin({
						soundfontUrl: soundfontUrl,
						onsuccess: function () {
							if (continuation) {
								continuation.apply(this, continuationArgs);
							}
						}
					});
				} else {
					$.ajax({
						url: "plugins/midi/emulation/lib/MIDI.js/" + jsFiles[i],
						success: function () { loadJS(i + 1); }
					});
				}
			}

			loadJS(0);
		});
		success();
	}

	if (edenUI.plugins.MIDI) {
		registerDriver();
	} else {
		edenUI.loadPlugin("MIDI", registerDriver);
	}

};
EdenUI.plugins.MIDIDotJS.title = "MIDI.JS";
EdenUI.plugins.MIDIDotJS.description = "Uses the MIDI.js JavaScript library to add a software synthesizer for users who cannot access a MIDI instrument via WebMIDI and the basic MIDI plug-in.";