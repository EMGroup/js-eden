var fs = require('fs');
var jsdom = require('jsdom').jsdom;

var file_name = 'test.html';
var grammar_file_name = 'grammar.jison';
var contents = fs.readFileSync(file_name, 'utf8');
var window = jsdom(contents).createWindow();

var $ = require('jquery').create(window);
var grammar = fs.readFileSync(grammar_file_name, 'utf8');

$($('textarea').get(0)).text(grammar);
fs.writeFileSync(file_name, window.document.innerHTML);
