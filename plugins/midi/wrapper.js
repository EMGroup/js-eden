abcjs = {};
abcjs.abcParser = require("abcjs/parse/abc_parse");
abcjs.midiCreate = require("abcjs/midi/abc_midi_create");
abcjs.currentTune = null;
abcjs.abcToMIDI = function(abcstr){
        var abcparser = new abcjs.abcParser();
        abcparser.parse(abcstr);
       	abcjs.currentTune = abcparser.getTune();
        return abcjs.midiCreate(abcjs.currentTune);
};
