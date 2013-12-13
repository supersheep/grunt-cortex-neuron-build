define("test-module@0.1.0/c", ["./d"], function(require, exports, module) {
require("./d");
require.async("./d");
}, {
    "asyncDeps": [
        "c@0.0.3"
    ]
});