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
var fs = require('fs');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

module.exports = function (grunt) {

	function mergeFile(file) {
		var data = grunt.file.read(file);
		var res = "";
		var lines = data.split("\n");
		for (var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].trim();
			if (lines[i].substr(0,9) == "include(\"") {
				var filename = lines[i].slice(9,-3);
				console.log(filename);
				res += mergeFile("./"+filename);
			} else if (lines[i].substr(0,2) == "##") {
				continue;
			} else {
				res += lines[i] + "\n";
			}
		}
		console.log("Size: " + res.length);
		return res;
	}

  grunt.initConfig({

    'gh-pages': {
      src: ['**']
    },

	cssmin: {
		options: {
			target: './plugins/',
			relativeTo: './',
			rebase: true
		},
		plugins: {
			files: {
				'./plugins/jseden-plugins.min.css': [
					'plugins/project-listing/project-listing.css',
					'plugins/menu-bar/menu-bar.css',
					'plugins/symbol-viewer/symbol-viewer.css',
					'plugins/observable-mining/observable-mining.css',
					'plugins/symbol-lookup-table/symbol-lookup-table.css',
					'plugins/dependency-map/dependency-map.css',
					'plugins/state-timeline/state-timeline.css',
					'plugins/state-listener/state-listener.css',
					'plugins/network-remote/network-remote.css',
					'plugins/input-dialog/interpreter.css',
					'plugins/adm/adm-input.css',
					'plugins/script-generator/script-generator.css'
				]
			}
		}
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
					'./js/core/initialise.js',
					'./js/core/lex.js',
					'./js/core/errors.js',
					'./js/core/ast.js',
					'./js/core/translator2.js'
				],
				'./plugins/jseden-plugins.min.js': [
					'./plugins/input-dialog/interpreter.js',
					'./plugins/input-dialog/highlighter.js',
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

	  plugincss: {
	    files: ['plugins/**/*.css'],
		tasks: ['cssmin']
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
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('default', ['uglify', 'cssmin', 'connect', 'watch']);
  grunt.registerTask('merge', 'Merge all JSE files', function() {
		var data = mergeFile("./library/eden.jse");
		grunt.file.write("./library/jseden-lib.min.jse", data);

		data = mergeFile("./plugins/canvas-html5/canvas.js-e");
		grunt.file.write("./plugins/canvas-html5/jseden-canvas.min.js-e", data);
	});
};
