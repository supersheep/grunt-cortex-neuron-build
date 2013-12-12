define("test-module@0.1.0/d", [], function(require, exports, module) {
module.exports = function(){
	console.log("I'm d");
};
}, {
    "asyncDeps": [
        "test-module@0.1.0/c",
        "test-module@0.1.0/d"
    ]
});