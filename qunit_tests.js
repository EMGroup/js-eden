var qunit = require('qunit');

qunit.setup({
	log: {
		testing: true,
		errors: true
	},
});

qunit.run([
	{
		deps: [
			'joe/joe.js'
		],
		code: 'js/core/maintainer.js',
		tests: 'js/test/test_maintainer.js'
	},
	{
		deps: [
			'joe/joe.js',
			'js/core/maintainer.js',
			'js/core/runtime.js',
			'js/core/eden/parser.js',
		],
		code: 'js/core/eden.js',
		tests: 'js/test/test.js'
	}
], function (err, report) {
	if (report.failed) {
		process.exit(1);
	}
});
