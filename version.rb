#!/usr/bin/env ruby
# this script is called through XHR by jseden to display a version number

puts "Content-type: text/plain"
puts ""
system("git describe --abbrev=4 HEAD")
