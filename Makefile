REPORTER = spec

test:
		@grunt clean cortex_neuron_build 
	    @./node_modules/.bin/mocha \
	          --reporter $(REPORTER) test/*.js

.PHONY: test