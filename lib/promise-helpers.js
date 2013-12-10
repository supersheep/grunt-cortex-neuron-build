var Q = require("q");

exports.list = function(promises){
    var deferred = Q.defer();
    var steps = promises.length;
    var ret = [];
    if(!steps){
        deferred.resolve();
    }

    promises.forEach(function(promise){
        promise.then(function(data){
            ret.push(data);
            steps--;
            if(!steps){
                deferred.resolve(ret);
            }
        });
    });
    
    return deferred.promise;
}