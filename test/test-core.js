
var nactor = require("../lib/factory")

// Utility to handle timeout
function timeout(test,value) {
    if (value == undefined ) {
        value = 1000;
    }
    
    var handler = setTimeout(function() {
        test.ok(false,"Timeout");
        test.done();
    },value);
    
    var _done = test.done; 
    
    // Hook of test.done();
    test.done = function() {
        clearTimeout(handler);
        _done.apply(test,arguments);
    }
}
	
exports.helloWorld = function(test) {
    test.expect(1);
    var actor = nactor.actor({
        hello: function(){
            return "world";
        }
    });

    actor.init();

    actor.ask("hello",function(msg){
        test.ok(msg == "world");
        test.done();
    });
    
    timeout(test);
}

exports.autoInterfaceBinding = function(test) {
    test.expect(2);
    var actor = nactor.actor({
        hello: function(){
            test.ok(this.name == "TestActor","The name argument should be set by init()");
            return "world";
        }
    });
    
    actor.init({
        name : "TestActor"
    });

    // Different then the previous test, it call "hello" instead of "ask"
    actor.hello(function(msg){
        test.ok(msg == "world");
        test.done();
    });

    timeout(test);
}

exports.configWithFunc = function(test){
    test.expect(7);

    var actor = nactor.actor(function(options){
        // "this" is referred to the context of the actor. Which can be shared with all interface 
        this.seq = 0;
        test.ok(options.name == "TestActor");
        
        return {
            hello : function(data) {
                test.ok(data != undefined);
                return {
                    target : data.target,
                    seq : ++this.seq
                }
            }
        };
        
    });

    actor.init({
        name : "TestActor"
    });

    actor.hello({ target : "1"} ,function(reply){
        test.ok(reply.target == "1");
        test.ok(reply.seq == 1);
    });

    actor.hello({ target : "2"} ,function(reply){
        test.ok(reply.target == "2");
        test.ok(reply.seq == 2);
        test.done();
    });

    timeout(test);
}

/** Test async actor method */
exports.async = function(test) {
    test.expect(6);
    
    var actor = nactor.actor({
        hello : function() {
            return { seq : ++this.seq};
        },
        timeout : function(data,async) {
            async.enable();
            this.seq++;
            self = this;
            setTimeout(function(){
                async.reply({msgId : data.msgId , seq : self.seq});
            },200);
        }
    });

    actor.init({
        seq : 0
    });

    actor.timeout({msgId : 1},function(reply){
        test.ok(reply.msgId == 1);
        test.ok(reply.seq == 1);
    });
    
    actor.hello(function(reply){
        test.ok(reply.msgId ==  undefined);        
        test.ok(reply.seq == 2);        
    });

    actor.timeout({msgId : 2},function(reply){
        test.ok(reply.msgId == 2);
        test.ok(reply.seq == 3);
        test.done();
    });

    timeout(test);
}

/** Capture Uncaught Exception */

exports.uncaughtException = function(test) {
    test.expect(4);
    var actor = nactor.actor(function(options){
        this.seq = 0;
        
        return {
            normal: function() {
                return {
                    seq : ++this.seq
                }
            },
            fail : function() {
                var target;
                target.exec(); // It will throw exception.
            }
        }
    });
    
    actor.init();   

    actor.onUncaughtException(function(err,action){
        test.ok(action != undefined);
    });
    
    actor.normal(function(reply){
        test.ok(reply.seq == 1);
    });

    actor.normal(function(reply){
        test.ok(reply.seq == 2);
    });
    
    actor.fail(function(reply){
        test.ok(false,"If actor's method throw exception, it should not return");
    });

    actor.normal(function(reply){
        test.ok(reply.seq == 3 ,"Although previous call thore exception failed ,the actor still work");
        test.done();
    });
    
    timeout(test);
}

/** Call action.stop() to stop the execution of actor's message queue */
exports.uncaughtExceptionAndStop = function(test) {
    test.expect(3);
    var actor = nactor.actor(function(options){
        this.seq = 0;
        
        return {
            normal: function() {
                return {
                    seq : ++this.seq
                }
            },
            fail : function() {
                var target;
                target.exec(); // It will throw exception.
            }
        }
    });
    
    actor.init();   

    actor.onUncaughtException(function(err,action){
        test.ok(action != undefined);
        action.stop();
        setTimeout(function(){
            test.done();
        },200);
    });
    
    actor.normal(function(reply){
        test.ok(reply.seq == 1);
    });

    actor.normal(function(reply){
        test.ok(reply.seq == 2);
    });
    
    actor.fail(function(reply){
        test.ok(false,"If actor's method throw exception, it should not return");
    });

    actor.normal(function(reply){
        test.ok(false ,"Expected fail");
        test.done();
    });
    
    timeout(test);
}

exports.askWithNonObjectArgument = function(test) {
    test.expect(1);
    var actor = nactor.actor({
        ping: function(msg){
            return msg;
        }
    });

    actor.init();

    actor.ping("hello",function(msg){
        test.ok(msg == "hello");
        test.done();
    });
    
    timeout(test);
}

exports.event = function(test) {
    var actor = nactor.actor({
        ping: function(msg){
            var self = this;
            setTimeout(function(){
                self.emit("pong",msg);
            },300);
        }
    });

    actor.init();
    
    actor.ping("Hello!",function(reply){
        test.ok(reply ==  undefined);
    });
    
    actor.on("pong",function(msg){
        test.ok(msg == "Hello!");
        test.done();
    });

    timeout(test);
}

exports.loadTesing = function(test) {
	var max = 1000;
	var pingCount = 0;
	var helloCount = 0;
    var actor = nactor.actor({
        ping: function(data,async){
			var actor = this;
			async.enable();
			pingCount++;
			var timer = Math.floor((Math.random()*10)+1);
			setTimeout(function(){
				actor.emit("pong",pingCount);
				async.reply();			
			},timer);
        },
        
        hello: function(data,async){
			async.enable();
			helloCount++;
			var timer = Math.floor((Math.random()*10)+1);
			setTimeout(function(){
				async.reply();			
			},timer);
			
			if (helloCount == max) {
				test.equal(pingCount , max);
				test.equal(helloCount , max);
				test.done();				
			}
			
        },
        
        final : function(){
		}
    });
    
	actor.init();
	
	actor.on("pong",function() {
		if (pingCount % 2 == 0) {
			actor.hello();
		} else {
			var timer = Math.floor((Math.random()*10)+1);
			setTimeout(function(){
				actor.hello();
			},timer);
		}		
	});
	
	var i = 0;
	
	var handler = setInterval(function(){
		var c = i + Math.floor((Math.random()*100)+1);
		while (i < max && i < c) {
			actor.ping();
			i++;
		}
		if (i >=max){
			clearInterval(handler);
		}
		
	},50);
	
	
	timeout(test,20 * 1000);
}
