/*
 * grunt-cortex-neuron-build
 * https://github.com/supersheep/grunt-cortex-neuron-build
 *
 * Copyright (c) 2013 supersheep
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    cortex_neuron_build: {
      test: {
        options: {
          entries: {
            "./input.js":"../expected/output-actual.js"
          },
          targetVersion: "latest",
          cwd:"./test/fixtures"
        }
      },
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'cortex_neuron_build']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
