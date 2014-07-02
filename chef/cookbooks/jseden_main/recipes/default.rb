require_recipe "apt"
require_recipe "apache2"
require_recipe "ruby"
require_recipe "mysql::client"
require_recipe "mysql::ruby"
require_recipe "mysql::server"

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
	if [ ! -e /dcs/emp/jseden/bin/ruby ]
	then
		ln -s /usr/bin/ruby /dcs/emp/jseden/bin/ruby
	fi
	EOH
end

script "make jseden database" do
	interpreter "bash"
	code <<-EOH
	mysql -uroot -p#{node[:mysql][:server_root_password]} -e "
	CREATE DATABASE IF NOT EXISTS jseden;
	GRANT ALL ON jseden.* TO 'jseden'@'localhost' IDENTIFIED BY 'emgroup';
	"

	mysql -ujseden -pemgroup -e '
	CREATE TABLE IF NOT EXISTS `jse_observables` (
		`observable` varchar(30) NOT NULL,
		`sid` int(11) NOT NULL,
		`definition` text,
		`value` text,
		`updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (`observable`,`sid`)
	) ENGINE=MyISAM DEFAULT CHARSET=latin1;
	CREATE TABLE IF NOT EXISTS `jse_sessions` (
		`id` int(11) NOT NULL AUTO_INCREMENT,
		`title` text,
		`created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		`cid` int(11) DEFAULT NULL,
		PRIMARY KEY (`id`)
	) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
	' jseden
	EOH
end

script "install ruby-mysql even though I'm sure the mysql::client recipe should have done this" do
	interpreter "bash"
	user "root"
	code <<-EOH
	apt-get install -y ruby-mysql
	EOH
end