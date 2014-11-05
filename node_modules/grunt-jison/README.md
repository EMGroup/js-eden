# grunt-jison  [![Build Status](https://travis-ci.org/rsilve/grunt-jison.svg?branch=master)](https://travis-ci.org/rsilve/grunt-jison)

> grunt plugin for jison parser

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-jison --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-jison');
```

## The "jison" task

### Overview
In your project's Gruntfile, add a section named `jison` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  jison: {
    target : {
    	options: {
      	// Task-specific options go here.
    	},
    	files: {
      	// Target-specific file lists and/or options go here.
    	}
     }
  }
})
```

### Options

#### options.moduleType
Type: `String`
Default value: `commonjs`

The type of module you want to generate with Jison.
Possible values are `commonjs`, `js` and `amd`.

#### options.moduleParser
Type: `String`
Default value: `lalr`

The type of algorithm to use for the parser.
Possible values are `lr0`, `slr`, `lalr`, `lr.

#### options.moduleName
Type: `String`
Default value: `parser`

When using `js` for `options.moduleType`, specifies the
variable name of the parser.  

### Usage Examples

#### Default Options

```js
grunt.initConfig({
  jison: {
    my_parser : {
    	files: { 'generated-parser.js': 'grammar-file.jison' }
    }
  }
})
```

#### Custom Options
In this example, we generate a AMD module instead of a standard JS file.

```js
grunt.initConfig({
  jison: {
    target : {
      options: { moduleType: 'amd' },
      files: { 'generated-parser.amd.js': 'grammar-file.jison' }
    }
  }
})
```
#### Optional lex file
In this example, we generate a module with a file containing a grammar and a
file containing a lexical grammar.

```js
grunt.initConfig({
  jison: {
    target : {
      options: { moduleType: 'amd' },
      files: { 'generated-parser.amd.js': ['grammar-file.jison',  'lex-file.jisonlex'}
    }
  }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
