#!/usr/bin/env ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: application/x-javascript\n\n"

scripts = [
	"lib/jquery.color.js",
	"lib/jquery.hotkeys.js",
	"lib/json2.js",
	"lib/codemirror/codemirror.js",
	"lib/codemirror/runmode.js",
	"lib/codemirror/mode/javascript/javascript.js",
	"lib/codemirror/mode/eden/eden.js",
	"lib/codemirror/mode/xml/xml.js",
	"lib/codemirror/mode/markdown/markdown.js",

	"core/runtime.js",
	"dummyconsole.js",
	"test/test.js",
	"core/maintainer.js",
	"core/eden/parser.js",
	"core/eden.js",
	"core/plugins.js",
	"edenui.js",
	"models.js",
	"collections.js",
	"em.js",
	"edenpage.js",

	"lib/sylvester.js",

	"../plugins/input-dialog/interpreter.js",
	"../plugins/project-listing/project-listing.js",
	"../plugins/menu-bar/menu-bar.js",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
