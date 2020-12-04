/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 *
 * Speech synthesis for JS-EDEN.
 *

 * Status as of September 2015
 * W3C specification: https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html
 * Works as-is in Chrome and provides the most natural sounding voices.
 * (though see bug report https://code.google.com/p/chromium/issues/detail?id=369472)
 * Works in Firefox by enabling the media.webspeech.synth.enabled option on the about:config page
 * and installing the add-on located at https://addons.mozilla.org/en-US/firefox/addon/espeak-web-speech-api/
 * The Firefox add-on supports more languages and more accents.
 * Mozilla plan to create a built-in version for Firefox soon.
 * Neither Chrome nor the Firefox add-on support SSML documents (inflection & pronunciation mark up),
 * only plain text.
 * Apparently it should also work in Opera too (not tested).
 */

EdenUI.plugins.SpeechSynthesis = function(edenUI, success) {
	var interrupted = false;

	function speak(utterance) {
		if (!("chrome" in window)) {
			window.speechSynthesis.speak(utterance);
			return;
		}

		var utterances = [];
		if (utterance.voice && utterance.voice.voiceURI == "native") {
			utterances.push(utterance);
		} else {
			var chunkSize = 200;
			var lastPunctuationRE = /^(.*[:;,.!?]['")\]]*)(\s[^:;,.!?]*)?$/;
			var punctuationRE = /^([:;,.!?"')\]]*)\s*/;
			function makeBoundaryEvent(offset) {
				return function (event) {
					var modifiedEvent = new Event("SpeechSynthesis");
					if (event.charIndex !== undefined) {
						modifiedEvent.charIndex = offset + event.charIndex;
					} else {
						modifiedEvent.charIndex = offset;
					}
					modifiedEvent.elapsedTime = event.elapsedTime;
					modifiedEvent.name = event.name;
					utterance.onboundary(modifiedEvent);
				};
			}

			var text = utterance.text.replace(/(\s)\s+/g, "$1");
			var offset = 0;
			var chunk = text.substr(offset, chunkSize);

			while (offset < text.length) {
				var beginOffset = offset;
				if (offset + chunkSize < text.length) {
					var newlineIndex = chunk.lastIndexOf("\n");
					if (newlineIndex !== -1) {
						chunk = chunk.slice(0, newlineIndex);
					} else {
						var match = chunk.match(lastPunctuationRE);
						if (match !== null) {
							chunk = match[1];
						} else {
							var spaceIndex = chunk.lastIndexOf(" ");
							if (spaceIndex !== -1) {
								chunk = chunk.slice(0, spaceIndex);
							}
						}
					}
				}
				var nextChunk = text.substr(offset + chunk.length, chunkSize);
				offset = offset + chunk.length;
				match = nextChunk.match(punctuationRE);
				if (match !== null) {
					chunk = chunk + match[1];
					offset = offset + match[0].length;
				}

				var chunkUtterance = new SpeechSynthesisUtterance(chunk);
				chunkUtterance.endOffset = beginOffset + chunk.length;
				chunkUtterance.lang = utterance.lang;
				chunkUtterance.volume = utterance.volume;
				chunkUtterance.rate = utterance.rate;
				chunkUtterance.pitch = utterance.pitch;
				chunkUtterance.voiceURI = utterance.voiceURI;
				chunkUtterance.voice = utterance.voice;
				chunkUtterance.onerror = utterance.onerror;
				chunkUtterance.onpause = utterance.onpause;
				chunkUtterance.onresume = utterance.onresume;
				if (utterance.onboundary) {
					chunkUtterance.onboundary = makeBoundaryEvent(beginOffset);
				}
				utterances.push(chunkUtterance);
				chunk = nextChunk;
			}

			function addNext(current, next) {
				current.onend = function (event) {
					if (utterance.onboundary) {
						var modifiedEvent = new Event("SpeechSynthesis");
						modifiedEvent.charIndex = current.endOffset;
						modifiedEvent.elapsedTime = event.elapsedTime;
						modifiedEvent.name = "word";
						utterance.onboundary(modifiedEvent);
					}
					if (!utterance.cancelled) {
						console.log(next);
						setTimeout(function () {
							window.speechSynthesis.speak(next);
						}, 0);
					} else if (utterance.onend) {
						lastUtterance.onend(event);
					}
				};
			}
			offset = 0;
			for (var i = 0; i < utterances.length - 1; i++) {
				addNext(utterances[i], utterances[i + 1]);
			}
			var lastUtterance = utterances[utterances.length - 1];
			utterances[0].onstart = utterance.onstart;

			lastUtterance.onend = utterance.onend;
		}

		console.log(utterances[0]);
		setTimeout(function () {
			window.speechSynthesis.speak(utterances[0]);
		}, 0);
	}

	function stopSpeaking() {
		var paused = window.speechSynthesis.paused;
		window.speechSynthesis.cancel();
		if (paused) {
			window.speechSynthesis.pause();
		}
	}

	function nextSpeech(completionState, advance) {
		if (interrupted) {
			interrupted = false;
			return;
		}
		var agent = root.lookup("speak");
		var	queueSym = root.lookup("speakingList");
		var queueIndexSym = root.lookup("speakingIndex");
		var isSpeakingSym = root.lookup("speaking");
		var idSym = root.lookup("speakingID");
		var textSym = root.lookup("speakingText");
		var speechSym = root.lookup("speakingSpeech");
		var charIndexSym = root.lookup("speakingCharIndex");

		var queue = queueSym.value();
		var queueIndex = queueIndexSym.value();
		var id;

		stopSpeaking();

		if (!queueIndex) {
			queueIndex = 1;
		}
		if (completionState != "") {
			//There was some speech being spoken previously, so finalize the status of that utterance.

			if (completionState == "finished") {
				var prevText = textSym.value();
				if (typeof(prevText) == "string") {
					charIndexSym.assign(prevText.length + 1, root.scope, agent);
				}
			} else if (completionState == "interrupted") {
				interrupted = true;
			}

			id = idSym.value();
			if (eden.isValidIdentifier(id)) {
				root.lookup(id + "_status").assign(completionState, root.scope, agent);
			}
		}
		if (advance) {
			queueIndex++;
		}

		charIndexSym.assign(1, root.scope, agent);
		root.lookup("speakingTime").assign(0, root.scope, agent);

		if (Array.isArray(queue) && queueIndex <= queue.length) {

			if (!isSpeakingSym.value()) {
				isSpeakingSym.assign(true, root.scope, agent);
			}

			var next = queue[queueIndex - 1];
			if (!(next instanceof SpeakingWords) || next.cancelled) {
				nextSpeech("", true);
				return;
			}
			next.prepareUtterance();
			var utter = next.utterance;

			id = next.id;
			idSym.assign(id, root.scope, agent);
			if (eden.isValidIdentifier(id)) {
				root.lookup(id + "_status").assign("speaking", root.scope, agent);
			}

			textSym.assign(utter.text, root.scope, agent);
			speechSym.assign(next, root.scope, agent);
			if (advance) {
				queueIndexSym.assign(queueIndex, root.scope, agent);
			}
			next.hasBeenSpoken = true;
			window.speechSynthesis.speak(utter);

		} else {

			isSpeakingSym.assign(false, root.scope, agent);
			idSym.assign("", root.scope, agent);
			textSym.assign("", root.scope, agent);
			speechSym.assign(undefined, root.scope, agent);

			if (Array.isArray(queue)) {
				queueIndexSym.assign(queue.length + 1, root.scope, agent);
			}
		}
	}

	root.lookup("speakingList").addJSObserver("sendToTTS", function (symbol, queue) {
		var agent = root.lookup("speak");
		if (Array.isArray(queue)) {
			var indexSym = root.lookup("speakingIndex");
			var index = indexSym.value();
			if (index > queue.length + 1) {
				//Index shouldn't be bigger than list length + 1.
				indexSym.assign(queue.length + 1, root.scope, agent);
			} else if (index <= queue.length) {
				for (var i = index < 1? 0 : index - 1; i < queue.length; i++) {
					var item = queue[i];
					if (item instanceof SpeakingWords) {
						item.prepareUtterance();
						var id = item.id;
						if (eden.isValidIdentifier(id)) {
							root.lookup(id + "_status").assign("waiting", root.scope, agent);
						}
					}
				}
				if (!root.lookup("speaking").value()) {
					//List has grown in size.  Queue the new elements for speaking.
					nextSpeech("", false);
				} else if (queue[index - 1] !== root.lookup("speakingSpeech").value()) {
					nextSpeech("interrupted", false);
				}
			}
		}
	});

	root.lookup("speakingIndex").addJSObserver("runTTS", function (symbol, index) {
		if (symbol.last_modified_by != "speak") {
			var queue = root.lookup("speakingList").value();
			if (Array.isArray(queue) && index <= queue.length) {
				if (root.lookup("speaking").value()) {
					nextSpeech("interrupted", false);
				} else {
					nextSpeech("", false);
				}
				for (var i = index; i < queue.length; i++) {
					if (queue[i] instanceof SpeakingWords) {
						queue[i].prepareUtterance();
					}
				}
			}
		}
	});

	root.lookup("speakingPaused").addJSObserver("controlTTS", function (symbol, pause) {
		if (pause) {
			window.speechSynthesis.pause();
		} else {
			window.speechSynthesis.resume();
			window.speechSynthesis.resume();  //Sometimes Chrome needs a nudge.
		}
	});

	function findVoice(lang, searchStr) {
		var voices = window.speechSynthesis.getVoices();
		var regExp, index;

		var baseLanguage, matchingDialect;
		if (lang) {
			lang = lang.toLowerCase();
			index = lang.indexOf("-");
			if (index != -1) {
				baseLanguage = lang.slice(0, index);
				matchingDialect = true;
			} else {
				baseLanguage = lang;
				matchingDialect = false;
			}
		}

		if (searchStr) {
			regExp = new RegExp("\\b" + searchStr + "\\b", "i");
		}

		var bestMatch = undefined;
		var emptyLanguageMatched = false;
		var languageMatched = false;
		var dialectMatched = false;
		var searchMatched = false;
		for (var i = 0; i < voices.length; i++) {
			var voice = voices[i];
			var voiceLang = voice.lang;
			var languageMatches = false;
			var dialectMatches = false;
			var searchMatches = false;

			if (lang && voiceLang) {
				voiceLang = voiceLang.toLowerCase()
				if (lang == voiceLang) {
					languageMatches = true;
					dialectMatches = true;
				} else if (baseLanguage == voiceLang) {
					languageMatches = true;
				} else {
					index = voiceLang.indexOf("-");
					if (index != -1 && voiceLang.slice(0, index) == baseLanguage) {
						languageMatches = true;
					}
				}
			}

			if (searchStr && regExp.test(voice.name)) {
				searchMatches = true;
			}

			if ((
				(!languageMatched && !voiceLang && !emptyLanguageMatched) ||
				(!languageMatched && (!voiceLang || !lang) && voice.default) ||
				(languageMatches && !languageMatched) ||
				(matchingDialect && dialectMatches && !dialectMatched) ||
				(languageMatches && !matchingDialect && voice.default) ||
				(dialectMatches && voice.default) ||
				(searchMatches && !searchMatched && (!lang || (!voiceLang && !languageMatched) || languageMatches))
				) && (!searchMatched || searchMatches || (languageMatches && !languageMatched))
			) {
				emptyLanguageMatched = !languageMatches;
				languageMatched = languageMatches;
				dialectMatched = dialectMatches;
				searchMatched = searchMatches;

				if ((!searchStr || searchMatched) && (dialectMatched || (languageMatched && !matchingDialect)) && voice.default) {
					return voice;
				} else {
					bestMatch = voice;
				}
			}

		}
		if (bestMatch === undefined) {
			bestMatch = voices[0];
		}
		return bestMatch;
	}

	SpeakingWords = function(id, text, lang, gender, volume, rate, pitch) {
		this.id = id;
		this.utterance = new window.SpeechSynthesisUtterance(String(text));
		var optVal, defaultedLang, defaultedGender, defaultedRate, defaultedPitch;
		var thisGender;
		var thisCancelled;
		this.hasBeenSpoken = false;
		if (gender === undefined) {
			thisGender = edenUI.getOptionValue("speechSynthDefaultGender");
			if ("chrome" in window && thisGender === null) {
				thisGender = "native";
			}
			defaultedGender = true;
		} else {
			thisGender = gender;
			defaultedGender = false;
		}
		this.utterance.volume = volume;
		if (rate === undefined) {
			optVal = edenUI.getOptionValue("speechSynthDefaultRate");
			if (optVal !== null) {
				this.utterance.rate = parseFloat(optVal);
			}
			defaultedRate = true;
		} else {
			this.utterance.rate = rate;
			defaultedRate = false;
		}
		if (pitch === undefined) {
			optVal = edenUI.getOptionValue("speechSynthDefaultPitch");
			if (optVal !== null) {
				this.utterance.pitch = parseFloat(optVal);
			}
			defaultedPitch = true;
		} else {
			this.utterance.pitch = pitch;
			defaultedPitch = false;
		}

		var me = this;
		Object.defineProperty(this, "text", {
			get: function () {
				return me.utterance.text;
			},
			set: function (text) {
				me.utterance.text = text;
			},
			enumerable: true
		});
		Object.defineProperty(this, "lang", {
			get: function () {
				return me.utterance.lang;
			},
			set: function (newLang) {
				if (newLang) {
					var index = newLang.indexOf("-");
					if (index != -1) {
						newLang = newLang.slice(0, index + 1) + newLang.slice(index + 1).toUpperCase();
					}
					me.utterance.lang = newLang;
				} else {
					me.utterance.lang = "";
				}
				defaultedLang = false;
				var voice = findVoice(newLang, thisGender);
				me.utterance.voiceURI = voice.voiceURI;
				me.utterance.voice = voice;
			},
			enumerable: true
		});
		Object.defineProperty(this, "gender", {
			get: function () {
				return thisGender;
			},
			set: function (newGender) {
				thisGender = newGender;
				defaultedGender = false;
				var voice = findVoice(this.utterance.lang, thisGender);
				me.utterance.voiceURI = voice.voiceURI;
				me.utterance.voice = voice;
			},
			enumerable: true
		});
		Object.defineProperty(this, "volume", {
			get: function () {
				return me.utterance.volume;
			},
			set: function (volume) {
				me.utterance.volume = volume;
			},
			enumerable: true
		});
		Object.defineProperty(this, "rate", {
			get: function () {
				return me.utterance.rate;
			},
			set: function (rate) {
				me.utterance.rate = rate;
				defaultedRate = false;
			},
			enumerable: true
		});
		Object.defineProperty(this, "pitch", {
			get: function () {
				return me.utterance.pitch;
			},
			set: function (pitch) {
				me.utterance.text = pitch;
				defaultedPitch = false;
			},
			enumerable: true
		});
		Object.defineProperty(this, "cancelled", {
			get: function () {
				return thisCancelled;
			},
			set: function (value) {
				thisCancelled = value;
				if (thisCancelled && me.id) {
					root.lookup(me.id + "_status").assign("cancelled", root.scope, root.lookup("SpeakingWords"));
				}
			},
			enumerable: true
		});
		this.toString = function () {
			var s = "SpeakingWords(" +
				Eden.edenCodeForValue(id) + ", " +
				"\"" + me.utterance.text + "\", ";

			if (defaultedLang) {
				s = s + "@, ";
			} else {
				s = s + "\"" + me.utterance.lang + "\", ";
			}
			if (defaultedGender) {
				s = s + "@, ";
			} else {
				s = s + Eden.edenCodeForValue(thisGender) + ", ";
			}
			s = s + me.utterance.volume + ", ";
			if (defaultedRate) {
				s = s + "@, ";
			} else {
				s = s + this.utterance.rate + ", ";
			}
			if (defaultedPitch) {
				s = s + "@)";
			} else {
				s = s + this.utterance.pitch + ")";
			}

			return s;
		};

		if (lang === undefined) {
			this.lang = edenUI.getOptionValue("speechSynthDefaultLanguage");
			defaultedLang = true;
		} else {
			this.lang = lang;
		}

		if (eden.isValidIdentifier(id)) {
			var idSym = root.lookup(id + "_status");
			if (idSym.value() === undefined) {
				idSym.assign("not queued", root.scope, root.lookup("SpeakingWords"));
			}
		}

		this.prepareUtterance = function () {
			if (me.hasBeenSpoken && !("chrome" in window)) {
				var newUtterance = new window.SpeechSynthesisUtterance(me.utterance.text);
				newUtterance.lang = me.utterance.lang;
				newUtterance.volume = me.utterance.volume;
				newUtterance.rate = me.utterance.rate;
				newUtterance.pitch = me.utterance.pitch;
				newUtterance.voiceURI = me.utterance.voiceURI;
				newUtterance.voice = me.utterance.voice;
				newUtterance.onboundary = me.utterance.onboundary;
				newUtterance.onend = me.utterance.onend;
				newUtterance.onerror = me.utterance.onerror;
				me.utterance = newUtterance;
				me.hasBeenSpoken = false;
			}
		}
		this.utterance.onboundary = function (event) {
			var agent = root.lookup("speak");
			root.lookup("speakingCharIndex").assign(event.charIndex + 1, root.scope, agent);
			var time = event.elapsedTime;
			if (time <= 10000000) {
				root.lookup("speakingTime").assign(time, root.scope, agent);
			}
		};
		this.utterance.onend = function () {
			nextSpeech("finished", true);
		};
		this.utterance.onerror = function () {
			nextSpeech("error", true);
		};

	}

	Eden.Selectors.execute("plugins > speech-synthesis > speech-synthesis", eden.root.scope, function() {
		eden.root.lookup("plugins_speech_sythesis_loaded").assign(true, eden.root.scope, EdenSymbol.localJSAgent);
		if (success) success();
	});
}

EdenUI.plugins.SpeechSynthesis.title = "Speech Synthesis";
EdenUI.plugins.SpeechSynthesis.description = "Gives JS-EDEN the ability to speak sentences out loud!";
