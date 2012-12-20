#!/usr/bin/ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: text/css\n\n"

scripts = [
	"header.css",
	"jseden.css",
	"flick/jquery-ui-1.8.16.custom.css",
	"eden.css",
]

scripts.each do |x|
	file = File.new(x, "r")
	while (line = file.gets)
		puts line
	end
	file.close
end
