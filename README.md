NActor - Node.js actor model framework for game
======================================================

Description
-------------

The implementation is inspired by [drama](https://github.com/stagas/drama)

It is an implementation of actor model for node.js. It is designed
for game backend service and may work with socket.io for sequential
process of game events.

Of course it can be used for non-game service.

Features
---------

* Easy to declare actor (Interface is similar to drama)
   * Automated binding of async interface
* Sequential order of message execution
    * All the message sent to actor model is processed in sequential order. 
    * Actor's method can work in sync / async way (e.g read/write from database) .
    * Prevent the race condition of high concurrent write/read to a resource
    * Example usage: Judgement of game event sent from multiple players
* The actor is running on main thread
    * High performance
    * Not-restricted access to other resource
* Customizable error handling of uncaught exception in actor.

Hello World
----------

```javascript

var nactor = require("nactor");

var actor = nactor.actor({
    // Declare your actor model by using object parameter
    hello : function(message) {
        console.log(message);
        return "Done";
    }
});

// Intialize the actor
actor.init(); 

// Ask to execute the hello() method. It will be called in next tick
actor.ask("hello","Node.js!");

```

Automated interface binding
-------------------------------

Instead of calling the ask() method , you may execute the method 
by its name directly.

```javascript
actor.hello("Node.js!");
```

Remarks: It will not execute the hello() on actor immediately. It will
be done on next trick.

Reply
-----

```javascript
actor.hello("Node.js!",function(reply){
    console.log(reply); // "Done"
});
```

Async messaging
---------------

In the previous example shows that the return from actor method will be
passed to sender's callback immediately. It is simple but not suitable for 
calls that depend on I/O resource. In this case , it should enable the async 
messaging interface 

```javascript

var nactor = require("nactor");

var actor = nactor.actor(function(options) {
   // Alternative way of actor declaration
   this.seq = 0;
   this.timeout = options.timeout;

   return {
      ping : function(data,async){
          async.enable(); // Enable async interface
          setTimeout(function(){
              async.reply("Done!");
          },this.timeout);
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
