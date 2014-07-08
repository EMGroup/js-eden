var connect = require('connect');
var http = require('http');
var fs = require('fs');
var serveStatic = require('serve-static');
var gateway = require('gateway');

// read nth line of a file efficiently
function getLine(filename, lineNo, callback) {
	var stream = fs.createReadStream(filename, {
		flags: 'r',
		encoding: 'utf-8',
		fd: null,
		mode: 0666,
		bufferSize: 64 * 1024
	});

	var fileData = '';
	stream.on('data', function(data){
		fileData += data;

		// The next lines should be improved
		var lines = fileData.split("\n");

		if (lines.length >= +line_no) {
			stream.destroy();
			callback(null, lines[+line_no]);
		}
	});

	stream.on('error', function(){
		callback('Error', null);
	});

	stream.on('end', function(){
		callback('File end reached without finding line', null);
	});
}

var myMiddle = function (req, res, next) {
	if (!res.pathname) {
		return next();
	}

	var pathToFile = res.pathname;

	// check a+x
	var stats = fs.statSync(pathToFile);
	var isExec = (stats.mode & 1) === 1;
	if (!isExec) {
		return next();
	}

	// check for hash-bang
	getLine(pathToFile, 0, function (err, line) {
		if (line.match(/^#!/)) {
			console.log('Serve CGI', pathToFile);
			res.writeHead(500);
			res.end();
		} else {
			console.log('Serve static', pathToFile);
			next();
		}
	});

	// follow tutorial to write CGI middleware for ruby/js-e scripts
	// https://github.com/fgnass/gateway/blob/master/gateway.js
	// http://www.hacksparrow.com/how-to-write-midddleware-for-connect-express-js.html
};

var app = connect();
app.use(gateway(__dirname, {'.rb': './ruby-cgi'})).use(serveStatic('.')).listen(8000);
