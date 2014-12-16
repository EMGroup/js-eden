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

## Unit tests

There are automated tests for the JavaScript code. They execute javascript code
directly to test the dependency maintenance and parsing code. To run the tests
on the commandline:

1. Run `npm install`
2. Run `npm test`

If you want to use the browser's debugging tools, you can run the tests in the
browser:

1. Run `node jseden-dev-server.js`
2. Go to `localhost:8000/qunit.html`

## Selenium tests

These tests simulate user actions in the JS-Eden UI. They are in the
`selenium-tests` folder. To run the tests:

1. Download `selenium-server-standalone-<version>.jar` from http://www.seleniumhq.org/download/
2. Run `java -jar selenium-server-standalone-<version>.jar` in a terminal and leave it running.
3. Run `npm install`
4. Run `./node_modules/.bin/mocha selenium-tests/test.js`

You should see Firefox appear and some actions occur.

## Black box tests for tkeden and JS-Eden

In order to check the compatibility of tkeden and JS-Eden, tests written in the
EDEN language are being developed. These are in the `black-box-tests` folder.

To run an individual test for tkeden, you need to use the `ttyeden` program, e.g.

```shell
C:\eden-1.73>ttyeden.exe -n "C:\Users\Tim Monks\projects\personal\em\js-eden\black-box-tests\12.e"
```

On Windows, you need to run `ttyeden` from the directory it is installed into,
the same might not be true for other operating systems. `ttyeden` is available as part of the EDEN downloads here: http://www2.warwick.ac.uk/fac/sci/dcs/research/em/software/eden/

To run a test for JS-Eden you can use the `ttyeden.js` script:

```shell
$ node ttyeden.js black-box-tests/12.e
```

# Usage Guide

## Input Window Hotkeys

* `ctrl+enter` Submit contents of interpreter window
* `ctrl+up` Load older entered EDEN code into interpreter window
* `ctrl+down` Load newer code into the interpeter window
