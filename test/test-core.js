
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


exports.processing = function(test) {
	test.expect(2);
	var actor = nactor.actor({
		wait : function(time,async){
			async.enable();
			setTimeout(function() {
				async.reply();
			},time);
		}
	});
	
	actor.init();
	actor.wait(200,function(){
		test.done();
	});
	
	test.equal(actor.processing() ,undefined);
	setTimeout(function() {
		test.ok(actor.processing() != undefined,"It should have processing message");
	},100);
	
	timeout(test);
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

exports.postAnonymous = function(test) {
    var actor = nactor.actor(function() {
		var self = this;
		
		setTimeout(function(){
			// Post an anonymouse function
			self.post(function() {
				test.equal(self.actor()._state , "PROCESSING");
				test.equal(self.actor()._queue.length , 0);
				
				setTimeout(function() {
					test.equal(self.actor()._state , "IDLE");
					test.done();	
				},100);
				
			});
		},100);
		
		return { // An actor without any method.
		} 
    });
	
	actor.init();
	
	timeout(test);
}

exports.post = function(test) {
    var actor = nactor.actor(function() {
		var self = this;
		
		setTimeout(function(){
			self.post("ping","Hello!",function(data,async) {
				async.enable();
				test.equal(data,"pong");
				test.equal(self.actor()._state , "PROCESSING"); // The reply is also an anonymous function.
				
				setTimeout(function() {
					async.reply(); // Return without receiver
					
					setTimeout(function() {
						// IDLE after reply.
						test.equal(self.actor()._state , "IDLE");
						test.done();
					},100);
				},100);
			});
		},100);
		
		return { 
			ping : function(msg) {
				test.equal(msg,"Hello!");
				return "pong"
			}
		} 
    });
	
	actor.init();
	
	timeout(test);
}

exports.next = function(test) {
    var seq = [];
    var actor = nactor.actor(function() {
		
		return { 
			a : function(msg) {
				test.equal(msg,"Hello!!");
				seq.push('a');
				this.next("b","Called by a"); // Inject 'b' into the queue
			},
			b : function(msg) {
				test.equal(msg,"Called by a");
				test.equal(seq.length , 1);
				test.equal(seq[0] , 'a');
				seq.push('b');
			},
			c: function(msg) {
				test.equal(seq.length , 2);
				test.equal(seq[1] , 'b');
				test.done();
			}
		} 
    });
	
	actor.init();
	actor.a("Hello!!");
	actor.c();
	timeout(test);
};

exports.onReceieved = function(test){
    test.expect(8);
	var actor = nactor.actor({
		blocked : function(time,async){
			async.enable();
			setTimeout(function() {
				async.reply();
			},time);
		},
        nonblocked : function() {
            return;
        }
	});
	
	actor.init();
    
    var name = "blocked";
    
    actor.system.on("received",function(message) {
        test.ok(message!=undefined),
        test.equal(message.name() ,name);
    });

    actor.system.on("completed",function(message) {
        test.ok(message!=undefined),
        test.equal(message.name() ,name);
    });
    
    actor.blocked(200,function(){
        setTimeout(function() {
            name = "nonblocked";
            actor.nonblocked(function() {
                setTimeout(function() {
                    test.done();
                },100);
            });
            
        },100);
	});
    
	timeout(test);
}

exports.drama = function(test) {
    // The argument of ask should be compatible with drama.
    var actor = nactor.actor({
		wait : function(time,async){
			async.enable();
			setTimeout(function() {
				async.reply();
			},time);
		}
	});
	
    actor.init();

    actor.ask(actor,"wait",200,function() {
       test.done(); 
    });
    
}
    
exports.dispose = function(test) {
    test.expect(4);
	var actor = nactor.actor({
		blocked : function(time,async){
			async.enable();
			setTimeout(function() {
				async.reply();
			},time);
		},
        nonblocked : function() {
            return;
        }
	});
	
	actor.init();
    
    var name = "blocked";
    
    actor.system.on("received",function(message) {
        test.ok(message!=undefined),
        test.equal(message.name() ,name);

        setTimeout(function() {
            message.dispose();
        },50);

    });

    actor.system.on("completed",function(message) {
        test.ok(false); // should not reach here
    });

    actor.system.on("disposed",function(message) {
        test.ok(message!=undefined),
        test.equal(message.name() ,name);
    });
    
    actor.blocked(200,function(){
        test.ok(false);
	});
    
    setTimeout(function() {
        test.done();
    },300);
    
	timeout(test);
}

// Prove the order of execution is in sequence even reply is called twice
exports.replyTwiceAndSequenceOrder = function(test) {
    test.expect(13);
    var res = [];
    var actor;

    actor = nactor.actor({
        delayReply: function(data,async) {
            async.enable();
            setTimeout(function() {
                test.ok(data.index !== undefined);
                res.push(data.index);
                async.reply();
                async.reply();
            },data.timeout);
        },
        final: function() {
        }
    });

    actor.init();

    actor.onUncaughtException(function(err,action) {
//        console.log(err.message);
        test.ok(action !== undefined);
        test.ok(action.stop !== undefined);
    });

    actor.delayReply({
        index : 0,
        timeout : 500
    });

    actor.delayReply({
        index : 1,
        timeout : 200
    });

    actor.delayReply({
        index : 2,
        timeout : 10
    });

    actor.final(function() {
        test.ok(res.length == 3);
        test.ok(res[0] == 0);
        test.ok(res[1] == 1);
        test.ok(res[2] == 2);
        test.done();
    });

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

