// writes version.txt. Should be used before publishing to gh-pages.

var exec = require('child_process').exec;
var fs = require('fs');

function writeVersion(version) {
  fs.writeFileSync('version.json', JSON.stringify(version));
}

exec('git describe --tags --abbrev=0 HEAD', function (error, stdout) {
  var tag;
  if (!error) {
    tag = stdout.replace('\n', '');
  }

  exec('git rev-parse HEAD', function (error, stdout) {
    if (error) {
      console.error('Failed to write version.json');
      process.exit(1);
    }

    writeVersion({
      tag: tag,
      sha: stdout.replace('\n', '')
    });
  });
});
