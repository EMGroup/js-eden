Global Hotkeys
==============
* `alt+i` Focus interpreter window
* `alt+shift+i` Hide interpreter window
* `alt+a` Submit contents of interpreter window
* `alt+o` Focus observable search box
* `alt+p` Load older entered EDEN code into interpreter window
* `alt+n` Load newer code into the interpeter window

Developing locally
==================
There's a `Vagrantfile` included for setting up an Ubuntu VM with apache/mysql/ruby configured. You'll need to install both [virtualbox](https://www.virtualbox.org/) and [Vagrant](http://vagrantup.com/) in order to use it. Fortunately both cross platform.

To start up the VM:

bc.
~/js-eden $ vagrant up

Once it's finished provisioning, you should be able to open your browser at localhost:8080 and see js-eden. You can use `vagrant ssh` (on windows this will just give you some instructions on how to use PuTTY) to ssh into the box. To shut it down you can run `vagrant halt`.

Modifying the provisioned VM
============================
Rough idea of how files matter:

* `Vagrantfile` Configuration for the virtualbox VM to be setup, including port forwards.
* `chef/` Folder containing all the scripts for provisioning services on the VM.
* `chef/cookbooks/jseden_main` Contains all the jseden specific chef recipes.

The main files are `Vagrantfile` and `chef/cookbooks/jseden_main/recipes/default.rb`. All the cookbooks other than `jseden_main` are written by a third party and downloaded from opscode.

If you want to change the VM, this reasonably nice introduction to vagrant/chef as well as looking in `jseden_main/recipes/default.rb` should give you an idea of how you can.
http://iostudio.github.com/LunchAndLearn/2012/03/21/vagrant.html

EDEN to JavaScript translator
=============================
The translator is itself written in JavaScript so that it can execute in the browser.

Note about end of lines
-----------------------
The translator fails to extract EDEN definitions from the source code if DOS newlines are present (CRLF).
Currently we work around this by just doing a search and replace for CRLF into LF before feeding it into the
parser.

WIP changes to the translator
-----------------------------
In order to improve code generation and ability to reuse the EDEN parser, the Jison parser could. 

What are all the files?
=======================
* build.sh - build the Eden -> JavaScript translator from grammar.jison and build the grammar testing page
* grammar.jison - contains the grammar for the Eden -> JavaScript translator
* test.html.top, test.html.bottom - the static content used to build the grammar testing page

* test.html - the grammar development and testing page
* eden.html - a prototype JsEden environment

* js/maintainer.js - the definition maintainer for JavaScript
* js/try.js - the logic for the grammar testing page
* js/test.js - logic for writing testcases for the translator

libraries & utils
-----------------

* js/json2.js
* js/jison.js
* js/dummyconsole.js
* js/beautify.js

Requirements to build everything
================================

Jison, the parser generator used for the EDEN translator, can be used without a browser by using node.js.

# Install Node
http://nodejs.org/

# NPM (node package manager)
website: http://npmjs.org/
installation: curl http://npmjs.org/install.sh | sh

# Jison
once you have npm, just run:

npm install jison

Build instructions
==================

sh build.sh

runtime requirements for the parser
===================================

the parser currently uses JSON.stringify for escaping strings. Some older
browsers (firefox 3 which is used in DCS) don't support this natively but this
is solved by using Douglas Crockford's implementation of the JSON object in
JavaScript:

https://github.com/douglascrockford/JSON-js

serialisation of state for persistency will almost undoubtedly use this also.
