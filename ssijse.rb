#!/usr/bin/env ruby
# 
# Performs a server side include of all js-e files. This optimises by combining
# all js-e files into one for a single compressed http request. It also supports
# jsonp for cross-site loading of js-e files.

require 'cgi'
require 'uri'

# Required HTTP header information
$cgi = CGI.new("html5")
puts "Content-type: text/javascript"
puts ""

# JSONP Support
$callback = $cgi['callback']
if $callback != ""
	print "#{$callback}(\""
end

# Print all lines and recursively expand any includes.
def includeScript(script)
	file = File.new(script, "r")
	while (line = file.gets)
		if line.start_with?("include(")
			comps = line.split("\"")
			includeScript("#{comps[1]}")
		else
			if $callback != ""
				newline = line.gsub(/\"/,"\\\"").chomp
				puts "#{newline}\\"
			else
				puts line
			end
		end
	end
	file.close
end

scriptfile = $cgi['script']
# Protect file system
scriptfile.gsub!(/\.\./,"_")
if scriptfile[0] == "/"
	exit 1
end

includeScript(scriptfile)

if $callback != ""
	print "\");\n"
else
	print "\n"
end

