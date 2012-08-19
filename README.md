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
You'll need to install ruby (probably ruby 1.9) as jseden currently requires a webserver for a few things.

Once you've done that, just run `ruby dev_server.rb` and open `localhost:9090` in your browser.

What are all the files?
=======================
build.sh - build the Eden -> JavaScript translator from grammar.jison and build the grammar testing page
grammar.jison - contains the grammar for the Eden -> JavaScript translator
test.html.top, test.html.bottom - the static content used to build the grammar testing page

test.html - the grammar development and testing page
eden.html - a prototype JsEden environment

js/maintainer.js - the definition maintainer for JavaScript
js/try.js - the logic for the grammar testing page
js/test.js - logic for writing testcases for the translator

libraries & utils
-----------------

js/json2.js
js/jison.js
js/dummyconsole.js
js/beautify.js

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
