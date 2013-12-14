# grunt-cortex-neuron-build [![Build Status](https://travis-ci.org/supersheep/grunt-cortex-neuron-build.png?branch=master)](https://travis-ci.org/supersheep/grunt-cortex-neuron-build)

> build a module to neuron wrapping

```shell
npm install grunt-cortex-neuron-build --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cortex-neuron-build');
```

## The "cortex_neuron_build" task

### Overview
In your project's Gruntfile, add a section named `cortex_neuron_build` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  cortex_neuron_build: {
    test: {
      options: {
        entries: {
          "./input.js":"../expected/output-actual.js"
        },
        targetVersion: "latest",
        cwd:"./test/fixtures"
      }
    }
  }
});
```

### Options

#### options.entries
Type: `Object`
Default value: `{}`

A object describe src and dest as key-value.

#### options.targetVersion
Type: `String`
Default value: pkg.version

A string value which will be use to describe the version of current module, default to `package.version`.

### Usage Examples

#### Default Options
Let's say we have such raw files:

package.json:
```js
{
    "name":"test-module",
    "version":"0.1.0",
    "cortex": {
        "dependencies": {
          "a": "0.0.1",
          "b": "0.0.2"
        }
    }
}
```
input.js:
```js
var a = require("a");
var b = require("b");
var c = require("./c");
var d = require("./d");
```
c.js:
```js
var d = require("./d");
```
d.js:
```js
module.exports = function(){
  console.log("I'm d");
};
```
and give such config is Gruntfile.js
```js
grunt.initConfig({
  cortex_neuron_build: {
    test: {
      options: {
        entries: {
          "./input.js":"../expected/output-actual.js"
        },
        targetVersion: "latest",
        cwd:"./test/fixtures"
      }
    }
  }
});
```

then we will got output-actual.js as below:
```js
define("test-module@latest/d", [], function(require, exports, module) {
module.exports = function(){
  console.log("I'm d");
}
});
define("test-module@latest/c", ["./d"], function(require, exports, module) {
var d = require("./d");
});
define("test-module@latest", ["a@0.0.1", "b@0.0.2", "./c", "./d"], function(require, exports, module) {
var a = require("a");
var b = require("b");
var c = require("./c");
var d = require("./d");
});
```

## Release History
2013-12-10 0.1.0 refactor code, add entries and targetVersion as option, add test cases