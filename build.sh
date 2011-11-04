#!/bin/sh

jison grammar.jison -o js/eden/parser.js
cat test.html.top grammar.jison test.html.bottom > test.html
