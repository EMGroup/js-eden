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

module.exports = function (grunt) {


  grunt.initConfig({

    'gh-pages': {
      src: ['**']
    },

	concat: {
		canvas: {
		src: ["plugins/canvas/*.js-e"],
		dest: "plugins/canvas_merged.js-e"
		}
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
					'css/explorer.css',
					'css/scriptbox.css',
					'css/markdown.css',
					'css/projectdetails.css',
					'css/feedback.css',
					'plugins/canvas/canvas.css',
					'plugins/page/page.css',
					'plugins/symbol-viewer/symbol-viewer.css',
					'plugins/version-viewer/version-viewer.css',
					'plugins/p2pmanager/p2pmanager.css',
					'plugins/observable-mining/observable-mining.css',
					'plugins/observable-palette/observable-palette.css',
					'plugins/symbol-lookup-table/symbol-lookup-table.css',
					'plugins/html/html-views.css',
					'plugins/external-html-content/external-html-content.css',
					'plugins/state-timeline/state-timeline.css',
					'plugins/state-listener/state-listener.css',
					'plugins/network-remote/network-remote.css',
					'plugins/input-dialog/interpreter.css',
					'plugins/input-dialog/subdialogs.css',
					'css/contextmenu.css',
					'css/highlighter.css',
					'plugins/input-dialog/gutter.css',
					'plugins/input-dialog/details.css',
					'plugins/adm/adm-input.css',
					'plugins/dbview/dbview.css',
					'plugins/script-generator/script-generator.css',
					'css/debugger.css',
					'plugins/dependency-map/dependency-map.css'
				]
			}
		}
	},

	uglify: {
		core: {
			files: {
				'./js/core/jseden.min.js': [
					'./js/util/misc.js',
					'./js/core/eden.js',
					'./js/core/edenui.js',
					'./js/util/diff.js',
					'./js/language/lang.js',
					'./js/core/runtime.js',
					'./js/core/window-highlighter.js',
					'./js/core/scope.js',
					'./js/core/symbol.js',
					'./js/core/context.js',
					'./js/core/database.js',
					'./js/core/plugins.js',
					'./js/util/url.js',
					'./js/core/initialise.js',
					'./js/lex.js',
					'./js/core/errors.js',
					'./js/selectors/selector.js',
					'./js/selectors/property.js',
					'./js/selectors/name.js',
					'./js/selectors/tag.js',
					'./js/selectors/intersection.js',
					'./js/selectors/union.js',
					'./js/selectors/navigate.js',
					'./js/core/warnings.js',
					'./js/index.js',
					'./js/ast/ast.js',
					'./js/ast/basestatement.js',
					'./js/ast/basescript.js',
					'./js/ast/basecontext.js',
					'./js/ast/baseexpression.js',
					'./js/ast/append.js',
					'./js/ast/shift.js',
					'./js/ast/assignment.js',
					'./js/ast/after.js',
					'./js/ast/binaryop.js',
					'./js/ast/break.js',
					'./js/ast/case.js',
					'./js/ast/codeblock.js',
					'./js/ast/context.js',
					'./js/ast/continue.js',
					'./js/ast/declarations.js',
					'./js/ast/default.js',
					'./js/ast/definition.js',
					'./js/ast/delete.js',
					'./js/ast/do.js',
					'./js/ast/doxycomments.js',
					'./js/ast/dummy.js',
					'./js/ast/for.js',
					'./js/ast/function.js',
					'./js/ast/functioncall.js',
					'./js/ast/handle.js',
					'./js/ast/if.js',
					'./js/ast/import.js',
					'./js/ast/index.js',
					'./js/ast/insert.js',
					'./js/ast/length.js',
					'./js/ast/literal.js',
					'./js/ast/llist.js',
					'./js/ast/local.js',
					'./js/ast/lvalue.js',
					'./js/ast/modify.js',
					'./js/ast/parameter.js',
					'./js/ast/primary.js',
					'./js/ast/proc.js',
					'./js/ast/range.js',
					'./js/ast/require.js',
					'./js/ast/return.js',
					'./js/ast/scope.js',
					'./js/ast/scopedscript.js',
					'./js/ast/scopepath.js',
					'./js/ast/scopepattern.js',
					'./js/ast/script.js',
					'./js/ast/virtual.js',
					'./js/ast/scriptexpr.js',
					'./js/ast/subscribers.js',
					'./js/ast/substatement.js',
					'./js/ast/switch.js',
					'./js/ast/ternaryop.js',
					'./js/ast/unaryop.js',
					'./js/ast/wait.js',
					'./js/ast/when.js',
					'./js/ast/while.js',
					'./js/ast/querystat.js',
					'./js/ast/alias.js',
					'./js/ast/indexed.js',
					'./js/ast/section.js',
					'./js/ast/customblock.js',
					'./js/ast/async.js',
					'./js/ast/cs3_html.js',
					'./js/grammar/actionbody.js',
					'./js/grammar/after.js',
					'./js/grammar/attributes.js',
					'./js/grammar/declarations.js',
					'./js/grammar/do.js',
					'./js/grammar/expression.js',
					'./js/grammar/factor.js',
					'./js/grammar/for.js',
					'./js/grammar/function.js',
					'./js/grammar/if.js',
					'./js/grammar/import.js',
					'./js/grammar/listops.js',
					'./js/grammar/lists.js',
					'./js/grammar/lvalue.js',
					'./js/grammar/primary.js',
					'./js/grammar/proc.js',
					'./js/grammar/scope.js',
					'./js/grammar/script.js',
					'./js/grammar/selector.js',
					'./js/grammar/statement.js',
					'./js/grammar/switch.js',
					'./js/grammar/terms.js',
					'./js/grammar/wait.js',
					'./js/grammar/when.js',
					'./js/grammar/while.js',
					'./js/grammar/query.js',
					'./js/grammar/section.js',
					'./js/grammar/after.js',
					'./js/grammar/cs3_html.js',
					'./js/grammar/template.js',
					'./js/project.js',
					'./js/fragment.js',
					'./js/query.js',
					'./js/generator.js',
					'./js/peer.js',
					'./js/core/engine.js'
				],
				'./js/ui/jseden-ui.min.js': [
					'./js/ui/highlighter.js',
					'./js/ui/highlighter-rules.js',
					'./js/ui/highlighter-commentrules.js',
					'./js/ui/cs3_htmlrules.js',
					'./js/ui/contextmenu.js',
					'./js/ui/buttonbar.js',
					'./js/ui/tabs.js',
					'./js/ui/menubar.js',
					'./js/ui/dialogs.js',
					'./js/ui/notifications.js',
					'./js/ui/sharebox.js',
					'./js/ui/search.js',
					'./js/ui/scriptbox.js',
					'./js/ui/explorer.js',
					'./js/ui/explorer-state.js',
					'./js/ui/explorer-script.js',
					'./js/ui/debugger.js',
					'./js/ui/markdown.js',
					'./js/ui/projectdetails.js',
					'./js/ui/feedback.js'
				],
				'./plugins/jseden-plugins.min.js': [
					'./js/util/css.js',
					'./plugins/input-dialog/interpreter.js',
					'./plugins/input-dialog/subdialogs.js',
					'./plugins/input-dialog/gutter.js',
					'./plugins/input-dialog/scriptarea.js',
					'./plugins/input-dialog/details.js',
					'./plugins/input-dialog/keyboard.js',
					'./plugins/input-dialog/mouse.js',
					'./plugins/plugin-listing/plugin-listing.js',
					'./plugins/canvas/canvas.js',
					'./plugins/page/page.js',
					'./plugins/symbol-viewer/symbol-viewer.js',
					'./plugins/version-viewer/version-viewer.js',
					'./plugins/p2pmanager/p2pmanager.js',
					'./plugins/external-html-content/external-html-content.js',
					'./plugins/html/html-views.js',
					'./plugins/expression-tree/expression-tree.js',
					'./plugins/systemSymbols.js',
					'./plugins/symbol-lookup-table/symbol-lookup-table.js',
					'./plugins/observable-mining/observable-mining.js',
					'./plugins/observable-palette/observable-palette.js',
					'./plugins/script-generator/script-generator.js',
					'./plugins/state-timeline/state-timeline.js',
					'./plugins/state-listener/state-listener.js',
					'./plugins/network-remote/network-remote.js',
					'./plugins/view-layout/view-layout.js',
					'./plugins/adm/adm-input.js',
					'./plugins/dbview/dbview.js',
					'./plugins/speech-synthesis/speech-synthesis.js',
					'./plugins/midi/midi.js',
					'./plugins/midi/emulation/midi.js-bridge.js',
					'./plugins/midi/emulation/midi-file.js',
					'./plugins/dependency-map/dependency-map.js'
				]}
		}
	}
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('build', ['uglify', 'cssmin', 'concat']);
  grunt.registerTask('default', ['build']);
};
