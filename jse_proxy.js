var connect = require('connect');
var request = require('request');
var url = require('url');

var app = connect();

function log() {
	return;
	console.log.apply(console, arguments);
}

function error() {
	return;
	console.error.apply(console, arguments);
}

app.use(function (req, downstreamRes) {
	var upstreamUrl = url.parse(req.url, true).query.url;

	if (!upstreamUrl) {
		return;
	}

	log('requesting ' + upstreamUrl);
	request.get(upstreamUrl, function (error, upstreamRes, script) {
		if (error) {
			error("Error:", upstreamUrl, error) 
			return;
		}
		log('done ' + upstreamUrl);

		if (upstreamRes.status >= 400) {
			downstreamRes.write('jseproxyerror("');
			downstreamRes.write(JSON.stringify(script));
			downstreamRes.write(');');
			downstreamRes.end()
			return;
		}

		downstreamRes.write('jseproxysuccess(');
		downstreamRes.write(JSON.stringify(script));
		downstreamRes.write(');');
		downstreamRes.end()
	});
});

app.listen(8001);
