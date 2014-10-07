// usage: node ttyeden.js <path-to-jse-file>

var fs = require('fs');
var Folder = require('./js/core/maintainer.js').Folder;
var Eden = require('./js/core/eden.js').Eden;

var eden = new Eden(new Folder());
eden.listenTo('executeError', this, function (e) {
	console.log('Execute error', e);
});

eden.execute("proc exit {}");
eden.execute("proc error { ${{ console.log('Test error', arguments[0]) }}$; }");
eden.execute("func str { return ${{ JSON.stringify(arguments[0]) }}$; }");
var script = fs.readFileSync(process.argv[2]).toString();
eden.execute(script);
