#!/dcs/emp/jseden/bin/ruby

require 'erb'
require 'uri'
require 'cgi'

$cgi = CGI.new("html4")
puts "Content-type: text/javascript"
puts ""

scripts = ["jquery.color.js","jquery.hotkeys.js","dummyconsole.js","json2.js","test.js","maintainer.js","eden/parser.js","eden.js","edenui.js","models.js","collections.js","sessions.js","em.js","edenpage.js"]

scripts.each do |x|
	#puts x
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end

