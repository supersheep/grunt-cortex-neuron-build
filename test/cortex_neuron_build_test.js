'use strict';


var fs = require("fs-sync");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var node_path = require("path");
var wrapper = require("../");
var lang = require("../lib/lang");

chai.should();

var grunt = require('grunt');
var lib = require("../lib/module-promise.js");
var path = require("path");

describe('test module promise', function(){
  it("should resolve properly", function(){
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

    expect(actual1).to.equal(expected1);
    expect(actual2).to.equal(expected2);
  });

  it("should generate identifier properly", function(){
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

    expect(actual1).to.equal(expected1);
    expect(actual2).to.equal(expected2);
  });

  it("should resolve dependency to file properly", function(){
    var actual = lib.resolveDepToFile("/root/proj/lib/test.js","./c");
    expect(actual).to.equal("/root/proj/lib/c.js");
  });

  it("should wrap module properly", function(){
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

    expect(actual).to.equal(expected);
  });

  it("should resolve dependency to file properly", function(){
    var actual = lib.resolveDepToFile("/root/proj/lib/test.js","./c");
    expect(actual).to.equal("/root/proj/lib/c.js");
  });

  it("should resolve module and its dependencies properly", function(done){
    this.timeout(5000);
    var promise = lib.promise({
      file:"test/fixtures/input.js",
      entry:"test/fixtures/input.js",
      pkg:grunt.file.readJSON("test/fixtures/package.json")
    });

    promise.then(function(result){
      assert.deepEqual(result, [ { 
        file: path.resolve('test/fixtures/d.js'),
        output: 'define("test-module@0.1.0/d", [], function(require, exports, module) {\nmodule.exports = function(){\n\tconsole.log("I\'m d");\n};\n});',
        deps: [] 
      },{ 
        file: path.resolve('test/fixtures/c.js'),
        output: 'define("test-module@0.1.0/c", ["./d"], function(require, exports, module) {\nvar d = require("./d");\n});',
        deps: [ './d' ] 
      },{ 
        file:  path.resolve('test/fixtures/input.js'),
        output: 'define("test-module@0.1.0", ["a@0.0.1", "b@0.0.2", "./c", "./d"], function(require, exports, module) {\nvar a = require("a");\nvar b = require("b");\nvar c = require("./c");\nvar d = require("./d");\n});',
        deps: [ 'a', 'b', './c', './d' ] 
      }]);
    }).done(done);
  });
  
  it("should wrap module properly", function(){
    var actual = grunt.file.read('test/expected/output-actual.js');
    var expected = grunt.file.read('test/expected/output.js');
    expect(actual).to.equal(expected);
  });
});
