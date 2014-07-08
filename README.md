# JsEden [![Build Status](https://secure.travis-ci.org/EMGroup/js-eden.png?branch=master)](https://travis-ci.org/EMGroup/js-eden)

JsEden is a browser based environment for modelling with definitive scripts, the style of modelling supported best by [tkeden](http://www2.warwick.ac.uk/fac/sci/dcs/research/em/software/eden/).

# Questions

Go to the [google group](https://groups.google.com/forum/#!forum/jseden)!

# Development Guide

## Automated testing

There are automated tests for the JavaScript code. To run the tests:

1) install Node.js
2) npm install
3) npm test

## Local development server

As well as a vagrant box there is a script to let you run jseden on your own
machine. If you're running linux/osx (anything with `/bin/sh`) and you have
node installed, you can do:

```javascript
npm install
node jseden-dev-server.js
```

Then go to localhost:8000.

## Developing locally

There's a `Vagrantfile` included for setting up an Ubuntu VM with apache/mysql/ruby configured. You'll need to install both [virtualbox](https://www.virtualbox.org/) and [Vagrant](http://vagrantup.com/) in order to use it. Fortunately both cross platform.

To start up the VM:

```~/js-eden $ vagrant up```

Once it's finished provisioning, you should be able to open your browser at localhost:8080 and see js-eden. You can use `vagrant ssh` (on windows this will just give you some instructions on how to use PuTTY) to ssh into the box. To shut it down you can run `vagrant halt`.

## Modifying the provisioned VM

Rough idea of how files matter:

* `Vagrantfile` Configuration for the virtualbox VM to be setup, including port forwards.
* `chef/` Folder containing all the scripts for provisioning services on the VM.
* `chef/cookbooks/jseden_main` Contains all the jseden specific chef recipes.

The main files are `Vagrantfile` and `chef/cookbooks/jseden_main/recipes/default.rb`. All the cookbooks other than `jseden_main` are written by a third party and downloaded from opscode.

If you want to change the VM, this reasonably nice introduction to vagrant/chef as well as looking in `jseden_main/recipes/default.rb` should give you an idea of how you can.
http://iostudio.github.com/LunchAndLearn/2012/03/21/vagrant.html


# Usage Guide

## Global Hotkeys

* `alt+i` Focus interpreter window
* `alt+shift+i` Hide interpreter window
* `alt+a` Submit contents of interpreter window
* `alt+o` Focus observable search box
* `alt+p` Load older entered EDEN code into interpreter window
* `alt+n` Load newer code into the interpeter window

