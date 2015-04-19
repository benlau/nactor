
var EventEmitter = require('events').EventEmitter,
    message = require("./message")

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
 * A proxy object clones the user defined interfaces for
 * the target actor, but all the call is async and process
 * in sequential order.
 *
 * @constructor
 */

var Proxy = function(actor) {
    var self = this;
    this._actor = actor;
    this._emitter = new EventEmitter();
    actor.onUncaughtException(function(err,action){
        self._uncaughtExceptionHandler(err,action);
    });

    this.system = new EventEmitter();
}

Proxy.prototype.init = function(options) {
    var iface = this._actor.init(options),
         self = this,
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

    if (typeof arguments[0] == "object") {
        // The first argument is a ref object.
        // Just make it compitable with "drama"

        var i = 1;
        while (arguments[i] != undefined) { // Shfit argument
            arguments[i - 1 ] = arguments[i];
            i++;
        }
        if (i!=1) {
            delete arguments[i-1];
            arguments.length = arguments.length-1;
        }
    }
    var msg = message.create.apply({} , arguments);

    this._actor.send(msg);
}

Proxy.prototype.die = function(callback){
    var cb = callback || function(){};
    this._actor.die(cb);
};

Proxy.prototype.on = function(event,callback){
    this._emitter.on(event,callback);
}

Proxy.prototype.onUncaughtException = function(callback) {
    this._uncaughtExceptionHandler = callback;
}

Proxy.prototype._uncaughtExceptionHandler = function(err,action) {
    throw err;
}

// Experimental API
Proxy.prototype.processing = function() {
	return this._actor.message();
}

Proxy.prototype.getInternalActor = function(){
    return this._actor;
}

Proxy.prototype.setInternalActor = function(actor){
    this._actor = actor;
}

Proxy.prototype.supervise = function(strategy,actor){
    this._actor.supervise(strategy,actor);
}

module.exports = Proxy;
