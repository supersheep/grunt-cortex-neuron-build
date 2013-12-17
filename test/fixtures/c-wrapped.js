define("test-module@latest/c", ["./folder/child"], function(require, exports, module) {
require("./folder/child");
require.async("./d");
}, {
    "asyncDeps": [
        "c@0.0.3"
    ]
});