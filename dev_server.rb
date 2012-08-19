# Serves the current working directory and serves the output of js/jseden.rb.
# Allows for local development of js-eden (with no support for sessions currently).
# Usage: ruby dev_server.rb

require 'webrick'
include WEBrick

require 'open3'
include Open3

RUBY = File.join(Config::CONFIG['bindir'], Config::CONFIG['ruby_install_name'])

class ServeJsEdenScripts < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(request, response)
  	popen3(RUBY, 'jseden.rb', '--nocgi', :chdir => 'js') do |stdin, stdout, stderr|
    	response.status = 200
    	response['Content-Type'] = 'application/x-javascript'
    	response.body = stdout.read
    end
  end
end


s = HTTPServer.new(:Port => 9090,  :DocumentRoot => Dir::pwd)
s.mount("/js/jseden.rb", ServeJsEdenScripts)

trap("INT"){ s.shutdown }
s.start