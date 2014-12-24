// usage: node black-box-tests/all.js [line-number]
// passing line number will execute just the test at that line number from
// all.e
var fs = require('fs');
var exec = require('child_process').exec;
var mode = process.argv[2];

var limit;
var firstLine;

if (process.argv[3]) {
	firstLine = parseInt(process.argv[3], 10);
	limit = 1;
} else {
	firstLine = 0;
}

var testsFile = fs.readFileSync('black-box-tests/all.e');
var lines = testsFile.toString().split('\n').slice(firstLine);
var sections = [];
var descriptionLines = [];
var sectionLines = [];
var i;
var sectionLineNumber;
var match;
var annotations = {};
for (i = 0; i < lines.length; ++i) {
	match = lines[i].match(/^##(.*)/);
	if (match) {
		if (sectionLines.length !== 0) {
			sections.push({
				annotations: annotations,
				description: descriptionLines.join(' '),
				section: sectionLines.join('\n'),
				lineNumber: sectionLineNumber
			});
			descriptionLines = [];
			sectionLines = [];
			sectionLineNumber = undefined;
			annotations = {};
		}
		if (match[1].trim().charAt(0) === '@') {
			annotations[match[1].trim().slice(1)] = true;
		} else {
			descriptionLines.push(match[1].trim());
			if (sectionLineNumber === undefined) {
				sectionLineNumber = firstLine + i;
			}
		}
	} else {
		sectionLines.push(lines[i]);
	}
}
sections.push({
	annotations: annotations,
	description: descriptionLines.join(' '),
	section: sectionLines.join('\n'),
	lineNumber: sectionLineNumber
});

var before = fs.readFileSync('black-box-tests/before.e');
var after = fs.readFileSync('black-box-tests/after.e');

var failures = [];
function testNumber(i) {
	function addFailure(stdout) {
		failures.push({
			i: i,
			stdout: stdout
		});
	}

	if (i === (limit !== undefined ? limit : sections.length)) {
		if (failures.length === 0) {
			process.exit(0);
		}

		console.log('\nFailures:\n');

		failures.forEach(function (failure) {
			console.log(sections[failure.i].lineNumber+' '+sections[failure.i].description);
			console.log(failure.stdout);
		});

		process.exit(1);
	}

	var testCase = before+'\n'+sections[i].section+'\n'+after+'\n';
	fs.writeFileSync('__tmptest.e', testCase);
	if (mode === 'jseden') {
		exec('node ttyeden.js __tmptest.e', function (error, stdout) {
			var failed = error || stdout !== '';
			var result = failed ? 'FAIL' : 'PASS';
			console.log(result+' '+sections[i].lineNumber+' '+sections[i].description);

			if (stdout !== '' && !sections[i].annotations.FailsInJSEden) {
				addFailure(stdout);
			} else if (!failed && sections[i].annotations.FailsInJSEden) {
				addFailure("Should have failed, but didn't!");
			}
			testNumber(i + 1);
		});
	} else if (mode === 'tkeden') {
		var tkeden = process.env.TKEDEN || '/Applications/ttyeden1-73';
		var command = tkeden+' -n __tmptest.e';
		var child = exec(command, {timeout: 100}, function (error, stdout, stderr) {
			var failed = error || stdout !== '' || stderr !== '';
			var result = failed ? 'FAIL' : 'PASS';
			console.log(result+' '+sections[i].lineNumber+' '+sections[i].description);
			if (failed) {
				addFailure(stdout !== '' ? stdout : stderr);
			}
			testNumber(i + 1);
		});
	}
}

testNumber(0);
