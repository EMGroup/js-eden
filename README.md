# JsEden [![Build Status](https://secure.travis-ci.org/EMGroup/js-eden.png?branch=master)](https://travis-ci.org/EMGroup/js-eden)

JsEden is a browser based environment for modelling with definitive scripts,
the style of modelling supported best by
[tkeden](http://www2.warwick.ac.uk/fac/sci/dcs/research/em/software/eden/).

Join the [google group](https://groups.google.com/forum/#!forum/jseden) for
development updates or if you have any questions!

There is currently an instance hosted with [http://emgroup.github.io/js-eden](Github pages).

# Development Guide

## Development pre-requisites

Install Node.js (version >= 0.10.0):

* Windows and Mac can get an installer from: http://nodejs.org/
* Ubuntu you can install it from a PPA: http://www.ubuntuupdates.org/ppa/chris_lea_nodejs

## Local development server

```shell
$ npm install
...
$ node jseden-dev-server.js
```

Then go to localhost:8000.

## Developing the parser

Start up the parser development server:

```
$ npm install
...
$ grunt
```

Then go to localhost:9000. This will let you see the generated JS from the
parser. Changes to the file `translator/grammar.jison` will automatically
rebuild the parser at `js/core/translator.js` (takes a few seconds) and reload
the page.

## Automated testing

There are automated tests for the JavaScript code. To run the tests:

```shell
npm install
npm test
```

# Usage Guide

## Input Window Hotkeys

* `ctrl+enter` Submit contents of interpreter window
* `ctrl+up` Load older entered EDEN code into interpreter window
* `ctrl+down` Load newer code into the interpeter window
