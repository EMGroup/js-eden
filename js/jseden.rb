#!/usr/bin/env ruby

# Copyright (c) 2013, Empirical Modelling Group
# All rights reserved.
#
# See LICENSE.txt

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
	"core/maintainer.js",
	"core/translator.js",
	"core/eden.js",
	"core/plugins.js",
	"core/initialise.js",
	"edenpage.js",

	"lib/sylvester.js",

	"../plugins/input-dialog/interpreter.js",
	"../plugins/project-listing/project-listing.js",
	"../plugins/menu-bar/menu-bar.js",
	"../plugins/canvas-html5/canvas.js",
	"../plugins/symbol-viewer/symbol-viewer.js",
	"../plugins/html-views/html-views.js",
	"../plugins/adm/adm-input.js",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
