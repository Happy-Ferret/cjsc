CommonJS Compiler
==============
[![Build Status](https://travis-ci.org/dsheiko/cjsc.png)](https://travis-ci.org/dsheiko/cjsc)
[![NPM version](https://badge.fury.io/js/cjsc.png)](http://badge.fury.io/js/cjsc)

CJSC is a nodejs application that compiles CommonJS (NodeJS) modules into a single JavaScript file suitable for the browser.

The utility gets especially handy when you want your JavaScript modular without additional libraries and
without incurring excess requests

## Features

* Makes CommonJS modules available in the browser
* Does not require any library to resolve dependencies, just adds a tiny `require` function and definition wrappers to your original code
* Works fine with [UMD modules](https://github.com/umdjs/umd) (including jQuery, Backbone, Underscore and others)
* Allows exporting globals of 3rd party libraries without intervention in their code

## Features inherited from CommonJS
* Allows splitting large projects into multiple files (modules) making web-application scalable and maintainable
* Enclosures every file in its own unique module context

## How to install

CommonJS Compiler relies on node.js. If you don't have node.js installed, just follow the instructions:
https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

Make sure all the required dependencies installed
```bash
npm i
```
Make sure the binary is executable
```bash
chmod +x cjsc
```
You can also create a symlink to make it globally available
```bash
ln -s cjsc /usr/local/bin/cjsc
```

## Using CommonJS Compiler in the command line

Compile `main-module.js` into `build.js`:
```bash
./cjsc main-module.js build.js
```
or
```bash
node cjsc.js main-module.js build.js
```

Compile `main-module.js` into `build.js` and minify `build.js`
```bash
./cjsc main-module.js build.js -M
```

With a banner
```bash
./cjsc main-module.js build.js -M --banner="/*! pkg v.0.0.1 */"
```

## How it works

Let's define a few CommonJS modules (http://wiki.commonjs.org/wiki/Modules/1.1.1):

`./main.js`
```javascript
console.log( "main.js running..." );
console.log( "Imported name in main.js is `%s`", require( "./lib/dep1" ).name );
console.log( "Getting imported object from the cache:" );
console.log( " imported name in main.js is still `%s`", require( "./lib/dep1" ).name );
```

`./lib/dep1.js`
```javascript
console.log( "dep1.js running..." );
console.log( " it has __diname = `%s`", __dirname );
console.log( " it has __filename = `%s`", __filename );
console.log( "Imported name in dep1.js is `%s`", require( "./dep2" ).name );
exports.name = "dep1";
```

`./lib/dep2.js`
```javascript
console.log( "dep2.js running..." );
module.exports.name = "dep2";
```

Now we can compile the modules:
```bash
cjsc main.js script.js
```

As we fire up script.js we get the following output:
```
main.js running...
dep1.js running...
 it has __diname = `.../demo/lib`
 it has __filename = `.../demo/lib/dep1.js`
dep2.js running...
Imported name in dep1.js is `dep2`
Imported name in main.js is `dep1`
Getting imported object from the cache:
 imported name in main.js is still `dep1`
```

## How to make modules of jQuery and its plugins

```javascript
// Obtain jQuery as UMD-module
window.$ = require( "./jquery/jquery.js" );
// Run plugin that attaches to the defined jQuery global object
require( "./jquery/jquery.autosize.js" );
console.log( $( window ).autosize );
```

## How to make modules of 3rd party libraries

```javascript
// Load 3rd-party library and export the globals it exposes ("exp1" and "exp2")
var exp1 = require( "./vendors/lib.js", "exp1", "exp2" ).exp1,
// Take the second exported object from the module cache
		exp2 = require( "./vendors/lib.js" ).exp2;

console.log( "exp1", exp1 );
console.log( "exp2", exp2 );
```

## File Modules

If the exact filename is not found, then CJSC will try the
required filename with the added extension of .js.

## The `module` object
Every module has available `module` variable that references to an object representing the module.
Like in [NodeJS](http://nodejs.org/api/modules.html) th object has following structure:

* module.id {string} - The identifier for the module.
* module.filename {string} - The fully resolved filename to the module.
* module.loaded {boolean} - Whether or not the module is done loading.
* module.parent {Object} - The module that required this one.
* module.children {Object[]} - The module objects required by this one

## Caching

Caching goes the same as in nodejs. Modules are cached after the first time they are loaded.
So every call to `require('foo')` returns exactly the same object, if it refers to the same file.

Multiple calls to `require('foo')` don't execute the module code multiple times.

## <a name="a-grunt"></a>Setting up [Grunt](http://gruntjs.com/) task

*Gruntfile.js*
```javascript
grunt.loadNpmTasks('grunt-contrib-cjsc');
grunt.initConfig({
     cjsc: {
      development: {
				options: {
					minify: true
				},
        files: {
          "<path>/compiled.js" : "<path>/source.js"
        }
      }
    }
  });
```
*package.json*
```javascript
"devDependencies": {
    //..
    "grunt-contrib-cjsc": "*"
  }
```