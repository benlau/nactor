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
    * Not-restricted access to other resource
* Support event emission from actor
* Customizable error handling of uncaught exception in actor.

Hello World
----------

```javascript

var nactor = require("nactor");

var actor = nactor.actor({
    // Declare your actor model through a object

    hello : function(message) {
        // Actor method
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

Beside ask() and reply(), actor may send information to sender through event emission.

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
