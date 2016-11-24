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
					'css/menu-bar.css',
					'plugins/canvas-html5/canvas.css',
					'plugins/page/page.css',
					'plugins/symbol-viewer/symbol-viewer.css',
					'plugins/observable-mining/observable-mining.css',
					'plugins/observable-palette/observable-palette.css',
					'plugins/symbol-lookup-table/symbol-lookup-table.css',
					'plugins/dependency-map/dependency-map.css',
					'plugins/html-views/html-views.css',
					'plugins/external-html-content/external-html-content.css',
					'plugins/state-timeline/state-timeline.css',
					'plugins/state-listener/state-listener.css',
					'plugins/network-remote/network-remote.css',
					'plugins/input-dialog/interpreter.css',
					'plugins/input-dialog/subdialogs.css',
					'css/contextmenu.css',
					'css/highlighter.css',
					'plugins/input-dialog/gutter.css',
					'plugins/adm/adm-input.css',
					'plugins/dbview/dbview.css',
					'plugins/script-generator/script-generator.css',
					'plugins/debugger/debugger.css'
				]
			}
		}
	},

	uglify: {
		core: {
			files: {
				'./js/core/jseden.min.js': [
					'./js/language/lang.js',
					'./js/core/runtime.js',
					'./js/core/window-highlighter.js',
					'./js/core/maintainer.js',
					'./js/core/polyglot.js',
					'./js/core/eden.js',
					'./js/core/plugins.js',
					'./js/util/url.js',
					'./js/core/initialise.js',
					'./js/core/lex.js',
					'./js/core/errors.js',
					'./js/core/translator2.js',
					'./js/core/ast.js',
					'./js/core/database.js',
					'./js/wrappers.js',
					'./js/peer.js',
					'./js/query.js'
				],
				'./js/ui/jseden-ui.min.js': [
					'./js/ui/highlighter.js',
					'./js/ui/contextmenu.js',
					'./js/ui/menubar.js',
					'./js/ui/dialogs.js'
				],
				'./plugins/jseden-plugins.min.js': [
					'./js/util/css.js',
					'./plugins/input-dialog/interpreter.js',
					'./plugins/input-dialog/subdialogs.js',
					'./plugins/input-dialog/gutter.js',
					'./plugins/plugin-listing/plugin-listing.js',
					'./plugins/canvas-html5/canvas.js',
					'./plugins/page/page.js',
					'./plugins/symbol-viewer/symbol-viewer.js',
					'./plugins/external-html-content/external-html-content.js',
					'./plugins/html-views/html-views.js',
					'./plugins/expression-tree/expression-tree.js',
					'./plugins/systemSymbols.js',
					'./plugins/symbol-lookup-table/symbol-lookup-table.js',
					'./plugins/observable-mining/observable-mining.js',
					'./plugins/observable-palette/observable-palette.js',
					'./plugins/script-generator/script-generator.js',
					'./plugins/dependency-map/springy/springy.js',
					'./plugins/dependency-map/springy/springyui.js',
					'./plugins/dependency-map/dependency-map.js',
					'./plugins/state-timeline/state-timeline.js',
					'./plugins/state-listener/state-listener.js',
					'./plugins/network-remote/network-remote.js',
					'./plugins/view-layout/view-layout.js',
					'./plugins/adm/adm-input.js',
					'./plugins/dbview/dbview.js',
					'./plugins/speech-synthesis/speech-synthesis.js',
					'./plugins/midi/midi.js',
					'./plugins/midi/emulation/midi.js-bridge.js',
					'./plugins/debugger/debugger.js'
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
		files: ['js/core/*.js','js/ui/*.js','./plugins/**/*.js'],
		tasks: ['uglify']
	  },

	  plugincss: {
	    files: ['plugins/**/*.css'],
		tasks: ['cssmin']
	  },

	  merge: {
		  files: [
			'library/**/*.js-e', 'library/**/*.jse',
			'plugins/canvas-html5/**/*.js-e', 'plugins/canvas-html5/**/*.jse',			
		],
		  tasks: ['merge']
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

  grunt.registerTask('merge', 'Merge all JSE files', function() {
		var data = mergeFile("./library/eden.jse");
		grunt.file.write("./library/jseden-lib.min.jse", data);

		data = mergeFile("./plugins/canvas-html5/canvas.js-e");
		grunt.file.write("./plugins/canvas-html5/jseden-canvas.min.js-e", data);
	});
  grunt.registerTask('build', ['jison', 'uglify', 'cssmin', 'merge']);
  grunt.registerTask('default', ['build', 'connect', 'watch']);
};
