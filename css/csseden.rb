#!/usr/bin/env ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: text/css\n\n"

scripts = [
	"header.css",
	"jseden.css",
	"jquery-ui-1.8.16.flick.css",
	"eden.css",
	"../plugins/project-listing/project-listing.css",
	"../plugins/menu-bar/menu-bar.css",
	"../plugins/symbol-viewer/symbol-viewer.css",
	"../plugins/canvas-html5/canvas.css",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
