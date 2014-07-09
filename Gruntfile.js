/*
 * grunt-watchify
 * http://github.com/amiorin/grunt-watchify
 *
 * Copyright (c) 2013 Alberto Miorin, contributors
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

module.exports = function (grunt) {
  grunt.initConfig({

    jison: {
      target: {
        files: { 'js/eden/core/parser.js': 'translator/grammar.jison' }
      }
    },

    watch: {
      // regenerate parser file when grammar changes
      grammar: {
        files: 'translator/grammar.jison',
        tasks: ['jison']
      },

      // reload browser when parser changes
      parser: {
        files: 'js/eden/core/parser.js',
        options: {
          livereload: true
        }
      }
    },

    connect: {
      options: {
        port: 9000,
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              connect.static(path.resolve('translator')),
              connect.static(path.resolve('.'))
            ];
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-jison');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-livereload');

  grunt.registerTask('default', ['connect', 'watch']);
};
