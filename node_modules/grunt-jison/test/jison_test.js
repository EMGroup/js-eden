'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.tests = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  js: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/js.calc.js');
    var expected = grunt.file.read('test/expected/js.calc.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  },
  withNamespace: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/withNamespace.calc.js');
    var expected = grunt.file.read('test/expected/withNamespace.calc.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  },
  amd: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/amd.calc.js');
    var expected = grunt.file.read('test/expected/amd.calc.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  },
  commonjs: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/commonjs.calc.js');
    var expected = grunt.file.read('test/expected/commonjs.calc.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  },
  withLexFile: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/withLexFile.calc.js');
    var expected = grunt.file.read('test/expected/withLexFile.calc.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  }

};
