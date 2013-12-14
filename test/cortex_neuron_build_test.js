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
      deps:{
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


    var actual3 = lib.generateIdentifier({
      cwd:"cwdcwd",
      file:"path/child/c.js",
      main_file:"path/a.js",
      main_id:"mod@0.0.1"
    });
    var expected3 = "mod@0.0.1/child/c";
    
    var actual4 = lib.generateIdentifier({ 
      cwd: 'test/fixtures',
      file: path.resolve('test/fixtures/input.js'),
      main_file: 'input.js',
      main_id: 'test-module@0.1.0' 
    });
    var expected4 = "test-module@0.1.0";
    expect(actual1).to.equal(expected1);
    expect(actual2).to.equal(expected2);
    expect(actual3).to.equal(expected3);
    expect(actual4).to.equal(expected4);
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
    var promise = lib.promise({
      cwd:"test/fixtures",
      file:"test/fixtures/input.js",
      pkg:grunt.file.readJSON("test/fixtures/mixed_package.json"),
      targetVersion:"latest"
    });

    function findByFileName(results,fileName){
      return results.filter(function(result){
        return result.file.indexOf(fileName) !== -1;
      })[0];
    }

    promise.then(function(results){
      [{
        name:"c",
        deps:["./folder/child"]
      },{
        name:"d",
        deps:[]
      },{
        name:"input",
        deps:["a","b","./c","./d"]
      }].forEach(function(item){
        var fixture = findByFileName(results,"fixtures/" + item.name + ".js");
        expect(fixture.output).to.equal(grunt.file.read("test/fixtures/" + item.name + "-wrapped.js"));
        expect(fixture.deps).to.deep.equal(item.deps);
      });
    }).done(done);
  });
  
  it("should wrap module properly", function(){
    var actual = grunt.file.read('test/expected/output-actual.js');
    var expected = grunt.file.read('test/expected/output.js');
    expect(actual).to.equal(expected);
  });
});
