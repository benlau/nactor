NActor - Node.js actor model framework for game
======================================================

Description
-------------

The implementation is inspired by [drama](https://github.com/stagas/drama)

It is an implementation of event-based actor model for node.js. It is designed
for game backend service and may work with socket.io for sequential
process of game events.

Of course it can be used for non-game service.

Features
---------

* Easy to declare actor (Interface is similar to drama)
   * Automated binding of proxy interface
* Sequential order of message execution
    * All the message sent to actor model is processed in sequential order 
    * Actor's reply can work in async mode (e.g reply after database read/write) 
    * Prevent the race condition of high concurrent write/read to a resource
    * Example usage: Judgement of game event sent from multiple players
* Event based actor model
    * Running on main event loop
    * High performance
    * Non-restricted access to other resource
* Support event emission from actor
* Customizable error handling of uncaught exception in actor.

Hello World
----------

```javascript

var nactor = require("nactor");

var actor = nactor.actor({
    // Declare the context of your actor by an object

    hello : function(message) {
        // Actor method - "hello"
        console.log(message);
        return "Done";
    }
});

// Intialize the actor
actor.init(); 

// Ask to execute the hello() method. It will be called in next tick
actor.ask("hello","Node.js!");

```

The nactor.actor() constructs an actor model according to the declaration passed through
argument. The return is a proxy of the actor which provides interface same as the declaration 
but the method will not be executed immediately. Instead, it is scheduled to run by the 
main event loop. The call is async.

The ask() is the standard method to invoke actor's method from proxy. Alternative method 
is "automated interface binding".

Automated interface binding
-------------------------------

Instead of calling the ask() , you may execute the declared method 
by its name directly.

```javascript
actor.hello("Node.js!");
```

Remarks: You must call "init()" before execute any actor method. The interface will not be 
binded without "init()"

Reply
-----

```javascript
actor.hello("Node.js!",function(reply){
    console.log(reply); // "Done"
});
```

Async Reply and Constructor
---------------------------

In the previous example shows that the return from actor method will be
passed to sender's callback. It is simple but not suitable for 
calls that depend on I/O resource. In this case , it should enable the async 
reply mechanism.

```javascript

var nactor = require("nactor");

var actor = nactor.actor(function(options) {

   // Alternative method of actor declaration

   // It is the constructor and will be executed by
   // init() immediately

   // Remarks: It is not suggested to put async method here.

   this.seq = 0; // Variables that can be shared for all methods.
   this.timeout = options.timeout;

   return {
      // Declare the method 
      ping : function(data,async){
          async.enable(); // Enable async interface
          setTimeout(function(){
              async.reply("Done!");
          },this.timeout); // Using "this" to access the variable declared
      }
   };

});

// Intialize the actor
actor.init({
   timeout : 200
}); 

actor.ping(function(message){
   console.log(message); // Done!
});

```

Event Emission
--------------

Beside ask() and reply(), actor may send information to any observer through event emission.

```javascript

var nactor = require("nactor");

var actor = nactor.actor(function(options){
    var self = this;

    this.handle = setInterval(function(){
         self.emit("pong","Pong!");
    },300);

    return {
        stop : function(){
            clearInterval(this.handle);
        }
    }
});

actor.init();

actor.on("pong",function(msg){
   console.log(msg);
});


```

The emit() method is added to the context automatically. It will not invoke observer's callback 
immediately just like the ask() method. It is scheduled on tick.

Post to the message queue from context
--------------------------------------

NActor implements a message queue and process one message at a time. It can be used to avoid
concurrent access to a single resource. May simplify the complexity of your code and prevent
race condition.

As actor is not only an answer machine , it may have its own logic like time out checking.
(e.g A player do not response within a time period, he/she will be considered as pass). 
Once the time out reached, the action taken may be working together with other message from 
sender. 

If you are not happy with this situation , you may post your action to the message queue and let's
NActor to handle the concurrecnt issues.

```javascript

var nactor = require("nactor");

var actor = nactor.actor(function(options){
    var self = this;
    this.pressed = false;

    return {
        start : function(name){
	 setTimeout(function() {
	     if (!self.pressed) {
                    self.post("giveup",name,function(data,async) { 
                      // In case you want to process the reply. 
                      // This callback is invoked like an actor method.  
                      // If async.enable() is called, it will hold the message queue until async.reply()
                    });
                }
	 },1000);
        },
        press : function() {
            this.pressed = true;
        },
        giveup : function(name) {
            console.log("Player[" + name + "] give up");
        }

    }
});

actor.init();
actor.start("Player A");

```

Remarks: An alternative method to post() is next() , the arguments same as post() but the message will be injected to 
the beginning of the message queue. 

Uncaught Exception Handling
---------------------------

As the actor method is not called directly, you can not catch the exception from actor 
in sender. Instead, you may call onUncaughtException() to add a listener for uncaught 
exception.

```javascript
actor.onUncaughtException(function(err,action){
    console.log(err);
});
```

If an exception is uncaught , NActor will skip the processing message and handle the 
next. If you don't like the behaviour. You may stop the message execuation by calling 
''action.stop()''

```javascript
actor.onUncaughtException(function(err,action){
    console.log(err);
    action.stop();
});
```

Remarks : The actor will no longer be usable after called ''action.stop()''

Licence
-------

New BSD
