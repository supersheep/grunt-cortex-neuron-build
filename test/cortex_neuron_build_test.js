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
        dependencies:{
          a:"0.0.1",
          b:"0.0.2"
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
    var gruntOptions = {
        entries: {
          "./input.js":"../expected/output-actual.js",
          "./c.js":"../expected/c-actual.js",
          "./d.js":"../expected/d-actual.js"
        },
        pkg:{
            "main":"input.js",
            "dependencies": {
              "a": "0.0.1",
              "b": "0.0.2"
            },
            "entries":["*.js"]
        },
        targetVersion: "latest",
        cwd:"./test/fixtures"
      };

    var promise = lib.promise({
      file:"test/fixtures/input.js",
      entry:"test/fixtures/input.js",
      pkg:grunt.file.readJSON("test/fixtures/mixed_package.json"),
      gruntOptions:gruntOptions
    });

    promise.then(function(result){
      expect(result[0].file).to.equal(path.resolve('test/fixtures/c.js'));
      expect(result[1].file).to.equal(path.resolve('test/fixtures/d.js'));
      expect(result[2].file).to.equal(path.resolve('test/fixtures/input.js'));

      expect(result[0].output).to.equal(grunt.file.read("test/fixtures/c-wrapped.js"));
      expect(result[1].output).to.equal(grunt.file.read("test/fixtures/d-wrapped.js"));
      expect(result[2].output).to.equal(grunt.file.read("test/fixtures/input-wrapped.js"));

      expect(result[0].deps).to.deep.equal([ './d' ]);
      expect(result[1].deps).to.deep.equal([ ]);
      expect(result[2].deps).to.deep.equal([ 'a', 'b', './c', './d' ]);

    }).done(done);
  });
  
  it("should wrap module properly", function(){
    var actual = grunt.file.read('test/expected/output-actual.js');
    var expected = grunt.file.read('test/expected/output.js');
    expect(actual).to.equal(expected);
  });
});
