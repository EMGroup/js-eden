/*
 * grunt-jison
 * https://github.com/rsilve/grunt-jison
 *
 * Copyright (c) 2013 Robert silve
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    jison: {
      commonjs : {
        options: {
          moduleType : 'commonjs'
        },
        files : {
          'tmp/commonjs.calc.js' : 'test/fixtures/calc.jison'
        }
      },
      js : {
        options: {
          moduleType : 'js'
        },
        files : {
          'tmp/js.calc.js' : 'test/fixtures/calc.jison'
        }
      },
      withNamespace : {
        options: {
          moduleType : 'js',
          moduleName : 'withNamespace'
        },
        files : {
          'tmp/withNamespace.calc.js' : 'test/fixtures/calc.jison'
        }
      },
      amd : {
        options: {
          moduleType : 'amd'
        },
        files : {
          'tmp/amd.calc.js' : 'test/fixtures/calc.jison'
        }
      },
      withLexFile: {
        options: {
          moduleParser : 'lalr'
        },
        files : {
          'tmp/withLexFile.calc.js' : ['test/fixtures/calc_grammar.jison', 'test/fixtures/calc_lex.jisonlex' ]
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'jison', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
