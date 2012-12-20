#!/usr/bin/ruby
# Concatenates and serves all the required scripts for jseden.
puts "Content-type: text/plain\n\n"

def includeScript(script)
	file = File.new(script, "r")
	while (line = file.gets)
		if line.starts_with?("include(")
			comps = line.split("\"")
			includeScript("../#{comps[1]}")
		else
			puts line
		end
	end
	file.close
end

