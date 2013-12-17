define("test-module@latest/folder/child", [], function(require, exports, module) {
console.log(1);
}, {
    "asyncDeps": [
        "c@0.0.3"
    ]
});