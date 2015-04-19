var Async           = require("./async"),
    message        = require("./message"),
    r               = require('ramda');

import {getAddMatcher, getMatchAll} from './MatchEmitter';
import {Termination} from './SystemMessages';

var Actor = function(config) {
    this._config = config;

    // The context of actor
    this._context = {};

    // The interface of the actor
    this._iface = undefined;

    // The processing message
    this._message = undefined;

    // Event listner
    this._listener;

    // System Event Emitter
    this._system;

    // The state of the actor.
    this._state = "IDLE";

    this._queue = [];

    this._children = [];

    this.matchListeners = [];
    this.onMatch = getAddMatcher(this.matchListeners);
    this.emitMatch = getMatchAll(this.matchListeners);
}

Actor.prototype.init = function(options) {

   var config = this._config;
   var self = this;

    // Add a hook to message callback

    var hook = function(message) {
        if (message.callback) {
            var _callback = message.callback;
            message.callback = function(data) {
                self._context.post(_callback,data);
            }
        }
    }

   // Emit event from actor.
   this._context.emit = function(event,data) {

        if (self._listener) {
            process.nextTick(function(){
                self._listener(event,data);
            });
        }
   }

   // Post a message to the event queue.
    this._context.post = function() {
		var msg = message.create.apply({},arguments);
        hook(msg);
        self.send(msg);
    }

    this._context.next = function() {
		var msg = message.create.apply({},arguments);
        hook(msg);
        self.send(msg,true);
	}

   this._context.actor = function(){
        // Let's context be able to locale the actor object
        return self;
   }

   if (typeof config == "object"){

        this._iface = config;
        for (var key in options) {
            this._context[key] = options[key];
        }

   } else if (typeof config == "function"){
        this._iface = config.call(this._context,options);
   } else {
        throw new Error("Invalid argument");
   }

   return this._iface;
}

Actor.prototype.send = function(msg,prepend) {
    if(this._state =='DEAD'){
        throw new Error('Attempt to send message to dead actor.');
    }

	var self = this;
    msg.onUncaughtException(function(err) {
        self.handleException(err);
    });
    this._enqueue(msg,prepend);
}

Actor.prototype._enqueue = function(message,prepend){
	if (prepend != true) {
		this._queue.push(message);
	} else {
		this._queue.unshift(message);
	}

	this.nextTick();
}

/** Ready to schedule next tick */
Actor.prototype.nextTick = function() {

    if(this._state === 'DEAD'){
        //dead actor exception
        this.handleException(new Error('attempting to process messages for a dead actor'));
    }

	if (this._state != "IDLE")
		return;

    var self = this;
    if (self._queue.length > 0){
		this._state = "QUEUED";
        process.nextTick(function(){
            self.tick();
        });
    }
}

/** Process a message in a tick */
Actor.prototype.tick = function() {

    if (this._queue.length <= 0) {
		this._state = "IDLE";
        return;
    }

	this._state = "PROCESSING";

    var message = this._queue.shift(),
         self = this,
         reply;

    var async = new Async(function(reply){
        message.reply(reply);
   });

    message.async = async;
    this._message  = message;

    message.done(function() {
        self._message = undefined;
        self._state = "IDLE";
        if (!message.disposed)
            self._emitSystem("completed",message);
        else
            self._emitSystem("disposed",message);
        self.nextTick();
    });

    try {
        this._emitSystem("received",message);
		if (typeof message.method == "function") { // Anonymous function
			reply = message.method.call(this._context,message.params,async);
		} else {
			reply = this._iface[message.method].call(this._context,message.params,async);
		}

        if (!async.isEnabled()) {
            message.reply(reply);
        }
     } catch(err) {

        if ( this.handleException(err) ) {

            if(this._state !== 'DEAD'){
                this._state = "IDLE";
                this.nextTick();
            }else{
                //dead actor exception
                //this.handleException(new Error('attempting to process messages for a dead actor'));
            }
        }

     }
}

/** Get the processing message */
Actor.prototype.message = function() {
    return this._message;
}

/** Register listener for any event */
Actor.prototype._on = function(callback){
    this._listener = callback;
}

Actor.prototype._emitSystem = function(event,data){
    var self = this;
    if (self._system) {
        process.nextTick(function(){
            self._system.emit(event,data);
        });
    }
}

Actor.prototype.handleException = function(err) {
    // An action object to let's user to choose to continue or stop the execution of actor's message queue
    var action = {
        _continue : true,
        stop : function(){
            this._continue = false;
        }
    };

    this._uncaughtExceptionHandler(err,action);

    return action._continue;
}

/** Setup a new exception handler for uncaught exception
 */

Actor.prototype.onUncaughtException = function(callback){
    this._uncaughtExceptionHandler = callback;
}

/** The default handler of uncaught exception
 */
Actor.prototype._uncaughtExceptionHandler = function(err,action) {
    throw err;
}

Actor.prototype.die = function(callback){
    this._state = 'DEAD';
    if(callback){
        callback(this._queue);
        this._queue = [];
    }
    this.emitMatch(new Termination(this));
}

Actor.prototype.supervise = function(strategy,actor){
    var self = this;

    var findHandler = function(err){
        return r.find(function(kvp){
                    return r.is(r.head(kvp),err);
                },strategy);
    };

    var errorHandler = function(err){
        var found = findHandler(err);
        if(found){
            return r.last(found);
        }
    };

    actor.onUncaughtException(function(err,action){

        var handler = errorHandler(err);
        if(handler){
            handler(err,action,actor,self);
        }else{
            self.handleException(err);
        }
    });

    this._children.push(actor);
}

module.exports = Actor;
