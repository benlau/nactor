
/** Async interface object
 *
 *  @constructor
 */

var Async = function(done){
    this._enabled = false;
    this._done = done;
}

/** Enable the async operation  */
Async.prototype.enable = function(){
    this._enabled = true;
}

Async.prototype.isEnabled = function(){
    return this._enabled;
}

Async.prototype.reply  = function(args) {
    this._done(args);
}

module.exports = Async;
