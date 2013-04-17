var Async = require("./async"),
    message = require("./message")

var Actor = function(config) {
    this._config = config;
    
    // The context of actor
    this._context = {};
    
    // The interface of the actor
    this._iface = undefined;
    
    this._queue = [];
    
    // The processing message
    this._message = undefined;
    
    // The state of the actor.
    this._state = "IDLE";
    
    // Event listner
    this._listener;
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
		self._enqueue(msg);
    }
    
    this._context.next = function() {
		var msg = message.create.apply({},arguments);
        hook(msg);
		self._enqueue(msg,true);		
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

Actor.prototype.send = function(msg) {
//    console.log("Actor::send ",msg);
    this._enqueue(msg);
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

    if (this._queue.len <= 0) {
		this._state = "IDLE";
        return;
    }

	this._state = "PROCESSING";

    var message = this._queue.shift(),
         self = this,
         reply;
         
//    console.log("Actor::tick" , message);

    var response = function(reply){ // Respone to the sender
        if (message.callback)
            message.callback(reply);
        self._message = undefined;
        self._state = "IDLE";
        self.nextTick();
    }

    var async = new Async(function(reply){
        response(reply);
    });

    message.async = async;
    this._message  = message;
    
    try {
		if (typeof message.method == "function") { // Anonymous function
			reply = message.method.call(this._context,message.params,async);
		} else {
			reply = this._iface[message.method].call(this._context,message.params,async);
		}

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
			this._state = "IDLE";
            this.nextTick();
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

Actor.prototype.onUncaughtException = function(callback){
    this._uncaughtExceptionHandler = callback;
}

Actor.prototype._uncaughtExceptionHandler = function(err,action) {
    throw err;
}

module.exports = Actor;
