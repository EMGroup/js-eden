/**
 * This script runs all the automated tests written for jseden.
 */
var qunit = require('qunit');

qunit.setup({
	log: {
		testing: true,
		errors: true
	},
});

qunit.run([
	{
		code: 'js/core/maintainer.js',
		tests: 'js/test/test_maintainer.js'
	},
	{
		code: 'js/core/runtime.js',
		tests: 'js/test/test_runtime.js'
	},
	{
		deps: [
			'js/core/maintainer.js',
			'js/core/runtime.js',
			'js/core/translator.js',
		],
		code: 'js/core/eden.js',
		tests: 'js/test/test.js'
	}
], function (err, report) {
	if (report.failed) {
		process.exit(1);
	}
});
