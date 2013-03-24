NActor - Node.js actor model framework for game
======================================================

Description
-------------

The implementation is inspired by [drama](https://github.com/stagas/drama)

It is an implementation of actor model for node.js. It is designed
for game backend service and may work with socket.io for sequential
process of game events.

Of course it can be used for non-game usage.

Features
---------

* Easy to use actor model creation (Interface is similar to drama)
   * Automated binding of async interface
* Sequential order of message execution
    * All the message sent to actor model is processed in sequential order. 
    * Actor may process the message in async way. (e.g read/write from database)
    * Prevent the race condition of high concurrent write/read of a resource
    * Example usage: Judgement of game event sent from multiple players
* Taking the advantage of node.js single thread design philosophy
    * The actor model is running on the main thread like other node.js code.
* Customizable error handling of uncaught exception in actor.

Hello World
----------

```javascript

var nactor = require("../");

var actor = nactor.actor({
    // Declare your actor model by a object parameter
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

var nactor = require("../");

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



Licence
-------

New BSD
