var qunit = require('qunit');

qunit.run({
	log: {
		testing: true,
		errors: true
	},
	code: {
		path: 'js/maintainer.js'
	},
	tests: ['js/test_maintainer.js']
}, function (err, report) {
	if (report.failed) {
		process.exit(1);
	}
});