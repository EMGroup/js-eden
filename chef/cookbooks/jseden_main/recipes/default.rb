require_recipe "apt"
require_recipe "apache2"

execute "disable-default-site" do
  command "sudo a2dissite default"
  notifies :reload, resources(:service => "apache2"), :delayed
end

web_app "project" do
  template "project.conf.erb"
  notifies :reload, resources(:service => "apache2"), :delayed
end

script "make link for cgi scripts" do
	interpreter "bash"
	user "root"
	cwd "/"

	code <<-EOH
	mkdir -p /dcs/emp/jseden/bin
	ln -s /opt/vagrant_ruby/bin/ruby /dcs/emp/jseden/bin/ruby
	EOH
end
