#!/bin/sh

npm install jison
./node_modules/.bin/jison grammar.jison -o ../js/eden/parser.js
cat test.html.top grammar.jison test.html.bottom > test.html
