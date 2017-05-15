/**
 * This script runs a simple webserver which is capable of passing through
 * requests to various ruby scripts we use. It's intended as an alternative to
 * running a vagrant box with apache.
 *
 * While running this a jseden instance should be visible at localhost:8000
 */
/*var connect = require('connect');
var serveStatic = require('serve-static');
var port = 8000;

var app = connect();
app.use(serveStatic('.')).listen(port, function () {
  console.log('JS-Eden instance running at http://localhost:'+port);
});*/

var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
//var serialp = require("serialport");
var SerialPort = require("serialport");

var theports;

SerialPort.list(function (err, ports) {
	/*ports.forEach(function(port) {
		if (port.manufacturer == "Arduino_Srl") arduinoDevice = port.comName;
	});*/
	theports = ports;
});
 
// Serve up public/ftp folder 
var serve = serveStatic('.')
 
// Create server 
var server = http.createServer(function onRequest (req, res) {
	if (req.url == "/arduino") {
		console.log("ARDUINO",req.data);
		res.write(JSON.stringify(theports));
		res.end();
	} else {
		serve(req, res, finalhandler(req, res))
	}
})
 
// Listen 
server.listen(8000)
