#!/dcs/emp/jseden/bin/ruby
# Concatenates and serves all the required scripts for jseden.
# If called with --nocgi, just outputs to stdout without waiting for CGI input.

require 'erb'
require 'uri'
require 'cgi'


if ARGV[0] != "--nocgi"
	$cgi = CGI.new("html4")

	puts "Content-type: application/x-javascript"
	puts ""
end

scripts = [
	"lib/jquery.color.js",
	"lib/jquery.hotkeys.js",
	"lib/json2.js",

	"dummyconsole.js",
	"test.js",
	"maintainer.js",
	"eden/parser.js",
	"eden.js",
	"edenui.js",
	"models.js",
	"collections.js",
	"sessions.js",
	"interpreter.js",
	"em.js",
	"edenpage.js",

	"sylvester.js",
	"raphael-min.js",
	"dracula_graffle.js",
	"dracula_graph.js",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end

