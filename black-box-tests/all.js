var fs = require('fs');
var exec = require('child_process').exec;

var testsFile = fs.readFileSync('black-box-tests/all.e');
var lines = testsFile.toString().split('\n');
var sections = [];
var descriptionLines = [];
var sectionLines = [];
var i;
for (i = 0; i < lines.length; ++i) {
	var match = lines[i].match(/^##(.*)/);
	if (match) {
		if (sectionLines.length !== 0) {
			sections.push({
				description: descriptionLines.join(' '),
				section: sectionLines.join('\n')
			});
			descriptionLines = [];
			sectionLines = [];
		}
		descriptionLines.push(match[1].trim());
	} else {
		sectionLines.push(lines[i]);
	}
}

var before = fs.readFileSync('black-box-tests/before.e');
var after = fs.readFileSync('black-box-tests/after.e');

var failures = [];
function testNumber(i) {
	if (i === sections.length) {
		if (failures.length === 0) {
			return;
		}

		console.log('\nFailures:\n');

		failures.forEach(function (failure) {
			console.log(sections[failure.i].description);
			console.log(failure.stdout);
		});

		return;
	}

	var testCase = before+'\n'+sections[i].section+'\n'+after;
	fs.writeFileSync('__tmptest.e', testCase);
	exec('node ttyeden.js __tmptest.e', function (error, stdout) {
		var result = stdout === '' ? 'PASS' : 'FAIL';
		console.log(result+' '+sections[i].description);
		if (stdout !== '') {
			failures.push({
				i: i,
				stdout: stdout
			});
		}
		testNumber(i + 1);
	});
}

testNumber(0);
