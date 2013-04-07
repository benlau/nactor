
var Async = require("./async")

var Actor = function(config) {
    this._config = config;
    
    // The context of actor
    this._context = {};
    
    // The interface of the actor
    this._iface = undefined;
    
    this._queue = [];
    
    // The current executing task
    this._task = undefined;
    
    // The state of the actor.
    this._state = "IDLE";
    
    // Event listner
    this._listener;
}

Actor.prototype.init = function(options) {

   var config = this._config;
   var self = this;

	// Construct a message object according to the parameters
    var message = function() {
		var ret = {}
		switch (typeof arguments[0]) {
			case "function":
				ret.method = arguments[0];
				
				// It is not suggest to pass parameters in anonymous
				// This code is used to handle the reply of post method.
				// Therefore , anonymous function do not accept callback paramter.
				ret.params = arguments[1];
				
				break;
			case "string":
				ret.method = arguments[0];
				
				if (arguments.length == 3){
					ret.params = arguments[1];
					ret.callback = wrapper(arguments[2]);
				} else if (arguments.length == 2) {
					if (typeof arguments[1] == "function") 
						ret.callback = wrapper(arguments[1]);
					else
						ret.params = arguments[1];
				}

				break;
			default:
				throw new Error("Invalid argument");
				break;
		}
		
		return ret;
	}
	
	// Wrapper of callback
	var wrapper = function(func) {
		return function(data) {
			self._context.post(func,data);
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
		var msg = message.apply({},arguments);
		self._enqueue(msg);
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

Actor.prototype.send = function(method,params,cb) {
    //console.log("Actor::send" , method , params,cb);
    var actor = this, 
         message = {
            method : method,
            params : params,
            callback : cb
        }
    
    this._enqueue(message);
}

Actor.prototype._enqueue = function(message){
    this._queue.push(message);
       
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

/** Execute a task in a tick */
Actor.prototype.tick = function() {

    if (this._queue.len <= 0) {
		this._state = "IDLE";
        return;
    }

	this._state = "PROCESSING";

    var task = this._queue.shift(),
         self = this,
         reply;
         
    //console.log("Actor::tick" , task);

    var response = function(reply){ // Respone to the sender
        if (task.callback)
            task.callback(reply);
        self._task = undefined;
        self._state = "IDLE";
        self.nextTick();
    }

    var async = new Async(function(reply){
        response(reply);
    });

    task.async = async;
    this._task  = task;
    
    try {
		if (typeof task.method == "function") { // Anonymous function
			reply = task.method.call(this._context,task.params,async);
		} else {
			reply = this._iface[task.method].call(this._context,task.params,async);
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
