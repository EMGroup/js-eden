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
			'js/core/polyglot.js',
			'js/core/translator.js',
			'js/language/lang.js',
			'js/language/en.js',
			'js/core/lex.js',
			'js/core/ast.js',
			'js/core/errors.js',
			'js/core/translator2.js'
		],
		code: 'js/core/eden.js',
		tests: 'js/test/test.js'
	}
], function (err, report) {
	if (report.failed) {
		process.exit(1);
	}
});
