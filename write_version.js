// writes version.txt. Should be used before publishing to gh-pages.

var exec = require('child_process').exec;
var fs = require('fs');

function writeVersion(version) {
  fs.writeFileSync('version.json', JSON.stringify(version));
}

exec('git describe --abbrev=0 HEAD', function (error, stdout) {
  if (error) {
    exec('git rev-parse HEAD', function (error, stdout) {
      if (error) {
        console.error('Failed to write version.txt');
        process.exit(1);
      }
      writeVersion({sha: stdout.replace('\n', '')});
    });
    return;
  }

  writeVersion({tag: stdout.replace('\n', '')});
});
