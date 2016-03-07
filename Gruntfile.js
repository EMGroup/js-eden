/*
 * Used by `grunt` - see gruntjs.com.
 *
 * The purpose of this file is to help with working on the eden-js grammar, the
 * 'jison' task will generate the parser, the default task runs a web server
 * for testing the grammar and automatically regenerates the parser when the
 * grammar file changes.
 */

'use strict';

var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

module.exports = function (grunt) {
  grunt.initConfig({

    'gh-pages': {
      src: ['**']
    },

	uglify: {
		core: {
			files: {
				'./js/core/jseden.min.js': [
					'./js/core/runtime.js',
					'./js/core/window-highlighter.js',
					'./js/core/maintainer.js',
					'./js/core/polyglot.js',
					'./js/core/translator.js',
					'./js/core/eden.js',
					'./js/core/plugins.js',
					'./js/util/url.js',
					'./js/core/initialise.js'
				],
				'./plugins/jseden-plugins.min.js': [
					'./js/util/css.js',
					'./plugins/input-dialog/interpreter.js',
					'./plugins/project-listing/project-listing.js',
					'./plugins/plugin-listing/plugin-listing.js',
					'./plugins/menu-bar/menu-bar.js',
					'./plugins/canvas-html5/canvas.js',
					'./plugins/symbol-viewer/symbol-viewer.js',
					'./plugins/html-views/html-views.js',
					'./plugins/expression-tree/expression-tree.js',
					'./plugins/systemSymbols.js',
					'./plugins/symbol-lookup-table/symbol-lookup-table.js',
					'./plugins/observable-mining/observable-mining.js',
					'./plugins/script-generator/script-generator.js',
					'./plugins/dependency-map/springy/springy.js',
					'./plugins/dependency-map/springy/springyui.js',
					'./plugins/dependency-map/dependency-map.js',
					'./plugins/state-timeline/state-timeline.js',
					'./plugins/state-listener/state-listener.js',
					'./plugins/network-remote/network-remote.js',
					'./plugins/view-layout/view-layout.js',
					'./plugins/adm/adm-input.js',
					'./plugins/speech-synthesis/speech-synthesis.js'
				]}
		}
	},

    jison: {
      target: {
        files: { 'js/core/translator.js': 'translator/grammar.jison' }
      }
    },

    watch: {
      // regenerate parser file when grammar changes
      grammar: {
        files: 'translator/grammar.jison',
        tasks: ['jison']
      },

	  coresrc: {
		files: ['js/core/*.js','./plugins/**/*.js'],
		tasks: ['uglify']
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('build', ['jison', 'uglify']);
  grunt.registerTask('default', ['build', 'connect', 'watch']);
};
