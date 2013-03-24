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
    * Prevent the race condition of high concurrent write/read of a resource
    * Example usage: Judgement of game event sent from multiple players
* Taking the advantage of node.js single thread design philosophy
    * The actor model is running on the main thread like other node.js code.
* Customizable error handling of uncaught exception in actor.

Usage
----------

Working
