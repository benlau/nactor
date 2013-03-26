
var Async = require("./async")

var Actor = function(config) {
    this._config = config;
    
    // Actor's runtime data
    this._runtime = {};
    
    // The interface of the actor
    this._iface = undefined;
    
    this._queue = [];
    
    // The current executing task
    this._task = undefined;
    
    // Event listner
    this._listener;
}

Actor.prototype.init = function(options) {

   var config = this._config;
   var self = this;

   this._runtime.emit = function(event,data) {
        if (self._listener)
            self._listener(event,data);
   }
   
   this._runtime.actor = function(){
        // Let's runtime be able to locale the actor object
        return self;
   }

   if (typeof config == "object"){
   
        this._iface = config;
        for (var key in options) {
            this._runtime[key] = options[key];
        }
        
   } else if (typeof config == "function"){
        this._iface = config.call(this._runtime,options);
   } else {
        throw new Error("Invalid argument");
   }
   
   return this._iface;
}

Actor.prototype.send = function(method,params,cb) {
    //console.log("Actor::send" , method , params,cb);
    var actor = this, 
         task = {
            method : method,
            params : params,
            callback : cb
        }
    
    this._queue.push(task);
       
    if (this._queue.length == 1){
        process.nextTick(function(){
            actor.tick();
        });
    }
}

/** Ready to schedule next tick */
Actor.prototype.nextTick = function() {
    var self = this;
    if (self._queue.length > 0){
        process.nextTick(function(){
            self.tick();
        });
    }
}

/** Execute a task in a tick */
Actor.prototype.tick = function() {

    if (this._queue.len <= 0) {
        return;
    }
    
    var task = this._queue.shift(),
         self = this,
         reply;
         
    //console.log("Actor::tick" , task);

    var response = function(reply){ // Respone to the sender
        self._task = undefined;
        if (task.callback)
            task.callback(reply);
         
        if (self._queue.length > 0){
            process.nextTick(function(){
                self.tick();
            });
        }
    }

    var async = new Async(function(reply){
        response(reply);
    });

    task.async = async;
    this._task  = task;
    
    try {
        reply = this._iface[task.method].call(this._runtime,task.params,async);

        if (!async.isEnabled()) {
            response(reply);
        }
     } catch(err) {
     
        // An action object to let's user to choose to continue or stop the execution of actor's message queue
        var action = {
            _continue : true,
            stop : function(){
                this._continue = false;
            }
        };
        
        this._uncaughtExceptionHandler(err,action);
        
        if (action._continue) {
            this.nextTick();
        }
     }  
}

/** Return the current executing task information  */
Actor.prototype.task = function() {
    return this._task;
}

/** Register listener for any event */
Actor.prototype._on = function(callback){
    this._listener = callback;
}

Actor.prototype.onUncaughtException = function(callback){
    this._uncaughtExceptionHandler = callback;
}

Actor.prototype._uncaughtExceptionHandler = function(err,action) {
    throw err;
}

module.exports = Actor;
