var connect = require('connect');
var serveStatic = require('serve-static');
var gateway = require('gateway');

var app = connect();
app.use(gateway(__dirname, {'.rb': './ruby-cgi'})).use(serveStatic('.')).listen(8000);
