#!/usr/bin/env ruby

puts "Content-type: text/plain"
puts ""
system("git describe --abbrev=4 HEAD")
