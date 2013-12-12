define("test-module@0.1.0/c", ["./d"], function(require, exports, module) {
require("./d");
require.async("./d");
}, {
    "asyncDeps": [
        "test-module@0.1.0/c",
        "test-module@0.1.0/d"
    ]
});