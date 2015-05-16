var   nactor    = require("../../lib/factory"),
      expect    = require("chai").expect;


describe('core-tests',function(){
    it('tests processing',function(done){
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
            done();
        });

        expect(actor.processing()).to.be.undefined;
        setTimeout(function() {
            expect(actor.processing()).to.not.undefined;
        },100);
    });

    it('tests hello world',function(done){
        var actor = nactor.actor({
            hello: function(){
                return "world";
            }
        });

        actor.init();

        actor.ask("hello",function(msg){
            expect(msg).to.equal("world");
            done();
        });
    });

    it('tests auto interface binding',function(done){
        var actor = nactor.actor({
            hello: function(){
                expect(this.name).to.equal("TestActor","The name argument should be set by init()");
                return "world";
            }
        });

        actor.init({
            name : "TestActor"
        });

        // Different then the previous test, it call "hello" instead of "ask"
        actor.hello(function(msg){
            expect(msg).to.equal("world");
            done();
        });
    });

    it('tests config with func',function(done){
        var actor = nactor.actor(function(options){
            // "this" is referred to the context of the actor. Which can be shared with all interface
            this.seq = 0;
            expect(options.name).to.equal("TestActor");

            return {
                hello : function(data) {
                    expect(data).to.not.be.undefined;
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
            expect(reply.target).to.equal("1");
            expect(reply.seq).to.equal(1);
        });

        actor.hello({ target : "2"} ,function(reply){
            expect(reply.target).to.equal("2");
            expect(reply.seq).to.equal(2);
            done();
        });
    });

    it('tests async',function(done){
        var actor = nactor.actor({
            hello : function() {
                return { seq : ++this.seq};
            },
            timeout : function(data,async) {
                async.enable();
                this.seq++;
                var self = this;
                setTimeout(function(){
                    async.reply({msgId : data.msgId , seq : self.seq});
                },200);
            }
        });

        actor.init({
            seq : 0
        });

        actor.timeout({msgId : 1},function(reply){
            expect(reply.msgId).to.equal(1);
            expect(reply.seq).to.equal(1);
        });

        actor.hello(function(reply){
            expect(reply.msgId).to.be.undefined;
            expect(reply.seq).to.equal(2);
        });

        actor.timeout({msgId : 2},function(reply){
            expect(reply.msgId).to.equal(2);
            expect(reply.seq).to.equal(3);
            done();
        });
    });

    it('tests uncaught exception handling',function(done){
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
            expect(action).to.not.be.undefined;
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(1);
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(2);
        });

        actor.fail(function(reply){
            expect(false).to.equal(true,"If actor's method throw exception, it should not return");
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(3,"Although previous call thore exception failed ,the actor still work");
            done();
        });

    });

    it('tests the ability to stop an actor after exceptions',function(done){

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
            expect(action).to.not.be.undefined;
            action.stop();
            setTimeout(function(){
                done();
            },200);
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(1);
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(2);
        });

        actor.fail(function(reply){
            assert.fail("If actor's method throw exception, it should not return");
        });

        actor.normal(function(reply){
            assert.fail("Expected fail");
            done();
        });

    });

    it('tests ask with non-object argument',function(done){
        var actor = nactor.actor({
            ping: function(msg){
                return msg;
            }
        });

        actor.init();

        actor.ping("hello",function(msg){
            expect(msg).to.equal("hello");
            done();
        });

    });

    it('tests events',function(done){
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
            expect(reply).to.be.undefined;
        });

        actor.on("pong",function(msg){
            expect(msg).to.equal("Hello!");
            done();
        });
    });

    it('tests post anonymous',function(done){
        var actor = nactor.actor(function() {
            var self = this;

            setTimeout(function(){
                // Post an anonymouse function
                self.post(function() {
                    expect(self.actor()._state).to.equal("PROCESSING");
                    expect(self.actor()._queue.length).to.equal(0);

                    setTimeout(function() {
                        expect(self.actor()._state).to.equal("IDLE");
                        done();
                    },100);

                });
            },100);

            return { // An actor without any method.
            }
        });

        actor.init();
    });

    it('tests post',function(done){
        var actor = nactor.actor(function() {
            var self = this;

            setTimeout(function(){
                self.post("ping","Hello!",function(data,async) {
                    async.enable();
                    expect(data).to.equal("pong");
                    expect(self.actor()._state).to.equal("PROCESSING"); // The reply is also an anonymous function.

                    setTimeout(function() {
                        async.reply(); // Return without receiver

                        setTimeout(function() {
                            // IDLE after reply.
                            expect(self.actor()._state).to.equal("IDLE");
                            done();
                        },100);
                    },100);
                });
            },100);

            return {
                ping : function(msg) {
                    expect(msg).to.equal("Hello!");
                    return "pong"
                }
            }
        });

        actor.init();

    });

    it('tests next',function(done){
        var seq = [];
        var actor = nactor.actor(function() {

            return {
                a : function(msg) {
                    expect(msg).to.equal("Hello!!");
                    seq.push('a');
                    this.next("b","Called by a"); // Inject 'b' into the queue
                },
                b : function(msg) {
                    expect(msg).to.equal("Called by a");
                    expect(seq.length).to.equal(1);
                    expect(seq[0]).to.equal('a');
                    seq.push('b');
                },
                c: function(msg) {
                    expect(seq.length).to.equal(2);
                    expect(seq[1]).to.equal('b');
                    done();
                }
            }
        });

        actor.init();
        actor.a("Hello!!");
        actor.c();

    });

    it('tests onReceived',function(done){
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
            expect(message).to.not.be.undefined;
            expect(message.name()).to.equal(name);
        });

        actor.system.on("completed",function(message) {
            expect(message).to.not.be.undefined;
            expect(message.name()).to.equal(name);
        });

        actor.blocked(200,function(){
            setTimeout(function() {
                name = "nonblocked";
                actor.nonblocked(function() {
                    setTimeout(function() {
                        done();
                    },100);
                });

            },100);
        });

    });

    it('tests drama',function(done){
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
            done();
        });
    });

    it('tests dispose',function(done){
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
            expect(message).to.not.be.undefined,
            expect(message.name()).to.equal(name);

            setTimeout(function() {
                message.dispose();
            },50);

        });

        actor.system.on("completed",function(message) {
            assert.fail();// should not reach here
        });

        actor.system.on("disposed",function(message) {
            expect(message).to.not.be.undefined;
            expect(message.name()).to.equal(name);
        });

        actor.blocked(200,function(){
            assert.fail();
        });

        setTimeout(function() {
            done();
        },300);
    });

    it('orders sequence of message consumption deterministically',function(done){
        var res = [];
        var actor;

        actor = nactor.actor({
            delayReply: function(data,async) {
                async.enable();
                setTimeout(function() {
                    expect(data.index).to.not.be.undefined;
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
            expect(action).to.not.be.undefined;
            expect(action.stop).to.not.be.undefined;
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
            expect(res.length).to.equal(3);
            expect(res[0]).to.equal(0);
            expect(res[1]).to.equal(1);
            expect(res[2]).to.equal(2);
            done();
        });

    });
});
