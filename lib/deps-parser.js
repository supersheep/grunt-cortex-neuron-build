// parse dependencies from the Abstract Syntax Tree
// @param {Object} options
// - file: {string}
// - ast: {uglifyjs.AST_Node} 

module.exports = function(file, callback) {
    var ast;
    var deps = [];
    var err;

    // read file
    var content = fs.read(file);

    // use syntax analytics
    var walker = new uglifyjs.TreeWalker(function(node) {
        if(!err && node.CTOR === uglifyjs.AST_Call){
            var expression = node.expression;
            var args = node.args;

            if(expression.CTOR === uglifyjs.AST_SymbolRef && expression.name === 'require'){
                var dep = args[0];

                // require('async')
                if(args.length === 1 && dep.CTOR === uglifyjs.AST_String){
                    deps.push(dep.value);
                    
                }else{
                    err = lang.template( 'Source file "{path}": `require` should have one and only one string as an argument.', {path: options.file} );
                }
            }
        }
    });

    // syntax parse may cause a javascript error
    try{
        ast = uglifyjs.parse(content);
    }catch(e){
        return callback(
            lang.template('Source file "{path}" syntax parse error: "{err}".', {path: file, err: e})
        );
    }

    if(!checker.check(ast)){
        callback( lang.template('Source file "{path}" already has module wrapping, which will cause further problems.', {path: file}) );
        // wrapped = content;

    }else{
        ast.walk(walker);

        if(err){
            callback(err);
        }else{
            callback(null, {
                dependencies: deps
            });
        }
    }



    };