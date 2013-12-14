define("test-module@latest/d", [], function(require, exports, module) {
module.exports = function(){
    console.log("I'm d");
};
}, {
    "asyncDeps": [
        "c@0.0.3"
    ]
});