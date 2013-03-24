
/** Convert an array like object to array */
function toArray(obj){
    var ret =[]
    for (var i = 0 ; i < obj.length;i++){
        ret.push(obj[i]);
    }
    return ret
}

/** A proxy of the actor object.
 * 
 * User should not work on the actor directly , instead they
 * should work on the proxy object. 
 * 
 * A proxy object cloned the user defined interfaces for
 * the target actor, but all the call is async and process
 * in sequential order. 
 * 
 * @constructor
 */

var Proxy = function(actor) {
    var self = this;
    this._actor = actor;
    actor.onUncaughtException(function(err,action){
        self._uncaughtExceptionHandler(err,action);
    });
}

Proxy.prototype.init = function(options) {
    var iface = this._actor.init(options),
         self = this;
         args = [""];

    for (var api in iface) {
        var t = api;
        this[api] = (function(method){
            return function () {
                var args = toArray(arguments);
                args.unshift(method);
                self.ask.apply(self,args);            
            }
        })(api);
    }
    
}

Proxy.prototype.ask = function() {
    var args,
         method = "",
         params = {},
         cb;
    
    args = toArray(arguments);
    
    if (typeof args[0] == "object") { 
        // The first argument is a ref object. 
        // Just make it compitable with "drama"
        args.shift();
    }
    
    method = args[0];
    args.shift();

    if (args.length > 0 && typeof args[0] != "function"  ) { 
        // Parameters to the actor's method
        params = args[0];
        args.shift();
    }

    if (args.length > 0 && typeof args[0] == "function") { 
        // Callback
        cb = args[0];
        args.shift();
    }
    
    if (args.length > 0)
        throw Error("Invalid argument list!");
    
    this._actor.send(method,params,cb);   
}

Proxy.prototype.onUncaughtException = function(callback) {
    this._uncaughtExceptionHandler = callback;
}

Proxy.prototype._uncaughtExceptionHandler = function(err,action) {
    throw err;
}

module.exports = Proxy;
