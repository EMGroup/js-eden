/*
 * grunt-jison
 * https://github.com/rsilve/grunt-jison
 *
 * Copyright (c) 2013 Robert silve
 * Licensed under the MIT license.
 */

'use strict';


module.exports = function(grunt) {

  var task = grunt.task;
  var file = grunt.file;
  var utils = grunt.utils;
  var log = grunt.log;
  var verbose = grunt.verbose;
  var fail = grunt.fail;
  var option = grunt.option;
  var config = grunt.config;
  var template = grunt.template;

  var jison = require('jison');
  var ebnfParser = require('ebnf-parser');
  var lexParser  = require('lex-parser');


  grunt.registerMultiTask('jison', 'jison parser generator', function() {

  var options = this.options({"moduleType" : "commonjs", "moduleParser": "lalr"});

	this.files.forEach(function(f) {


		var src = f.src.shift();
		var dest = f.dest;

		if (!src) {
			grunt.warn('Missing src property.');
			return false;
		}

		if (!dest) {
			grunt.warn('Missing dest property');
			return false;
		}


		try {
      var data = file.read(src);
      var grammar = ebnfParser.parse(data);
      var lex = f.src.shift();
      if (lex) {
        var lexFile = file.read(lex);
        var lexOpts = lexParser.parse(lexFile);
        grammar.lex = lexOpts;
      }
      var parser = new jison.Generator(grammar, options);
      var js = parser.generate(options);
      file.write(dest, js);
      grunt.log.oklns("generate "+dest);
			return true;
		} catch (e) {
      grunt.warn(e);
			return false;
		}
    });
  });


};
