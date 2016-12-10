/*
 * Copyright (c) 2016, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.MIDIFileInput = function (edenUI, success) {

	var input = {};
	input.name = "MIDI Input from MIDI File";

	this.queue = function (messageList) {
		var begin = window.performance.now();
		var numEvents = messageList.length;

		function makeEvent(messageData) {
			var midiData = new Uint8Array(messageData.slice(1));
			var e = new MIDIMessageEvent(
				"midimessage",
				{
					target: input,
					data: midiData,
				}
			);
			return e;
		}

		function scheduleEvents(i) {
			if (i == numEvents) {
				return;
			}
			var messageData = messageList[i];
			var wait = begin + messageData[0] - window.performance.now();
			if (wait > 0) {
				window.setTimeout(function () {
					var e = makeEvent(messageData);
					input.onmidimessage(e);
					scheduleEvents(i + 1);
				}, wait);
			} else {
				var e = makeEvent(messageData);
				input.onmidimessage(e);
				scheduleEvents(i + 1);				
			}
		}
		scheduleEvents(0);
	}

	function registerDriver() {
		edenUI.plugins.MIDI.addSoftwareDriver(function (continuation, continuationArgs) {
			edenUI.plugins.MIDI.addSoftInput(input);
			if (continuation) {
				continuation.apply(this, continuationArgs);
			}
		});
	};

	if (edenUI.plugins.MIDI) {
		registerDriver();
	} else {
		edenUI.loadPlugin("MIDI", registerDriver);
	}

};
EdenUI.plugins.MIDIFileInput.title = "MIDI File Input";
EdenUI.plugins.MIDIFileInput.description = "Use a MIDI file to simulate MIDI file input.";
