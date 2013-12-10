'use strict';

var grunt = require('grunt');
var lib = require("../lib/module-promise.js");
var path = require("path");

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.cortex_neuron_build = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  resolve_deps: function(test){
    var opt = {
      pkg_dependencies:{
        "a":"0.0.1",
        "b":"0.0.2"
      },
      identifier:"mod@0.0.1"
    };
    var actual1 = lib.resolveDependency("a",opt);
    var expected1 = "a@0.0.1";


    var actual2 = lib.resolveDependency("./a",opt);
    var expected2 = "./a";

    test.equal(actual1, expected1, "should resolve properly");
    test.equal(actual2, expected2, "should resolve properly");
    test.done();
  },
  generateIdentifier:function(test){
    var actual1 = lib.generateIdentifier({
      file:"path/a.js",
      main_file:"path/a.js",
      main_id:"mod@0.0.1"
    });
    var expected1 = "mod@0.0.1";

    var actual2 = lib.generateIdentifier({
      file:"path/c.js",
      main_file:"path/a.js",
      main_id:"mod@0.0.1"
    });
    var expected2 = "mod@0.0.1/c";
    test.equal(actual1, expected1, "should generate identifier properly");
    test.equal(actual2, expected2, "should generate identifier properly");
    test.done();
  },
  resolveDepToFile: function(test){
    var actual = lib.resolveDepToFile("/root/proj/lib/test.js","./c");
    test.equal(actual, "/root/proj/lib/c.js", "should resolve dependency to file properly");
    test.done();
  },
  moduleRenderFuncFactory: function(test){
    var actual = lib.moduleRenderFuncFactory({
      cortex:{
        dependencies:{
          a:"0.0.1",
          b:"0.0.2"
        }        
      }
    })({
      id:"input@0.1.0",
      deps:["a","b","./c","./d"],
      code:grunt.file.read("test/fixtures/input.js")
    });
    var expected = grunt.file.read("test/expected/wrapped.js");

    test.equal(actual.trim(), expected.trim(), "should wrap module properly");
    test.done();
  },
  modulePromise: function(test){

    var promise = lib.promise({
      file:"test/fixtures/input.js",
      entry:"test/fixtures/input.js",
      pkg:grunt.file.readJSON("test/fixtures/package.json")
    });

    promise.then(function(result){
      test.deepEqual(result,  [ { 
        file: path.resolve('test/fixtures/d.js'),
        output: 'define("test-module@0.1.0/d", [], function(require, exports, module) {\nmodule.exports = function(){\n\tconsole.log("I\'m d");\n}\n});',
        deps: [] 
      },{ 
        file: path.resolve('test/fixtures/c.js'),
        output: 'define("test-module@0.1.0/c", ["./d"], function(require, exports, module) {\nvar d = require("./d");\n});',
        deps: [ './d' ] 
      },{ 
        file:  path.resolve('test/fixtures/input.js'),
        output: 'define("test-module@0.1.0", ["a@0.0.1", "b@0.0.2", "./c", "./d"], function(require, exports, module) {\nvar a = require("a");\nvar b = require("b");\nvar c = require("./c");\nvar d = require("./d");\n});',
        deps: [ 'a', 'b', './c', './d' ] 
      }], "should generate identifier properly");
      test.done();
    }).fail(function(err){
      test.equal(err, null, "should generate identifier properly");
      test.done();
    });
  },
  build: function(test) {
    var actual = grunt.file.read('test/expected/output-actual.js');
    var expected = grunt.file.read('test/expected/output.js');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  }
};
