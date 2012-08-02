#!/dcs/emp/jseden/bin/ruby

require 'erb'
require 'uri'
require 'cgi'

$cgi = CGI.new("html4")
puts "Content-type: text/javascript"
puts ""

# scripts = ["jquery.color.js","jquery.hotkeys.js","dummyconsole.js","json2.js","test.js","maintainer.js","eden/parser.js","eden.js","edenui.js","models.js","collections.js","sessions.js","interpreter.js","em.js","edenpage.js","sylvester.js", "raphael-min.js", "dracula_graffle.js",  "dracula_graph.js", "Curry-1.0.1.js", "dracula_algorithms.js", "dracula_graph.js", "jquery-1.4.2.min.js", "seedrandom.js"]

# scripts = ["jquery.color.js","jquery.hotkeys.js","dummyconsole.js","json2.js","test.js","maintainer.js","eden/parser.js","eden.js","edenui.js","models.js","collections.js","sessions.js","interpreter.js","em.js","edenpage.js","sylvester.js"]

scripts = ["jquery.color.js","jquery.hotkeys.js","dummyconsole.js","json2.js","test.js","maintainer.js","eden/parser.js","eden.js","edenui.js","models.js","collections.js","sessions.js","interpreter.js","em.js","edenpage.js","sylvester.js", "raphael-min.js", "dracula_graffle.js",  "dracula_graph.js"]


scripts.each do |x|
	#puts x
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end

