module.exports = function(grunt){

    grunt.registerMultiTask('neuron-build','Build cmd module to neuron wrapped module',function(){
        require("colors");

        var checker     = require('../lib/check-wrapper');
        var wrapper     = require('../lib/wrapper');
        var lang        = require('../lib/lang');


        var uglifyjs    = require('uglify-js');
        var fs          = require('fs-sync');
        var async       = require('async');
        var node_path   = require('path');
        var multi_profile = require("multi-profile");

        var callback = this.async();


        var MESSAGE = {
            NAME_MUST_BE_DEFINED    : 'package.name must be defined.',
            VER_MUST_BE_DEFINED     : 'package.version must be defined.'
        };
        var build       = {};
        var fileSrc     = this.filesSrc; 
        var run_options = this.options({
            define:"DP.define"
        });

        var REGEX_ENDS_WITH_JS = /\.js$/;
        var cwd = run_options.cwd;
        var pkg = fs.readJSON( node_path.join(cwd, 'package.json') );
        var main_file = node_path.join(
            cwd, 
            // default to `'index.js'`
            ensure_js_ext((pkg.cortex && pkg.cortex.main) || pkg.main || 'index.js') 
        );
        var main_dir = node_path.dirname(main_file);

        build.ENSURE_PROPERTY = {
            name: {
                err: MESSAGE.NAME_MUST_BE_DEFINED
            },

            version: {
                err: MESSAGE.VER_MUST_BE_DEFINED
            }
        };
                
        var TYPES = {
            cortex_path: {
                getter: function (v) {
                    // will resolve '~' in the path
                    v = multi_profile.resolveHomePath(v);
                    if(!fs.isPathAbsolute(v)){

                        // convert to absolute path relative to the root directory of the current profile
                        v = node_path.join(build.context.profile.currentDir(), v);
                    }

                    if(!fs.isDir(v)){
                        fs.mkdir(v);
                    }

                    return v;
                }
            },

            url: {
                setter: function (v, key, attr) {
                    v = node_url.parse(String(v));

                    // must be an invalid url
                    if (!v.host){
                        attr.error('invalid url');
                    }
                    
                    return v.href;
                }
            }
        };

        var DEFAULT_OPTIONS = {
            path:"~/.cortex",
            schema:{
                built_root      : {
                    writable    : false,
                    value       : 'built_modules',
                    type        : TYPES.cortex_path
                },

                built_temp      : {
                    writable    : false,
                    value       : 'built',
                    type        : {
                        getter  : function (v) {
                            v = node_path.join('.cortex', v);

                            if(!fs.isDir(v)){
                                fs.mkdir(v);
                            }

                            return v;
                        }
                    }
                }
            }
        };

        build.context = {}
        build.context.profile = multi_profile(lang.mix(run_options, DEFAULT_OPTIONS, false)).init();



        function check_package(pkg){
            var err;

            Object.keys(build.ENSURE_PROPERTY).some(function(key, config) {
                if(!pkg[key]){
                    err = config.err;
                }

                return err;
            });

            return err;
        }


        function is_relative_path(str){
            return str.indexOf('../') === 0 || str.indexOf('./') === 0;
        }


        function ensure_js_ext(path) {
            return REGEX_ENDS_WITH_JS.test(path) ?
                    path :
                    path + '.js';
        }

        build.build_files = function(options, callback) {
            var cwd = options.cwd;

            // main entrance:
            // {
            //      main: 'test/fixtures/main.js',
            //      name: 'module'
            //      version: '0.0.1'
            // }
            // 
            // expected
            //      src: ''
            //
            // unexpected:
            //      src: 'test/folder/module.js'    -> ../folder/module.js
            //      src: 'folder/folder/module.js'  -> ../../folder/folder/module.js

            var pkg_error = check_package(pkg);
            if(pkg_error){
                return callback(pkg_error);
            }

            var name = pkg.name;
            var version = pkg.version;

            var CORTEX_BUILT_TEMP = build.context.profile.get('built_temp');
            var built_folder = node_path.join(cwd, CORTEX_BUILT_TEMP, name, version);

            // copy stylesheets
            var directories_css = lang.object_member_by_namespaces(pkg, 'cortex.directories.css');
            if ( directories_css && fs.isDir(directories_css) ) {
                // copy the entire folder, 'coz there might be images or other resources.
                fs.copy(directories_css, built_folder, {
                    force: true
                });
            }

            // if options.dist exists, skip building
            if(options.dist){
                // always fill the built_folder
                fs.copy(options.dist, built_folder, {
                    force: true
                });

                callback(null, {
                    name: name,
                    version: version,
                    folder: built_folder
                });

            }else{
                var output = node_path.join(built_folder, name + '.js');
                fs.remove(output);

                // -> 'module@0.0.1'
                var main_id = name + '@' + version;

                if( !fs.exists(main_file) ){
                    return callback( grunt.template.process('Main file "<%= path %>" is not found.', {
                        path: main_file
                    }));
                }


                async.waterfall([
                    function(done) {
                        // check file paths
                        build.check_files({
                            main_dir: main_dir,
                            main_file: main_file,
                            files: options.files

                        }, done);
                    },

                    function(data, done) {
                        async.parallel(
                            // build each file
                            data.files.map(function(file) {
                                return function(sub_done) {
                                    grunt.log.writeln("parsing".cyan, file, '...');

                                    var id = build.generate_identifier({
                                        file: file,
                                        main_dir: main_dir,
                                        main_file: main_file,
                                        main_id: main_id
                                    });

                                    build.write_module({
                                        dependencies: lang.object_member_by_namespaces(
                                            pkg, 'cortex.exactDependencies', {}
                                        ),
                                        file: file,
                                        define: options.define,
                                        id: id,
                                        output: output

                                    }, sub_done);
                                } 
                            }),
                            done
                        );
                    }

                ], function(err) {
                    if(err){
                        callback(err);
                    }else{
                        callback(null, {
                            folder: built_folder,
                            name: name,
                            version: version
                        });
                    }
                });
            }
        };


        // check the file paths
        // - main_dir: {string} 
        // - main_file: {string}
        // - files: {Array}
        build.check_files = function(options, callback) {
            var filtered = options.files.filter(function(file) {
                if( fs.exists(file) ){
                    return true;
                }else{
                    grunt.fail.warn( grunt.template.process('Source file "<%= path %>" not found.', {path: file}) );
                    return false;
                }
            });

            var passed = filtered.every(function(file) {

                // the relative path of the current module to the main module
                // main_path: 'test/fixtures/main.js',
                // path: 'ROOT/test/fixtures/folder/foo.js'
                // -> 'folder/foo.js'
                if( ~ node_path.relative(options.main_dir, file).indexOf('../') ){
                    callback( grunt.template.process('Modules "<%= path %>" outside the folder of the main module may cause serious further problems.', {
                        path: file
                    }) );

                }else{
                    return true;
                }
            });

            if(passed){

                // Move main file to the end of the file list, which is important,
                // to make sure all sub modules have been defined before the main entrance
                filtered = filtered.filter(function(path) {
                    return path !== options.main_file;
                });

                filtered.push(options.main_file);

                callback(null, {
                    files: filtered
                });
            }
        };


        // generate the standard identifier of the current file
        // @param {Object} options
        // - file: {string} the pathname of the current file
        // - main_dir: {string} dirname of main_file
        // - main_file: {string} absolute url of the `main` property in package.json
        // - main_id: {string} the standard identifier of the main module
        build.generate_identifier = function(options) {
            // the exact identifier
            var id;
            var file = options.file;

            if(file === options.main_file){
                id = options.main_id;

            }else{

                var relative_path = node_path.relative(options.main_dir, file);

                // -> 'folder/foo'
                var relative_id = relative_path.replace(REGEX_ENDS_WITH_JS, '');

                // -> 'module@0.0.1/folder/foo'
                id = node_path.join(options.main_id, relative_id);
            }

            return id;
        };


        // @param {Object} options
        // - file: {string}
        // - dependencies: {Object} exact dependencies of the current package
        // - define: {string} `options.define` of `module.exports`
        // - id: {string} standard id of the current module 
        // - output: {string}
        build.write_module = function(options, callback) {
            var file = options.file;
            var content = fs.read(file);
            
                async.waterfall([
                    function(done) {
                        build.parse_dependencies(file, done);
                    },

                    function(data, done) {
                        build.resolve_dependencies({
                            dependencies: data.dependencies,
                            pkg_dependencies: options.dependencies,
                            file: file
                        }, done);
                    },

                    function(data, done) {
                        var wrapped = wrapper({
                            define  : options.define,
                            code    : content,
                            deps    : data.dependencies,
                            id      : options.id
                        });

                        fs.write(options.output, wrapped + '\n\n', {
                            flag: 'a+'
                        });

                        done();
                    }

                ], function(err) {
                    callback(err);
                });
        }


        // parse dependencies from the Abstract Syntax Tree
        // @param {Object} options
        // - file: {string}
        // - ast: {uglifyjs.AST_Node} 
        build.parse_dependencies = function(file, callback) {
            var ast;
            var deps = [];
            var err;

            // read file
            var content = fs.read(file);
            
            var ast;

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
                            err = grunt.template.process( 'Source file "<%= path %>": `require` should have one and only one string as an argument.', {path: options.file} );
                        }
                    }
                }
            });

            // syntax parse may cause a javascript error
            try{
                ast = uglifyjs.parse(content);
            }catch(e){
                return callback(
                    grunt.template.process('Source file "<%= path %>" syntax parse error: "<%= err %>".', {path: file, err: e})
                );
            }

            if(!checker.check(ast)){
                callback( grunt.template.process('Source file "<%= path %>" already has module wrapping, which will cause further problems.', {path: file}) );
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


        // resolve the ids of the dependencies array into standard identifers
        // @param {Object} options
        // - dependencies: {Array} array of dependencies of the current module
        // - pkg_dependencies: {Object} 'dependencies' of package.json
        // - file: {string}
        // X - separator: {string} @

        // @returns {string} resolved dependencies
        build.resolve_dependencies = function(options, callback) {

            // suppose: 
            //      ['./a', '../../b']
            // `options.dependencies` may have relative items, validate them
            var deps = options.dependencies;

            var i = 0;
            var length = deps.length;
            var dep;
            var resolved = [];

            var err;

            for(; i < length; i ++){
                dep = deps[i];

                if(!is_relative_path(dep)){
                    var version = options.pkg_dependencies[dep];

                    if(!version){
                        err = grunt.template.process( 'Exact version of dependency "<%= mod %>" has not defined in package.json. Use "ctx install <%= mod%> --save".', {mod: dep, path: options.file} );
                        break;
                    }

                    dep += '@' + version;
                }

                resolved.push(dep);
            }

            if(err){
                callback(err);
            }else{
                callback(null, {
                    dependencies: resolved
                });
            }
        };


        // TODO
        build.check_stable_module = function(options, callback) {
            callback(null);
        };


        // publish modules to local server
        // @param {Object} options
        // - name: {string}
        // - version: {string}
        // - folder: {path}
        build.publish = function(options, callback) {
            grunt.log.writeln('publishing...'.cyan);


            var CORTEX_BUILT_ROOT = build.context.profile.get('built_root');

            var to = node_path.join( CORTEX_BUILT_ROOT, options.name, options.version );

            try{
                fs.remove(to) && fs.remove(to, {
                    force: true
                });

                fs.copy(options.folder, to, {
                    force: true
                });

                grunt.log.writeln("copy".cyan,options.folder,to);

                callback(null);

            }catch(e){
                callback(e);
            }
        }


        // var file_main = fileSrc.map(function(file){return node_path.resolve(file)});
        var parse_all_dependencies = function(file,all_parsed){
            var all = parse_all_dependencies.all = parse_all_dependencies.all || [];
            
            var resolve = function(file,path){
                var dir = node_path.dirname(file);
                return node_path.resolve(node_path.join(dir,path+".js"));
            }

            var add = function(path){
                if(all.indexOf(path) === -1){
                    all.push(path);
                }
            }

            var parse_file = function(file,file_parsed){
                build.parse_dependencies(file,function(err,data){
                    var deps = data.dependencies.filter(is_relative_path).map(function(path){
                        return resolve(file,path);
                    });
                    grunt.log.debug(file,"dependeny on",deps.join(","));
                    var len = deps.length;
                    if(!len){
                        grunt.log.debug(file,"parsed");
                        file_parsed(null,[]);
                    }else{
                        deps.forEach(add);
                        deps.forEach(function(file){
                            parse_file(file,function(){
                                len--;
                                if(len===0){
                                    grunt.log.debug(file,"parsed");
                                    file_parsed(null,deps);
                                }
                            });
                        });
                    }
                });
            }

            parse_file(file,function(err){
                if(err){return all_parsed(err);}

                all_parsed(null,all);
                all = parse_all_dependencies.all = [];
            });
        }


        run_options.files = [main_file];


        parse_all_dependencies(main_file,function(err,data){
            if(err){return callback(err);}
            run_options.files = run_options.files.concat(data);
            //fileSrc.map(function(file){return node_path.resolve(file)});
            build.build_files(run_options, function(err, data) {
                if(err){
                    return callback(err);
                }

                callback(null);
            });
        });

        



    });

};


// options:{
//     publish:true,
//     cwd:process.cwd()
// }